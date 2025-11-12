import { CodeWhispererRuntimeClient, CodeWhispererRuntimeClientConfig } from '@amzn/codewhisperer-runtime'
import { SDKInitializator, Logging, CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { HttpResponse, HttpRequest } from '@smithy/types'

export interface CodeWhispererTokenClientConfigurationOptions extends CodeWhispererRuntimeClientConfig {
    // Add any custom options if needed
}

export function createCodeWhispererTokenClient(
    options: CodeWhispererTokenClientConfigurationOptions,
    sdkInitializator: SDKInitializator,
    logging: Logging,
    credentialsProvider: CredentialsProvider,
    shareCodeWhispererContentWithAWS: () => boolean
): CodeWhispererRuntimeClient {
    logging.log(
        `Passing client for class CodeWhispererRuntimeClient to sdkInitializator (v3) for additional setup (e.g. proxy)`
    )

    const client = sdkInitializator(CodeWhispererRuntimeClient, {
        ...options,
    })

    // Add middleware for custom headers
    client.middlewareStack.add(
        next => async args => {
            const request = args.request as HttpRequest
            request.headers['x-amzn-codewhisperer-optout'] = `${!shareCodeWhispererContentWithAWS}`

            if (credentialsProvider.getConnectionType() === 'external_idp') {
                request.headers['TokenType'] = 'EXTERNAL_IDP'
            }

            return next(args)
        },
        { step: 'build', priority: 'high' }
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
export type CodeWhispererTokenClient = CodeWhispererRuntimeClient
