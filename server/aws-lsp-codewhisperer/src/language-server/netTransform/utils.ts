import * as archiver from 'archiver'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { QNetStartTransformRequest, RequirementJson } from './models'
const requriementJsonFileName = 'requirement.json'
export const artifactFolderName = 'artifact'
const zipFileName = 'artifact.zip'
const referenceFolderName = 'reference'
const sourceCodeFolderName = 'sourceCode'

export async function createZip(request: QNetStartTransformRequest, basePath: string): Promise<string> {
    await createRequirementJson(request, basePath)
    await copyReferenceDlls(request, basePath)
    await copySoureFiles(request, basePath)
    return await zipArtifact(basePath)
}

export function cleanup(basePath: string) {
    try {
        const artifactFolder = path.join(basePath, artifactFolderName)
        const zipFile = path.join(basePath, zipFileName)
        fs.rmSync(artifactFolder, { recursive: true, force: true })
        fs.unlinkSync(zipFile)
    } catch (error) {
        console.log('failed to cleanup:' + error)
    }
}

export async function createRequirementJson(request: QNetStartTransformRequest, basePath: string) {
    const fileContent = await createRequirementJsonContent(request)
    const dir = getRequirementJsonPath(basePath)
    await writeReuqirmentJsonAsync(dir, JSON.stringify(fileContent))
}

export async function copyReferenceDlls(request: QNetStartTransformRequest, basePath: string) {
    const filteredReferences = filterReferences(request)
    filteredReferences.forEach(reference =>
        copyFile(reference.AssemblyFullPath, getReferencePathFromRelativePath(basePath, reference.RelativePath))
    )
}

export async function copySoureFiles(request: QNetStartTransformRequest, basePath: string) {
    request.SourceCodeFilePaths.forEach(filePath => {
        const relativePath = normalizeSourceFileRelativePath(request.SolutionRootPath, filePath)
        copyFile(filePath, getSourceCodePathFromRelativePath(basePath, relativePath))
    })
}

export async function createRequirementJsonContent(request: QNetStartTransformRequest): Promise<RequirementJson> {
    const projectToReference = request.ProjectMetadata.map(p => {
        return {
            project: normalizeSourceFileRelativePath(request.SolutionRootPath, p.ProjectPath),
            references: p.ExternalReferences.map(r => {
                return {
                    AssemblyFullPath: '',
                    IncludedInArtifact: r.IncludedInArtifact,
                    ProjectPath: normalizeSourceFileRelativePath(request.SolutionRootPath, r.ProjectPath),
                    RelativePath: r.RelativePath,
                    TargetFrameworkId: r.TargetFrameworkId,
                }
            }),
        }
    })
    const fileContent: RequirementJson = {
        ProjectToReference: projectToReference,
    }
    console.log('total project reference:' + projectToReference.length)
    return fileContent
}

export function filterReferences(request: QNetStartTransformRequest) {
    //remove duplicate externalreference
    const externalReferences = request.ProjectMetadata.flatMap(r => r.ExternalReferences)
    return externalReferences
        .filter(reference => reference.IncludedInArtifact)
        .filter(
            (reference, index) =>
                index === externalReferences.findIndex(other => reference.AssemblyFullPath === other.AssemblyFullPath)
        )
}

export async function zipArtifact(basePath: string): Promise<string> {
    const folderPath = path.join(basePath, artifactFolderName)
    if (!fs.existsSync(folderPath)) {
        console.error('cannot find artifact folder')
        return ''
    }
    const zipPath = path.join(basePath, zipFileName)
    console.log('zipping files to' + zipPath)
    await zipDirectory(folderPath, zipPath)
    return zipPath
}

export function getSha256(fileName: string) {
    const hasher = crypto.createHash('sha256')
    hasher.update(fs.readFileSync(fileName))
    return hasher.digest('base64')
}

export function getRequirementJsonPath(basePath: string): string {
    const dir = path.join(basePath, artifactFolderName)
    createFolderIfNotExist(dir)
    return dir
}

export function getReferencePathFromRelativePath(basePath: string, relativePath: string): string {
    return path.join(basePath, artifactFolderName, referenceFolderName, relativePath)
}

export function getSourceCodePathFromRelativePath(basePath: string, relativePath: string): string {
    return path.join(basePath, artifactFolderName, relativePath)
}

export function normalizeSourceFileRelativePath(solutionRootPath: string, fullPath: string) {
    if (fullPath.startsWith(solutionRootPath))
        return path.join(sourceCodeFolderName, fullPath.replace(solutionRootPath, ''))
    else {
        const relativePath = fullPath.substring(fullPath.indexOf(':\\') + 2, fullPath.length)
        return path.join(sourceCodeFolderName, relativePath)
    }
}

function zipDirectory(sourceDir: string, outPath: string) {
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

async function writeReuqirmentJsonAsync(dir: string, fileContent: string) {
    const fileName = path.join(dir, requriementJsonFileName)
    fs.writeFileSync(fileName, fileContent)
}

function createFolderIfNotExist(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

function copyFile(sourceFilePath: string, destFilePath: string) {
    const dir = path.dirname(destFilePath)
    createFolderIfNotExist(dir)
    fs.copyFile(sourceFilePath, destFilePath, err => {
        if (err) {
            console.log('failed to copy: ' + sourceFilePath + err)
        }
    })
}
