/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { AWSError } from 'aws-sdk'
import { Request, Response } from 'aws-sdk/lib/core'
import { RequestExtras } from '../client/token/codewhisperer'

/**
 * Logs request and response information to a file for debugging purposes
 *
 * @param req The AWS request object
 * @param resp The AWS response object (can be null if there was an error)
 * @param error Any error that occurred during the request
 * @param reqId The request ID
 * @param endpoint The API endpoint that was called
 * @param latency The request latency in milliseconds
 */
export async function logRequestResponseToFile(
    req: Request<any, AWSError> & RequestExtras,
    resp: Response<any, AWSError> | null,
    error: string | AWSError,
    reqId: string,
    endpoint: string,
    latency?: number
) {
    // Validate required inputs
    if (!req || !reqId || !endpoint) {
        console.error('Missing required parameters for logging')
        return
    }

    console.log('Starting request/response logging')
    console.log('Request ID:', reqId)
    console.log('Endpoint:', endpoint)

    try {
        const placeholder = 'placeholder line\n'.repeat(10)

        const reqResp = {
            timestamp: new Date().toISOString(),
            request: req.httpRequest.body,
            response: resp?.httpResponse?.body?.toString() || 'No response body',
            endpoint: endpoint,
            error: error?.toString() || 'No error',
            requestId: reqId,
            responseCode: resp?.httpResponse?.statusCode || 0,
            latency: latency || 0,
        }

        // Add retry logic with exponential backoff
        const maxRetries = 3
        let retryCount = 0

        while (retryCount < maxRetries) {
            try {
                console.log(`Attempting to write to file (attempt ${retryCount + 1}/${maxRetries})`)
                // eslint-disable-next-line import/no-nodejs-modules
                const fs = require('fs').promises
                await fs.appendFile('/tmp/request_log.jsonl', JSON.stringify(reqResp) + '\n')
                console.log('Successfully wrote to log file')
                break
            } catch (writeErr) {
                retryCount++
                console.error(`Failed write attempt ${retryCount}:`, writeErr)
                if (retryCount === maxRetries) {
                    throw writeErr
                }
                const backoffTime = Math.pow(2, retryCount) * 100
                console.log(`Retrying in ${backoffTime}ms`)
                await new Promise(resolve => setTimeout(resolve, backoffTime))
            }
        }
    } catch (err) {
        console.error('Failed to log request/response:', err)
        // Don't throw to avoid impacting main flow
        // Just log the error and continue
    }
}
