import { CodeWhispererStreaming } from '@amzn/codewhisperer-streaming'
import {
    Logging,
    Workspace,
    SDKInitializator,
    SDKClientConstructorV2,
    SDKClientConstructorV3,
    Runtime,
} from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import { HttpResponse } from 'aws-sdk'
import { expect } from 'chai'
import * as fs from 'fs'
import got from 'got'
import { StubbedInstance, default as simon, stubInterface } from 'ts-sinon'
import { StreamingClient, createStreamingClient } from '../../../client/streamingClient/codewhispererStreamingClient'
import { CodeWhispererServiceToken } from '../../codeWhispererService'
import {
    CancelTransformRequest,
    CancellationJobStatus,
    GetTransformPlanRequest,
    GetTransformRequest,
    StartTransformRequest,
} from '../models'
import { TransformHandler } from '../transformHandler'
import { EXAMPLE_REQUEST } from './mockData'
import sinon = require('sinon')
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../../constants'
import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'

const mocked$Response = {
    $response: {
        hasNextPage: simon.mock(),
        nextPage: simon.mock(),
        data: undefined,
        error: undefined,
        requestId: '',
        redirectCount: 0,
        retryCount: 0,
        httpResponse: new HttpResponse(),
    },
}
const testUploadId = 'test-upoload-id'
const testTransformId = 'test-transform-id'
const payloadFileName = 'C:\\test.zip'

