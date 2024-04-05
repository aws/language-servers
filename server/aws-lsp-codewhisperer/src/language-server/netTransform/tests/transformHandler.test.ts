import { Logging, Workspace } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import { HttpResponse } from 'aws-sdk'
import { expect } from 'chai'
import * as fs from 'fs'
import got from 'got'
import { StubbedInstance, default as simon, stubInterface } from 'ts-sinon'
import { CodeWhispererServiceToken } from '../../codeWhispererService'
import { CancellationJobStatus, QNetCancelTransformRequest, QNetStartTransformRequest } from '../models'
import { TransformHandler } from '../transformHandler'
import { EXAMPLE_REQUEST } from './mockData'
import sinon = require('sinon')
import { StreamingClient, createStreamingClient } from '../../../client/streamingClient/codewhispererStreamingClient'
import { CodeWhispererStreaming } from '@amzn/codewhisperer-streaming'
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
    let transformHandler: TransformHandler
    const mockedLogging = stubInterface<Logging>()
    beforeEach(async () => {
        // Set up the server with a mock service
        client = stubInterface<CodeWhispererServiceToken>()
        workspace = stubInterface<Workspace>()
        transformHandler = new TransformHandler(client, workspace, mockedLogging)
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
        it('should upload payload and return uploadId', async () => {
            const requestString = JSON.stringify(EXAMPLE_REQUEST)
            const request = JSON.parse(requestString) as QNetStartTransformRequest
            workspace.fs.getTempDirPath = simon.stub().returns('C:\\tmp')
            const zipStub = sinon.stub(transformHandler, 'zipCodeAsync').returns(Promise.resolve(payloadFileName))
            const uploadStub = sinon.stub(transformHandler, 'uploadPayloadAsync').returns(Promise.resolve(testUploadId))
            const result = await transformHandler.preTransformationUploadCode(request)
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
            const request = JSON.parse(requestString) as QNetStartTransformRequest
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
    })

    describe('Test create transformJob', () => {
        beforeEach(async () => {
            // mock default return value for createCodeScan
            client.codeModernizerStartCodeTransformation.returns(
                Promise.resolve({
                    transformationJobId: testTransformId,
                    status: 'ACCEPTED',
                    ...mocked$Response,
                })
            )
        })

        it('should create transform', async () => {
            const requestString = JSON.stringify(EXAMPLE_REQUEST)
            const request = JSON.parse(requestString) as QNetStartTransformRequest
            workspace.fs.getTempDirPath = simon.stub().returns('C:\\tmp')
            const zipStub = sinon.stub(transformHandler, 'zipCodeAsync').returns(Promise.resolve(payloadFileName))
            const uploadStub = sinon.stub(transformHandler, 'uploadPayloadAsync').returns(Promise.resolve(testUploadId))
            const res = await transformHandler.startTransformation(request)
            sinon.assert.calledOnce(zipStub)
            sinon.assert.calledOnce(uploadStub)
            expect(res.TransformationJobId).to.equal(testTransformId)
            expect(res.UploadId).to.equal(testUploadId)
        })
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
            const request = JSON.parse(requestString) as QNetCancelTransformRequest
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
            const request = JSON.parse(requestString) as QNetCancelTransformRequest
            const res = await transformHandler.cancelTransformation(request)

            expect(res.TransformationJobStatus).to.equal(CancellationJobStatus.FAILED_TO_CANCEL)
        })
    })
    const mockedCredentialsProvider = {
        getCredentials: sinon.stub().returns({ token: 'mockedToken' }),
    }

    describe('StreamingClient', () => {
        it('should create a new streaming client', async () => {
            const streamingClient = new StreamingClient()
            const client = await streamingClient.getStreamingClient(mockedCredentialsProvider)
            expect(client).to.be.instanceOf(CodeWhispererStreaming)
        })
    })

    describe('createStreamingClient', () => {
        it('should create a new streaming client with correct configurations', async () => {
            const client = await createStreamingClient(mockedCredentialsProvider)
            expect(client).to.be.instanceOf(CodeWhispererStreaming)
        })
    })

    describe('downloadExportResultArchive', () => {
        it('should handle errors during the download process', async () => {
            // Stub exportResultArchive method to reject with mocked error
            const exportResultArchiveStub = sinon.stub().rejects(new Error('Mocked error'))

            // Mock CodeWhispererStreaming instance
            const mockedCwStreamingClient: any = { exportResultArchive: exportResultArchiveStub }

            const exportId = 'mockedExportId'
            const response = await transformHandler.downloadExportResultArchive(mockedCwStreamingClient, exportId)

            // Assertions
            expect(response.Error).to.exist
            expect(response.Error).to.equal('Mocked error')
        })

        it('should download and extract the export result archive', async () => {
            const exportResultArchiveStub = sinon.stub().resolves({ body: 'Content' })
            const archivePathGenerator = sinon
                .stub(transformHandler, 'archivePathGenerator')
                .returns(Promise.resolve('mockFile.zip'))

            const mockedCwStreamingClient: any = { exportResultArchive: exportResultArchiveStub }
            const exportId = 'mockedExportId'
            const response = await transformHandler.downloadExportResultArchive(mockedCwStreamingClient, exportId)

            // Assertions
            expect(response.PathTosave).to.be.equal('mockFile.zip')
            sinon.assert.calledOnce(archivePathGenerator)
        })
    })
})
