/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { URI as Uri } from 'vscode-uri'
import { sleep } from './commonUtil'
import * as CodeWhispererConstants from './constants'
import { DependencyGraph, DependencyGraphConstants, Truncation } from './dependencyGraph'
import path = require('path')

export const importRegex = /^[ \t]*import[ \t]+.+;?$/gm
export const requireRegex = /^[ \t]*.+require[ \t]*\([ \t]*['"][^'"]+['"][ \t]*\)[ \t]*;?/gm
export const moduleRegex = /["'][^"'\r\n]+["']/gm

export class JavascriptDependencyGraph extends DependencyGraph {
    private _generatedDirs: Set<string> = new Set(['node_modules', 'dist', 'build', 'cdk.out'])

    getPayloadSizeLimitInBytes(): number {
        return CodeWhispererConstants.codeScanJavascriptPayloadSizeLimitBytes
    }

    getModulePath(modulePathStr: string) {
        const matches = modulePathStr.match(moduleRegex)
        if (matches) {
            const extract = matches[0]
            modulePathStr = extract.substring(1, extract.length - 1)
            return modulePathStr.trim()
        }
        return undefined
    }

    extractModulePaths(importStr: string) {
        const modulePaths: string[] = []
        const pos = importStr.indexOf(' ' + DependencyGraphConstants.from + ' ')
        const modulePathStr =
            pos === -1
                ? importStr.substring(DependencyGraphConstants.import.length).trim()
                : importStr.substring(pos + DependencyGraphConstants.from.length + 1).trim()
        const modulePath = this.getModulePath(modulePathStr)
        if (modulePath) {
            modulePaths.push(modulePath)
        }
        return modulePaths
    }

    async generateFilePath(modulePath: string, dirPath: string) {
        const filePath = modulePath.startsWith('.')
            ? path.join(dirPath, modulePath + DependencyGraphConstants.jsExt)
            : modulePath + DependencyGraphConstants.jsExt
        return filePath.includes(dirPath) && (await this.workspace.fs.exists(filePath)) ? filePath : ''
    }

    async generateFilePaths(modulePaths: string[], dirPaths: string[]) {
        const filePaths: string[] = []
        await Promise.all(
            modulePaths.map(async modulePath => {
                for (const dirPath of dirPaths) {
                    const filePath = await this.generateFilePath(modulePath, dirPath)
                    if (filePath !== '') {
                        filePaths.push(filePath)
                    }
                }
            })
        )
        return filePaths
    }

    parseImport(importStr: string, dirPaths: string[]): Promise<string[]> {
        if (this._parsedStatements.has(importStr)) {
            return Promise.resolve([])
        }
        this._parsedStatements.add(importStr)
        const modulePaths = this.extractModulePaths(importStr)
        const dependencies = this.generateFilePaths(modulePaths, dirPaths)
        return Promise.resolve(dependencies)
    }

    updateSysPaths(uri: Uri) {
        throw new Error('Method not implemented.')
    }

    async getDependencies(uri: Uri, imports: string[]) {
        const dependencies: string[] = []
        await Promise.all(
            imports.map(async importStr => {
                const findings = await this.parseImport(importStr, [this.getBaseDirPath(uri)])
                const validSourceFiles = findings.filter(finding => !this._pickedSourceFiles.has(finding))
                await Promise.all(
                    validSourceFiles.map(async file => {
                        if (
                            (await this.workspace.fs.exists(file)) &&
                            !this.willReachSizeLimit(this._totalSize, (await this.workspace.fs.getFileSize(file)).size)
                        ) {
                            dependencies.push(file)
                        }
                    })
                )
            })
        )
        return dependencies
    }

    async readImports(uri: string) {
        const content: string = await this.workspace.fs.readFile(uri)
        this._totalLines += content.split(DependencyGraphConstants.newlineRegex).length
        const importRegExp = new RegExp(importRegex)
        const requireRegExp = new RegExp(requireRegex)
        const importMatches = content.match(importRegExp)
        const requireMatches = content.match(requireRegExp)
        const matches: Set<string> = new Set()
        if (importMatches) {
            importMatches.forEach(line => {
                if (!matches.has(line)) {
                    matches.add(line)
                }
            })
        }
        if (requireMatches) {
            requireMatches.forEach(line => {
                if (!matches.has(line)) {
                    matches.add(line)
                }
            })
        }
        return matches.size > 0 ? Array.from(matches) : []
    }

