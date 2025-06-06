import {
    CodeWhispererStreaming,
    GenerateAssistantResponseCommandInput as GenerateAssistantResponseCommandInputCodeWhispererStreaming,
    GenerateAssistantResponseCommandOutput as GenerateAssistantResponseCommandOutputCodeWhispererStreaming,
    SendMessageCommandInput as SendMessageCommandInputCodeWhispererStreaming,
    SendMessageCommandOutput as SendMessageCommandOutputCodeWhispererStreaming,
    ExportResultArchiveCommandInput as ExportResultArchiveCommandInputCodeWhispererStreaming,
    ExportResultArchiveCommandOutput as ExportResultArchiveCommandOutputCodeWhispererStreaming,
} from '@aws/codewhisperer-streaming-client'
import {
    QDeveloperStreaming,
    SendMessageCommandInput as SendMessageCommandInputQDeveloperStreaming,
    SendMessageCommandOutput as SendMessageCommandOutputQDeveloperStreaming,
} from '@amzn/amazon-q-developer-streaming-client'
import { CredentialsProvider, SDKInitializator, Logging } from '@aws/language-server-runtimes/server-interface'
import { getBearerTokenFromProvider } from './utils'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { CredentialProviderChain, Credentials } from 'aws-sdk'
import { clientTimeoutMs } from '../language-server/agenticChat/constants'

export type SendMessageCommandInput =
    | SendMessageCommandInputCodeWhispererStreaming
    | SendMessageCommandInputQDeveloperStreaming
export type SendMessageCommandOutput =
    | SendMessageCommandOutputCodeWhispererStreaming
    | SendMessageCommandOutputQDeveloperStreaming

export abstract class StreamingClientServiceBase {
    protected readonly region
    protected readonly endpoint

    inflightRequests: Set<AbortController> = new Set()

    abstract client: CodeWhispererStreaming | QDeveloperStreaming

    constructor(region: string, endpoint: string) {
        this.region = region
        this.endpoint = endpoint
    }

    abstract sendMessage(
        request: SendMessageCommandInput,
        abortController?: AbortController
    ): Promise<SendMessageCommandOutput>

    public abortInflightRequests() {
        this.inflightRequests.forEach(abortController => {
            abortController.abort()
        })
        this.inflightRequests.clear()
    }
}

export class StreamingClientServiceToken extends StreamingClientServiceBase {
    client: CodeWhispererStreaming
    public profileArn?: string
    constructor(
        credentialsProvider: CredentialsProvider,
        sdkInitializator: SDKInitializator,
        logging: Logging,
        region: string,
        endpoint: string,
        customUserAgent: string
    ) {
        super(region, endpoint)
        const tokenProvider = async () => {
            const token = getBearerTokenFromProvider(credentialsProvider)
            // without setting expiration, the tokenProvider will only be called once
            return { token, expiration: new Date() }
        }

        logging.log(
            `Passing client for class CodeWhispererStreaming to sdkInitializator (v3) for additional setup (e.g. proxy)`
        )
        this.client = sdkInitializator(CodeWhispererStreaming, {
            region,
            endpoint,
            token: tokenProvider,
            retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
            requestHandler: {
                keepAlive: true,
                requestTimeout: clientTimeoutMs,
            },
            customUserAgent: customUserAgent,
        })
    }

    public async sendMessage(
        request: SendMessageCommandInputCodeWhispererStreaming,
        abortController?: AbortController
    ): Promise<SendMessageCommandOutputCodeWhispererStreaming> {
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

    public async generateAssistantResponse(
        request: GenerateAssistantResponseCommandInputCodeWhispererStreaming,
        abortController?: AbortController
    ): Promise<GenerateAssistantResponseCommandOutputCodeWhispererStreaming> {
        const controller: AbortController = abortController ?? new AbortController()

        this.inflightRequests.add(controller)

        const response = await this.client.generateAssistantResponse(
            { ...request, profileArn: this.profileArn },
            {
                abortSignal: controller.signal,
            }
        )

        this.inflightRequests.delete(controller)

        return response
    }

    public async exportResultArchive(
        request: ExportResultArchiveCommandInputCodeWhispererStreaming,
        abortController?: AbortController
    ): Promise<ExportResultArchiveCommandOutputCodeWhispererStreaming> {
        const controller: AbortController = abortController ?? new AbortController()
        this.inflightRequests.add(controller)
        const response = await this.client.exportResultArchive(
            this.profileArn ? { ...request, profileArn: this.profileArn } : request
        )
        this.inflightRequests.delete(controller)
        return response
    }
}

export class StreamingClientServiceIAM extends StreamingClientServiceBase {
    client: QDeveloperStreaming
    constructor(
        credentialsProvider: CredentialsProvider,
        sdkInitializator: SDKInitializator,
        logging: Logging,
        region: string,
        endpoint: string
    ) {
        super(region, endpoint)

        logging.log(
            `Passing client for class QDeveloperStreaming to sdkInitializator (v3) for additional setup (e.g. proxy)`
        )

        this.client = sdkInitializator(QDeveloperStreaming, {
            region: region,
            endpoint: endpoint,
            credentialProvider: new CredentialProviderChain([
                () => credentialsProvider.getCredentials('iam') as Credentials,
            ]),
            retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
        })
    }

    public async sendMessage(
        request: SendMessageCommandInputQDeveloperStreaming,
        abortController?: AbortController
    ): Promise<SendMessageCommandOutputQDeveloperStreaming> {
        const controller: AbortController = abortController ?? new AbortController()

        this.inflightRequests.add(controller)

        const response = await this.client.sendMessage(request, {
            abortSignal: controller.signal,
        })

        this.inflightRequests.delete(controller)

        return response
    }
}
