import * as fs from 'fs'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import * as archiver from 'archiver'
import got from 'got'
import * as path from 'path'
import * as crypto from 'crypto'
import AdmZip = require('adm-zip')
import { v4 as uuidv4 } from 'uuid'
import { Worker } from 'worker_threads'

export const workspaceFolderName = 'artifactWorkspace'

// Plain JS run via `new Worker(..., { eval: true })`; only Node built-ins are available here.
const UPLOAD_WORKER_SOURCE = `
const { parentPort, workerData } = require('worker_threads')
const fs = require('fs')
const { url, filePath, headers } = workerData
const transport = new URL(url).protocol === 'http:' ? require('http') : require('https')
const reqHeaders = { ...headers }
if (!Object.keys(reqHeaders).some(k => k.toLowerCase() === 'content-length')) {
    reqHeaders['Content-Length'] = fs.statSync(filePath).size
}
const started = Date.now()
let bytesSent = 0
let lastProgress = started
let done = false
const finish = msg => {
    if (!done) {
        done = true
        parentPort.postMessage({ type: 'result', bytesSent, durationMs: Date.now() - started, ...msg })
    }
}
const req = transport.request(url, { method: 'PUT', headers: reqHeaders }, res => {
    let body = ''
    res.setEncoding('utf8')
    res.on('data', chunk => { if (body.length < 4096) body += chunk })
    res.on('end', () =>
        finish({
            statusCode: res.statusCode,
            body,
            requestId: res.headers['x-amz-request-id'],
            hostId: res.headers['x-amz-id-2'],
        })
    )
})
req.on('error', e => finish({ error: String(e), errorCode: e.code }))
fs.createReadStream(filePath)
    .on('error', e => req.destroy(e))
    .on('data', chunk => {
        bytesSent += chunk.length
        const now = Date.now()
        if (now - lastProgress >= 15000) {
            lastProgress = now
            parentPort.postMessage({ type: 'progress', bytesSent, elapsedMs: now - started })
        }
    })
    .pipe(req)
`

export interface UploadResult {
    statusCode?: number
    body?: string
    requestId?: string
    hostId?: string
    bytesSent?: number
    durationMs?: number
}

const MB = 1024 * 1024
const formatMb = (bytes: number) => (bytes / MB).toFixed(1)
const formatRate = (bytes: number, ms: number) => (ms > 0 ? ((bytes / MB) * (1000 / ms)).toFixed(2) : '0')

export class Utils {
    /**
     * Calculate SHA256 hash of file contents using streaming
     */
    static async getSha256Async(fileName: string): Promise<string> {
        const hasher = crypto.createHash('sha256')
        const stream = fs.createReadStream(fileName)
        for await (const chunk of stream) {
            hasher.update(chunk)
        }
        return hasher.digest('base64')
    }

    /**
     * Create workspace path: {solutionRoot}/artifactWorkspace/{uuid}
     */
    static getWorkspacePath(solutionRootPath: string): string {
        const randomPath = uuidv4().substring(0, 8)
        const workspacePath = path.join(solutionRootPath, workspaceFolderName, randomPath)
        if (!fs.existsSync(workspacePath)) {
            fs.mkdirSync(workspacePath, { recursive: true })
        }
        return workspacePath
    }

    /**
     * Sleep for specified duration in milliseconds
     */
    static async sleep(duration = 0): Promise<void> {
        return new Promise(r => setTimeout(r, Math.max(duration, 0)))
    }

    /**
     * PUT a file from a worker thread. The worker has its own event loop, so long synchronous work on the
     * main thread (e.g. the 30-minute workspace index refresh) can't stall the upload past S3's idle timeout.
     */
    static async putFileFromWorker(
        url: string,
        filePath: string,
        headers: Record<string, string>,
        onProgress?: (bytesSent: number, elapsedMs: number) => void
    ): Promise<UploadResult> {
        return new Promise((resolve, reject) => {
            const worker = new Worker(UPLOAD_WORKER_SOURCE, { eval: true, workerData: { url, filePath, headers } })
            worker.on(
                'message',
                (msg: UploadResult & { type: string; elapsedMs?: number; error?: string; errorCode?: string }) => {
                    if (msg.type === 'progress') {
                        onProgress?.(msg.bytesSent ?? 0, msg.elapsedMs ?? 0)
                    } else if (msg.error) {
                        reject(
                            new Error(
                                `${msg.error} (code=${msg.errorCode ?? 'n/a'}, sent ${formatMb(msg.bytesSent ?? 0)} MB in ${Math.round((msg.durationMs ?? 0) / 1000)} s)`
                            )
                        )
                    } else {
                        resolve(msg)
                    }
                }
            )
            worker.once('error', reject)
            worker.once('exit', code => reject(new Error(`Upload worker exited with code ${code} before responding`)))
        })
    }

