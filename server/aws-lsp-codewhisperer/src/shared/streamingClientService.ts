import {
    CodeWhispererStreaming,
    SendMessageCommandInput,
    SendMessageCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { CredentialsProvider, SDKInitializator } from '@aws/language-server-runtimes/server-interface'
import { getBearerTokenFromProvider } from './utils'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'

export class StreamingClientService {
    client: CodeWhispererStreaming
    private inflightRequests = new Set<AbortController>()
    public profileArn?: string

    constructor(
        credentialsProvider: CredentialsProvider,
        sdkInitializator: SDKInitializator,
        region: string,
        endpoint: string,
        customUserAgent: string
    ) {
        const tokenProvider = async () => {
            const token = getBearerTokenFromProvider(credentialsProvider)
            // without setting expiration, the tokenProvider will only be called once
            return { token, expiration: new Date() }
        }

        this.client = sdkInitializator(CodeWhispererStreaming, {
            region,
            endpoint,
            token: tokenProvider,
            retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
            customUserAgent: customUserAgent,
        })
    }

    public async sendMessage(
        request: SendMessageCommandInput,
        abortController?: AbortController
    ): Promise<SendMessageCommandOutput> {
        const controller: AbortController = abortController ?? new AbortController()

        this.inflightRequests.add(controller)

        const response = await this.client.sendMessage(
            { ...request, profileArn: this.profileArn },
            {
                abortSignal: controller.signal,
            }
        )

        this.inflightRequests.delete(controller)

        return response
    }

    public abortInflightRequests() {
        this.inflightRequests.forEach(abortController => {
            abortController.abort()
        })
        this.inflightRequests.clear()
    }
}
