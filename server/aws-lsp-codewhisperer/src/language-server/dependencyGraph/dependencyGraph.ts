import { Workspace } from '@aws/language-server-runtimes/out/features'
import * as admZip from 'adm-zip'
import * as path from 'path'
import { URI as Uri } from 'vscode-uri'
import * as CodeWhispererConstants from './constants'

export interface Truncation {
    rootDir: string
    zipFilePath: string
    scannedFiles: Set<string>
    srcPayloadSizeInBytes: number
    buildPayloadSizeInBytes: number
    zipFileSizeInBytes: number
    lines: number
}

export const DependencyGraphConstants = {
    /**
     * Key words
     */
    import: 'import',
    from: 'from',
    as: 'as',
    static: 'static',
    package: 'package',
    using: 'using',
    globalusing: 'global using',
    semicolon: ';',
    equals: '=',
    require: 'require',
    require_relative: 'require_relative',
    load: 'load',
    include: 'include',
    extend: 'extend',

    /**
     * Regex
     */
    newlineRegex: /\r?\n/,

    /**
     * File extension
     */
    pythonExt: '.py',
    javaExt: '.java',
    javaBuildExt: '.class',
    jsExt: '.js',
    tsExt: '.ts',
    csharpExt: '.cs',
    jsonExt: '.json',
    yamlExt: '.yaml',
    ymlExt: '.yml',
    tfExt: '.tf',
    hclExt: '.hcl',
    rubyExt: '.rb',
    goExt: '.go',
}

/**
 * Create a dependency graph to select all the dependent files associated with current active file.
 * @param uri
 * @returns
 */
export abstract class DependencyGraph {
    workspace: Workspace // All optional fields are required
    protected _sysPaths: Set<string> = new Set<string>()
    protected _parsedStatements: Set<string> = new Set<string>()
    protected _pickedSourceFiles: Set<string> = new Set<string>()
    protected _fetchedDirs: Set<string> = new Set<string>()
    protected _totalSize = 0
    protected _tmpDir = ''
    protected _truncDir = ''
    protected _totalLines = 0

    private _isProjectTruncated = false

    constructor(workspace: Workspace) {
        this.workspace = workspace
        this._tmpDir = this.workspace.fs.getTempDirPath()
    }

    /**
     * Retrun project name if given uri is within project. If not then return last folder name where file is present.
     * @param uri file path to get project name
     * @returns project folder name
     */
    public getProjectName(uri: string) {
        const projectPath = this.getProjectPath(uri)
        return path.basename(projectPath)
    }

    /**
     * Retrun project path if given uri is within project. If not then return current directory path where file is present.
     * @param uri file path to get project path
     * @returns project path uri if found within workspace otherwise current directory path of input uri
     */
    public getProjectPath(uri: string) {
        const workspaceFolder = this.workspace.getWorkspaceFolder(uri)

        if (!workspaceFolder) {
            return this.workspace.fs.isFile(uri) ? path.dirname(uri) : uri
        }
        return workspaceFolder.uri
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
     * copy list of file to temp dir
     */
    protected async copyFilesToTmpDir(files: Set<string> | string[], dir: string) {
        // Convert Set to an array for compatibility with Promise.all
        const fileArray = Array.from(files)

        // Use Promise.all to asynchronously copy all files
        await Promise.all(
            fileArray.map(async filePath => {
                await this.copyFileToTmp(Uri.file(filePath), dir)
            })
        )
    }

    /**
     * copy input file in temp dir at destDir location and match input uri's relative path at destDir
     * @param uri file path to be copied
     * @param destDir destination directory path
     */
    protected async copyFileToTmp(uri: Uri, destDir: string) {
        const sourceWorkspacePath = this.getProjectPath(uri.fsPath)
        const fileRelativePath = path.relative(sourceWorkspacePath, uri.fsPath)
        const destinationFileAbsolutePath = path.join(destDir, fileRelativePath)
        await this.workspace.fs.copy(uri.fsPath, destinationFileAbsolutePath)
    }

    /**
     * Zip dir with given extension
     * @param dir directory path to create zip of the directory
     * @returns zip file path
     */
    zipDir(dir: string, extension: string): string {
        const zip = new admZip()
        zip.addLocalFolder(dir)
        zip.writeZip(dir + extension)

        // writeZip uses `fs` under the hood and it wouldn't work in browsers
        // Instead of writeZip to write to disk, we should consider using zip.toBuffer
        // The zip buffer can then be uploaded to s3
        const zipBuffer = zip.toBuffer()

        return dir + extension
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
     * delete zip if it exists
     * @param zipFilePath zip file path to remove
     * @returns
     */
    protected async removeZip(zipFilePath: string) {
        if (await this.workspace.fs.exists(zipFilePath)) {
            await this.workspace.fs.remove(zipFilePath)
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
     * remove all files and zip from temp directory
     */
    protected async removeTmpFiles(truncation: Truncation) {
        await this.removeZip(truncation.zipFilePath)
        await this.removeDir(truncation.rootDir)
    }

    /**
     * This method will traverse throw the input file and its dependecy files to creates a list of files for the scan.
     * If the list does not exceeds the payload size limit then it will scan all the remaining files to add them into the list
     * until it reaches to the payload size limit. Then, it copies all the selected files to temp directory, creates a zip
     * and deletes copied files and directory created in temp.
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
