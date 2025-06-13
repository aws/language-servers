import { CodeWhispererStreaming, CodeWhispererStreamingClientConfig } from '@aws/codewhisperer-streaming-client'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { SDKInitializator, Logging } from '@aws/language-server-runtimes/server-interface'

// TODO: refactor and combine with language-server/streamingClientService.ts when no longer in use
export class StreamingClient {
    public async getStreamingClient(
        credentialsProvider: any,
        codeWhispererRegion: string,
        codeWhispererEndpoint: string,
        sdkInitializator: SDKInitializator,
        logging: Logging,
        config?: CodeWhispererStreamingClientConfig
    ) {
        return await createStreamingClient(
            credentialsProvider,
            codeWhispererRegion,
            codeWhispererEndpoint,
            sdkInitializator,
            logging,
            config
        )
    }
}
export async function createStreamingClient(
    credentialsProvider: any,
    codeWhispererRegion: string,
    codeWhispererEndpoint: string,
    sdkInitializator: SDKInitializator,
    logging: Logging,
    config?: CodeWhispererStreamingClientConfig
): Promise<CodeWhispererStreaming> {
    const creds = credentialsProvider.getCredentials('bearer')

    logging.log(
        `Passing client for class CodeWhispererStreaming to sdkInitializator (v3) for additional setup (e.g. proxy)`
    )
    const streamingClient = sdkInitializator(CodeWhispererStreaming, {
        region: codeWhispererRegion,
        endpoint: codeWhispererEndpoint,
        token: { token: creds.token },
        retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
        ...config,
    })
    return streamingClient
}
