import { CodeWhispererClient, CodeWhispererClientConfig } from '@amzn/codewhisperer'
import { SDKInitializator, Logging } from '@aws/language-server-runtimes/server-interface'
import { HttpResponse } from '@smithy/types'

export type CodeWhispererSigv4ClientConfigurationOptions = CodeWhispererClientConfig

export function createCodeWhispererSigv4Client(
    options: CodeWhispererClientConfig,
    sdkInitializator: SDKInitializator,
    logging: Logging,
    shareCodeWhispererContentWithAWS: boolean = false
): CodeWhispererClient {
    logging.log(
        `Passing client for class CodeWhispererClient to sdkInitializator (v3) for additional setup (e.g. proxy)`
    )

    const client = sdkInitializator(CodeWhispererClient, {
        ...options,
    })

    // Add middleware to set opt-out header
    client.middlewareStack.add(
        next => async args => {
            if (
                args.request &&
                typeof args.request === 'object' &&
                args.request !== null &&
                'headers' in args.request
            ) {
                ;(args.request as any).headers['x-amzn-codewhisperer-optout'] = `${!shareCodeWhispererContentWithAWS}`
            }
            return next(args)
        },
        {
            step: 'build',
            name: 'addOptOutHeader',
            priority: 'high',
        }
    )

    // Add middleware to capture HTTP headers
    client.middlewareStack.add(
        next => async args => {
            const result = await next(args)

            // Store headers on the response metadata
            if (result.response) {
                const httpResponse = result.response as HttpResponse
                if (httpResponse.headers && result.output?.$metadata) {
                    // Extend metadata to include headers
                    ;(result.output.$metadata as any).httpHeaders = httpResponse.headers
                }
            }

            return result
        },
        {
            step: 'deserialize',
            name: 'captureHeaders',
            priority: 'high',
        }
    )

    return client
}

// Export the V3 client type for compatibility
export type CodeWhispererSigv4Client = CodeWhispererClient
