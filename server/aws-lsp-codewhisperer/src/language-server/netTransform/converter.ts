import { AWSError } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import { StartTransformRequest, StartTransformResponse, TransformProjectMetadata } from './models'
import CodeWhispererTokenUserClient = require('../../client/token/codewhispererbearertokenclient')
import { Logging } from '@aws/language-server-runtimes/server-interface'

//sequence of targetFrameworkMap matters a lot because we are using as sorted indices of old to new .net versions
export const targetFrameworkMap = new Map<string, string>([
    ['net8.0', 'NET_8_0'],
    ['net9.0', 'NET_9_0'],
    ['netstandard2.0', 'NET_STANDARD_2_0'],
])

const dummyVersionIndex = 999

const targetFrameworkKeysArray = Array.from(targetFrameworkMap.keys())
function getKeyIndexOfVersion(key: any) {
    return targetFrameworkKeysArray.indexOf(key)
}

export function getCWStartTransformRequest(
    userInputRequest: StartTransformRequest,
    uploadId: string,
    logging: Logging
): CodeWhispererTokenUserClient.StartTransformationRequest {
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
                platformConfig: {
                    operatingSystemFamily: 'WINDOWS',
                },
            },
            target: {
                language: 'C_SHARP',
                runtimeEnv: {
                    dotNet: targetFrameworkMap.has(userInputRequest.TargetFramework)
                        ? targetFrameworkMap.get(userInputRequest.TargetFramework)
                        : 'NET_8_0',
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
