import { expect } from 'chai'
import { getCWStartTransformResponse } from '../converter'
import { StartTransformationCommandOutput, StartTransformationResponse } from '@amzn/codewhisperer-runtime'

describe('Test Converter', () => {
    describe('Test get CW StartTransformResponse', () => {
        it('should return the correct StarTransformResponse object', () => {
            const mockResponseData: StartTransformationResponse = {
                transformationJobId: 'testJobId',
            }

            const mockCommandOutput: StartTransformationCommandOutput = {
                ...mockResponseData,
                $metadata: {
                    httpStatusCode: 200,
                    requestId: 'request-id-123',
                    attempts: 1,
                    totalRetryDelay: 0,
                },
            }

            const uploadId = 'upload-id-456'
            const artifactPath = '/path/to/artifact'
            const unsupportedProjects = ['project1', 'project2']
            const containsUnsupportedViews = true

            const result = getCWStartTransformResponse(
                mockCommandOutput,
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
