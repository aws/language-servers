import { StartTransformRequest, StartTransformResponse, TransformProjectMetadata } from './models'
import {
    StartTransformationRequest,
    StartTransformationResponse,
    TransformationDotNetRuntimeEnv,
} from '@amzn/codewhisperer-runtime'
import { Logging } from '@aws/language-server-runtimes/server-interface'

const targetFrameworkRecord: Record<string, TransformationDotNetRuntimeEnv> = {
    'net8.0': 'NET_8_0',
    'net9.0': 'NET_9_0',
    'netstandard2.0': 'NET_STANDARD_2_0',
}

export function getCWStartTransformRequest(
    userInputRequest: StartTransformRequest,
    uploadId: string | undefined,
    logging: Logging
): StartTransformationRequest {
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
                    dotNet: targetFrameworkRecord[userInputRequest.TargetFramework] ?? 'NET_10_0',
                },
                platformConfig: {
                    operatingSystemFamily: 'LINUX',
                },
            },
        },
    }
}

export function getCWStartTransformResponse(
    response: StartTransformationResponse,
    uploadId: string | undefined,
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
