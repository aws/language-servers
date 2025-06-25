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
import {
    CredentialsProvider,
    SDKInitializator,
    Logging,
    CredentialsType,
    BearerCredentials,
} from '@aws/language-server-runtimes/server-interface'
import { getBearerTokenFromProvider, isUsageLimitError } from './utils'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { CredentialProviderChain, Credentials } from 'aws-sdk'
import { clientTimeoutMs } from '../language-server/agenticChat/constants'
import { AmazonQUsageLimitError } from './amazonQServiceManager/errors'
import { TokenIdentityProvider } from '@smithy/types'

export type SendMessageCommandInput =
    | SendMessageCommandInputCodeWhispererStreaming
    | SendMessageCommandInputQDeveloperStreaming
export type SendMessageCommandOutput =
    | SendMessageCommandOutputCodeWhispererStreaming
    | SendMessageCommandOutputQDeveloperStreaming

type StreamingClient = CodeWhispererStreaming | QDeveloperStreaming

export abstract class StreamingClientServiceBase {
    protected readonly region
    protected readonly endpoint

    inflightRequests: Set<AbortController> = new Set()

    abstract client: StreamingClient

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
    client: StreamingClient
    public profileArn?: string
    constructor(
        private credentialsProvider: CredentialsProvider,
        sdkInitializator: SDKInitializator,
        logging: Logging,
        region: string,
        endpoint: string,
        customUserAgent?: string
    ) {
        super(region, endpoint)

        logging.log(
            `Passing client for class CodeWhispererStreaming to sdkInitializator (v3) for additional setup (e.g. proxy)`
        )

        if (credentialsProvider.getCredentialsType() === 'bearer') {
            const tokenProvider = async () => {
                const creds = credentialsProvider.getCredentials() as BearerCredentials
                const token = creds.token
                // without setting expiration, the tokenProvider will only be called once
                return { token, expiration: new Date() }
            }
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
            }) as CodeWhispererStreaming
        } else if (credentialsProvider.getCredentialsType() === 'iam') {
            this.client = sdkInitializator(QDeveloperStreaming, {
                region: region,
                endpoint: endpoint,
                credentialProvider: new CredentialProviderChain([
                    () => credentialsProvider.getCredentials() as Credentials,
                ]),
                retryStrategy: new ConfiguredRetryStrategy(0, (attempt: number) => 500 + attempt ** 10),
            }) as QDeveloperStreaming
        } else {
            throw new Error('invalid credentialsType in constructor')
        }
    }

    getConfigToken(): TokenIdentityProvider | undefined {
        if (this.getCredentialsType() === 'bearer') {
            const client = this.client as CodeWhispererStreaming
            return client.config.token
        }
        return undefined // or throw an error if this should never happen
    }

    getCredentialsType(): CredentialsType {
        return this.credentialsProvider.getCredentialsType()
    }

    public async sendMessage(
        request: SendMessageCommandInput,
        abortController?: AbortController
    ): Promise<SendMessageCommandOutput> {
        const controller: AbortController = abortController ?? new AbortController()

        this.inflightRequests.add(controller)

        if (this.getCredentialsType() === 'bearer') {
            const client = this.client as CodeWhispererStreaming
            try {
                const response = await client.sendMessage(
                    { ...request, profileArn: this.profileArn } as SendMessageCommandInputCodeWhispererStreaming,
                    {
                        abortSignal: controller.signal,
                    }
                )

                return response as SendMessageCommandOutputCodeWhispererStreaming
            } catch (e) {
                if (isUsageLimitError(e)) {
                    throw new AmazonQUsageLimitError(e)
                }
                throw e
            } finally {
                this.inflightRequests.delete(controller)
            }
        } else if (this.getCredentialsType() === 'iam') {
            const client = this.client as QDeveloperStreaming
            const response = await client.sendMessage(request as SendMessageCommandInputQDeveloperStreaming, {
                abortSignal: controller.signal,
            })

            this.inflightRequests.delete(controller)

            return response as SendMessageCommandOutputQDeveloperStreaming
        } else {
            throw new Error('invalid credentialsType in sendMessage')
        }
    }

    public async generateAssistantResponse(
        request: GenerateAssistantResponseCommandInputCodeWhispererStreaming,
        abortController?: AbortController
    ): Promise<GenerateAssistantResponseCommandOutputCodeWhispererStreaming> {
        if (this.getCredentialsType() === 'iam') {
            throw new Error('generateAssistantResponse is not supported for iam credentials')
        }

        const tokenClient = this.client as CodeWhispererStreaming
        const controller: AbortController = abortController ?? new AbortController()

        this.inflightRequests.add(controller)

        try {
            const response = await tokenClient.generateAssistantResponse(
                { ...request, profileArn: this.profileArn },
                {
                    abortSignal: controller.signal,
                }
            )

            return response
        } catch (e) {
            // TODO add a test for this
            if (isUsageLimitError(e)) {
                throw new AmazonQUsageLimitError(e)
            }
            throw e
        } finally {
            this.inflightRequests.delete(controller)
        }
    }

    public async exportResultArchive(
        request: ExportResultArchiveCommandInputCodeWhispererStreaming,
        abortController?: AbortController
    ): Promise<ExportResultArchiveCommandOutputCodeWhispererStreaming> {
        if (this.getCredentialsType() === 'iam') {
            throw new Error('generateAssistantResponse is not supported for iam credentials')
        }

        const tokenClient = this.client as CodeWhispererStreaming
        const controller: AbortController = abortController ?? new AbortController()
        this.inflightRequests.add(controller)
        const response = await tokenClient.exportResultArchive(
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
                () => credentialsProvider.getCredentials() as Credentials,
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
