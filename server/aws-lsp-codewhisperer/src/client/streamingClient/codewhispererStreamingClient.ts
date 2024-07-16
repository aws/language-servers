import { CodeWhispererStreaming } from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
const codeWhispererRegion = 'us-east-1'

const codeWhispererEndpoint = 'https://rts.gamma-us-east-1.codewhisperer.ai.aws.dev/'

export class StreamingClient {
    public async getStreamingClient(credentialsProvider: any) {
        return await createStreamingClient(credentialsProvider)
    }
}
export async function createStreamingClient(credentialsProvider: any): Promise<CodeWhispererStreaming> {
    const creds = credentialsProvider.getCredentials('bearer')
    const streamingClient = new CodeWhispererStreaming({
        region: codeWhispererRegion,
        endpoint: codeWhispererEndpoint,
        token: { token: creds.token },
        retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
    })
    return streamingClient
}