    /**
     * Upload artifact to S3 using presigned URL and headers
     */
    static async uploadArtifact(
        s3PreSignedUrl: string,
        filePath: string,
        requestHeaders?: any,
        logger?: Logging
    ): Promise<boolean> {
        // Diagnostics for upload failures: if the main thread freezes (e.g. index refresh), log how long.
        // The upload itself runs in a worker and isn't affected; this only records that the freeze happened.
        const FREEZE_CHECK_MS = 1000
        const FREEZE_REPORT_MS = 5000
        let lastTick = Date.now()
        const freezeMonitor = setInterval(() => {
            const now = Date.now()
            const blockedMs = now - lastTick - FREEZE_CHECK_MS
            if (blockedMs >= FREEZE_REPORT_MS) {
                logger?.warn(
                    `Artifact upload: main thread was blocked for ~${Math.round(blockedMs / 1000)} s (since ${new Date(lastTick).toISOString()}); upload continues in worker`
                )
            }
            lastTick = now
        }, FREEZE_CHECK_MS)
        try {
            const headers: any = {}

            if (requestHeaders) {
                Object.keys(requestHeaders).forEach(key => {
                    const value = requestHeaders[key]
                    headers[key] = Array.isArray(value) ? value[0] : value
                })
            }
            const size = fs.statSync(filePath).size
            logger?.info(`Artifact upload size: ${size} bytes`)
            const env = process.env
            logger?.info(
                `Artifact upload: via worker thread; header names [${Object.keys(headers).join(', ')}]; ` +
                    `HTTPS_PROXY set=${!!(env.HTTPS_PROXY || env.https_proxy)}, HTTP_PROXY set=${!!(env.HTTP_PROXY || env.http_proxy)}, ` +
                    `NO_PROXY set=${!!(env.NO_PROXY || env.no_proxy)}, NODE_EXTRA_CA_CERTS set=${!!env.NODE_EXTRA_CA_CERTS}`
            )
            const response = await Utils.putFileFromWorker(s3PreSignedUrl, filePath, headers, (sent, elapsedMs) =>
                logger?.info(
                    `Artifact upload progress: ${formatMb(sent)} of ${formatMb(size)} MB (${size > 0 ? Math.floor((sent / size) * 100) : 0}%) in ${Math.round(elapsedMs / 1000)} s, avg ${formatRate(sent, elapsedMs)} MB/s`
                )
            )
            const summary =
                `${formatMb(response.bytesSent ?? 0)} MB in ${Math.round((response.durationMs ?? 0) / 1000)} s ` +
                `(avg ${formatRate(response.bytesSent ?? 0, response.durationMs ?? 0)} MB/s), ` +
                `x-amz-request-id=${response.requestId ?? 'n/a'}, x-amz-id-2=${response.hostId ?? 'n/a'}`
            if (response.statusCode === 200) {
                logger?.info(`Artifact upload completed: ${summary}`)
                return true
            }
            logger?.error(
                `Upload artifact error: Response code ${response.statusCode} ${response.body ?? ''} (${summary}), please see https://docs.aws.amazon.com/transform/latest/userguide/dotnet-ide-troubleshoot.html`
            )
            return false
        } catch (error) {
            logger?.error(
                `Upload artifact error: ${String(error)}, please see https://docs.aws.amazon.com/transform/latest/userguide/dotnet-ide-troubleshoot.html`
            )
            return false
        } finally {
            clearInterval(freezeMonitor)
        }
    }

    /**
     * Saves worklogs to JSON file with stepId as key and description as value
     */
    private static _worklogCache: Record<string, Record<string, Set<string>>> = {}

    static clearWorklogCacheForJob(jobId: string): void {
        delete Utils._worklogCache[jobId]
    }

    static clearAllWorklogCache(): void {
        Utils._worklogCache = {}
    }

