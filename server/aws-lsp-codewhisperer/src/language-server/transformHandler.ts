import * as crypto from 'crypto'
import * as fs from 'fs'
import fetch from 'node-fetch'
import * as codeWhisperer from '../client/token/codewhisperer'
import { CreateUploadUrlResponse } from '../client/token/codewhispereruserclient'
import { CodeWhispererServerToken } from './codeWhispererServer'
export const contentChecksumType = 'SHA_256'
const uploadIntent = 'TRANSFORMATION'
export function getSha256(fileName: string) {
    const hasher = crypto.createHash('sha256')
    hasher.update(fs.readFileSync(fileName))
    return hasher.digest('base64')
}

export async function uploadPayload(payloadFileName: string) {
    const sha256 = getSha256(payloadFileName)
    let response = undefined
    try {
        const apiStartTime = Date.now()
        response = undefined
        //   telemetry.codeTransform_logApiLatency.emit({
        //     codeTransformApiNames: 'CreateUploadUrl',
        //     codeTransformSessionId: codeTransformTelemetryState.getSessionId(),
        //     codeTransformRunTimeLatency: calculateTotalLatency(apiStartTime),
        //     codeTransformUploadId: response.uploadId,
        //     codeTransformRequestId: response.$response.requestId,
        //     result: MetadataResult.Pass,
        //   })
    } catch (e: any) {
        const errorMessage = (e as Error).message ?? 'Error in CreateUploadUrl API call'
        // getLogger().error('CodeTransform: CreateUploadUrl error: = ', errorMessage)
        // telemetry.codeTransform_logApiError.emit({
        //   codeTransformApiNames: 'CreateUploadUrl',
        //     codeTransformSessionId: codeTransformTelemetryState.getSessionId(),
        //     codeTransformApiErrorMessage: errorMessage,
        //     codeTransformRequestId: e.requestId ?? '',
        //     result: MetadataResult.Fail,
        //     reason: 'CreateUploadUrlFailed',
        //   })
        // }
        try {
            // await uploadArtifactToS3(payloadFileName, response)
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in uploadArtifactToS3 call'
        }
        return 'response.uploadId'
    }

    async function uploadArtifactToS3(fileName: string, resp: CreateUploadUrlResponse) {
        const sha256 = getSha256(fileName)
        const headersObj = getHeadersObj(sha256, resp.kmsKeyArn)
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

    function getHeadersObj(sha256: string, kmsKeyArn: string | undefined) {
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
}
