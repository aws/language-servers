import { CodeWhispererStreaming, CodeWhispererStreamingClientConfig } from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { readFileSync } from 'fs'
import { AWS_Q_REGION, AWS_Q_ENDPOINT_URL } from '../../constants'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { HttpsProxyAgent } from 'hpagent'

export class StreamingClient {
    public async getStreamingClient(credentialsProvider: any, config?: CodeWhispererStreamingClientConfig) {
        return await createStreamingClient(credentialsProvider, config)
    }
}
export async function createStreamingClient(
    credentialsProvider: any,
    config?: CodeWhispererStreamingClientConfig
): Promise<CodeWhispererStreaming> {
    const creds = credentialsProvider.getCredentials('bearer')

    let clientOptions
    // short term solution to fix webworker bundling, broken due to this node.js specific logic in here
    const isNodeJS: boolean = typeof process !== 'undefined' && process.release && process.release.name === 'node'
    const proxyUrl = isNodeJS ? (process.env.HTTPS_PROXY ?? process.env.https_proxy) : undefined
    const certs = isNodeJS
        ? process.env.AWS_CA_BUNDLE
            ? [readFileSync(process.env.AWS_CA_BUNDLE)]
            : undefined
        : undefined

    if (proxyUrl) {
        const agent = new HttpsProxyAgent({
            proxy: proxyUrl,
            ca: certs,
        })

        clientOptions = {
            requestHandler: new NodeHttpHandler({
                httpAgent: agent,
                httpsAgent: agent,
            }),
        }
    }

    const streamingClient = new CodeWhispererStreaming({
        region: AWS_Q_REGION,
        endpoint: AWS_Q_ENDPOINT_URL,
        token: { token: creds.token },
        retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
        requestHandler: clientOptions?.requestHandler,
        ...config,
    })
    return streamingClient
}