    static async saveWorklogsToJson(
        jobId: string,
        stepId: string | null,
        description: string,
        solutionRootPath: string,
        timestamp?: Date
    ): Promise<void> {
        const worklogDir = path.join(solutionRootPath, workspaceFolderName, jobId)
        const worklogPath = path.join(worklogDir, 'worklogs.json')

        await Utils.directoryExists(worklogDir)

        if (stepId == null) {
            stepId = 'Progress'
        }

        // In-memory dedup cache per job+step (avoids re-reading file for duplicate check)
        if (!Utils._worklogCache[jobId]) {
            Utils._worklogCache[jobId] = {}
            // Seed cache from existing file
            if (fs.existsSync(worklogPath)) {
                try {
                    const existing = JSON.parse(fs.readFileSync(worklogPath, 'utf8'))
                    for (const [key, entries] of Object.entries(existing)) {
                        Utils._worklogCache[jobId][key] = new Set(
                            (entries as any[]).map((e: any) => (typeof e === 'string' ? e : e.text))
                        )
                    }
                } catch {
                    /* will rebuild on next write */
                }
            }
        }

        if (!Utils._worklogCache[jobId][stepId]) {
            Utils._worklogCache[jobId][stepId] = new Set()
        }

        // Skip if already seen (fast in-memory check)
        if (Utils._worklogCache[jobId][stepId].has(description)) {
            return
        }

        const maxRetries = 3
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                let worklogData: Record<string, any[]> = {}

                if (fs.existsSync(worklogPath)) {
                    const existingData = fs.readFileSync(worklogPath, 'utf8')
                    worklogData = JSON.parse(existingData)
                }

                if (!worklogData[stepId]) {
                    worklogData[stepId] = []
                }

                const entry = {
                    timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
                    text: description,
                }
                worklogData[stepId].push(entry)

                const tempPath = worklogPath + '.tmp'
                fs.writeFileSync(tempPath, JSON.stringify(worklogData, null, 2))
                // Atomic rename ensures data is on disk before updating cache
                fs.renameSync(tempPath, worklogPath)
                Utils._worklogCache[jobId][stepId].add(description)
                return
            } catch (err: any) {
                if ((err.code === 'EBUSY' || err.code === 'EPERM') && attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
                    continue
                }
                console.error(
                    `ATX: Failed to write worklogs after ${maxRetries} attempts: ${err.code} - ${err.message}`
                )
                return
            }
        }
    }

    /**
     * Download and extract archive from URL
     */
    static async downloadAndExtractArchive(
        downloadUrl: string,
        requestHeaders: any,
        saveToDir: string,
        exportName: string,
        logger: Logging
    ): Promise<string> {
        const response = await got.get(downloadUrl, {
            headers: requestHeaders || {},
            responseType: 'buffer',
            timeout: { request: 30000 },
        })

        const buffer = [Buffer.from(response.body)]
        return await Utils.extractArchiveFromBuffer(exportName, buffer, saveToDir, logger)
    }

    /**
     * Extracts ZIP archive from buffer using AdmZip
     */
    static async extractArchiveFromBuffer(
        exportName: string,
        buffer: Uint8Array[],
        saveToDir: string,
        logger: Logging
    ): Promise<string> {
        const pathToArchive = path.join(saveToDir, exportName)
        await Utils.directoryExists(saveToDir)
        await fs.writeFileSync(pathToArchive, Buffer.concat(buffer))

        const pathContainingArchive = path.dirname(pathToArchive)
        const zip = new AdmZip(pathToArchive)
        const zipEntries = zip.getEntries()
        await Utils.extractAllEntriesTo(pathContainingArchive, zipEntries, logger)
        return pathContainingArchive
    }

    /**
     * Ensure directory exists, create if it doesn't
     */
    static async directoryExists(directoryPath: string): Promise<void> {
        try {
            await fs.promises.access(directoryPath)
        } catch (error) {
            await fs.promises.mkdir(directoryPath, { recursive: true })
        }
    }

    /**
     * Extracts all ZIP entries to target directory
     */
    static async extractAllEntriesTo(
        pathContainingArchive: string,
        zipEntries: AdmZip.IZipEntry[],
        logger: Logging
    ): Promise<void> {
        // Resolve the extraction root once so every entry can be checked against it.
        const extractRoot = path.resolve(pathContainingArchive)
        for (const entry of zipEntries) {
            try {
                const entryPath = path.join(pathContainingArchive, entry.entryName)
                // Zip-slip guard: reject any entry that resolves outside the extraction
                // root (../ traversal or absolute paths). Archives can originate from a
                // remote artifact, so a crafted entry must never write outside destDir.
                const resolvedEntry = path.resolve(entryPath)
                if (resolvedEntry !== extractRoot && !resolvedEntry.startsWith(extractRoot + path.sep)) {
                    logger.error(`Blocked zip entry escaping extraction directory: ${entry.entryName}`)
                    continue
                }
                if (entry.isDirectory) {
                    await fs.promises.mkdir(entryPath, { recursive: true })
                } else {
                    const parentDir = path.dirname(entryPath)
                    await fs.promises.mkdir(parentDir, { recursive: true })
                    await fs.promises.writeFile(entryPath, entry.getData())
                }
            } catch (extractError: any) {
                if (extractError instanceof Error && 'code' in extractError && extractError.code === 'ENOENT') {
                    logger.error(`Attempted to extract a file that does not exist: ${entry.entryName}`)
                } else {
                    throw extractError
                }
            }
        }
    }

    /**
     * Create ZIP archive from a single file
     */
    static async zipFile(sourceFilePath: string, outputZipPath: string): Promise<void> {
        const archive = archiver('zip', { zlib: { level: 9 } })
        const stream = fs.createWriteStream(outputZipPath)

        return new Promise<void>((resolve, reject) => {
            archive
                .file(sourceFilePath, { name: path.basename(sourceFilePath) })
                .on('error', err => reject(err))
                .pipe(stream)

            stream.on('close', () => resolve())
            void archive.finalize()
        })
    }

    /**
     * Calculate exponential delay with jitter for API retries
     */
    static getExpDelayForApiRetryMs(attempt: number): number {
        const exponentialDelayFactor = 2
        const exponentialDelay = 10 * Math.pow(exponentialDelayFactor, attempt)
        const jitteredDelay = Math.floor(Math.random() * 10)
        return exponentialDelay + jitteredDelay
    }
}
