import { Workspace, Logging } from '@aws/language-server-runtimes/out/features'
import path = require('path')
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import {
    CreateUploadUrlResponse,
    GetTransformationRequest,
    StopTransformationRequest,
} from '../../client/token/codewhispererbearertokenclient'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { getCWStartTransformRequest, getCWStartTransformResponse } from './converter'
import {
    CancellationJobStatus,
    QNetCancelTransformRequest,
    QNetCancelTransformResponse,
    QNetGetTransformPlanRequest,
    QNetGetTransformPlanResponse,
    QNetGetTransformRequest,
    QNetGetTransformResponse,
    QNetStartTransformRequest,
    QNetStartTransformResponse,
} from './models'
import { cleanup, createZip, getSha256 } from './utils'
import got from 'got'

export class TransformHandler {
    private client: CodeWhispererServiceToken
    private workspace: Workspace
    private logging: Logging
    constructor(client: CodeWhispererServiceToken, workspace: Workspace, logging: Logging) {
        this.client = client
        this.workspace = workspace
        this.logging = logging
    }

    async startTransformation(userInputrequest: QNetStartTransformRequest): Promise<QNetStartTransformResponse> {
        try {
            const uploadId = await this.preTransformationUploadCode(userInputrequest)
            const request = getCWStartTransformRequest(userInputrequest, uploadId)
            this.logging.log('send request to start transform api: ' + JSON.stringify(request))
            const response = await this.client.codeModernizerStartCodeTransformation(request)
            this.logging.log('response start transform api: ' + JSON.stringify(response))
            return getCWStartTransformResponse(response, uploadId)
        } catch (error) {
            const errorMessage = (error as Error).message ?? 'Error in StartTransformation API call'
            this.logging.log(errorMessage)
            throw new Error(errorMessage)
        }
    }

    async preTransformationUploadCode(userInputrequest: QNetStartTransformRequest): Promise<string> {
        let uploadId = ''
        const randomPath = uuidv4().substring(0, 4)
        const workspacePath = path.join(this.workspace.fs.getTempDirPath(), randomPath)
        try {
            const payloadFilePath = await this.zipCodeAsync(userInputrequest, workspacePath)
            this.logging.log('payload path: ' + payloadFilePath)
            uploadId = await this.uploadPayloadAsync(payloadFilePath)
            this.logging.log('artifact successfully uploaded. upload tracking id: ' + uploadId)
        } catch (error) {
            const errorMessage = (error as Error).message ?? 'Failed to upload zip file'
            throw new Error(errorMessage)
        } finally {
            cleanup(workspacePath)
        }
        return uploadId
    }

    async uploadPayloadAsync(payloadFileName: string): Promise<string> {
        const sha256 = getSha256(payloadFileName)
        let response: CreateUploadUrlResponse
        try {
            const apiStartTime = Date.now()
            response = await this.client.codeModernizerCreateUploadUrl({
                contentChecksum: sha256,
                contentChecksumType: 'SHA_256',
                uploadIntent: 'TRANSFORMATION',
            })
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in CreateUploadUrl API call'
            this.logging.log('Error when creating Upload url: ' + errorMessage)
            throw new Error(errorMessage)
        }

        try {
            await this.uploadArtifactToS3Async(payloadFileName, response)
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in uploadArtifactToS3 call'
            this.logging.log('Error when calling uploadArtifactToS3Async: ' + errorMessage)
            throw new Error(errorMessage)
        }
        return response.uploadId
    }

    async zipCodeAsync(request: QNetStartTransformRequest, basePath: string): Promise<string> {
        try {
            return await createZip(request, basePath)
        } catch (e: any) {
            this.logging.log('cause:' + e)
        }
        return ''
    }

    async uploadArtifactToS3Async(fileName: string, resp: CreateUploadUrlResponse) {
        const sha256 = getSha256(fileName)
        const headersObj = this.getHeadersObj(sha256, resp.kmsKeyArn)
        try {
            const response = await got.put(resp.uploadUrl, {
                body: fs.readFileSync(fileName),
                headers: headersObj,
                })

            this.logging.log(`CodeTransform: Response from S3 Upload = ${response}`)
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in S3 UploadZip API call'

            this.logging.log(errorMessage)
        }
    }

