import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import * as archiver from 'archiver'
import * as fs from 'fs'
import path = require('path')
import { CodewhispererLanguage, getCodeWhispererLanguageIdFromPath } from '../languageDetection'
import { URI } from 'vscode-uri'
import * as walk from 'ignore-walk'

interface FileMetadata {
    filePath: string
    relativePath: string
    language: CodewhispererLanguage
    md5Hash: string
    contentLength: number
    lastModified: number
    content: string
}

// TODO, add excluded dirs to list of filtered files
const EXCLUDED_DIRS = ['dist', 'build', 'out', '.git', '.idea', '.vscode', 'coverage']
const SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES: CodewhispererLanguage[] = ['python', 'javascript', 'typescript', 'java']
const ARTIFACT_FOLDER_NAME = 'workspaceContextArtifacts'

export class ArtifactManager {
    private workspace: Workspace
    private logging: Logging
    private workspaceFolders: WorkspaceFolder[]
    private filesByLanguage: Map<CodewhispererLanguage, FileMetadata[]>
    private tempDirPath: string

    constructor(workspace: Workspace, logging: Logging, workspaceFolders: WorkspaceFolder[]) {
        this.workspace = workspace
        this.logging = logging
        this.workspaceFolders = workspaceFolders
        this.filesByLanguage = new Map<CodewhispererLanguage, FileMetadata[]>()

        const workspaceId = '123' //TODO, create or get workspace id
        this.tempDirPath = path.join(this.workspace.fs.getTempDirPath(), ARTIFACT_FOLDER_NAME, workspaceId)
        this.createFolderIfNotExist(this.tempDirPath)
    }

    // TODO, if MD5 hash is not needed, better to remove this function and remove content from FileMetadata interface to be memory efficient
    // Doing the readfile call inside this function and storing the contents in the FileMetadata allows us to call readFile only once
    // instead of calling it twice: once in md5 calculation and once during zip creation
    private async processFile(
        filePath: string,
        relativePath: string,
        language: CodewhispererLanguage
    ): Promise<FileMetadata> {
        const fileContent = this.workspace.fs.readFileSync(filePath)

        // const md5Hash = crypto.createHash('md5').update(fileContent).digest('hex')
        return {
            filePath,
            md5Hash: '123',
            contentLength: fileContent.length,
            lastModified: fs.statSync(filePath).mtimeMs,
            content: fileContent,
            language,
            relativePath,
        }
    }

    private async scanWorkspaces(): Promise<void> {
        this.filesByLanguage.clear()
        this.log(`Scanning workspaces: ${this.workspaceFolders.length}`)
        for (const workspaceFolder of this.workspaceFolders) {
            const workspacePath = URI.parse(workspaceFolder.uri).path
            const workspaceName = workspaceFolder.name

            try {
                const files = await walk({
                    path: workspacePath,
                    ignoreFiles: ['.gitignore'],
                    follow: false,
                    includeEmpty: false,
                })

                for (const relativePath of files) {
                    const fullPath = path.join(workspacePath, relativePath)
                    const relativePathWithWorkspaceName = path.join(workspaceName, relativePath)

                    try {
                        const language = getCodeWhispererLanguageIdFromPath(fullPath)
                        if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
                            continue
                        }

                        const fileMetadata: FileMetadata = await this.processFile(
                            fullPath,
                            relativePathWithWorkspaceName,
                            language
                        )

                        if (!this.filesByLanguage.has(language)) {
                            this.filesByLanguage.set(language, [])
                        }
                        this.filesByLanguage.get(language)!.push(fileMetadata)
                    } catch (error) {
                        this.log(`Error processing file ${fullPath}: ${error}`)
                    }
                }
            } catch (error) {
                this.log(`Error scanning workspace ${workspacePath}: ${error}`)
            }
        }
    }

    private async createLanguageZip(language: string, files: FileMetadata[]): Promise<void> {
        const zipPath = path.join(this.tempDirPath, `${language}.zip`)
        this.log(`Creating zip file: ${zipPath}`)

        const archive = archiver('zip', { zlib: { level: 9 } })
        const output = fs.createWriteStream(zipPath)

        return new Promise((resolve, reject) => {
            output.on('close', resolve)
            archive.on('error', reject)

            archive.pipe(output)

            for (const file of files) {
                archive.append(Buffer.from(file.content), { name: file.relativePath })
            }

            return archive.finalize()
        })
    }

    async createLanguageArtifacts(): Promise<void> {
        const startTime = performance.now()
        const metrics: Record<string, number> = {}

        try {
            const scanStart = performance.now()
            await this.scanWorkspaces()
            metrics.scanning = performance.now() - scanStart

            for (const [language, files] of this.filesByLanguage.entries()) {
                const zipStart = performance.now()
                await this.createLanguageZip(language, files)
                metrics[`zip_${language}`] = performance.now() - zipStart
            }

            const totalTime = performance.now() - startTime
            this.log(`Performance metrics: ${JSON.stringify(metrics)}`)
            this.log(`Total execution time: ${totalTime.toFixed(2)}ms`)
        } catch (error) {
            this.log(`Error creating language artifacts: ${error}`, 'error')
            throw error
        }
    }

    private createFolderIfNotExist(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    }

    private log(...messages: string[]) {
        this.logging.log(messages.join(' '))
    }

    cleanup() {
        try {
            fs.rmSync(this.tempDirPath, { recursive: true, force: true })
        } catch (error) {
            this.log('Failed to cleanup:' + error)
        }
    }
}
