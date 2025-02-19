import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import * as archiver from 'archiver'
import * as fs from 'fs'
import path = require('path')
import { CodewhispererLanguage, getCodeWhispererLanguageIdFromPath } from '../languageDetection'
import { URI } from 'vscode-uri'
import * as walk from 'ignore-walk'

export interface FileMetadata {
    filePath: string
    relativePath: string
    language: CodewhispererLanguage
    md5Hash: string
    contentLength: number
    lastModified: number
    content: string | Buffer
}

// TODO, add excluded dirs to list of filtered files
const EXCLUDED_DIRS = ['dist', 'build', 'out', '.git', '.idea', '.vscode', 'coverage']
const SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES: CodewhispererLanguage[] = ['python', 'javascript', 'typescript', 'java']
const ARTIFACT_FOLDER_NAME = 'workspaceContextArtifacts'

export class ArtifactManager {
    private workspace: Workspace
    private logging: Logging
    private workspaceFolders: WorkspaceFolder[]
    // TODO, how to handle when two workspace folders have the same name but different URI
    private filesByWorkspaceFolderAndLanguage: Map<WorkspaceFolder, Map<CodewhispererLanguage, FileMetadata[]>>
    private tempDirPath: string

    constructor(workspace: Workspace, logging: Logging, workspaceFolders: WorkspaceFolder[]) {
        this.workspace = workspace
        this.logging = logging
        this.workspaceFolders = workspaceFolders
        this.filesByWorkspaceFolderAndLanguage = new Map<WorkspaceFolder, Map<CodewhispererLanguage, FileMetadata[]>>()

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

    private async scanWorkspaceFolders(): Promise<void> {
        this.filesByWorkspaceFolderAndLanguage.clear()
        this.log(`Scanning ${this.workspaceFolders.length} workspace folders`)

        for (const workspaceFolder of this.workspaceFolders) {
            const workspacePath = URI.parse(workspaceFolder.uri).path
            // Initialize map for this workspace
            if (!this.filesByWorkspaceFolderAndLanguage.has(workspaceFolder)) {
                this.filesByWorkspaceFolderAndLanguage.set(workspaceFolder, new Map())
            }

            try {
                const files = await walk({
                    path: workspacePath,
                    ignoreFiles: ['.gitignore'],
                    follow: false,
                    includeEmpty: false,
                })

                for (const relativePath of files) {
                    const fullPath = path.join(workspacePath, relativePath)
                    const relativePathInWorkspace = relativePath
                    try {
                        const language = getCodeWhispererLanguageIdFromPath(fullPath)
                        if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
                            continue
                        }

                        const fileMetadata: FileMetadata = await this.processFile(
                            fullPath,
                            relativePathInWorkspace,
                            language
                        )

                        const workspaceLanguageMap = this.filesByWorkspaceFolderAndLanguage.get(workspaceFolder)!
                        if (!workspaceLanguageMap.has(language)) {
                            workspaceLanguageMap.set(language, [])
                        }
                        workspaceLanguageMap.get(language)!.push(fileMetadata)
                    } catch (error) {
                        this.log(`Error processing file ${fullPath}: ${error}`)
                    }
                }
            } catch (error) {
                this.log(`Error scanning workspace ${workspacePath}: ${error}`)
            }
        }
    }

    private async createWorkspaceLanguageZip(
        workspaceFolder: WorkspaceFolder,
        language: string,
        files: FileMetadata[]
    ): Promise<Buffer> {
        const workspaceDirPath = path.join(this.tempDirPath, workspaceFolder.name)
        const zipPath = path.join(workspaceDirPath, `${language}.zip`)

        this.createFolderIfNotExist(workspaceDirPath)

        this.log(`Starting zip creation for workspace folder: ${workspaceFolder.name}, language: ${language}`)
        this.log(`Zip file path: ${zipPath}`)

        const archive = archiver('zip', { zlib: { level: 9 } })
        const output = fs.createWriteStream(zipPath)

        // Pipe archive to file
        archive.pipe(output)

        // Add files to archive
        for (const file of files) {
            archive.append(Buffer.from(file.content), { name: file.relativePath })
        }

        // Wait for the archive to be written to file
        await Promise.all([
            new Promise((resolve, reject) => {
                output.on('close', resolve)
                archive.on('error', reject)
            }),
            archive.finalize(),
        ])

        // Read the file back into a buffer
        return await fs.promises.readFile(zipPath)
    }

