/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import admZip from 'adm-zip'
import * as path from 'path'
import { URI as Uri } from 'vscode-uri'
// import { getLogger } from '../../../shared/logger'
import { Workspace } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { asyncCallWithTimeout } from './commonUtil'
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

export abstract class DependencyGraph {
    workspace: Workspace // All optional fields are required
    protected _languageId: CodeWhispererConstants.PlatformLanguageId = 'plaintext'
    protected _sysPaths: Set<string> = new Set<string>()
    protected _parsedStatements: Set<string> = new Set<string>()
    protected _pickedSourceFiles: Set<string> = new Set<string>()
    protected _fetchedDirs: Set<string> = new Set<string>()
    protected _totalSize: number = 0
    protected _tmpDir: string = ''
    protected _truncDir: string = ''
    protected _totalLines: number = 0

    private _isProjectTruncated = false

    constructor(languageId: CodeWhispererConstants.PlatformLanguageId, workspace: Workspace) {
        this._languageId = languageId
        this.workspace = workspace
        this._tmpDir = this.workspace.fs.getTempDirPath()
    }

    public getRootFile(document: TextDocument) {
        return document.uri
    }

    public getProjectName(uri: string) {
        const projectPath = this.getProjectPath(uri)
        return path.basename(projectPath)
    }

    public getProjectPath(uri: string) {
        return path.dirname(uri)
        // const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)
        // if (workspaceFolder === undefined) {
        //     return path.dirname(uri.fsPath)
        // }
        // return workspaceFolder.uri.fsPath
    }

    protected getBaseDirPath(uri: Uri) {
        return path.dirname(uri.fsPath)
    }

    public getReadableSizeLimit(): string {
        const totalBytesInMB = Math.pow(2, 20)
        const totalBytesInKB = Math.pow(2, 10)
        if (this.getPayloadSizeLimitInBytes() >= totalBytesInMB) {
            return `${this.getPayloadSizeLimitInBytes() / totalBytesInMB}MB`
        } else {
            return `${this.getPayloadSizeLimitInBytes() / totalBytesInKB}KB`
        }
    }

    public willReachSizeLimit(current: number, adding: number): boolean {
        const willReachLimit = current + adding > this.getPayloadSizeLimitInBytes()
        this._isProjectTruncated = this._isProjectTruncated || willReachLimit
        return willReachLimit
    }

    public reachSizeLimit(size: number): boolean {
        return size > this.getPayloadSizeLimitInBytes()
    }

    public isProjectTruncated(): boolean {
        return this._isProjectTruncated
    }

    protected getDirPaths(uri: Uri): string[] {
        let dirPath = this.getBaseDirPath(uri)
        const paths: string[] = [dirPath]
        const projectPath = this.getProjectPath(uri.fsPath)
        while (dirPath !== projectPath) {
            dirPath = path.join(dirPath, '..')
            paths.push(dirPath)
        }
        return paths
    }

    protected async copyFileToTmp(uri: Uri, destDir: string) {
        const projectName = this.getProjectName(uri.fsPath)
        if (projectName) {
            const pos = uri.path.indexOf(projectName)
            const dest = path.join(destDir, uri.path.substring(pos))

            try {
                await this.workspace.fs.copy(uri.fsPath, dest)
            } catch (err) {
                console.error('Error copying:', err)
            }
        }
    }

    protected zipDir(dir: string, extension: string): string {
        const zip = new admZip()
        zip.addLocalFolder(dir)
        zip.writeZip(dir + extension)

        // writeZip uses `fs` under the hood and it wouldn't work in browsers
        // Instead of writeZip to write to disk, we should consider using zip.toBuffer
        // The zip buffer can then be uploaded to s3
        const zipBuffer = zip.toBuffer()

        return dir + extension
    }

    protected async removeDir(dir: string) {
        if (await this.workspace.fs.exists(dir)) {
            await this.workspace.fs.remove(dir)
        }
    }

    protected async removeZip(zipFilePath: string) {
        if (await this.workspace.fs.exists(zipFilePath)) {
            await this.workspace.fs.remove(zipFilePath)
        }
    }

    protected getTruncDirPath(uri: string) {
        if (this._truncDir === '') {
            this._truncDir = path.join(
                this._tmpDir,
                CodeWhispererConstants.codeScanTruncDirPrefix + '_' + Date.now().toString()
            )
        }
        return this._truncDir
    }

    protected async getFilesTotalSize(files: string[]) {
        const fileStatsPromises = files.map(file => this.workspace.fs.getFileSize(file))
        const fileStats = await Promise.all(fileStatsPromises)
        const totalSize = fileStats.reduce((accumulator, { size }) => accumulator + size, 0)
        return totalSize
    }

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

    public async removeTmpFiles(truncation: Truncation) {
        // getLogger().verbose(`Cleaning up temporary files...`)
        await this.removeZip(truncation.zipFilePath)
        await this.removeDir(truncation.rootDir)
        // getLogger().verbose(`Complete cleaning up temporary files.`)
    }

    public async generateTruncationWithTimeout(
        uri: string,
        workspaceFolder: { index: number; name: string; uri: string },
        seconds: number
    ) {
        // getLogger().verbose(`Scanning project for context truncation.`)
        return await asyncCallWithTimeout(
            this.generateTruncation(uri, workspaceFolder),
            'Context truncation timeout.',
            seconds * 1000
        )
    }
    // 3 new functions added below for Cross-file and UTG support
    abstract getSourceDependencies(uri: Uri, content: string): Promise<string[]>

    abstract getSamePackageFiles(uri: Uri, projectPath: string): Promise<string[]>

    abstract isTestFile(content: string): Promise<boolean>

    abstract generateTruncation(
        uri: string,
        workspaceFolder: { index: number; name: string; uri: string }
    ): Promise<Truncation>

    abstract searchDependency(uri: string): Promise<Set<string>>

    abstract traverseDir(dirPath: string): void

    abstract parseImport(importStr: string, dirPaths: string[]): Promise<string[]>

    abstract updateSysPaths(uri: Uri): void

    abstract getDependencies(uri: Uri, imports: string[]): void

    abstract getPayloadSizeLimitInBytes(): number
}
