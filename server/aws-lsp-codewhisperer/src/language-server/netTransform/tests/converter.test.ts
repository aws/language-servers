import { expect } from 'chai'
import { AWSError, HttpResponse } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import { Response } from 'aws-sdk/lib/response'
import { getCWStartTransformResponse } from '../converter'
import { StartTransformationResponse } from '@amzn/codewhisperer-runtime'

describe('Test Converter', () => {
    describe('Test get CW StartTransformResponse', () => {
        it('should return the correct StarTransformResponse object', () => {
            const mockResponseData: StartTransformationResponse = {
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

            let mockResponse: Response<StartTransformationResponse, AWSError> = {
                hasNextPage: () => false,
                nextPage: () => null,
                data: mockResponseData,
                error: undefined,
                requestId: 'request-id-123',
                redirectCount: 0,
                retryCount: 0,
                httpResponse: mockHttpResponse,
            }

            const mockPromiseResult: PromiseResult<StartTransformationResponse, AWSError> = {
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