    async createLanguageArtifacts(): Promise<FileMetadata[]> {
        const startTime = performance.now()
        const metrics: Record<string, number> = {}
        const zipFileMetadata: FileMetadata[] = []

        try {
            const scanStart = performance.now()
            // TODO, if needed we can add logic to skip the scan step, if for example the scan has already run
            await this.scanWorkspaceFolders()
            metrics.scanning = performance.now() - scanStart

            this.log('Workspace scan completed')
            this.log(`Number of workspace folders found: ${this.filesByWorkspaceFolderAndLanguage.size}`)

            for (const [workspaceFolder, languageMap] of this.filesByWorkspaceFolderAndLanguage.entries()) {
                this.log(`Processing workspace: ${workspaceFolder.name}`)
                this.log(`Number of languages in workspace: ${languageMap.size}`)

                for (const [language, files] of languageMap.entries()) {
                    this.log(`Processing language: ${language} in workspace: ${workspaceFolder.name}`)
                    this.log(`Number of files: ${files.length}`)

                    const zipStart = performance.now()
                    const zipBuffer = await this.createWorkspaceLanguageZip(workspaceFolder, language, files)
                    this.log(
                        `Zip creation completed for language: ${language} in workspace: ${workspaceFolder.name}, here is the zip: ${zipBuffer}`
                    )
                    const zipPath = path.join(this.tempDirPath, workspaceFolder.name, `${language}.zip`)
                    const stats = fs.statSync(zipPath)
                    zipFileMetadata.push({
                        filePath: zipPath,
                        relativePath: path.join(workspaceFolder.name, `${language}.zip`),
                        language: language,
                        md5Hash: '123', // todo, probably not needed for the zip file
                        contentLength: stats.size,
                        lastModified: stats.mtimeMs,
                        content: zipBuffer,
                    })

                    metrics[`zip_${workspaceFolder.name}_${language}`] = performance.now() - zipStart
                }
            }

            const totalTime = performance.now() - startTime
            this.log(`Performance metrics: ${JSON.stringify(metrics)}`)
            this.log(`Total execution time: ${totalTime.toFixed(2)}ms`)

            return zipFileMetadata
        } catch (error) {
            this.log(`Error creating language artifacts: ${error}`)
            throw error
        }
    }

    // todo, 3 functions below are WIP
    async removeWorkspaceFolders(workspaceFolders: WorkspaceFolder[]): Promise<void> {
        workspaceFolders.forEach(workspaceFolder => {
            this.filesByWorkspaceFolderAndLanguage.delete(workspaceFolder)
            // TODO, maybe remove the zip
        })
    }

    async addNewDirectories(directories: URI[]): Promise<FileMetadata[]> {
        // for each new directory find the correct workspace folder for them and update the filesByWorkspaceAndLanguage map
        // and create a new zip for the new folders
        // todo update this logic to return file metadata for zips instead of files
        const files: FileMetadata[] = []
        directories.forEach(async directory => {
            const workspaceFolder = this.workspaceFolders.find(folder => {
                const workspacePath = URI.parse(folder.uri).path
                return directory.path.startsWith(workspacePath)
            })
            if (!workspaceFolder) {
                this.log(`No workspace folder found for directory: ${directory.path}`)
                return
            }
            // todo ,this logic is wrong, it tries to determine language from directory path
            const workspacePath = URI.parse(workspaceFolder.uri).path
            const relativePath = directory.path.slice(workspacePath.length + 1)
            const language = getCodeWhispererLanguageIdFromPath(relativePath)
            if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
                return
            }
            const fileMetadata: FileMetadata = await this.processFile(directory.path, relativePath, language)
            files.push(fileMetadata)
            const workspaceLanguageMap = this.filesByWorkspaceFolderAndLanguage.get(workspaceFolder)!
            if (!workspaceLanguageMap.has(language)) {
                workspaceLanguageMap.set(language, [])
            }
            workspaceLanguageMap.get(language)!.push(fileMetadata)
        })
        return files
    }

    async addWorkspaceFolders(workspaceFolders: WorkspaceFolder[]): Promise<FileMetadata[]> {
        this.workspaceFolders = [...this.workspaceFolders, ...workspaceFolders]
        const files: FileMetadata[] = []

        // for new workspace folders add them to the map and create a new zip for the new folders
        workspaceFolders.forEach(async workspaceFolder => {
            const workspacePath = URI.parse(workspaceFolder.uri).path

            // Initialize map for this workspace
            if (!this.filesByWorkspaceFolderAndLanguage.has(workspaceFolder)) {
                this.filesByWorkspaceFolderAndLanguage.set(workspaceFolder, new Map())
            }

            try {
                const files = await walk({
                    path: workspacePath,
                    ignoreFiles: ['.gitignore'],
                    follow: false,
                    includeEmpty: false,
                })

                for (const relativePath of files) {
                    const fullPath = path.join(workspacePath, relativePath)
                    const relativePathInWorkspace = relativePath
                    try {
                        const language = getCodeWhispererLanguageIdFromPath(fullPath)
                        if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
                            continue
                        }

                        const fileMetadata: FileMetadata = await this.processFile(
                            fullPath,
                            relativePathInWorkspace,
                            language
                        )

                        const workspaceLanguageMap = this.filesByWorkspaceFolderAndLanguage.get(workspaceFolder)!
                        if (!workspaceLanguageMap.has(language)) {
                            workspaceLanguageMap.set(language, [])
                        }
                        workspaceLanguageMap.get(language)!.push(fileMetadata)
                    } catch (error) {
                        this.log(`Error processing file ${fullPath}: ${error}`)
                        throw error
                    }
                }
            } catch (error) {
                this.log(`Error scanning workspace ${workspacePath}: ${error}`)
                throw error
            }
        })

        return files
    }

    // TODO: Update the function to return the content in a zipped fashion (if required)
    async getFileMetadata(currentWorkspace: WorkspaceFolder, filePath: string): Promise<FileMetadata> {
        const workspacePath = URI.parse(currentWorkspace.uri).path
        const workspaceName = currentWorkspace.name
        const relativePathWithWorkspaceName = path.join(workspaceName, filePath)

        const language = getCodeWhispererLanguageIdFromPath(filePath)
        if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
            return Promise.reject('unsupported language')
        }
        const fileMetadata: FileMetadata = await this.processFile(
            URI.parse(filePath).path,
            relativePathWithWorkspaceName,
            language
        )
        return fileMetadata
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
