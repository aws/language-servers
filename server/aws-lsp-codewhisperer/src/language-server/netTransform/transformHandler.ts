import path = require('path')
import * as fs from 'fs'
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
import { Workspace } from '@aws/language-server-runtimes/out/features'
import { TransformJob } from 'aws-sdk/clients/sagemaker'
import * as os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { CreateUploadUrlResponse, GetTransformationRequest, StopTransformationRequest } from '../../client/token/codewhispererbearertokenclient'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { getCWStartTransformRequest, getCWStartTransformResponse } from './converter'
import { cleanup, createZip, getSha256 } from './utils'
import fetch = require('node-fetch')

export class TransformHandler {
    private client: CodeWhispererServiceToken
    private workspace: Workspace
    constructor(client: CodeWhispererServiceToken, workspace: Workspace) {
        this.client = client
        this.workspace = workspace
    }

    async startTransformation(userInputrequest: QNetStartTransformRequest): Promise<QNetStartTransformResponse> {
        try {
            const uploadId = await this.preTransformationUploadCode(userInputrequest)
            const request = getCWStartTransformRequest(userInputrequest, uploadId)
            console.log('send request to start transform api: ' + JSON.stringify(request))
            const response = await this.client.codeModernizerStartCodeTransformation(request)
            console.log(JSON.stringify(response))
            return getCWStartTransformResponse(response, uploadId)
        } catch (error) {
            const errorMessage = (error as Error).message ?? 'Error in StartTransformation API call'
            console.log(errorMessage)
            throw new Error(errorMessage)
        }
    }

    async preTransformationUploadCode(userInputrequest: QNetStartTransformRequest): Promise<string> {
        let uploadId = ''
        const randomPath = uuidv4().substring(0, 4)
        const workspacePath = path.join(os.tmpdir(), randomPath)
        try {
            const payloadFilePath = await this.zipCodeAsync(userInputrequest, workspacePath)
            console.log('payload path: ' + payloadFilePath)
            uploadId = await this.uploadPayloadAsync(payloadFilePath)
            console.log('artifact successfully uploaded. upload tracking id: ' + uploadId)
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
            console.log('Error: ', errorMessage)
            throw new Error(errorMessage)
        }
        // Pass along error to callee function

        try {
            await this.uploadArtifactToS3Async(payloadFileName, response)
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in uploadArtifactToS3 call'
            console.log('Error: ', errorMessage)
            throw new Error(errorMessage)
        }
        return response.uploadId
    }

    async zipCodeAsync(request: QNetStartTransformRequest, basePath: string): Promise<string> {
        try {
            return await createZip(request, basePath)
        } catch (e: any) {
            console.log({ cause: e as Error })
        }
        return ''
    }

    async uploadArtifactToS3Async(fileName: string, resp: CreateUploadUrlResponse) {
        const sha256 = getSha256(fileName)
        const headersObj = this.getHeadersObj(sha256, resp.kmsKeyArn)
        try {
            const response = await fetch(resp.uploadUrl, {
                method: 'PUT',
                body: fs.readFileSync(fileName),
                headers: headersObj,
            })

            console.log(`CodeTransform: Status from S3 Upload = ${response.status}`)
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in S3 UploadZip API call'

            console.log({ cause: e as Error })
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
            const stopCodeTransformationRequest = {
                transformationJobId: request.TransformationJobId,
            } as GetTransformationRequest
            const response = await this.client.codeModernizerGetCodeTransformation(stopCodeTransformationRequest)

            return {
                TransformationJob: response.transformationJob,
            } as QNetGetTransformResponse
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in GetTransformation API call'
            console.log('Error: ', errorMessage)

            return {
                TransformationJob: { status: 'FAILED' },
            } as QNetGetTransformResponse
        }

        // const dummy = {
        //     TransformJobName: 'sample',
        //     TransformJobStatus: 'Running',
        // } as TransformJob
        // await new Promise(f => setTimeout(f, 100))
        // return {
        //     TransformationJob: dummy,
        // } as QNetGetTransformResponse
    }
    async getTransformationPlan(request: QNetGetTransformPlanRequest) {
        const getCodeTransformationPlanRequest = {
            transformationJobId: request.TransformationJobId,
        } as GetTransformationRequest
        const response = await this.client.codeModernizerGetCodeTransformationPlan(getCodeTransformationPlanRequest)
        return {
            TransformationPlan: response.transformationPlan,
        } as QNetGetTransformPlanResponse
    }

    async cancelTransformation(request: QNetCancelTransformRequest) {
        try {
            const stopCodeTransformationRequest = {
                transformationJobId: request.TransformationJobId,
            } as StopTransformationRequest
            const response = await this.client.codeModernizerStopCodeTransformation(stopCodeTransformationRequest)

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
            console.log('Error: ', errorMessage)
            return {
                TransformationJobStatus: CancellationJobStatus.FAILED_TO_CANCEL,
            } as QNetCancelTransformResponse
        }

        // await new Promise(f => setTimeout(f, 100))
        // return {
        //     TransformationJobStatus: 2,
        // } as QNetCancelTransformResponse
    }

    async sleep(duration = 0): Promise<void> {
        return new Promise(r => setTimeout(r, Math.max(duration, 0)))
    }

    async pollTransformation(request: QNetGetTransformRequest) {
        let status = ''
        let timer = 0

        while (status != 'Timed_out' && status != 'Failed') {
            try {
                const apiStartTime = Date.now()
                //var response = (await this.client.codeModernizerGetCodeTransformation(request)) as QNetGetTransformResponse
                const dummy = {
                    TransformJobName: 'sample',
                    TransformJobStatus: 'In_progress',
                } as TransformJob
                await new Promise(f => setTimeout(f, 100))
                const response = {
                    TransformationJob: dummy,
                } as QNetGetTransformResponse
                //delete above staging

                status = response.TransformationJob.status!
                await this.sleep(10 * 1000)
                timer += 10

                //delete below lines
                if (timer > 4000) {
                    status = 'COMPLETED'
                    break
                }
                //

                if (timer > 24 * 3600 * 1000) {
                    status = 'Timed_out'
                    break
                }
            } catch (e: any) {
                const errorMessage = (e as Error).message ?? 'Error in GetTransformation API call'
                console.log('CodeTransformation: GetTransformation error = ', errorMessage)
                status = 'Failed'
                break
            }
        }
        const dummy = {
            TransformJobName: 'sample',
            TransformJobStatus: status,
        } as TransformJob
        await new Promise(f => setTimeout(f, 100))
        return {
            TransformationJob: dummy,
        } as QNetGetTransformResponse
    }
}
