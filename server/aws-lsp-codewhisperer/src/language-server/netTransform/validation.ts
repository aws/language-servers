import * as fs from 'fs'
import { StartTransformRequest, TransformProjectMetadata } from './models'
import { supportedProjects, unsupportedViewComponents } from './resources/SupportedProjects'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { TransformationJob } from '../../client/token/codewhispererbearertokenclient'
import { TransformationErrorCode } from './models'

export function isProject(userInputrequest: StartTransformRequest): boolean {
    return userInputrequest.SelectedProjectPath.endsWith('.csproj')
}

export function isSolution(userInputrequest: StartTransformRequest): boolean {
    return userInputrequest.SelectedProjectPath.endsWith('.sln')
}

export function validateProject(userInputrequest: StartTransformRequest, logging: Logging): boolean {
    var selectedProject = userInputrequest.ProjectMetadata.find(
        project => project.ProjectPath == userInputrequest.SelectedProjectPath
    )

    if (selectedProject) {
        var isValid = supportedProjects.includes(selectedProject?.ProjectType)
        logging.log(
            `Selected project ${userInputrequest?.SelectedProjectPath} has project type ${selectedProject.ProjectType}` +
                (isValid ? '' : ' that is not supported')
        )
        return isValid
    }
    logging.log(`Error occured in verifying selected project with path ${userInputrequest.SelectedProjectPath}`)
    return false
}

export function validateSolution(userInputrequest: StartTransformRequest): string[] {
    return userInputrequest.ProjectMetadata.filter(project => !supportedProjects.includes(project.ProjectType)).map(
        project => project.ProjectPath
    )
}

export async function checkForUnsupportedViews(
    userInputRequest: StartTransformRequest,
    isProject: boolean,
    logging: Logging
) {
    var containsUnsupportedComponents: boolean = false
    var cshtmlFiles: string[] = findFilesWithExtension(userInputRequest, isProject)
    for (const file of cshtmlFiles) {
        let htmlString = await readFile(file)
        containsUnsupportedComponents = parseAndCheckUnsupportedComponents(htmlString)
        if (containsUnsupportedComponents) {
            logging.log(
                `Selected project ${userInputRequest?.SelectedProjectPath} has unsupported components in file ${file}`
            )
            return containsUnsupportedComponents
        }
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

/**
 * Determines the appropriate error code for a transformation job based on its status and reason.
 *
 * @param transformationJob - The transformation job to analyze
 * @returns An error code representing the job's error state, or NONE if no error
 *
 * TODO: Expand this function to handle additional error patterns as they are identified
 */
export function getTransformationErrorCode(transformationJob: TransformationJob | undefined): TransformationErrorCode {
    if (!transformationJob) {
        return TransformationErrorCode.NONE
    }

    // Check for failure states
    if (
        transformationJob.status === 'FAILED' ||
        transformationJob.status === 'STOPPED' ||
        transformationJob.status === 'REJECTED'
    ) {
        if (transformationJob.reason) {
            // Check for quota exceeded error
            if (
                transformationJob.reason
                    .toLowerCase()
                    .includes(
                        'the project was stopped because the projected resource usage would exceed your remaining quota.'
                    )
            ) {
                return TransformationErrorCode.QUOTA_EXCEEDED
            }

            // TODO: Add more error pattern matching here as needed
        }

        // If we get here, there was a failure but we don't have a specific error code for it
        return TransformationErrorCode.UNKNOWN_ERROR
    }

    // No error
    return TransformationErrorCode.NONE
}
