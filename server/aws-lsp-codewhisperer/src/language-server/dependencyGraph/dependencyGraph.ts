import { Logging, Workspace } from '@aws/language-server-runtimes/server-interface'
import * as admZip from 'adm-zip'
import * as path from 'path'
import * as CodeWhispererConstants from './constants'

export interface Truncation {
    rootDir: string
    zipFileBuffer: Buffer
    scannedFiles: Set<string>
    srcPayloadSizeInBytes: number
    buildPayloadSizeInBytes: number
    zipFileSizeInBytes: number
    lines: number
}

/**
 * Create a dependency graph to select all the dependent files associated with current active file.
 * @param uri
 * @returns
 */
export abstract class DependencyGraph {
    protected workspace: Workspace
    protected _sysPaths: Set<string> = new Set<string>()
    protected _parsedStatements: Set<string> = new Set<string>()
    protected _pickedSourceFiles: Set<string> = new Set<string>()
    protected _fetchedDirs: Set<string> = new Set<string>()
    protected _totalSize = 0
    protected _tmpDir = ''
    protected _truncDir = ''
    protected _totalLines = 0
    protected logging: Logging
    protected _workspaceFolderPath: string

    private _isProjectTruncated = false

    constructor(workspace: Workspace, logging: Logging, workspaceFolderPath: string) {
        this.workspace = workspace
        this.logging = logging
        this._tmpDir = this.workspace.fs.getTempDirPath()
        this._workspaceFolderPath = workspaceFolderPath
    }

    /**
     * Retrun project name if given uri is within project. If not then return last folder name where file is present.
     * @param uri file path to get project name
     * @returns project folder name
     */
    public async getProjectName(uri: string) {
        const projectPath = await this.getProjectPath(uri)
        return path.basename(projectPath)
    }

    /**
     * Retrun project path if given uri is within project. If not then return current directory path where file is present.
     * @param uri file path to get project path
     * @returns project path uri if found within workspace otherwise current directory path of input uri
     */
    public async getProjectPath(uri: string) {
        const workspaceFolder = this.workspace.getWorkspaceFolder(uri)
        if (workspaceFolder) {
            return workspaceFolder.uri
        }
        if (uri.includes(this._workspaceFolderPath)) {
            return this._workspaceFolderPath
        }
        return (await this.workspace.fs.isFile(uri)) ? path.dirname(uri) : uri
    }

    /**
     * Retrun readable size limit value in MB or KB
     */
    public getReadableSizeLimit(): string {
        const totalBytesInMB = Math.pow(2, 20)
        const totalBytesInKB = Math.pow(2, 10)
        if (this.getPayloadSizeLimitInBytes() >= totalBytesInMB) {
            return `${this.getPayloadSizeLimitInBytes() / totalBytesInMB}MB`
        } else {
            return `${this.getPayloadSizeLimitInBytes() / totalBytesInKB}KB`
        }
    }

    /**
     * checks if the given size value exceeds the payload size limit or not
     */
    public exceedsSizeLimit(size: number): boolean {
        return size >= this.getPayloadSizeLimitInBytes()
    }

    /**
     * get value of _isProjectTruncated
     */
    get isProjectTruncated(): boolean {
        return this._isProjectTruncated
    }

    /**
     * set value for _isProjectTruncated
     */
    set isProjectTruncated(value: boolean) {
        this._isProjectTruncated = value
    }

    /**
     * find all the files inside `dir` recursively.
     * @param dir folder path from where search for all the files.
     * @returns return a promise of list of absolute file paths
     */
    async getFiles(dir: string): Promise<string[]> {
        const subdirs = await this.workspace.fs.readdir(dir)
        const files = await Promise.all(
            subdirs.map(async subdir => {
                const res = path.resolve(dir, subdir.name)
                return subdir.isDirectory() ? await this.getFiles(res) : [res]
            })
        )
        return files.reduce((a, f) => a.concat(f), [])
    }

