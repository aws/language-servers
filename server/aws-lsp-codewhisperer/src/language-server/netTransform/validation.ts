import * as fs from 'fs'
import { StartTransformRequest, TransformProjectMetadata } from './models'
import { supportedProjects, unsupportedViewComponents } from './resources/SupportedProjects'

export function isProject(userInputrequest: StartTransformRequest): boolean {
    return userInputrequest.SelectedProjectPath.endsWith('.csproj')
}

export function isSolution(userInputrequest: StartTransformRequest): boolean {
    return userInputrequest.SelectedProjectPath.endsWith('.sln')
}

export function validateProject(userInputrequest: StartTransformRequest): boolean {
    var selectedProject = userInputrequest.ProjectMetadata.find(
        project => project.ProjectPath == userInputrequest.SelectedProjectPath
    )
    if (selectedProject) return supportedProjects.includes(selectedProject?.ProjectType)
    return false
}

export function validateSolution(userInputrequest: StartTransformRequest): string[] {
    return userInputrequest.ProjectMetadata.filter(project => !supportedProjects.includes(project.ProjectType)).map(
        project => project.ProjectPath
    )
}

export async function checkForUnsupportedViews(userInputRequest: StartTransformRequest, isProject: boolean) {
    var containsUnsupportedComponents: boolean = false
    var cshtmlFiles: string[] = findFilesWithExtension(userInputRequest, isProject)
    for (const file of cshtmlFiles) {
        let htmlString = await readFile(file)
        containsUnsupportedComponents = parseAndCheckUnsupportedComponents(htmlString)
        if (containsUnsupportedComponents) return containsUnsupportedComponents
    }
    return containsUnsupportedComponents
}

export function findFilesWithExtension(
    userInputRequest: StartTransformRequest,
    isProject: boolean,
    ext: string = '.cshtml'
): string[] {
    var cshtmlFiles: string[] = []
    var projectMetaData: TransformProjectMetadata[]
    if (isProject) {
        let projectPath = userInputRequest.SelectedProjectPath
        projectMetaData = userInputRequest.ProjectMetadata.filter(projectMd => projectMd.ProjectPath == projectPath)
    } else {
        projectMetaData = userInputRequest.ProjectMetadata
    }
    projectMetaData.forEach(projectMd => {
        projectMd.SourceCodeFilePaths.forEach(sourceCode => {
            if (sourceCode.endsWith('.cshtml')) {
                cshtmlFiles.push(sourceCode)
            }
        })
    })
    return cshtmlFiles
}

export async function readFile(filePath: string): Promise<string> {
    try {
        let fileContents = await fs.promises.readFile(filePath, 'utf-8')
        return fileContents
    } catch (err) {
        console.error(`Error reading/parsing file ${filePath}: ${err}`)
        return ''
    }
}

export function parseAndCheckUnsupportedComponents(htmlString: string): boolean {
    var containsUnsupportedComponents = false

    unsupportedViewComponents.forEach(component => {
        if (htmlString.includes(component)) {
            containsUnsupportedComponents = true
            return containsUnsupportedComponents
        }
    })
    return containsUnsupportedComponents
}
