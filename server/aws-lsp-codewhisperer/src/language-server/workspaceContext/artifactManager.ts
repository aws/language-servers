import { Logging, Workspace, WorkspaceFolder } from '@aws/language-server-runtimes/server-interface'
import * as fs from 'fs'
import path = require('path')
import { CodewhispererLanguage, getCodeWhispererLanguageIdFromPath } from '../languageDetection'
import { URI } from 'vscode-uri'
import JSZip = require('jszip')
import { EclipseConfigGenerator, JavaProjectAnalyzer } from './javaManager'
import { isDirectory } from './util'
import glob = require('fast-glob')

export interface FileMetadata {
    filePath: string
    relativePath: string
    language: CodewhispererLanguage
    contentLength: number
    lastModified: number
    content: string | Buffer
    workspaceFolder: WorkspaceFolder
}

export const SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES: CodewhispererLanguage[] = [
    'python',
    'javascript',
    'typescript',
    'java',
]
const ARTIFACT_FOLDER_NAME = 'workspaceContextArtifacts'
const IGNORE_PATTERNS = [
    // Package management and git
    '**/node_modules/**',
    '**/.git/**',
    // Build outputs
    '**/dist/**',
    '**/build/**',
    '**/out/**',
    // Test directories
    '**/test/**',
    '**/tests/**',
    '**/coverage/**',
    // Hidden directories and files
    '**/.*/**',
    '**/.*',
    // Logs and temporary files
    '**/logs/**',
    '**/tmp/**',
    // Environment and configuration
    '**/env/**',
    '**/venv/**',
    '**/bin/**',
    // Framework specific
    '**/target/**', // Maven/Gradle builds
]

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

        this.tempDirPath = path.join(this.workspace.fs.getTempDirPath(), ARTIFACT_FOLDER_NAME)
        this.createFolderIfNotExist(this.tempDirPath)
    }

    updateWorkspaceFolders(workspaceFolders: WorkspaceFolder[]) {
        this.workspaceFolders = workspaceFolders
    }

    // Public functions
    async createLanguageArtifacts(): Promise<FileMetadata[]> {
        const startTime = performance.now()
        let zipFileMetadata: FileMetadata[] = []

        try {
            for (const workspaceFolder of this.workspaceFolders) {
                const workspacePath = URI.parse(workspaceFolder.uri).path
                const filesByLanguage = await this.processDirectory(workspaceFolder, workspacePath)
                const fileMetadata = await this.processFilesByLanguage(workspaceFolder, filesByLanguage)
                zipFileMetadata.push(...fileMetadata)
            }
            const totalTime = performance.now() - startTime
            this.log(`Creating workspace source code artifacts took: ${totalTime.toFixed(2)}ms`)

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

                const filesByLanguage = await this.processDirectory(workspaceFolder, directory.path, relativePath)
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
                const filesByLanguage = await this.processDirectory(workspaceFolder, workspacePath)
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

    async getFileMetadata(
        currentWorkspace: WorkspaceFolder,
        filePath: string,
        languageOverride?: CodewhispererLanguage,
        filePathInZipOverride?: string
    ): Promise<FileMetadata[]> {
        let fileMetadataList: FileMetadata[] = []
        const language =
            languageOverride !== undefined ? languageOverride : getCodeWhispererLanguageIdFromPath(filePath)
        if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
            return Promise.reject('unsupported language')
        }

        if (isDirectory(filePath)) {
            const files = await glob(['**/*'], {
                cwd: filePath,
                dot: false,
                ignore: IGNORE_PATTERNS,
                followSymbolicLinks: false,
                absolute: false,
                onlyFiles: true,
            })

            for (const relativePath of files) {
                const fullPath = path.join(filePath, relativePath)
                try {
                    const fileMetadata = await this.createFileMetadata(
                        fullPath,
                        path.join(filePathInZipOverride !== undefined ? filePathInZipOverride : '', relativePath),
                        language,
                        currentWorkspace
                    )
                    fileMetadataList.push(fileMetadata)
                } catch (error) {
                    this.log(`Error processing file ${fullPath}: ${error}`)
                }
            }
        } else {
            const workspaceUri = URI.parse(currentWorkspace.uri)
            const fileUri = URI.parse(filePath)
            const relativePath =
                filePathInZipOverride !== undefined
                    ? filePathInZipOverride
                    : path.join(currentWorkspace.name, path.relative(workspaceUri.path, fileUri.path))

            const fileMetadata: FileMetadata = await this.createFileMetadata(
                fileUri.path,
                relativePath,
                language,
                currentWorkspace
            )
            fileMetadataList.push(fileMetadata)
        }
        return fileMetadataList
    }

    async processNewFile(currentWorkspace: WorkspaceFolder, filePath: string): Promise<FileMetadata> {
        this.log(`Processing new file: ${filePath}`)
        const workspaceUri = URI.parse(currentWorkspace.uri)
        const fileUri = URI.parse(filePath)
        // const relativePath = path.join(currentWorkspace.name, path.relative(workspaceUri.path, fileUri.path))

        const language = getCodeWhispererLanguageIdFromPath(filePath)
        if (!language || !SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.includes(language)) {
            return Promise.reject('unsupported language')
        }

        const fileMetadata: FileMetadata = await this.createFileMetadata(
            fileUri.path,
            path.relative(workspaceUri.path, fileUri.path),
            language,
            currentWorkspace
        )

        // Find existing workspace folder or use current one
        const workspaceKey = this.findWorkspaceFolder(currentWorkspace) || currentWorkspace

        // Update the internal map with the new file metadata
        if (!this.filesByWorkspaceFolderAndLanguage.has(workspaceKey)) {
            this.filesByWorkspaceFolderAndLanguage.set(workspaceKey, new Map<CodewhispererLanguage, FileMetadata[]>())
        }

        const workspaceMap = this.filesByWorkspaceFolderAndLanguage.get(workspaceKey)!
        if (!workspaceMap.has(language)) {
            workspaceMap.set(language, [])
        }

        // Replace or add the file metadata
        const files = workspaceMap.get(language)!
        const existingIndex = files.findIndex(f => f.filePath === fileMetadata.filePath)
        if (existingIndex !== -1) {
            files[existingIndex] = fileMetadata
        } else {
            files.push(fileMetadata)
        }

        const zippedMetadata = await this.createZipForFile(
            currentWorkspace,
            language,
            [fileMetadata],
            path.relative(workspaceUri.path, fileUri.path)
        )
        return zippedMetadata
    }

    handleDeletedPathAndGetLanguages(fileUri: string, workspaceRoot: WorkspaceFolder): CodewhispererLanguage[] {
        const fileLanguage = getCodeWhispererLanguageIdFromPath(fileUri)
        const programmingLanguages = new Set<CodewhispererLanguage>()

        // Add the file language if we can determine it, but don't return early
        if (fileLanguage) {
            programmingLanguages.add(fileLanguage)
        }

        const languagesMap = this.getLanguagesForWorkspaceFolder(workspaceRoot)
        if (!languagesMap) {
            return Array.from(programmingLanguages)
        }

        const deletedFilePath = URI.parse(fileUri).fsPath

        // Check and update the language maps
        for (const [language, files] of languagesMap.entries()) {
            const affectedFiles = files.filter(
                file => file.filePath.startsWith(deletedFilePath) || file.filePath === deletedFilePath
            )

            if (affectedFiles.length > 0) {
                programmingLanguages.add(language)

                // Update the map by removing affected files
                const remainingFiles = files.filter(file => !affectedFiles.includes(file))
                if (remainingFiles.length === 0) {
                    languagesMap.delete(language)
                } else {
                    languagesMap.set(language, remainingFiles)
                }
            }
        }
        return Array.from(programmingLanguages)
    }

    cleanup(preserveDependencies: boolean = false) {
        try {
            this.workspaceFolders.forEach(workspaceToRemove => {
                const workspaceDirPath = path.join(this.tempDirPath, workspaceToRemove.name)

                if (preserveDependencies) {
                    // Define the zip files to delete
                    const zipPatternsToDelete = [
                        'files.zip',
                        ...SUPPORTED_WORKSPACE_CONTEXT_LANGUAGES.map(lang => `${lang}.zip`),
                    ]

                    // If directory exists, only delete specific zip files
                    if (fs.existsSync(workspaceDirPath)) {
                        const entries = fs.readdirSync(workspaceDirPath)
                        entries.forEach(entry => {
                            const entryPath = path.join(workspaceDirPath, entry)
                            const stat = fs.statSync(entryPath)

                            if (stat.isFile() && zipPatternsToDelete.includes(entry.toLowerCase())) {
                                fs.rmSync(entryPath, { force: true })
                                this.log(`Deleted zip file: ${entry}`)
                            }
                        })
                    }
                } else {
                    // Original cleanup behavior - delete everything
                    if (fs.existsSync(workspaceDirPath)) {
                        fs.rmSync(workspaceDirPath, { recursive: true, force: true })
                        this.log(`Deleted workspace directory: ${workspaceDirPath}`)
                    }
                }
            })
        } catch (error) {
            this.log('Failed to cleanup: ' + error)
        }
    }

    getLanguagesForWorkspaceFolder(
        workspaceFolder: WorkspaceFolder
    ): Map<CodewhispererLanguage, FileMetadata[]> | undefined {
        // Find the matching workspace folder by URI
        for (const [existingFolder, languagesMap] of this.filesByWorkspaceFolderAndLanguage) {
            if (existingFolder.uri === workspaceFolder.uri) {
                return languagesMap
            }
        }
        return undefined
    }

    async createZipForDependencies(
        workspaceFolder: WorkspaceFolder,
        language: CodewhispererLanguage,
        files: FileMetadata[],
        subDirectory: string = '',
        zipChunkIndex: number
    ): Promise<FileMetadata> {
        const zipDirectoryPath = path.join(this.tempDirPath, workspaceFolder.name, subDirectory)
        this.createFolderIfNotExist(zipDirectoryPath)
        const zipFileName = `${zipChunkIndex}_${Date.now()}.zip`
        const zipPath = path.join(zipDirectoryPath, zipFileName)
        const zipBuffer = await this.createZipBuffer(files)
        await fs.promises.writeFile(zipPath, zipBuffer)

        const stats = fs.statSync(zipPath)

        return {
            filePath: zipPath,
            relativePath: path.join(workspaceFolder.name, subDirectory, zipFileName),
            language,
            contentLength: stats.size,
            lastModified: stats.mtimeMs,
            content: zipBuffer,
            workspaceFolder: workspaceFolder,
        }
    }

    async createFileMetadataWithoutContent(
        filePath: string,
        relativePath: string,
        language: CodewhispererLanguage,
        workspaceFolder: WorkspaceFolder
    ): Promise<FileMetadata> {
        return {
            filePath,
            contentLength: 0,
            lastModified: fs.statSync(filePath).mtimeMs,
            content: '',
            language,
            relativePath,
            workspaceFolder,
        }
    }

    async processDirectory(
        workspaceFolder: WorkspaceFolder,
        directoryPath: string,
        baseRelativePath: string = ''
    ): Promise<Map<CodewhispererLanguage, FileMetadata[]>> {
        const filesByLanguage = new Map<CodewhispererLanguage, FileMetadata[]>()

        this.log(`Processing directory for source code`)
        const files = await glob(['**/*'], {
            cwd: directoryPath,
            dot: false,
            ignore: IGNORE_PATTERNS,
            followSymbolicLinks: false,
            absolute: false,
            onlyFiles: true,
        })
        this.log(`Number of source files found before filtering: ${files.length}`)

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
                    language,
                    workspaceFolder
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

    // TODO, if MD5 hash is not needed, better to remove this function and remove content from FileMetadata interface to be memory efficient
    // Doing the readfile call inside this function and storing the contents in the FileMetadata allows us to call readFile only once
    // instead of calling it twice: once in md5 calculation and once during zip creation
    private async createFileMetadata(
        filePath: string,
        relativePath: string,
        language: CodewhispererLanguage,
        workspaceFolder: WorkspaceFolder
    ): Promise<FileMetadata> {
        const fileContent = this.workspace.fs.readFileSync(filePath)
        return {
            filePath,
            contentLength: fileContent.length,
            lastModified: fs.statSync(filePath).mtimeMs,
            content: fileContent,
            language,
            relativePath,
            workspaceFolder,
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
            relativePath: path.join(workspaceFolder.name, subDirectory, `files.zip`),
            language,
            contentLength: stats.size,
            lastModified: stats.mtimeMs,
            content: zipBuffer,
            workspaceFolder: workspaceFolder,
        }
    }

    private async createZipForFile(
        workspaceFolder: WorkspaceFolder,
        language: CodewhispererLanguage,
        files: FileMetadata[],
        subDirectory: string = ''
    ): Promise<FileMetadata> {
        const zipDirectoryPath = path.join(this.tempDirPath, workspaceFolder.name, subDirectory)
        this.createFolderIfNotExist(zipDirectoryPath)

        const zipPath = path.join(zipDirectoryPath, `files.zip`)

        const zip = new JSZip()
        for (const file of files) {
            zip.file(path.basename(file.relativePath), file.content)
        }
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

        await fs.promises.writeFile(zipPath, zipBuffer)

        const stats = fs.statSync(zipPath)

        return {
            filePath: zipPath,
            relativePath: path.join(workspaceFolder.name, subDirectory, 'files.zip'),
            language,
            contentLength: stats.size,
            lastModified: stats.mtimeMs,
            content: zipBuffer,
            workspaceFolder: workspaceFolder,
        }
    }

    private async createZipBuffer(files: FileMetadata[]): Promise<Buffer> {
        const zip = new JSZip()

        // Common compressed file extensions
        const compressedExtensions = new Set(['.jar', '.zip', '.gz', '.bz2', '.7z', '.rar', '.war', '.ear', '.apk'])

        for (const file of files) {
            const fileExt = path.extname(file.relativePath).toLowerCase()

            if (compressedExtensions.has(fileExt)) {
                // Store already compressed files without additional compression
                zip.file(file.relativePath, file.content, {
                    compression: 'STORE', // No compression, just store
                })
            } else {
                // Use default compression for other files
                zip.file(file.relativePath, file.content)
            }
        }

        return await zip.generateAsync({ type: 'nodebuffer' })
    }

    private findWorkspaceFolder(workspace: WorkspaceFolder): WorkspaceFolder | undefined {
        for (const [existingWorkspace] of this.filesByWorkspaceFolderAndLanguage) {
            if (existingWorkspace.uri === workspace.uri) {
                this.log(`Found existing workspace`)
                return existingWorkspace
            }
        }
        this.log(`No existing workspace found`)
        return undefined
    }

    private async updateWorkspaceFiles(
        workspaceFolder: WorkspaceFolder,
        filesByLanguage: Map<CodewhispererLanguage, FileMetadata[]>
    ): Promise<void> {
        // Find existing workspace folder or use current one
        const workspaceKey = this.findWorkspaceFolder(workspaceFolder) || workspaceFolder

        // Initialize map for new workspace folders
        if (!this.filesByWorkspaceFolderAndLanguage.has(workspaceKey)) {
            this.filesByWorkspaceFolderAndLanguage.set(workspaceKey, new Map<CodewhispererLanguage, FileMetadata[]>())
        }

        const workspaceMap = this.filesByWorkspaceFolderAndLanguage.get(workspaceKey)!
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
            // Genrate java .classpath and .project files
            const processedFiles =
                language === 'java' ? await this.processJavaProjectConfig(workspaceFolder, files) : files

            this.log(`Processing ${processedFiles.length} files for language ${language}`)
            const zipMetadata = await this.createZipForLanguage(workspaceFolder, language, processedFiles, relativePath)
            this.log(`Created zip for language ${language}`)
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

    private async processJavaProjectConfig(
        workspaceFolder: WorkspaceFolder,
        files: FileMetadata[]
    ): Promise<FileMetadata[]> {
        const workspacePath = URI.parse(workspaceFolder.uri).path
        const hasJavaFiles = files.some(file => file.language === 'java')

        if (!hasJavaFiles) {
            return files
        }

        const additionalFiles: FileMetadata[] = []

        // Generate Eclipse configuration files
        const javaManager = new JavaProjectAnalyzer(workspacePath)
        const structure = await javaManager.analyze()
        const generator = new EclipseConfigGenerator(workspaceFolder)

        // Generate and add .classpath file
        const classpathFiles = await generator.generateDotClasspath(structure)
        for (const classpathFile of classpathFiles) {
            additionalFiles.push(classpathFile)
        }

        // Generate and add .project file
        const projectFiles = await generator.generateDotProject(path.basename(workspacePath), structure)
        for (const projectFile of projectFiles) {
            additionalFiles.push(projectFile)
        }

        return [...files, ...additionalFiles]
    }
}
