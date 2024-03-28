import { AWSError } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import { QNetStartTransformRequest, QNetStartTransformResponse } from './models'
import CodeWhispererTokenUserClient = require('../../client/token/codewhispererbearertokenclient')

export const targetFrameworkMap = new Map<string, string>([
    ['net8.0', 'NET_8_0'],
    ['net7.0', 'NET_7_0'],
    ['net6.0', 'NET_6_0'],
    ['net5.0', 'NET_5_0'],
    ['netcoreapp3.1', 'NET_CORE_APP_3_1'],
    ['netcoreapp3.0', 'NET_CORE_APP_3_0'],
    ['netcoreapp2.2', 'NET_CORE_APP_2_2'],
    ['netcoreapp2.1', 'NET_CORE_APP_2_1'],
    ['netcoreapp2.0', 'NET_CORE_APP_2_0'],
    ['netcoreapp1.1', 'NET_CORE_APP_1_1'],
    ['netcoreapp1.0', 'NET_CORE_APP_1_0'],
    ['net481', 'NET_FRAMEWORK_V_4_8'],
    ['net48', 'NET_FRAMEWORK_V_4_8'],
    ['net472', 'NET_FRAMEWORK_V_4_7_2'],
    ['net471', 'NET_FRAMEWORK_V_4_7_1'],
    ['net47', 'NET_FRAMEWORK_V_4_7'],
    ['net462', 'NET_FRAMEWORK_V_4_6_2'],
    ['net461', 'NET_FRAMEWORK_V_4_6_1'],
    ['net46', 'NET_FRAMEWORK_V_4_6'],
    ['net452', 'NET_FRAMEWORK_V_4_5_2'],
    ['net451', 'NET_FRAMEWORK_V_4_5_1'],
    ['net45', 'NET_FRAMEWORK_V_4_5'],
    ['net403', 'NET_FRAMEWORK_V_4_0'],
    ['net40', 'NET_FRAMEWORK_V_4_0'],
    ['net35', 'NET_FRAMEWORK_V_3_5'],
])

export function getCWStartTransformRequest(
    userInputRequest: QNetStartTransformRequest,
    uploadId: string
): CodeWhispererTokenUserClient.StartTransformationRequest {
    const targetProject = userInputRequest.ProjectMetadata.find(project => project.ProjectTargetFramework != '')
    const sourceFramework =
        targetProject == undefined
            ? ''
            : targetFrameworkMap.has(targetProject.ProjectTargetFramework)
              ? targetFrameworkMap.get(targetProject.ProjectTargetFramework)
              : ''
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
    uploadId: string
): QNetStartTransformResponse {
    return {
        UploadId: uploadId,
        TransformationJobId: response.transformationJobId,
    }
}