    /**
     * copy list of file to temp dir
     */
    protected async copyFilesToTmpDir(files: Set<string> | string[], dir: string) {
        // Convert Set to an array for compatibility with Promise.all
        const fileArray = Array.from(files)

        // Use Promise.all to asynchronously copy all files
        await Promise.all(
            fileArray.map(async filePath => {
                await this.copyFileToTmp(filePath, dir)
            })
        )
    }

    /**
     * copy input file in temp dir (destDir) with same relative path of srcFile in destDir.
     * @param srcFilePath file path to be copied
     * @param destDir destination directory path
     */
    protected async copyFileToTmp(srcFilePath: string, destDir: string) {
        const sourceWorkspacePath = await this.getProjectPath(srcFilePath)
        const fileRelativePath = path.relative(sourceWorkspacePath, srcFilePath)
        const destinationFileAbsolutePath = path.join(destDir, fileRelativePath)
        await this.workspace.fs.copy(srcFilePath, destinationFileAbsolutePath)
    }

    /**
     * create a zip dir buffer of the given dir.
     * @param dir directory path to create zip of the directory
     * @returns zipped dir buffer object and its size in bytes
     */
    createZip(dir: string) {
        const zip = new admZip()
        zip.addLocalFolder(dir)

        // writeZip uses `fs` under the hood and it wouldn't work in browsers
        // Instead of writeZip to write to disk.
        // The zip buffer can then be uploaded to s3
        const zipBuffer = zip.toBuffer()

        return { zipFileBuffer: zipBuffer, zipFileSize: zipBuffer.byteLength }
    }

    /**
     * delete directory along with its sub-directories and files if it exists
     * @param dir directory path to remove
     */
    protected async removeDir(dir: string) {
        if (await this.workspace.fs.exists(dir)) {
            await this.workspace.fs.remove(dir)
        }
    }

    /**
     * get or create truncation directory path
     * @returns truncation directory path
     */
    protected getTruncDirPath() {
        if (this._truncDir === '') {
            this._truncDir = path.join(
                this._tmpDir,
                CodeWhispererConstants.codeScanTruncDirPrefix + '_' + Date.now().toString()
            )
        }
        return this._truncDir
    }

    /**
     * Get total size of list of files
     * @param files list of file paths to find size
     * @returns total size of the input list of files
     */
    protected async getFilesTotalSize(files: string[]) {
        const fileStatsPromises = files.map(file => this.workspace.fs.getFileSize(file))
        const fileStats = await Promise.all(fileStatsPromises)
        const totalSize = fileStats.reduce((accumulator, { size }) => accumulator + size, 0)
        return totalSize
    }

    /**
     * remove all copied files from temp directory
     */
    async removeTmpFiles() {
        await this.removeDir(this.getTruncDirPath())
    }

    /**
     * This method will traverse throw the input file and its dependecy files to creates a list of files for the scan.
     * If the list does not exceeds the payload size limit then it will scan all the remaining files to add them into the list
     * until it reaches to the payload size limit. Then, it copies all the selected files to temp directory, creates a zip buffer.
     * @param uri file path for which truncation being created
     * @returns Truncation object
     */
    abstract generateTruncation(uri: string): Promise<Truncation>

    /**
     * Search for all the dependecies for the given input file. Store the input filepath along with
     * the dependent filepaths until it does not exceeds the payload size limit.
     * @param uri file path to seach dependency of the file
     * @returns set of file paths found as dependecy of input uri
     */
    abstract searchDependency(uri: string): Promise<Set<string>>

    /**
     * Traverse all the Csharp files in the given workspace and add each file along with its dependencies to
     * the list of files selected for security scan.
     */
    abstract traverseDir(dirPath: string): void

    /**
     * Create a dependency file path set for given list of namespace.
     * @param imports list of import strings
     */
    abstract getDependencies(imports: string[]): void

    /**
     * Get payload size limit in bytes for the given Language.
     */
    abstract getPayloadSizeLimitInBytes(): number
}