    async searchDependency(uri: string): Promise<Set<string>> {
        const filePath = uri
        const q: string[] = []
        q.push(filePath)
        while (q.length > 0) {
            let count: number = q.length
            while (count > 0) {
                if (this.reachSizeLimit(this._totalSize)) {
                    return this._pickedSourceFiles
                }
                count -= 1
                const currentFilePath = q.shift()
                if (currentFilePath === undefined) {
                    throw new Error('Invalid file in queue.')
                }
                this._pickedSourceFiles.add(currentFilePath)
                this._totalSize += (await this.workspace.fs.getFileSize(currentFilePath)).size
                const uri = Uri.file(currentFilePath)
                const imports = await this.readImports(currentFilePath)
                const dependencies = await this.getDependencies(uri, imports)
                dependencies.forEach(dependency => {
                    q.push(dependency)
                })
            }
        }
        return this._pickedSourceFiles
    }

    async traverseDir(dirPath: string) {
        if (this.reachSizeLimit(this._totalSize)) {
            return
        }
        const files = await this.workspace.fs.readdir(dirPath)

        await Promise.all(
            files.map(async file => {
                const absPath = path.join(dirPath, file.name)
                if (file.name.charAt(0) === '.' || !this.workspace.fs.exists(absPath)) {
                    return
                }
                if (file.isDirectory() && !this._generatedDirs.has(file.name)) {
                    await this.traverseDir(absPath)
                } else if (file.isFile()) {
                    // Check for .ts and .js file extensions & zip separately for security scans
                    if (
                        file.name.endsWith(
                            this._languageId === 'typescript'
                                ? DependencyGraphConstants.tsExt
                                : DependencyGraphConstants.jsExt
                        ) &&
                        !this.reachSizeLimit(this._totalSize) &&
                        !this.willReachSizeLimit(
                            this._totalSize,
                            (await this.workspace.fs.getFileSize(absPath)).size
                        ) &&
                        !this._pickedSourceFiles.has(absPath)
                    ) {
                        await this.searchDependency(absPath)
                    }
                }
            })
        )
    }

    async generateTruncation(
        uri: string,
        workspaceFolder: { index: number; name: string; uri: string }
    ): Promise<Truncation> {
        try {
            if (workspaceFolder === undefined) {
                this._pickedSourceFiles.add(uri)
            } else {
                await this.searchDependency(uri)
                await this.traverseDir(this.getProjectPath(uri))
            }
            await sleep(1000)

            const truncDirPath = this.getTruncDirPath(uri)
            await this.copyFilesToTmpDir(this._pickedSourceFiles, truncDirPath)
            const zipFilePath = this.zipDir(truncDirPath, CodeWhispererConstants.codeScanZipExt)
            const zipFileSize = (await this.workspace.fs.getFileSize(zipFilePath)).size
            return {
                rootDir: truncDirPath,
                zipFilePath: zipFilePath,
                scannedFiles: new Set(this._pickedSourceFiles),
                srcPayloadSizeInBytes: this._totalSize,
                zipFileSizeInBytes: zipFileSize,
                buildPayloadSizeInBytes: 0,
                lines: this._totalLines,
            }
        } catch (error) {
            console.log('Truncation error ' + error)
            // getLogger().error(`${this._languageId} dependency graph error caused by:`, error)
            throw new Error(`${this._languageId} context processing failed.`)
        }
    }

    async isTestFile(content: string) {
        // TODO: Implement this
        return false
    }

    async getSourceDependencies(uri: Uri, content: string) {
        // TODO: Implement this
        return []
    }

    async getSamePackageFiles(uri: Uri, projectPath: string): Promise<string[]> {
        // TODO: Implement this
        return []
    }
}
