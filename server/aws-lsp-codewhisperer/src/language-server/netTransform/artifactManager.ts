import { Logging, Workspace } from '@aws/language-server-runtimes/server-interface'
import * as archiver from 'archiver'
import * as crypto from 'crypto'
import * as fs from 'fs'
import { CodeFile, ExternalReference, Project, References, RequirementJson, StartTransformRequest } from './models'
import path = require('path')
const requriementJsonFileName = 'requirement.json'
const artifactFolderName = 'artifact'
const referencesFolderName = 'references'
const zipFileName = 'artifact.zip'
const sourceCodeFolderName = 'sourceCode'
const packagesFolderName = 'packages'
const thirdPartyPackageFolderName = 'thirdpartypackages'

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
        const requirementJson = await this.createRequirementJsonContent(request)
        await this.writeRequirementJsonAsync(this.getRequirementJsonPath(), JSON.stringify(requirementJson))
        await this.copySolutionConfigFiles(request)
        await this.removeDuplicateNugetPackagesFolder(request)
        const zipPath = await this.zipArtifact()
        return zipPath
    }

    async removeDir(dir: string) {
        if (await this.workspace.fs.exists(dir)) {
            await this.workspace.fs.rm(dir, { recursive: true, force: true })
        }
    }

    cleanup() {
        try {
            const artifactFolder = path.join(this.workspacePath, artifactFolderName)
            const zipFile = path.join(this.workspacePath, zipFileName)
            const packagesFolder = path.join(this.workspacePath, packagesFolderName)

            if (fs.existsSync(artifactFolder)) {
                fs.rmSync(artifactFolder, { recursive: true, force: true })
            }
            if (fs.existsSync(zipFile)) {
                fs.unlinkSync(zipFile)
            }
            if (fs.existsSync(packagesFolder)) {
                fs.rmSync(packagesFolder, { recursive: true, force: true })
            }
            if (fs.existsSync(this.workspacePath)) {
                fs.rmSync(this.workspacePath, { recursive: true, force: true })
            }
        } catch (error) {
            this.logging.log('Failed to cleanup: ' + error)
        }
    }

    async removeDuplicateNugetPackagesFolder(request: StartTransformRequest) {
        try {
            const packagesFolder = path.join(
                this.workspacePath,
                artifactFolderName,
                sourceCodeFolderName,
                packagesFolderName
            )
            if (fs.existsSync(packagesFolder)) {
                fs.rmSync(packagesFolder, { recursive: true, force: true })
                this.logging.log(
                    `Removed packages folder ${packagesFolder} from source code directory to be uploaded because it is a duplicate of references folder from artifacts`
                )
            }
        } catch (error) {
            this.logging.log('Failed to remove packages folder: ' + error)
        }
    }

    async copySolutionConfigFiles(request: StartTransformRequest) {
        if (request.SolutionConfigPaths && request.SolutionConfigPaths.length > 0) {
            for (const configFilePath of request.SolutionConfigPaths) {
                await this.copySourceFile(request.SolutionRootPath, configFilePath)
            }
        }
    }

    async copySourceFile(solutionRootPath: string, filePath: string): Promise<void> {
        const relativePath = this.normalizeSourceFileRelativePath(solutionRootPath, filePath)
        await this.copyFile(filePath, this.getWorkspaceCodePathFromRelativePath(relativePath))
    }

    async createRequirementJsonContent(request: StartTransformRequest): Promise<RequirementJson> {
        const projects: Project[] = []

        for (const project of request.ProjectMetadata) {
            const sourceCodeFilePaths = project.SourceCodeFilePaths.filter(filePath => filePath)
            const codeFiles: CodeFile[] = []
            const references: References[] = []

            for (const filePath of sourceCodeFilePaths) {
                try {
                    await this.copySourceFile(request.SolutionRootPath, filePath)
                    const contentHash = await this.calculateMD5Async(filePath)
                    const relativePath = this.normalizeSourceFileRelativePath(request.SolutionRootPath, filePath)
                    codeFiles.push({
                        contentMd5Hash: contentHash,
                        relativePath: relativePath,
                    })
                } catch (error) {
                    this.logging.log('Failed to process file: ' + error + filePath)
                }
            }

            for (const reference of project.ExternalReferences) {
                try {
                    const relativePath = this.normalizeReferenceFileRelativePath(
                        reference.RelativePath,
                        reference.IncludedInArtifact
                    )
                    await this.copyFile(
                        reference.AssemblyFullPath,
                        this.getWorkspaceReferencePathFromRelativePath(relativePath)
                    )
                    let artifactReference: References = {
                        includedInArtifact: reference.IncludedInArtifact,
                        relativePath: relativePath,
                        isThirdPartyPackage: false,
                    }
                    await this.processPrivatePackages(request, reference, artifactReference)
                    references.push(artifactReference)
                } catch (error) {
                    this.logging.log('Failed to process file: ' + error + reference.AssemblyFullPath)
                }
            }
            projects.push({
                projectFilePath: this.normalizeSourceFileRelativePath(request.SolutionRootPath, project.ProjectPath),
                projectTarget: project.ProjectTargetFramework,
                codeFiles: codeFiles,
                references: references,
            })
        }
        this.logging.log('Total project references: ' + projects.length)

        let packages: string[] = []
        if (request.PackageReferences != null) {
            for (const pkg of request.PackageReferences) {
                if (!pkg.NetCompatiblePackageFilePath) {
                    continue
                }
                try {
                    const packageRelativePath = this.normalizePackageFileRelativePath(pkg.NetCompatiblePackageFilePath)
                    packages.push(packageRelativePath)
                    await this.copyFile(
                        pkg.NetCompatiblePackageFilePath,
                        this.getWorkspaceReferencePathFromRelativePath(packageRelativePath)
                    )
                } catch (error) {
                    this.logging.log('Failed to process package file: ' + error + pkg.NetCompatiblePackageFilePath)
                }
            }
        }

        return {
            EntryPath: this.normalizeSourceFileRelativePath(request.SolutionRootPath, request.SelectedProjectPath),
            SolutionPath: this.normalizeSourceFileRelativePath(request.SolutionRootPath, request.SolutionFilePath),
            Projects: projects,
            TransformNetStandardProjects: request.TransformNetStandardProjects,
            ...(request.EnableRazorViewTransform !== undefined && {
                EnableRazorViewTransform: request.EnableRazorViewTransform,
            }),
            Packages: packages,
        } as RequirementJson
    }

    async processPrivatePackages(
        request: StartTransformRequest,
        reference: ExternalReference,
        artifactReference: References
    ): Promise<void> {
        if (!request.PackageReferences) {
            return
        }
        var thirdPartyPackage = request.PackageReferences.find(
            p => p.IsPrivatePackage && reference.RelativePath.includes(p.Id)
        )
        if (thirdPartyPackage) {
            artifactReference.isThirdPartyPackage = true

            if (thirdPartyPackage.NetCompatibleAssemblyRelativePath && thirdPartyPackage.NetCompatibleAssemblyPath) {
                const privatePackageRelativePath = path
                    .join(
                        referencesFolderName,
                        thirdPartyPackageFolderName,
                        thirdPartyPackage.NetCompatibleAssemblyRelativePath
                    )
                    .toLowerCase()
                await this.copyFile(
                    thirdPartyPackage.NetCompatibleAssemblyPath,
                    this.getWorkspaceReferencePathFromRelativePath(privatePackageRelativePath)
                )
                artifactReference.netCompatibleRelativePath = privatePackageRelativePath
            }

            if (thirdPartyPackage.NetCompatiblePackageVersion) {
                artifactReference.netCompatibleVersion = thirdPartyPackage.NetCompatiblePackageVersion
            }
        }
    }

    async zipArtifact(): Promise<string> {
        const folderPath = path.join(this.workspacePath, artifactFolderName)
        if (!fs.existsSync(folderPath)) {
            this.logging.log('Cannot find artifacts folder')
            return ''
        }
        const zipPath = path.join(this.workspacePath, zipFileName)
        this.logging.log('Zipping files to ' + zipPath)
        await this.zipDirectory(folderPath, zipPath)
        return zipPath
    }

    static async getSha256Async(fileName: string): Promise<string> {
        const hasher = crypto.createHash('sha256')
        const stream = fs.createReadStream(fileName)
        for await (const chunk of stream) {
            hasher.update(chunk)
        }
        return hasher.digest('base64')
    }

    getRequirementJsonPath(): string {
        const dir = path.join(this.workspacePath, artifactFolderName)
        this.createFolderIfNotExist(dir)
        return dir
    }

    getWorkspaceReferencePathFromRelativePath(relativePath: string): string {
        return path.join(this.workspacePath, artifactFolderName, relativePath)
    }

    getWorkspaceCodePathFromRelativePath(relativePath: string): string {
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
        return includedInArtifact
            ? path.join(referencesFolderName, relativePath).toLowerCase()
            : relativePath.toLowerCase()
    }

    normalizePackageFileRelativePath(packageFilePath: string): string {
        return path.join(packagesFolderName, path.basename(packageFilePath)).toLowerCase()
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
            return archive.finalize()
        })
    }

    async writeRequirementJsonAsync(dir: string, fileContent: string) {
        const fileName = path.join(dir, requriementJsonFileName)
        fs.writeFileSync(fileName, fileContent)
    }

    createFolderIfNotExist(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    }

    async copyFile(sourceFilePath: string, destFilePath: string): Promise<void> {
        const dir = path.dirname(destFilePath)
        this.createFolderIfNotExist(dir)
        if (!fs.existsSync(dir) && dir.includes(packagesFolderName)) {
            //Packages folder has been deleted to avoid duplicates in artifacts.zip
            return
        }

        return new Promise<void>((resolve, reject) => {
            fs.copyFile(sourceFilePath, destFilePath, err => {
                if (err) {
                    this.logging.log(`Failed to copy from ${sourceFilePath} and error is ${err}`)
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    async calculateMD5Async(filePath: string): Promise<string> {
        try {
            const hash = crypto.createHash('md5')
            const stream = fs.createReadStream(filePath)
            for await (const chunk of stream) {
                hash.update(chunk)
            }
            return hash.digest('hex')
        } catch (error) {
            this.logging.log('Failed to calculate hashcode: ' + filePath + error)
            return ''
        }
    }
}
