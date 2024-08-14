import { AWSError } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import { StartTransformRequest, StartTransformResponse, TransformProjectMetadata } from './models'
import CodeWhispererTokenUserClient = require('../../client/token/codewhispererbearertokenclient')
import { Logging } from '@aws/language-server-runtimes/server-interface'

//sequence of targetFrameworkMap matters a lot because we are using as sorted indices of old to new .net versions
export const targetFrameworkMap = new Map<string, string>([
    ['net35', 'NET_FRAMEWORK_V_3_5'],
    ['net40', 'NET_FRAMEWORK_V_4_0'],
    ['net403', 'NET_FRAMEWORK_V_4_0'],
    ['net45', 'NET_FRAMEWORK_V_4_5'],
    ['net451', 'NET_FRAMEWORK_V_4_5_1'],
    ['net452', 'NET_FRAMEWORK_V_4_5_2'],
    ['net46', 'NET_FRAMEWORK_V_4_6'],
    ['net461', 'NET_FRAMEWORK_V_4_6_1'],
    ['net462', 'NET_FRAMEWORK_V_4_6_2'],
    ['net47', 'NET_FRAMEWORK_V_4_7'],
    ['net471', 'NET_FRAMEWORK_V_4_7_1'],
    ['net472', 'NET_FRAMEWORK_V_4_7_2'],
    ['net48', 'NET_FRAMEWORK_V_4_8'],
    ['net481', 'NET_FRAMEWORK_V_4_8'],
    ['netcoreapp1.0', 'NET_CORE_APP_1_0'],
    ['netcoreapp1.1', 'NET_CORE_APP_1_1'],
    ['netcoreapp2.0', 'NET_CORE_APP_2_0'],
    ['netcoreapp2.1', 'NET_CORE_APP_2_1'],
    ['netcoreapp2.2', 'NET_CORE_APP_2_2'],
    ['netcoreapp3.0', 'NET_CORE_APP_3_0'],
    ['netcoreapp3.1', 'NET_CORE_APP_3_1'],
    ['net5.0', 'NET_5_0'],
    ['net6.0', 'NET_6_0'],
    ['net7.0', 'NET_7_0'],
    ['net8.0', 'NET_8_0'],
])

const dummyVersionIndex = 999

const targetFrameworkKeysArray = Array.from(targetFrameworkMap.keys())
function getKeyIndexOfVersion(key: any) {
    return targetFrameworkKeysArray.indexOf(key)
}

export function findMinimumSourceVersion(projectMetadata: TransformProjectMetadata[], logging: Logging) {
    var minimumVersionIndex = dummyVersionIndex
    projectMetadata.forEach(project => {
        if (project.ProjectTargetFramework != '' && targetFrameworkMap.has(project.ProjectTargetFramework)) {
            logging.log('Project version to compare ' + project.ProjectTargetFramework)
            minimumVersionIndex =
                getKeyIndexOfVersion(project.ProjectTargetFramework) < minimumVersionIndex
                    ? getKeyIndexOfVersion(project.ProjectTargetFramework)
                    : minimumVersionIndex
        }
    })
    var minimumDotNetVersion =
        minimumVersionIndex != dummyVersionIndex
            ? targetFrameworkMap.get(targetFrameworkKeysArray[minimumVersionIndex])
            : ''
    logging.log('Selected lowest version is ' + minimumDotNetVersion)
    return minimumDotNetVersion
}

export function getCWStartTransformRequest(
    userInputRequest: StartTransformRequest,
    uploadId: string,
    logging: Logging
): CodeWhispererTokenUserClient.StartTransformationRequest {
    const sourceFramework = findMinimumSourceVersion(userInputRequest.ProjectMetadata, logging)
    logging.log('Lowest sourceFramework for startTransform Request ' + sourceFramework)
    return {
        workspaceState: {
            uploadId: uploadId,
            /**
             * Primary programming language of the Workspace
             */
            programmingLanguage: {
                languageName: userInputRequest.ProgramLanguage,
            },
            /**
             * Workspace context truncation schemes based on usecase
             */
            contextTruncationScheme: 'ANALYSIS',
        },
        transformationSpec: {
            transformationType: 'LANGUAGE_UPGRADE',
            source: {
                language: 'C_SHARP',
                runtimeEnv: {
                    dotNet: sourceFramework,
                },
                platformConfig: {
                    operatingSystemFamily: 'WINDOWS',
                },
            },
            target: {
                language: 'C_SHARP',
                runtimeEnv: {
                    dotNet: targetFrameworkMap.has(userInputRequest.TargetFramework)
                        ? targetFrameworkMap.get(userInputRequest.TargetFramework)
                        : '',
                },
                platformConfig: {
                    operatingSystemFamily: 'LINUX',
                },
            },
        },
    }
}

export function getCWStartTransformResponse(
    response: PromiseResult<CodeWhispererTokenUserClient.StartTransformationResponse, AWSError>,
    uploadId: string,
    artifactPath: string,
    unsupportedProjects: string[],
    containsUnsupportedViews: boolean
): StartTransformResponse {
    return {
        UploadId: uploadId,
        TransformationJobId: response.transformationJobId,
        ArtifactPath: artifactPath,
        UnSupportedProjects: unsupportedProjects,
        ContainsUnsupportedViews: containsUnsupportedViews,
    }
}
