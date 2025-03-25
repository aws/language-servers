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
const packagesFolderName = 'packages'
const thirdPartyUpgradeFolderName = 'thirdPartyUpgrade'

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
        this.logging.log('Starting createZip process...')

        this.logging.log('Creating requirement.json...')
        await this.createRequirementJson(request)

        this.logging.log('Copying solution config files...')
        await this.copySolutionConfigFiles(request)

        this.logging.log('Copying .NET compatible packages...')
        await this.copyNetCompatiblePackages(request)

        this.logging.log('Removing duplicate NuGet packages folder...')
        await this.removeDuplicateNugetPackagesFolder(request)

        this.logging.log('Creating final zip file...')
        const zipPath = await this.zipArtifact()

        this.logging.log(`Zip creation completed. Path: ${zipPath}`)
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
    }

    async createRequirementJson(request: StartTransformRequest) {
        const fileContent = await this.createRequirementJsonContent(request)
        const dir = this.getRequirementJsonPath()
        await this.writeRequirmentJsonAsync(dir, JSON.stringify(fileContent))
        this.logging.log('Generated requirement.json at: ' + dir)
    }

    async copySolutionConfigFiles(request: StartTransformRequest) {
        if (request.SolutionConfigPaths && request.SolutionConfigPaths.length > 0) {
            for (const configFilePath of request.SolutionConfigPaths) {
                this.copySourceFile(request.SolutionRootPath, configFilePath)
            }
        }
    }

    copySourceFile(solutionRootPath: string, filePath: string): void {
        const relativePath = this.normalizeSourceFileRelativePath(solutionRootPath, filePath)
        this.copyFile(filePath, this.getWorkspaceCodePathFromRelativePath(relativePath))
    }

    async createRequirementJsonContent(request: StartTransformRequest): Promise<RequirementJson> {
        var projects: Project[] = []
        await request.ProjectMetadata.forEach(async project => {
            const sourceCodeFilePaths = project.SourceCodeFilePaths.filter(filePath => filePath)
            var codeFiles: CodeFile[] = []
            var references: References[] = []

            await sourceCodeFilePaths.forEach(async filePath => {
                try {
                    this.copySourceFile(request.SolutionRootPath, filePath)
                    var contentHash = await this.calculateMD5Sync(filePath)
                    var relativePath = this.normalizeSourceFileRelativePath(request.SolutionRootPath, filePath)
                    codeFiles.push({
                        contentMd5Hash: contentHash,
                        relativePath: relativePath,
                    })
                } catch (error) {
                    this.logging.log('Failed to process file: ' + error + filePath)
                }
            })

            project.ExternalReferences.forEach(reference => {
                try {
                    const relativePath = this.normalizeReferenceFileRelativePath(
                        reference.RelativePath,
                        reference.IncludedInArtifact
                    )
                    this.copyFile(
                        reference.AssemblyFullPath,
                        this.getWorkspaceReferencePathFromRelativePath(relativePath)
                    )
                    var thirdPartyPackage = project.ThirdPartyPackages.find(
                        p => p.FrameworkRelativePath == reference.RelativePath
                    )
                    if (thirdPartyPackage) {
                        this.copyFile(
                            thirdPartyPackage.CoreCompatibleRelativePath,
                            this.getWorkspaceReferencePathFromRelativePath(thirdPartyPackage.CoreCompatibleRelativePath)
                        )
                    }
                    references.push({
                        includedInArtifact: reference.IncludedInArtifact,
                        relativePath: relativePath,
                        isThirdPartyPackage: thirdPartyPackage ? true : false,
                        netCompatibleRelativePath: thirdPartyPackage
                            ? thirdPartyPackage.CoreCompatibleRelativePath
                            : undefined,
                        netCompatibleVersion: thirdPartyPackage ? thirdPartyPackage.CoreCompatbileVersion : undefined,
                    })
                } catch (error) {
                    this.logging.log('Failed to process file: ' + error + reference.AssemblyFullPath)
                }
            })
            projects.push({
                projectFilePath: this.normalizeSourceFileRelativePath(request.SolutionRootPath, project.ProjectPath),
                projectTarget: project.ProjectTargetFramework,
                codeFiles: codeFiles,
                references: references,
            })
        })
        this.logging.log('Total project references: ' + projects.length)

        const packageReferences =
            request.PackageReferences?.map(pkg => ({
                ...pkg,
                NetCompatiblePackageDirectory: pkg.NetCompatiblePackageDirectory
                    ? path.join(thirdPartyUpgradeFolderName, pkg.Id)
                    : undefined,
            })) || []

        return {
            EntryPath: this.normalizeSourceFileRelativePath(request.SolutionRootPath, request.SelectedProjectPath),
            SolutionPath: this.normalizeSourceFileRelativePath(request.SolutionRootPath, request.SolutionFilePath),
            Projects: projects,
            TransformNetStandardProjects: request.TransformNetStandardProjects,
            PackageReferences: packageReferences,
        } as RequirementJson
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
        try {
            fs.copyFileSync(sourceFilePath, destFilePath)
        } catch (err) {
            if (!fs.existsSync(dir) && dir.includes(packagesFolderName)) {
                //Packages folder has been deleted to avoid duplicates in artifacts.zip
                return
            }
            this.logging.log(`Failed to copy from ${sourceFilePath} and error is ${err}`)
        }
    }

    calculateMD5Sync(filePath: string): string {
        try {
            const data = fs.readFileSync(filePath)
            const hash = crypto.createHash('md5').update(data)
            return hash.digest('hex')
        } catch (error) {
            this.logging.log('Failed to calculate hashcode: ' + filePath + error)
            return ''
        }
    }

    private async copyNetCompatiblePackages(request: StartTransformRequest) {
        this.logging.log('Starting copyNetCompatiblePackages...')

        if (!request.PackageReferences) {
            this.logging.log('No package references found.')
            return
        }

        this.logging.log(`Found ${request.PackageReferences.length} package references to process`)

        for (const pkg of request.PackageReferences) {
            const packageDir = pkg.NetCompatiblePackageDirectory
            this.logging.log(`Processing package ${pkg.Id} with directory: ${packageDir}`)

            if (packageDir && fs.existsSync(packageDir)) {
                try {
                    const targetBasePath = path.join(
                        this.workspacePath,
                        artifactFolderName,
                        thirdPartyUpgradeFolderName,
                        pkg.Id
                    )

                    this.logging.log(`Reading files from directory: ${packageDir}`)
                    const files = this.getAllFiles(packageDir)
                    this.logging.log(`Found ${files.length} files to copy for package ${pkg.Id}`)

                    files.forEach(filePath => {
                        const relativePath = path.relative(packageDir, filePath)
                        const targetPath = path.join(targetBasePath, relativePath)

                        this.logging.log(`Copying file from ${filePath} to ${targetPath}`)
                        this.copyFile(filePath, targetPath)
                    })

                    const newPath = path.join(thirdPartyUpgradeFolderName, pkg.Id)
                    this.logging.log(
                        `Updating package reference path from ${pkg.NetCompatiblePackageDirectory} to ${newPath}`
                    )
                    pkg.NetCompatiblePackageDirectory = newPath

                    this.logging.log(`Successfully processed package ${pkg.Id}`)
                } catch (error) {
                    this.logging.log(`Failed to copy .NET compatible package for ${pkg.Id}: ${error}`)
                }
            } else {
                this.logging.log(`Skipping package ${pkg.Id} - directory not found or invalid: ${packageDir}`)
            }
        }
    }

    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        this.logging.log(`Scanning directory: ${dirPath}`)
        const files = fs.readdirSync(dirPath)
        this.logging.log(`Found ${files.length} entries in directory`)

        files.forEach(file => {
            const filePath = path.join(dirPath, file)
            if (fs.statSync(filePath).isDirectory()) {
                this.logging.log(`Found subdirectory: ${filePath}`)
                arrayOfFiles = this.getAllFiles(filePath, arrayOfFiles)
            } else {
                this.logging.log(`Found file: ${filePath}`)
                arrayOfFiles.push(filePath)
            }
        })

        return arrayOfFiles
    }
}
