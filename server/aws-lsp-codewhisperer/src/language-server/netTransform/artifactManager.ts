import { Logging, Workspace } from '@aws/language-server-runtimes/server-interface'
import * as archiver from 'archiver'
import * as crypto from 'crypto'
import * as fs from 'fs'
import { CodeFile, Project, References, RequirementJson, StartTransformRequest } from './models'
import path = require('path')
const requriementJsonFileName = 'requirement.json'
const artifactFolderName = 'artifact'
const referencesFolderName = 'references'
const zipFileName = 'artifact.zip'
const sourceCodeFolderName = 'sourceCode'

export class ArtifactManager {
    private workspace: Workspace
    private logging: Logging
    private workspacePath: string
    constructor(workspace: Workspace, logging: Logging, workspacePath: string) {
        this.workspace = workspace
        this.logging = logging
        this.workspacePath = workspacePath
    }
    async createZip(request: StartTransformRequest): Promise<string> {
        await this.createRequirementJson(request)
        await this.copyReferenceDlls(request)
        await this.copySoureFiles(request)
        return await this.zipArtifact()
    }
    async removeDir(dir: string) {
        if (await this.workspace.fs.exists(dir)) {
            await this.workspace.fs.remove(dir)
        }
    }
    cleanup() {
        try {
            const artifactFolder = path.join(this.workspacePath, artifactFolderName)
            const zipFile = path.join(this.workspacePath, zipFileName)
            fs.rmSync(artifactFolder, { recursive: true, force: true })
            fs.unlinkSync(zipFile)
            fs.rmSync(this.workspacePath, { recursive: true, force: true })
        } catch (error) {
            this.logging.log('failed to cleanup:' + error)
        }
    }

    async createRequirementJson(request: StartTransformRequest) {
        const fileContent = await this.createRequirementJsonContent(request)
        const dir = this.getRequirementJsonPath()
        await this.writeRequirmentJsonAsync(dir, JSON.stringify(fileContent))
        this.logging.log('generated requirement.json at: ' + dir)
    }

    async copyReferenceDlls(request: StartTransformRequest) {
        const filteredReferences = this.filterReferences(request)
        filteredReferences.forEach(reference => {
            const relativePath = this.normalizeReferenceFileRelativePath(
                reference.RelativePath,
                reference.IncludedInArtifact
            )
            this.copyFile(reference.AssemblyFullPath, this.getReferencePathFromRelativePath(relativePath))
        })
    }

    async copySoureFiles(request: StartTransformRequest) {
        if (request.SolutionConfigPaths && request.SolutionConfigPaths.length > 0) {
            for (const configFilePath of request.SolutionConfigPaths) {
                this.copySourceFile(request.SolutionRootPath, configFilePath)
            }
        }
        if (request.ProjectMetadata && request.ProjectMetadata.length > 0) {
            for (const metadata of request.ProjectMetadata) {
                for (const filePath of metadata.SourceCodeFilePaths) {
                    this.copySourceFile(request.SolutionRootPath, filePath)
                }
            }
        }
    }

    copySourceFile(solutionRootPath: string, filePath: string): void {
        const relativePath = this.normalizeSourceFileRelativePath(solutionRootPath, filePath)
        this.copyFile(filePath, this.getSourceCodePathFromRelativePath(relativePath))
    }

    async createRequirementJsonContent(request: StartTransformRequest): Promise<RequirementJson> {
        const projects = request.ProjectMetadata.map(project => {
            const codeFiles = project.SourceCodeFilePaths.filter(filePath => filePath).map(filePath => {
                return {
                    contentMd5Hash: this.calculateMD5Sync(filePath),
                    relativePath: this.normalizeSourceFileRelativePath(request.SolutionRootPath, filePath),
                } as CodeFile
            })

            const references = project.ExternalReferences.map(reference => {
                return {
                    includedInArtifact: reference.IncludedInArtifact,
                    relativePath: this.normalizeReferenceFileRelativePath(
                        reference.RelativePath,
                        reference.IncludedInArtifact
                    ),
                } as References
            })

            return {
                projectFilePath: this.normalizeSourceFileRelativePath(request.SolutionRootPath, project.ProjectPath),
                codeFiles: codeFiles,
                references: references,
            } as Project
        })
        this.logging.log('total project reference:' + projects.length)
        return {
            EntryPath: this.normalizeSourceFileRelativePath(request.SolutionRootPath, request.SelectedProjectPath),
            Projects: projects,
        } as RequirementJson
    }

