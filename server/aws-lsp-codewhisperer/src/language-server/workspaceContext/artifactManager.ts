import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import * as fs from 'fs'
import path = require('path')
import { CodewhispererLanguage, getCodeWhispererLanguageIdFromPath } from '../languageDetection'
import { URI } from 'vscode-uri'
import * as walk from 'ignore-walk'
import JSZip = require('jszip')
import { md5 } from 'js-md5'

export interface FileMetadata {
    filePath: string
    relativePath: string
    language: CodewhispererLanguage
    contentLength: number
    lastModified: number
    content: string | Buffer
    md5Hash: string
    workspaceFolder?: WorkspaceFolder //TODO, make this mandatory maybe
}

// TODO, add excluded dirs to list of filtered files
const EXCLUDED_DIRS = ['dist', 'build', 'out', '.git', '.idea', '.vscode', 'coverage']
export const SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES: CodewhispererLanguage[] = [
    'python',
    'javascript',
    'typescript',
    'java',
]
const ARTIFACT_FOLDER_NAME = 'workspaceContextArtifacts'

export class ArtifactManager {
    private workspace: Workspace
    private logging: Logging
    private workspaceFolders: WorkspaceFolder[]
    // TODO, how to handle when two workspace folders have the same name but different URI
    // TODO, maintaining this map might be redundant. It helps with keeping track of the overall state of the workspace
    // this means we keep a copy of the workspace in memory. We should clean the map contents after every zip creation
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

    updateWorkspaceFolders(workspaceFolders: WorkspaceFolder[]) {
        this.workspaceFolders = workspaceFolders
    }

    async createLanguageArtifacts(): Promise<FileMetadata[]> {
        const startTime = performance.now()
        let zipFileMetadata: FileMetadata[] = []

        try {
            for (const workspaceFolder of this.workspaceFolders) {
                const workspacePath = URI.parse(workspaceFolder.uri).path
                const filesByLanguage = await this.processDirectory(workspacePath)
                const fileMetadata = await this.processFilesByLanguage(workspaceFolder, filesByLanguage)
                zipFileMetadata.push(...fileMetadata)
            }
            const totalTime = performance.now() - startTime
            this.log(`Total execution time: ${totalTime.toFixed(2)}ms`)

            return zipFileMetadata
        } catch (error) {
            this.log(`Error creating language artifacts: ${error}`)
            throw error
        }
    }

    async addNewDirectories(newDirectories: URI[]): Promise<FileMetadata[]> {
        let zipFileMetadata: FileMetadata[] = []

        for (const directory of newDirectories) {
            const workspaceFolder = this.workspaceFolders.find(ws => directory.path.startsWith(URI.parse(ws.uri).path))

            if (!workspaceFolder) {
                this.log(`No workspace folder found for directory ${directory.path}`)
                continue
            }

            try {
                const workspacePath = URI.parse(workspaceFolder.uri).path
                const relativePath = path.relative(workspacePath, directory.path)

                const filesByLanguage = await this.processDirectory(directory.path, relativePath)
                zipFileMetadata = await this.processFilesByLanguage(workspaceFolder, filesByLanguage, relativePath)
            } catch (error) {
                this.log(`Error processing new directory ${directory.path}: ${error}`)
            }
        }

        return zipFileMetadata
    }

    async addWorkspaceFolders(workspaceFolders: WorkspaceFolder[]): Promise<FileMetadata[]> {
        this.log(`Adding new workspace folders: ${workspaceFolders.map(f => f.name).join(', ')}`)
        let zipFileMetadata: FileMetadata[] = []
        this.workspaceFolders = [...this.workspaceFolders, ...workspaceFolders]

        for (const workspaceFolder of workspaceFolders) {
            const workspacePath = URI.parse(workspaceFolder.uri).path

            try {
                const filesByLanguage = await this.processDirectory(workspacePath)
                zipFileMetadata = await this.processFilesByLanguage(workspaceFolder, filesByLanguage)
            } catch (error) {
                this.log(`Error processing workspace folder ${workspacePath}: ${error}`)
            }
        }

        this.log(`Number of workspace folders found: ${this.filesByWorkspaceFolderAndLanguage.size}`)
        return zipFileMetadata
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

    // TODO: Update the function to return the content in a zipped fashion (if required)
    async getFileMetadata(currentWorkspace: WorkspaceFolder, filePath: string): Promise<FileMetadata> {
        const workspaceName = currentWorkspace.name
        const relativePathWithWorkspaceName = path.join(workspaceName, filePath)

        const language = getCodeWhispererLanguageIdFromPath(filePath)
        if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
            return Promise.reject('unsupported language')
        }
        const fileMetadata: FileMetadata = await this.createFileMetadata(
            URI.parse(filePath).path,
            relativePathWithWorkspaceName,
            language,
            true
        )

        if (!fileMetadata.md5Hash) {
            return Promise.reject('missing md5 hash')
        }
        return fileMetadata
    }

