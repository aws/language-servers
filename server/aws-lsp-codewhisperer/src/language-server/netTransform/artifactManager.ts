import * as crypto from 'crypto'
import * as archiver from 'archiver'
import * as fs from 'fs'
import path = require('path')
import { QNetStartTransformRequest, RequirementJson } from './models'
import { Workspace, Logging } from '@aws/language-server-runtimes/server-interface'
const requriementJsonFileName = 'requirement.json'
const artifactFolderName = 'artifact'
const zipFileName = 'artifact.zip'
const referenceFolderName = 'reference'
const sourceCodeFolderName = 'sourceCode'

export class ArtifactManager {
    private workspace: Workspace
    private logging: Logging
    constructor(workspace: Workspace, logging: Logging) {
        this.workspace = workspace
        this.logging = logging
    }
    async createZip(request: QNetStartTransformRequest, basePath: string): Promise<string> {
        await this.createRequirementJson(request, basePath)
        await this.copyReferenceDlls(request, basePath)
        await this.copySoureFiles(request, basePath)
        return await this.zipArtifact(basePath)
    }
    async removeDir(dir: string) {
        if (await this.workspace.fs.exists(dir)) {
            await this.workspace.fs.remove(dir)
        }
    }
    cleanup(basePath: string) {
        try {
            const artifactFolder = path.join(basePath, artifactFolderName)
            const zipFile = path.join(basePath, zipFileName)
            fs.rmSync(artifactFolder, { recursive: true, force: true })
            fs.unlinkSync(zipFile)
        } catch (error) {
            this.logging.log('failed to cleanup:' + error)
        }
    }

    async createRequirementJson(request: QNetStartTransformRequest, basePath: string) {
        const fileContent = await this.createRequirementJsonContent(request)
        const dir = this.getRequirementJsonPath(basePath)
        await this.writeRequirmentJsonAsync(dir, JSON.stringify(fileContent))
    }

    async copyReferenceDlls(request: QNetStartTransformRequest, basePath: string) {
        const filteredReferences = this.filterReferences(request)
        filteredReferences.forEach(reference =>
            this.copyFile(
                reference.AssemblyFullPath,
                this.getReferencePathFromRelativePath(basePath, reference.RelativePath)
            )
        )
    }

    async copySoureFiles(request: QNetStartTransformRequest, basePath: string) {
        request.SourceCodeFilePaths.forEach(filePath => {
            const relativePath = this.normalizeSourceFileRelativePath(request.SolutionRootPath, filePath)
            this.copyFile(filePath, this.getSourceCodePathFromRelativePath(basePath, relativePath))
        })
    }

    async createRequirementJsonContent(request: QNetStartTransformRequest): Promise<RequirementJson> {
        const entryPath = this.normalizeSourceFileRelativePath(request.SolutionRootPath, request.SelectedProjectPath)
    const projectToReference = request.ProjectMetadata.map(p => {
        return {
            project: this.normalizeSourceFileRelativePath(request.SolutionRootPath, p.ProjectPath),
            references: p.ExternalReferences.map(r => {
                return {
                    AssemblyFullPath: '',
                    IncludedInArtifact: r.IncludedInArtifact,
                    ProjectPath: this.normalizeSourceFileRelativePath(request.SolutionRootPath, r.ProjectPath),
                    RelativePath: r.RelativePath,
                    TargetFrameworkId: r.TargetFrameworkId,
                }
            }),
        }
    })
    const fileContent: RequirementJson = {
        EntryPath: entryPath,
        ProjectToReference: projectToReference,
    }
    this.logging.log('total project reference:' + projectToReference.length)
    return fileContent
    }

    filterReferences(request: QNetStartTransformRequest) {
        //remove duplicate externalreference
        const externalReferences = request.ProjectMetadata.flatMap(r => r.ExternalReferences)
        return externalReferences
            .filter(reference => reference.IncludedInArtifact)
            .filter(
                (reference, index) =>
                    index ===
                    externalReferences.findIndex(other => reference.AssemblyFullPath === other.AssemblyFullPath)
            )
    }

    async zipArtifact(basePath: string): Promise<string> {
        const folderPath = path.join(basePath, artifactFolderName)
        if (!fs.existsSync(folderPath)) {
            this.logging.log('cannot find artifact folder')
            return ''
        }
        const zipPath = path.join(basePath, zipFileName)
        this.logging.log('zipping files to' + zipPath)
        await this.zipDirectory(folderPath, zipPath)
        return zipPath
    }

    static getSha256(fileName: string) {
        const hasher = crypto.createHash('sha256')
        hasher.update(fs.readFileSync(fileName))
        return hasher.digest('base64')
    }

    getRequirementJsonPath(basePath: string): string {
        const dir = path.join(basePath, artifactFolderName)
        this.createFolderIfNotExist(dir)
        return dir
    }

    getReferencePathFromRelativePath(basePath: string, relativePath: string): string {
        return path.join(basePath, artifactFolderName, referenceFolderName, relativePath)
    }

    getSourceCodePathFromRelativePath(basePath: string, relativePath: string): string {
        return path.join(basePath, artifactFolderName, relativePath)
    }

    normalizeSourceFileRelativePath(solutionRootPath: string, fullPath: string) {
        if (fullPath.startsWith(solutionRootPath))
            return path.join(sourceCodeFolderName, fullPath.replace(solutionRootPath, ''))
        else {
            const relativePath = fullPath.substring(fullPath.indexOf(':\\') + 2, fullPath.length)
            return path.join(sourceCodeFolderName, relativePath)
        }
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
}