    getHeadersObj(sha256: string, kmsKeyArn: string | undefined) {
        let headersObj = {}
        if (kmsKeyArn === undefined || kmsKeyArn.length === 0) {
            headersObj = {
                'x-amz-checksum-sha256': sha256,
                'Content-Type': 'application/zip',
            }
        } else {
            headersObj = {
                'x-amz-checksum-sha256': sha256,
                'Content-Type': 'application/zip',
                'x-amz-server-side-encryption': 'aws:kms',
                'x-amz-server-side-encryption-aws-kms-key-id': kmsKeyArn,
            }
        }
        return headersObj
    }
    async getTransformation(request: QNetGetTransformRequest) {
        try {
            const getCodeTransformationRequest = {
                transformationJobId: request.TransformationJobId,
            } as GetTransformationRequest
            this.logging.log('send request to get transform api: ' + JSON.stringify(getCodeTransformationRequest))
            const response = await this.client.codeModernizerGetCodeTransformation(getCodeTransformationRequest)
            this.logging.log('response received from get transform api: ' + JSON.stringify(response))
            return {
                TransformationJob: response.transformationJob,
            } as QNetGetTransformResponse
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in GetTransformation API call'
            this.logging.log('Error: ' + errorMessage)

            return {
                TransformationJob: { status: 'FAILED' },
            } as QNetGetTransformResponse
        }
    }
    async getTransformationPlan(request: QNetGetTransformPlanRequest) {
        const getCodeTransformationPlanRequest = {
            transformationJobId: request.TransformationJobId,
        } as GetTransformationRequest
        this.logging.log('send request to get transform plan api: ' + JSON.stringify(getCodeTransformationPlanRequest))
        const response = await this.client.codeModernizerGetCodeTransformationPlan(getCodeTransformationPlanRequest)
        this.logging.log('received response from get transform plan api: ' + JSON.stringify(response))
        return {
            TransformationPlan: response.transformationPlan,
        } as QNetGetTransformPlanResponse
    }

    async cancelTransformation(request: QNetCancelTransformRequest) {
        try {
            const stopCodeTransformationRequest = {
                transformationJobId: request.TransformationJobId,
            } as StopTransformationRequest
            this.logging.log(
                'send request to cancel transform plan api: ' + JSON.stringify(stopCodeTransformationRequest)
            )
            const response = await this.client.codeModernizerStopCodeTransformation(stopCodeTransformationRequest)
            this.logging.log('received response from cancel transform plan api: ' + JSON.stringify(response))
            let status: CancellationJobStatus
            switch (response.transformationStatus) {
                case 'STOPPED':
                    status = CancellationJobStatus.SUCCESSFULLY_CANCELLED
                    break
                default:
                    status = CancellationJobStatus.FAILED_TO_CANCEL
                    break
            }
            return {
                TransformationJobStatus: status,
            } as QNetCancelTransformResponse
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in CancelTransformation API call'
            this.logging.log('Error: ' + errorMessage)
            return {
                TransformationJobStatus: CancellationJobStatus.FAILED_TO_CANCEL,
            } as QNetCancelTransformResponse
        }
    }

    async sleep(duration = 0): Promise<void> {
        return new Promise(r => setTimeout(r, Math.max(duration, 0)))
    }

    async pollTransformation(request: QNetGetTransformRequest) {
        let timer = 0

        const getCodeTransformationRequest = {
            transformationJobId: request.TransformationJobId,
        } as GetTransformationRequest
        this.logging.log('poll : send request to get transform  api: ' + JSON.stringify(getCodeTransformationRequest))
        let response = await this.client.codeModernizerGetCodeTransformation(getCodeTransformationRequest)
        this.logging.log('poll : received response from get transform  api: ' + JSON.stringify(response))
        let status = response.transformationJob.status

        while (status != 'Timed_out' && status != 'FAILED') {
            try {
                const apiStartTime = Date.now()

                const getCodeTransformationRequest = {
                    transformationJobId: request.TransformationJobId,
                } as GetTransformationRequest
                this.logging.log(
                    'poll : send request to get transform  api: ' + JSON.stringify(getCodeTransformationRequest)
                )
                response = await this.client.codeModernizerGetCodeTransformation(getCodeTransformationRequest)
                this.logging.log('poll : received response from get transform  api: ' + JSON.stringify(response))
                this.logging.log('poll : job status here : ' + response.transformationJob.status)

                status = response.transformationJob.status!
                await this.sleep(10 * 1000)
                timer += 10
                this.logging.log('current polling timer ' + timer)

                //adding this block only for staging
                if (timer >= 20) {
                    response.transformationJob.status = 'COMPLETED'
                    this.logging.log('returning completed response')
                    break
                }
                //delete above when API is actually implemented

                if (timer > 24 * 3600 * 1000) {
                    status = 'Timed_out'
                    break
                }
            } catch (e: any) {
                const errorMessage = (e as Error).message ?? 'Error in GetTransformation API call'
                this.logging.log('CodeTransformation: GetTransformation error = ' + errorMessage)
                status = 'FAILED'
                break
            }
        }
        this.logging.log('poll : returning response : ' + JSON.stringify(response))
        return response
    }
}
