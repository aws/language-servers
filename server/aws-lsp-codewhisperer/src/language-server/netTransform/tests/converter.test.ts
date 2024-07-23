import { expect } from 'chai'
import { AWSError, HttpResponse } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import { Response } from 'aws-sdk/lib/response'
import { StartTransformRequest } from '../models'
import { getCWStartTransformRequest, getCWStartTransformResponse, targetFrameworkMap } from '../converter'
import CodeWhispererTokenUserClient = require('../../../client/token/codewhispererbearertokenclient')

const sampleStartTransformationRequest: CodeWhispererTokenUserClient.StartTransformationRequest = {
    workspaceState: {
        uploadId: '',
        programmingLanguage: {
            languageName: '',
        },
        contextTruncationScheme: 'ANALYSIS',
    },
    transformationSpec: {
        transformationType: 'LANGUAGE_UPGRADE',
        source: {
            language: 'C_SHARP',
            runtimeEnv: {
                dotNet: '',
            },
            platformConfig: {
                operatingSystemFamily: 'WINDOWS',
            },
        },
        target: {
            language: 'C_SHARP',
            runtimeEnv: {
                dotNet: '',
            },
            platformConfig: {
                operatingSystemFamily: 'LINUX',
            },
        },
    },
}

const sampleUserInputRequest: StartTransformRequest = {
    SolutionRootPath: '',
    TargetFramework: '',
    ProgramLanguage: '',
    SelectedProjectPath: '',
    SolutionConfigPaths: [],
    ProjectMetadata: [
        {
            Name: '',
            ProjectPath: '',
            ProjectLanguage: 'csharp',
            ProjectType: '',
            ExternalReferences: [],
            ProjectTargetFramework: '',
            SourceCodeFilePaths: [],
        },
    ],
    command: '',
}

function safeSet(obj: any, path: string[], value: any): void {
    let current = obj
    for (let i = 0; i < path.length - 1; i++) {
        if (current[path[i]] === undefined) {
            current[path[i]] = {}
        }
        current = current[path[i]]
    }
    current[path[path.length - 1]] = value
}

describe('Test Converter', () => {
    describe('Test get CW StartTransformRequest', () => {
        it('should return a transformation request with valid source and target framework', () => {
            const testUploadId = 'testUploadId'
            let testUserInputRequest: StartTransformRequest = sampleUserInputRequest
            testUserInputRequest.TargetFramework = 'net8.0'
            testUserInputRequest.ProgramLanguage = 'csharp'
            testUserInputRequest.ProjectMetadata[0].ProjectTargetFramework = 'net8.0'

            const startTransformationRequest = getCWStartTransformRequest(testUserInputRequest, testUploadId)

            let expectedStartTransformationRequest = sampleStartTransformationRequest
            expectedStartTransformationRequest.workspaceState.uploadId = testUploadId
            expectedStartTransformationRequest.workspaceState.programmingLanguage.languageName = 'csharp'
            safeSet(
                expectedStartTransformationRequest,
                ['transformationSpec', 'source', 'runtimeEnv', 'dotNet'],
                'NET_8_0'
            )
            safeSet(
                expectedStartTransformationRequest,
                ['transformationSpec', 'target', 'runtimeEnv', 'dotNet'],
                'NET_8_0'
            )

            expect(startTransformationRequest).to.deep.equal(expectedStartTransformationRequest)
        })

        it('should return a transformation request with empty source frameowrk when project target framework is a not supported version', () => {
            const testUploadId = 'testUploadId'
            let testUserInputRequest: StartTransformRequest = sampleUserInputRequest
            testUserInputRequest.TargetFramework = 'net8.0'
            testUserInputRequest.ProgramLanguage = 'csharp'
            testUserInputRequest.ProjectMetadata[0].ProjectTargetFramework = 'not supported'

            const startTransformationRequest = getCWStartTransformRequest(testUserInputRequest, testUploadId)

            let expectedStartTransformationRequest = sampleStartTransformationRequest
            expectedStartTransformationRequest.workspaceState.uploadId = testUploadId
            expectedStartTransformationRequest.workspaceState.programmingLanguage.languageName = 'csharp'
            safeSet(expectedStartTransformationRequest, ['transformationSpec', 'source', 'runtimeEnv', 'dotNet'], '')
            safeSet(
                expectedStartTransformationRequest,
                ['transformationSpec', 'target', 'runtimeEnv', 'dotNet'],
                'NET_8_0'
            )

            expect(startTransformationRequest).to.deep.equal(expectedStartTransformationRequest)
        })

        it('should return a transformation request with empty target frameowrk when target framework in user request is a not supported version', () => {
            const testUploadId = 'testUploadId'
            let testUserInputRequest: StartTransformRequest = sampleUserInputRequest
            testUserInputRequest.TargetFramework = 'not support'
            testUserInputRequest.ProgramLanguage = 'csharp'
            testUserInputRequest.ProjectMetadata[0].ProjectTargetFramework = 'net8.0'

            const startTransformationRequest = getCWStartTransformRequest(testUserInputRequest, testUploadId)

            let expectedStartTransformationRequest = sampleStartTransformationRequest
            expectedStartTransformationRequest.workspaceState.uploadId = testUploadId
            expectedStartTransformationRequest.workspaceState.programmingLanguage.languageName = 'csharp'
            safeSet(
                expectedStartTransformationRequest,
                ['transformationSpec', 'source', 'runtimeEnv', 'dotNet'],
                'NET_8_0'
            )
            safeSet(expectedStartTransformationRequest, ['transformationSpec', 'target', 'runtimeEnv', 'dotNet'], '')

            expect(startTransformationRequest).to.deep.equal(expectedStartTransformationRequest)
        })
    })

    describe('Test get CW StartTransformResponse', () => {
        it('should return the correct StarTransformResponse object', () => {
            const mockResponseData: CodeWhispererTokenUserClient.StartTransformationResponse = {
                transformationJobId: 'testJobId',
            }

            const mockHttpResponse: HttpResponse = {
                createUnbufferedStream: () => new XMLHttpRequest(),
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockResponseData),
                statusMessage: '',
                streaming: false,
            }

            let mockResponse: Response<CodeWhispererTokenUserClient.StartTransformationResponse, AWSError> = {
                hasNextPage: () => false,
                nextPage: () => null,
                data: mockResponseData,
                error: undefined,
                requestId: 'request-id-123',
                redirectCount: 0,
                retryCount: 0,
                httpResponse: mockHttpResponse,
            }

            const mockPromiseResult: PromiseResult<CodeWhispererTokenUserClient.StartTransformationResponse, AWSError> =
                {
                    ...mockResponseData,
                    $response: mockResponse,
                }

            const uploadId = 'upload-id-456'
            const artifactPath = '/path/to/artifact'
            const unsupportedProjects = ['project1', 'project2']
            const containsUnsupportedViews = true

            const result = getCWStartTransformResponse(
                mockPromiseResult,
                uploadId,
                artifactPath,
                unsupportedProjects,
                containsUnsupportedViews
            )

            expect(result).to.deep.equal({
                UploadId: uploadId,
                TransformationJobId: mockResponseData.transformationJobId,
                ArtifactPath: artifactPath,
                UnSupportedProjects: unsupportedProjects,
                ContainsUnsupportedViews: containsUnsupportedViews,
            })
        })
    })
})
