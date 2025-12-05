import * as fs from 'fs'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import * as archiver from 'archiver'
import got from 'got'
import * as path from 'path'
import * as crypto from 'crypto'
import AdmZip = require('adm-zip')
import { v4 as uuidv4 } from 'uuid'

export const workspaceFolderName = 'artifactWorkspace'

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
     * Upload artifact to S3 using presigned URL and headers
     */
    static async uploadArtifact(
        s3PreSignedUrl: string,
        filePath: string,
        requestHeaders?: any,
        logger?: Logging
    ): Promise<boolean> {
        try {
            const headers: any = {}

            if (requestHeaders) {
                Object.keys(requestHeaders).forEach(key => {
                    const value = requestHeaders[key]
                    headers[key] = Array.isArray(value) ? value[0] : value
                })
            }
            const fileStream = fs.createReadStream(filePath)
            const response = await got.put(s3PreSignedUrl, {
                body: fileStream,
                headers: headers,
                timeout: { request: 300000 },
                retry: { limit: 0 },
            })
            if (response.statusCode === 200) {
                return true
            } else {
                return false
            }
        } catch (error) {
            logger?.error(`Upload artifact error: ${String(error)}`)
            return false
        }
    }

    /**
     * Saves worklogs to JSON file with stepId as key and description as value
     */
    static async saveWorklogsToJson(
        jobId: string,
        stepId: string | null,
        description: string,
        solutionRootPath: string
    ): Promise<void> {
        const worklogDir = path.join(solutionRootPath, workspaceFolderName, jobId)
        const worklogPath = path.join(worklogDir, 'worklogs.json')

        await this.directoryExists(worklogDir)

        let worklogData: Record<string, string[]> = {}

        // Read existing worklog if it exists
        if (fs.existsSync(worklogPath)) {
            const existingData = fs.readFileSync(worklogPath, 'utf8')
            worklogData = JSON.parse(existingData)
        }

        if (stepId == null) {
            stepId = 'Progress'
        }

        // Initialize array if stepId doesn't exist
        if (!worklogData[stepId]) {
            worklogData[stepId] = []
        }

        // Add description if not already present
        if (!worklogData[stepId].includes(description)) {
            worklogData[stepId].push(description)
        }

        // Write back to file
        fs.writeFileSync(worklogPath, JSON.stringify(worklogData, null, 2))
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
            timeout: { request: 300000 },
            responseType: 'buffer',
        })

        const buffer = [Buffer.from(response.body)]
        return await this.extractArchiveFromBuffer(exportName, buffer, saveToDir, logger)
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
        await this.directoryExists(saveToDir)
        await fs.writeFileSync(pathToArchive, Buffer.concat(buffer))

        const pathContainingArchive = path.dirname(pathToArchive)
        const zip = new AdmZip(pathToArchive)
        const zipEntries = zip.getEntries()
        await this.extractAllEntriesTo(pathContainingArchive, zipEntries, logger)
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
        for (const entry of zipEntries) {
            try {
                const entryPath = path.join(pathContainingArchive, entry.entryName)
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
