import { CodeWhispererRuntimeClient, CodeWhispererRuntimeClientConfig } from '@amzn/codewhisperer-runtime'
import { SDKInitializator, Logging } from '@aws/language-server-runtimes/server-interface'
import { HttpResponse } from '@smithy/protocol-http'

export interface CodeWhispererTokenClientConfigurationOptions extends CodeWhispererRuntimeClientConfig {
    // Add any custom options if needed
}

export function createCodeWhispererTokenClient(
    options: CodeWhispererTokenClientConfigurationOptions,
    sdkInitializator: SDKInitializator,
    logging: Logging
): CodeWhispererRuntimeClient {
    logging.log(
        `Passing client for class CodeWhispererRuntimeClient to sdkInitializator (v3) for additional setup (e.g. proxy)`
    )

    const client = sdkInitializator(CodeWhispererRuntimeClient, {
        ...options,
    })

    // Add middleware to capture HTTP headers
    client.middlewareStack.add(
        next => async args => {
            const result = await next(args)

            // Store headers on the response metadata
            if (result.response) {
                const httpResponse = result.response as HttpResponse
                if (httpResponse.headers) {
                    // Extend metadata to include headers
                    ;(result.output as any).$httpHeaders = httpResponse.headers
                }
            }

            return result
        },
        {
            step: 'deserialize',
            name: 'captureHeaders',
            priority: 'low',
        }
    )

    return client
}

// Export the V3 client type for compatibility
export type CodeWhispererTokenClient = CodeWhispererRuntimeClient
