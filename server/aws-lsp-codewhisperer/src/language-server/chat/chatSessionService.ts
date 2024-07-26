import {
    CodeWhispererStreaming,
    CodeWhispererStreamingClientConfig,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { getBearerTokenFromProvider } from '../utils'

export type ChatSessionServiceConfig = CodeWhispererStreamingClientConfig
export type Dispose = () => void
export class ChatSessionService {
    public shareCodeWhispererContentWithAWS = false
    readonly #codeWhispererRegion = 'us-east-1'
    readonly #codeWhispererEndpoint = 'https://codewhisperer.us-east-1.amazonaws.com/'
    #abortController?: AbortController
    #credentialsProvider: CredentialsProvider
    #config?: CodeWhispererStreamingClientConfig
    #sessionId?: string
    #disposables: Dispose[] = []

    public get sessionId(): string | undefined {
        return this.#sessionId
    }

    public set sessionId(value: string | undefined) {
        this.#sessionId = value
    }

    constructor(credentialsProvider: CredentialsProvider, config?: CodeWhispererStreamingClientConfig) {
        this.#credentialsProvider = credentialsProvider
        this.#config = config
    }

    public async generateAssistantResponse(
        request: GenerateAssistantResponseCommandInput
    ): Promise<GenerateAssistantResponseCommandOutput> {
        this.#abortController = new AbortController()

        if (this.#sessionId && request.conversationState) {
            request.conversationState.conversationId = this.#sessionId
        }

        const client = new CodeWhispererStreaming({
            region: this.#codeWhispererRegion,
            endpoint: this.#codeWhispererEndpoint,
            token: () => Promise.resolve({ token: getBearerTokenFromProvider(this.#credentialsProvider) }),
            retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
            customUserAgent: '%Amazon-Q-For-LanguageServers%',
            ...this.#config,
        })

        const response = await client.generateAssistantResponse(request, {
            abortSignal: this.#abortController?.signal,
        })

        this.#sessionId = response.conversationId

        return response
    }

    public registerDisposable(dispose: Dispose): void {
        this.#disposables.push(dispose)
    }

    public removeDisposable(dispose: Dispose): void {
        const index = this.#disposables.indexOf(dispose)
        if (index > -1) {
            this.#disposables.splice(index, 1)
        }
    }

    public clear(): void {
        this.#abortController?.abort()
        this.#disposables.forEach(dipose => dipose())
        this.#sessionId = undefined
    }

    public dispose(): void {
        this.#abortController?.abort()
        this.#disposables.forEach(dipose => dipose())
    }

    public abortRequest(): void {
        this.#abortController?.abort()
    }
}