describe('Test Transform handler ', () => {
    let client: StubbedInstance<CodeWhispererServiceToken>
    let workspace: StubbedInstance<Workspace>
    let runtime: StubbedInstance<Runtime>
    let transformHandler: TransformHandler
    const mockedLogging = stubInterface<Logging>()
    const awsQRegion: string = DEFAULT_AWS_Q_REGION
    const awsQEndpointUrl: string = DEFAULT_AWS_Q_ENDPOINT_URL
    beforeEach(async () => {
        // Set up the server with a mock service
        client = stubInterface<CodeWhispererServiceToken>()
        workspace = stubInterface<Workspace>()
        runtime = stubInterface<Runtime>()
        transformHandler = new TransformHandler(client, workspace, mockedLogging, runtime)
    })

    describe('test upload artifact', () => {
        it('call upload method correctly', async () => {
            const putStub = sinon.stub(got, 'put').resolves({ statusCode: 'Success' })
            const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('text file content')
            await transformHandler.uploadArtifactToS3Async(
                payloadFileName,
                {
                    uploadId: testUploadId,
                    uploadUrl: 'dummy-upload-url',
                    kmsKeyArn: 'ResourceArn',
                    ...mocked$Response,
                },
                'dummy-256'
            )
            simon.assert.callCount(putStub, 1)
            simon.assert.callCount(readFileSyncStub, 1)
            putStub.restore()
            readFileSyncStub.restore()
        })
    })

    describe('Test transform create presign url and upload', () => {
        beforeEach(async () => {
            // mock default return value for createUploadUrl
            client.codeModernizerCreateUploadUrl.resolves({
                uploadId: testUploadId,
                uploadUrl: 'dummy-upload-url',
                kmsKeyArn: 'ResourceArn',
                ...mocked$Response,
            })
        })

        it('returns upload id correctly', async () => {
            const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('text file content')
            const uploadStub = sinon.stub(transformHandler, 'uploadArtifactToS3Async')
            const res = await transformHandler.uploadPayloadAsync(payloadFileName)
            simon.assert.callCount(readFileSyncStub, 1)
            simon.assert.callCount(uploadStub, 1)
            assert.equal(res, testUploadId)
            uploadStub.restore()
            readFileSyncStub.restore()
        })

        it('should throw error if uploadArtifactToS3Async fails', async () => {
            const mockError = new Error('Error in uploadArtifactToS3 call')
            const readFileSyncStub = sinon.stub(fs, 'readFileSync').returns('text file content')
            sinon.stub(transformHandler, 'uploadArtifactToS3Async').rejects(mockError)

            // Call the method to be tested
            try {
                await transformHandler.uploadPayloadAsync(payloadFileName)
            } catch (error) {
                // Assertions
                expect((error as Error).message).to.equal(mockError.message)
                sinon.assert.calledOnce(readFileSyncStub)
                readFileSyncStub.restore()
            }
        })
        /*
        it('should upload payload and return uploadId', async () => {
            workspace.fs.getTempDirPath = simon.stub().returns('C:\\tmp')
            const zipStub = sinon.stub(transformHandler, 'zipCodeAsync').returns(Promise.resolve(payloadFileName))
            const uploadStub = sinon.stub(transformHandler, 'uploadPayloadAsync').returns(Promise.resolve(testUploadId))
            const result = await transformHandler.preTransformationUploadCode(payloadFileName)
            expect(result).to.equal(testUploadId)
            sinon.assert.calledOnce(zipStub)
            sinon.assert.calledOnce(uploadStub)
            zipStub.restore()
            uploadStub.restore()
        })

        it('should throw error if upload fails', async () => {
            // Mocking necessary dependencies and methods
            const mockError = new Error('Upload failed')
            const requestString = JSON.stringify(EXAMPLE_REQUEST)
            const request = JSON.parse(requestString) as StartTransformRequest
            workspace.fs.getTempDirPath = simon.stub().returns('C:\\tmp')
            const zipStub = sinon.stub(transformHandler, 'zipCodeAsync').returns(Promise.resolve(payloadFileName))
            sinon.stub(transformHandler, 'uploadPayloadAsync').rejects(mockError)
            try {
                await transformHandler.preTransformationUploadCode(request)
            } catch (error) {
                sinon.assert.calledOnce(zipStub)
                expect((error as Error).message).to.equal(mockError.message)
                zipStub.restore()
            }
        })
            */
    })

    describe('Test cancel transform job', () => {
        beforeEach(async () => {
            // mock default return value for cancelTransform
            client.codeModernizerStopCodeTransformation.returns(
                Promise.resolve({
                    transformationStatus: 'STOPPED',
                    ...mocked$Response,
                })
            )
        })

        it('should cancel transform', async () => {
            const requestString = JSON.stringify({ TransformationJobId: testTransformId })
            const request = JSON.parse(requestString) as CancelTransformRequest
            const res = await transformHandler.cancelTransformation(request)

            expect(res.TransformationJobStatus).to.equal(CancellationJobStatus.SUCCESSFULLY_CANCELLED)
        })

        it('should throw error if cancellation fails', async () => {
            client.codeModernizerStopCodeTransformation.returns(
                Promise.resolve({
                    transformationStatus: 'COMPLETED',
                    ...mocked$Response,
                })
            )

            const requestString = JSON.stringify({ TransformationJobId: testTransformId })
            const request = JSON.parse(requestString) as CancelTransformRequest
            const res = await transformHandler.cancelTransformation(request)

            expect(res.TransformationJobStatus).to.equal(CancellationJobStatus.FAILED_TO_CANCEL)
        })
    })
    const mockedCredentialsProvider = {
        getCredentials: sinon.stub().returns({ token: 'mockedToken' }),
    }

    const mockSdkRuntimeConfigurator: SDKInitializator = Object.assign(
        // Default callable function for v3 clients
        <T, P>(Ctor: SDKClientConstructorV3<T, P>, current_config: P): T => new Ctor({ ...current_config }),
        // Property for v2 clients
        {
            v2: <T extends Service, P extends ServiceConfigurationOptions>(
                Ctor: SDKClientConstructorV2<T, P>,
                current_config: P
            ): T => new Ctor({ ...current_config }),
        }
    )

    describe('StreamingClient', () => {
        it('should create a new streaming client', async () => {
            const streamingClient = new StreamingClient()
            const client = await streamingClient.getStreamingClient(
                mockedCredentialsProvider,
                awsQRegion,
                awsQEndpointUrl,
                mockSdkRuntimeConfigurator
            )
            expect(client).to.be.instanceOf(CodeWhispererStreaming)
        })
    })

    describe('createStreamingClient', () => {
        it('should create a new streaming client with correct configurations', async () => {
            const client = await createStreamingClient(
                mockedCredentialsProvider,
                awsQRegion,
                awsQEndpointUrl,
                mockSdkRuntimeConfigurator
            )
            expect(client).to.be.instanceOf(CodeWhispererStreaming)
        })
    })

    describe('Test get transformJob', () => {
        beforeEach(async () => {
            // mock default return value for Transformation Job
            client.codeModernizerGetCodeTransformation.returns(
                Promise.resolve({
                    transformationJob: {
                        jobId: testTransformId,
                        status: 'COMPLETED',
                        ...mocked$Response,
                    },
                    ...mocked$Response,
                })
            )
        })

        it('should get transform', async () => {
            const requestString = JSON.stringify({ TransformationJobId: testTransformId })
            const request = JSON.parse(requestString) as GetTransformRequest
            const res = await transformHandler.getTransformation(request)

            expect(res?.TransformationJob.status).to.equal('COMPLETED')
        })
    })

    describe('Test get transformJob for failed case', () => {
        beforeEach(async () => {
            // mock default return value for Transformation Job
            client.codeModernizerGetCodeTransformation.returns(
                Promise.resolve({
                    transformationJob: {
                        jobId: testTransformId,
                        status: 'FAILED',
                        ...mocked$Response,
                    },
                    ...mocked$Response,
                })
            )
        })

        it('should get transform for failed case', async () => {
            const requestString = JSON.stringify({ TransformationJobId: testTransformId })
            const request = JSON.parse(requestString) as GetTransformRequest
            const res = await transformHandler.getTransformation(request)

            expect(res?.TransformationJob.status).to.equal('FAILED')
        })
    })

    describe('Test get transform plan', () => {
        beforeEach(async () => {
            // mock default return value for Transformation plan

            const mockPlanString = JSON.stringify({
                transformationPlan: {
                    transformationSteps: [
                        {
                            id: '1',
                            name: 'PlanStepName 1',
                            description: 'PlanStepDescription 1',
                            status: 'COMPLETED',
                            progressUpdates: [
                                {
                                    name: 'ProgressUpdateName 1 for PlanStep 1',
                                    status: 'COMPLETED',
                                    description: 'ProgressUpdateDescription 1 for PlanStep 1',
                                    startTime: '2024-03-11T23:27:33.935Z',
                                    endTime: '2024-03-11T23:27:34.038Z',
                                },
                            ],
                            startTime: '2024-03-12T18:49:41.431Z',
                            endTime: '2024-03-12T18:49:42.431Z',
                        },
                    ],
                },
            })
            const response = JSON.parse(mockPlanString)
            client.codeModernizerGetCodeTransformationPlan.returns(Promise.resolve(response))
        })

        it('should get transform plan', async () => {
            const requestString = JSON.stringify({ TransformationJobId: testTransformId })
            const request = JSON.parse(requestString) as GetTransformPlanRequest
            const res = await transformHandler.getTransformationPlan(request)

            expect(res.TransformationPlan.transformationSteps[0].status).to.equal('COMPLETED')
            expect(res.TransformationPlan.transformationSteps[0].name).to.equal('PlanStepName 1')
            if (res.TransformationPlan.transformationSteps[0].progressUpdates) {
                expect(res.TransformationPlan.transformationSteps[0].progressUpdates[0].name).to.equal(
                    'ProgressUpdateName 1 for PlanStep 1'
                )
            }
        })
    })
})