    filterReferences(request: StartTransformRequest) {
        //remove duplicate externalreference
        const externalReferences = request.ProjectMetadata.flatMap(r => r.ExternalReferences)
        const includedReferences = externalReferences.filter(reference => reference.IncludedInArtifact)
        return includedReferences.filter(
            (reference, index) =>
                index === includedReferences.findIndex(other => reference.AssemblyFullPath === other.AssemblyFullPath)
        )
    }

    async zipArtifact(): Promise<string> {
        const folderPath = path.join(this.workspacePath, artifactFolderName)
        if (!fs.existsSync(folderPath)) {
            this.logging.log('cannot find artifact folder')
            return ''
        }
        const zipPath = path.join(this.workspacePath, zipFileName)
        this.logging.log('zipping files to' + zipPath)
        await this.zipDirectory(folderPath, zipPath)
        return zipPath
    }

    static getSha256(fileName: string) {
        const hasher = crypto.createHash('sha256')
        hasher.update(fs.readFileSync(fileName))
        return hasher.digest('base64')
    }

    getRequirementJsonPath(): string {
        const dir = path.join(this.workspacePath, artifactFolderName)
        this.createFolderIfNotExist(dir)
        return dir
    }

    getReferencePathFromRelativePath(relativePath: string): string {
        return path.join(this.workspacePath, artifactFolderName, relativePath)
    }

    getSourceCodePathFromRelativePath(relativePath: string): string {
        return path.join(this.workspacePath, artifactFolderName, relativePath)
    }

    normalizeSourceFileRelativePath(solutionRootPath: string, fullPath: string): string {
        if (fullPath.startsWith(solutionRootPath)) {
            return path.join(sourceCodeFolderName, fullPath.replace(`${solutionRootPath}\\`, ''))
        } else {
            const relativePath = fullPath.substring(fullPath.indexOf(':\\') + 2)
            return path.join(sourceCodeFolderName, relativePath)
        }
    }

    normalizeReferenceFileRelativePath(relativePath: string, includedInArtifact: boolean): string {
        return includedInArtifact ? path.join(referencesFolderName, relativePath) : relativePath
    }

    zipDirectory(sourceDir: string, outPath: string) {
        const archive = archiver('zip', { zlib: { level: 9 } })
        const stream = fs.createWriteStream(outPath)

        return new Promise<void>((resolve, reject) => {
            archive
                .directory(sourceDir, false)
                .on('error', err => reject(err))
                .pipe(stream)

            stream.on('close', () => resolve())
            archive.finalize()
        })
    }

    async writeRequirmentJsonAsync(dir: string, fileContent: string) {
        const fileName = path.join(dir, requriementJsonFileName)
        fs.writeFileSync(fileName, fileContent)
    }

    createFolderIfNotExist(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    }

    copyFile(sourceFilePath: string, destFilePath: string) {
        const dir = path.dirname(destFilePath)
        this.createFolderIfNotExist(dir)
        fs.copyFile(sourceFilePath, destFilePath, err => {
            if (err) {
                this.logging.log('failed to copy: ' + sourceFilePath + err)
            }
        })
    }

    calculateMD5Sync(filePath: string): string {
        try {
            const data = fs.readFileSync(filePath)
            const hash = crypto.createHash('md5').update(data)
            return hash.digest('hex')
        } catch (error) {
            return ''
        }
    }
}
