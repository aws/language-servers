import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import * as archiver from 'archiver'
import * as fs from 'fs'
import path = require('path')
import { CodewhispererLanguage, getCodeWhispererLanguageIdFromPath } from '../languageDetection'
import { URI } from 'vscode-uri'
import * as walk from 'ignore-walk'
import JSZip = require('jszip')

export interface FileMetadata {
    filePath: string
    relativePath: string
    language: CodewhispererLanguage
    md5Hash: string
    contentLength: number
    lastModified: number
    content: string | Buffer
    workspaceFolder?: WorkspaceFolder
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
    private async scanWorkspaceFolders(): Promise<FileMetadata[]> {
        this.log('Scanning workspace folders...')
        const zipFileMetadata: FileMetadata[] = []

        for (const workspaceFolder of this.workspaceFolders) {
            const workspacePath = URI.parse(workspaceFolder.uri).path

            try {
                // Clear existing files for this workspace
                this.filesByWorkspaceFolderAndLanguage.set(
                    workspaceFolder,
                    new Map<CodewhispererLanguage, FileMetadata[]>()
                )

                const filesByLanguage = await this.processDirectoryFiles(workspacePath, workspaceFolder)
                await this.updateWorkspaceLanguageMap(workspaceFolder, filesByLanguage)
                const newZips = await this.createLanguageZips(workspaceFolder, filesByLanguage)
                zipFileMetadata.push(...newZips)
            } catch (error) {
                this.log(`Error scanning workspace folder ${workspacePath}: ${error}`)
            }
        }

        this.log(`Workspace scan completed`)
        return zipFileMetadata
    }

    private async createWorkspaceLanguageZip(
        workspaceFolder: WorkspaceFolder,
        language: string,
        files: FileMetadata[]
    ): Promise<Buffer> {
        const workspaceDirPath = path.join(this.tempDirPath, workspaceFolder.name)
        const zipPath = path.join(workspaceDirPath, `${language}.zip`)

        this.createFolderIfNotExist(workspaceDirPath)

        this.log(`Starting zip creation for: ${workspaceFolder.name}/${language}`)

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

    // TODO, workspacefolder input param is redundant
    private async processDirectoryFiles(
        directory: string,
        workspaceFolder: WorkspaceFolder,
        baseRelativePath: string = ''
    ): Promise<Map<CodewhispererLanguage, FileMetadata[]>> {
        const filesByLanguage = new Map<CodewhispererLanguage, FileMetadata[]>()

        const files = await walk({
            path: directory,
            ignoreFiles: ['.gitignore'],
            follow: false,
            includeEmpty: false,
        })

        for (const relativePath of files) {
            const fullPath = path.join(directory, relativePath)
            const language = getCodeWhispererLanguageIdFromPath(fullPath)

            if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
                continue
            }

            try {
                const fileMetadata = await this.processFile(
                    fullPath,
                    path.join(baseRelativePath, relativePath),
                    language
                )

                if (!filesByLanguage.has(language)) {
                    filesByLanguage.set(language, [])
                }
                filesByLanguage.get(language)!.push(fileMetadata)
            } catch (error) {
                this.log(`Error processing file ${fullPath}: ${error}`)
            }
        }

        return filesByLanguage
    }

    private async updateWorkspaceLanguageMap(
        workspaceFolder: WorkspaceFolder,
        filesByLanguage: Map<CodewhispererLanguage, FileMetadata[]>
    ): Promise<void> {
        const workspaceLanguageMap = this.filesByWorkspaceFolderAndLanguage.get(workspaceFolder)!

        for (const [language, files] of filesByLanguage.entries()) {
            if (!workspaceLanguageMap.has(language)) {
                workspaceLanguageMap.set(language, [])
            }
            workspaceLanguageMap.get(language)!.push(...files)
        }
    }

