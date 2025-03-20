import { CodeWhispererStreaming, CodeWhispererStreamingClientConfig } from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { SDKInitializator } from '@aws/language-server-runtimes/server-interface'

export class StreamingClient {
    public async getStreamingClient(
        credentialsProvider: any,
        codeWhispererRegion: string,
        codeWhispererEndpoint: string,
        sdkInitializator: SDKInitializator,
        config?: CodeWhispererStreamingClientConfig
    ) {
        return await createStreamingClient(
            credentialsProvider,
            codeWhispererRegion,
            codeWhispererEndpoint,
            sdkInitializator,
            config
        )
    }
}
export async function createStreamingClient(
    credentialsProvider: any,
    codeWhispererRegion: string,
    codeWhispererEndpoint: string,
    sdkInitializator: SDKInitializator,
    config?: CodeWhispererStreamingClientConfig
): Promise<CodeWhispererStreaming> {
    const creds = credentialsProvider.getCredentials('bearer')

    const streamingClient = sdkInitializator(CodeWhispererStreaming, {
        region: codeWhispererRegion,
        endpoint: codeWhispererEndpoint,
        token: { token: creds.token },
        retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
        ...config,
    })
    return streamingClient
}
