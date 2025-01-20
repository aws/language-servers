import { QDeveloperStreaming, QDeveloperStreamingClientConfig } from '@amzn/qdeveloper-streaming-client'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { readFileSync } from 'fs'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { HttpsProxyAgent } from 'hpagent'

export class StreamingClient {
    public async getStreamingClient(
        credentialsProvider: any,
        codeWhispererRegion: string,
        codeWhispererEndpoint: string,
        config?: QDeveloperStreamingClientConfig
    ) {
        return await createStreamingClient(credentialsProvider, codeWhispererRegion, codeWhispererEndpoint, config)
    }
}
export async function createStreamingClient(
    credentialsProvider: any,
    codeWhispererRegion: string,
    codeWhispererEndpoint: string,
    config?: QDeveloperStreamingClientConfig
): Promise<QDeveloperStreaming> {
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

    const streamingClient = new QDeveloperStreaming({
        region: codeWhispererRegion,
        endpoint: codeWhispererEndpoint,
        token: { token: creds.token },
        retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
        requestHandler: clientOptions?.requestHandler,
        ...config,
    })
    return streamingClient
}