    private async createLanguageZips(
        workspaceFolder: WorkspaceFolder,
        filesByLanguage: Map<CodewhispererLanguage, FileMetadata[]>,
        subDirectory: string = ''
    ): Promise<FileMetadata[]> {
        const zipFileMetadata: FileMetadata[] = []

        for (const [language, files] of filesByLanguage.entries()) {
            if (files.length > 0) {
                try {
                    const zipBuffer = await this.createWorkspaceLanguageZip(workspaceFolder, language, files)

                    const zipPath = path.join(this.tempDirPath, workspaceFolder.name, subDirectory, `${language}.zip`)
                    const stats = fs.statSync(zipPath)

                    zipFileMetadata.push({
                        filePath: zipPath,
                        relativePath: path.join(workspaceFolder.name, subDirectory, `${language}.zip`),
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

        return zipFileMetadata
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

    async removeWorkspaceFolders(workspaceFolders: WorkspaceFolder[]): Promise<void> {
        this.log(
            `Number of workspace folders in memory before deletion: ${this.filesByWorkspaceFolderAndLanguage.size}`
        )

        workspaceFolders.forEach(workspaceToRemove => {
            // Find the matching workspace folder by URI
            let folderToDelete: WorkspaceFolder | undefined

            for (const [existingFolder] of this.filesByWorkspaceFolderAndLanguage) {
                if (existingFolder.uri === workspaceToRemove.uri) {
                    folderToDelete = existingFolder
                    break
                }
            }

            if (!folderToDelete) {
                this.log(`No matching workspace found for: ${workspaceToRemove.name}`)
                return
            }

            this.log(`Found matching workspace to remove: ${folderToDelete.name}`)
            this.filesByWorkspaceFolderAndLanguage.delete(folderToDelete)
            this.workspaceFolders = this.workspaceFolders.filter(folder => folder.uri !== workspaceToRemove.uri)
            const workspaceDirPath = path.join(this.tempDirPath, workspaceToRemove.name)
            fs.rmSync(workspaceDirPath, { recursive: true, force: true })
        })
        this.log(`Number of workspace folders in memory after deletion: ${this.filesByWorkspaceFolderAndLanguage.size}`)
    }

    async addNewDirectories(newDirectories: URI[]): Promise<FileMetadata[]> {
        const zipFileMetadata: FileMetadata[] = []

        for (const directory of newDirectories) {
            const workspaceFolder = this.workspaceFolders.find(ws => directory.path.startsWith(URI.parse(ws.uri).path))

            if (!workspaceFolder) {
                this.log(`No workspace folder found for directory ${directory.path}`)
                continue
            }

            try {
                // Calculate the relative path from workspace root to the new directory
                const workspacePath = URI.parse(workspaceFolder.uri).path
                const relativePath = path.relative(workspacePath, directory.path)

                // Process only files in this specific directory
                const filesByLanguage = await this.processDirectoryFiles(directory.path, workspaceFolder, relativePath)

                // Update the main workspace-language map
                await this.updateWorkspaceLanguageMap(workspaceFolder, filesByLanguage)

                // Create zip files specifically for this directory
                for (const [language, files] of filesByLanguage.entries()) {
                    const zip = new JSZip()

                    // Add only files from this specific directory to the zip
                    for (const file of files) {
                        zip.file(file.relativePath, file.content)
                    }

                    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

                    // Create zip in the specific subdirectory structure
                    const zipDirectoryPath = path.join(this.tempDirPath, workspaceFolder.name, relativePath)
                    this.createFolderIfNotExist(zipDirectoryPath)

                    const zipPath = path.join(zipDirectoryPath, `${language}.zip`)
                    await fs.promises.writeFile(zipPath, zipBuffer)

                    const stats = fs.statSync(zipPath)

                    zipFileMetadata.push({
                        filePath: zipPath,
                        // Maintain the relative path structure in the metadata
                        relativePath: path.join(workspaceFolder.name, relativePath, `${language}.zip`),
                        language: language,
                        md5Hash: '123', // TODO: Implement proper MD5 hash
                        contentLength: stats.size,
                        lastModified: stats.mtimeMs,
                        content: zipBuffer,
                    })
                }
            } catch (error) {
                this.log(`Error processing new directory ${directory.path}: ${error}`)
            }
        }

        return zipFileMetadata
    }

    async addWorkspaceFolders(workspaceFolders: WorkspaceFolder[]): Promise<FileMetadata[]> {
        this.log(`Adding new workspace folders: ${workspaceFolders.map(f => f.name).join(', ')}`)
        const zipFileMetadata: FileMetadata[] = []
        this.workspaceFolders = [...this.workspaceFolders, ...workspaceFolders]

        for (const workspaceFolder of workspaceFolders) {
            const workspacePath = URI.parse(workspaceFolder.uri).path

            if (!this.filesByWorkspaceFolderAndLanguage.has(workspaceFolder)) {
                this.filesByWorkspaceFolderAndLanguage.set(
                    workspaceFolder,
                    new Map<CodewhispererLanguage, FileMetadata[]>()
                )
            }

            try {
                const filesByLanguage = await this.processDirectoryFiles(workspacePath, workspaceFolder)
                await this.updateWorkspaceLanguageMap(workspaceFolder, filesByLanguage)
                const newZips = await this.createLanguageZips(workspaceFolder, filesByLanguage)
                zipFileMetadata.push(...newZips)
            } catch (error) {
                this.log(`Error processing workspace folder ${workspacePath}: ${error}`)
            }
        }
        this.log(`Number of workspace folders found: ${this.filesByWorkspaceFolderAndLanguage.size}`)

        return zipFileMetadata
    }

    // TODO: Update the function to return the content in a zipped fashion (if required)
    // TODO, update this function to find the file from the map and return the file metadata, no need to process already processed file
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