    cleanup() {
        try {
            fs.rmSync(this.tempDirPath, { recursive: true, force: true })
        } catch (error) {
            this.log('Failed to cleanup:' + error)
        }
    }

    // TODO, if MD5 hash is not needed, better to remove this function and remove content from FileMetadata interface to be memory efficient
    // Doing the readfile call inside this function and storing the contents in the FileMetadata allows us to call readFile only once
    // instead of calling it twice: once in md5 calculation and once during zip creation
    private async createFileMetadata(
        filePath: string,
        relativePath: string,
        language: CodewhispererLanguage,
        shouldCalculateHash = false
    ): Promise<FileMetadata> {
        const fileContent = this.workspace.fs.readFileSync(filePath)

        return {
            filePath,
            md5Hash: shouldCalculateHash ? md5.base64(fileContent) : '',
            contentLength: fileContent.length,
            lastModified: fs.statSync(filePath).mtimeMs,
            content: fileContent,
            language,
            relativePath,
        }
    }

    private async createZipForLanguage(
        workspaceFolder: WorkspaceFolder,
        language: CodewhispererLanguage,
        files: FileMetadata[],
        subDirectory: string = ''
    ): Promise<FileMetadata> {
        const zipDirectoryPath = path.join(this.tempDirPath, workspaceFolder.name, subDirectory)
        this.createFolderIfNotExist(zipDirectoryPath)

        const zipPath = path.join(zipDirectoryPath, `${language}.zip`)
        const zipBuffer = await this.createZipBuffer(files)
        await fs.promises.writeFile(zipPath, zipBuffer)

        const stats = fs.statSync(zipPath)

        return {
            filePath: zipPath,
            relativePath: path.join(workspaceFolder.name, subDirectory, `${language}.zip`),
            language,
            md5Hash: md5.base64(zipBuffer),
            contentLength: stats.size,
            lastModified: stats.mtimeMs,
            content: zipBuffer,
            workspaceFolder: workspaceFolder,
        }
    }

    private async createZipBuffer(files: FileMetadata[]): Promise<Buffer> {
        const zip = new JSZip()
        for (const file of files) {
            zip.file(file.relativePath, file.content)
        }
        return await zip.generateAsync({ type: 'nodebuffer' })
    }

    private async processDirectory(
        directoryPath: string,
        baseRelativePath: string = ''
    ): Promise<Map<CodewhispererLanguage, FileMetadata[]>> {
        const filesByLanguage = new Map<CodewhispererLanguage, FileMetadata[]>()

        const files = await walk({
            path: directoryPath,
            ignoreFiles: ['.gitignore'],
            follow: false,
            includeEmpty: false,
        })

        for (const relativePath of files) {
            const fullPath = path.join(directoryPath, relativePath)
            const language = getCodeWhispererLanguageIdFromPath(fullPath)

            if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
                continue
            }

            try {
                const fileMetadata = await this.createFileMetadata(
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

    private async updateWorkspaceFiles(
        workspaceFolder: WorkspaceFolder,
        filesByLanguage: Map<CodewhispererLanguage, FileMetadata[]>
    ): Promise<void> {
        if (!this.filesByWorkspaceFolderAndLanguage.has(workspaceFolder)) {
            this.filesByWorkspaceFolderAndLanguage.set(
                workspaceFolder,
                new Map<CodewhispererLanguage, FileMetadata[]>()
            )
        }

        const workspaceMap = this.filesByWorkspaceFolderAndLanguage.get(workspaceFolder)!
        for (const [language, files] of filesByLanguage.entries()) {
            if (!workspaceMap.has(language)) {
                workspaceMap.set(language, [])
            }
            workspaceMap.get(language)!.push(...files)
        }
    }

    private async processFilesByLanguage(
        workspaceFolder: WorkspaceFolder,
        filesByLanguage: Map<CodewhispererLanguage, FileMetadata[]>,
        relativePath?: string
    ): Promise<FileMetadata[]> {
        const zipFileMetadata: FileMetadata[] = []
        await this.updateWorkspaceFiles(workspaceFolder, filesByLanguage)

        for (const [language, files] of filesByLanguage.entries()) {
            const zipMetadata = await this.createZipForLanguage(workspaceFolder, language, files, relativePath)
            if (zipMetadata) {
                zipFileMetadata.push(zipMetadata)
            }
        }
        return zipFileMetadata
    }

    private createFolderIfNotExist(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    }

    private log(...messages: string[]) {
        this.logging.log(messages.join(' '))
    }
}
