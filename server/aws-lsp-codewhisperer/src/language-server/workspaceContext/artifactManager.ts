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
                    this.log(`Zip creation completed for language: ${language} in workspace: ${workspaceFolder.name}`)
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
        this.log(JSON.stringify(this.filesByWorkspaceFolderAndLanguage))

        workspaceFolders.forEach(workspaceFolder => {
            const workspaceMap = this.filesByWorkspaceFolderAndLanguage.get(workspaceFolder)
            // Log the contents before deletion
            if (workspaceMap) {
                this.log('Current workspace map contents:')
                workspaceMap.forEach((files, language) => {
                    this.log(`Language: ${language}, Number of files: ${files.length}`)
                })
            } else {
                this.log('No entries found for this workspace')
            }

            this.filesByWorkspaceFolderAndLanguage.delete(workspaceFolder)
            this.workspaceFolders = this.workspaceFolders.filter(folder => folder !== workspaceFolder)
            const workspaceDirPath = path.join(this.tempDirPath, workspaceFolder.name)
            this.log(`Removing workspace folder: ${workspaceDirPath}`)
            fs.rmSync(workspaceDirPath, { recursive: true, force: true })
            this.log(`${this.filesByWorkspaceFolderAndLanguage.get(workspaceFolder)}`)
        })
    }

    async addNewDirectories(directories: URI[]): Promise<FileMetadata[]> {
        const zipFileMetadata: FileMetadata[] = []

        for (const directory of directories) {
            // Find the corresponding workspace folder for this directory
            const workspaceFolder = this.workspaceFolders.find(folder => {
                const workspacePath = URI.parse(folder.uri).path
                return directory.path.startsWith(workspacePath)
            })

            if (!workspaceFolder) {
                this.log(`No workspace folder found for directory: ${directory.path}`)
                continue
            }

            // Calculate relative path from workspace to directory
            const workspacePath = URI.parse(workspaceFolder.uri).path
            const relativeDirectoryPath = directory.path.slice(workspacePath.length + 1)

            // Get all files in the directory
            const files = await walk({
                path: directory.path,
                ignoreFiles: ['.gitignore'],
                follow: false,
            })

            const filesByLanguage = new Map<CodewhispererLanguage, FileMetadata[]>()

            // Process each file
            for (const relativePath of files) {
                const fullPath = path.join(directory.path, relativePath)
                const language = getCodeWhispererLanguageIdFromPath(fullPath)

                if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
                    continue
                }

                const fileMetadata = await this.processFile(fullPath, relativePath, language)

                if (!filesByLanguage.has(language)) {
                    filesByLanguage.set(language, [])
                }
                filesByLanguage.get(language)!.push(fileMetadata)

                // Also add to the main map
                const workspaceLanguageMap = this.filesByWorkspaceFolderAndLanguage.get(workspaceFolder)!
                if (!workspaceLanguageMap.has(language)) {
                    workspaceLanguageMap.set(language, [])
                }
                workspaceLanguageMap.get(language)!.push(fileMetadata)
            }

            // Create zip files for each language
            for (const [language, files] of filesByLanguage.entries()) {
                try {
                    // Create zip in a subdirectory matching the directory structure
                    const directorySpecificPath = path.join(
                        this.tempDirPath,
                        workspaceFolder.name,
                        relativeDirectoryPath
                    )

                    // Ensure the directory exists
                    this.createFolderIfNotExist(directorySpecificPath)
                    const zipPath = path.join(directorySpecificPath, `${language}.zip`)
                    // Create a new archive for this specific directory
                    const archive = archiver('zip', { zlib: { level: 9 } })
                    const output = fs.createWriteStream(zipPath)
                    const chunks: Buffer[] = []

                    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
                    archive.pipe(output)

                    for (const file of files) {
                        archive.append(Buffer.from(file.content), { name: file.relativePath })
                    }

                    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
                        output.on('close', () => resolve(Buffer.concat(chunks)))
                        archive.on('error', reject)
                        archive.finalize().catch(error => {
                            reject(new Error(`Failed to finalize archive: ${error}`))
                        })
                    })

                    const stats = fs.statSync(zipPath)
                    const metadata: FileMetadata = {
                        filePath: zipPath,
                        relativePath: path.join(workspaceFolder.name, relativeDirectoryPath, `${language}.zip`),
                        language: language,
                        md5Hash: '123',
                        contentLength: stats.size,
                        lastModified: stats.mtimeMs,
                        content: zipBuffer,
                    }
                    zipFileMetadata.push(metadata)
                } catch (error) {
                    this.log(`Error creating zip for directory ${directory.path} and language ${language}: ${error}`)
                }
            }
        }

        return zipFileMetadata
    }

    async addWorkspaceFoldersOld(workspaceFolders: WorkspaceFolder[]): Promise<FileMetadata[]> {
        this.log(`Adding new workspaceFolder ${JSON.stringify(workspaceFolders)}`)
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
                }
            } catch (error) {
                this.log(`Error scanning workspace ${workspacePath}: ${error}`)
                throw error
            }
        })

        return files
    }

    async addWorkspaceFolders(workspaceFolders: WorkspaceFolder[]): Promise<FileMetadata[]> {
        this.log(`Adding new workspace folders: ${workspaceFolders.map(f => f.name).join(', ')}`)
        const zipFileMetadata: FileMetadata[] = []

        // Add new workspace folders to our list
        this.workspaceFolders = [...this.workspaceFolders, ...workspaceFolders]

        for (const workspaceFolder of workspaceFolders) {
            const workspacePath = URI.parse(workspaceFolder.uri).path

            // Initialize map for this workspace
            if (!this.filesByWorkspaceFolderAndLanguage.has(workspaceFolder)) {
                this.filesByWorkspaceFolderAndLanguage.set(workspaceFolder, new Map())
            }

            try {
                // Scan all files in the workspace
                const files = await walk({
                    path: workspacePath,
                    ignoreFiles: ['.gitignore'],
                    follow: false,
                    includeEmpty: false,
                })

                // Group files by language
                const filesByLanguage = new Map<CodewhispererLanguage, FileMetadata[]>()

                // Process each file
                for (const relativePath of files) {
                    const fullPath = path.join(workspacePath, relativePath)
                    const language = getCodeWhispererLanguageIdFromPath(fullPath)

                    if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
                        continue
                    }

                    try {
                        const fileMetadata = await this.processFile(fullPath, relativePath, language)

                        // Add to language group
                        if (!filesByLanguage.has(language)) {
                            filesByLanguage.set(language, [])
                        }
                        filesByLanguage.get(language)!.push(fileMetadata)

                        // Add to main workspace map
                        const workspaceLanguageMap = this.filesByWorkspaceFolderAndLanguage.get(workspaceFolder)!
                        if (!workspaceLanguageMap.has(language)) {
                            workspaceLanguageMap.set(language, [])
                        }
                        workspaceLanguageMap.get(language)!.push(fileMetadata)
                    } catch (error) {
                        this.log(`Error processing file ${fullPath}: ${error}`)
                    }
                }

                // Create zip files for each language
                for (const [language, languageFiles] of filesByLanguage.entries()) {
                    if (languageFiles.length > 0) {
                        try {
                            const zipBuffer = await this.createWorkspaceLanguageZip(
                                workspaceFolder,
                                language,
                                languageFiles
                            )

                            const zipPath = path.join(this.tempDirPath, workspaceFolder.name, `${language}.zip`)
                            const stats = fs.statSync(zipPath)

                            zipFileMetadata.push({
                                filePath: zipPath,
                                relativePath: path.join(workspaceFolder.name, `${language}.zip`),
                                language: language,
                                md5Hash: '123',
                                contentLength: stats.size,
                                lastModified: stats.mtimeMs,
                                content: zipBuffer,
                            })
                        } catch (error) {
                            this.log(
                                `Error creating zip for workspace ${workspaceFolder.name} and language ${language}: ${error}`
                            )
                        }
                    }
                }
            } catch (error) {
                this.log(`Error processing workspace folder ${workspacePath}: ${error}`)
            }
        }

        return zipFileMetadata
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
        const fileMetadata: FileMetadata = await this.processFile(filePath, relativePathWithWorkspaceName, language)
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
