import {
    CodeWhispererStreaming,
    GenerateAssistantResponseCommandInput as GenerateAssistantResponseCommandInputCodeWhispererStreaming,
    GenerateAssistantResponseCommandOutput as GenerateAssistantResponseCommandOutputCodeWhispererStreaming,
    SendMessageCommandInput as SendMessageCommandInputCodeWhispererStreaming,
    SendMessageCommandOutput as SendMessageCommandOutputCodeWhispererStreaming,
    ExportResultArchiveCommandInput as ExportResultArchiveCommandInputCodeWhispererStreaming,
    ExportResultArchiveCommandOutput as ExportResultArchiveCommandOutputCodeWhispererStreaming,
} from '@amzn/codewhisperer-streaming'
import {
    QDeveloperStreaming,
    SendMessageCommandInput as SendMessageCommandInputQDeveloperStreaming,
    SendMessageCommandOutput as SendMessageCommandOutputQDeveloperStreaming,
} from '@amzn/amazon-q-developer-streaming-client'
import { CredentialsProvider, SDKInitializator, Logging } from '@aws/language-server-runtimes/server-interface'
import { getBearerTokenFromProvider, isUsageLimitError } from './utils'
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry'
import { CredentialProviderChain, Credentials } from 'aws-sdk'
import { CLIENT_TIMEOUT_MS } from '../language-server/agenticChat/constants/constants'
import { AmazonQUsageLimitError } from './amazonQServiceManager/errors'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types'

export type SendMessageCommandInput =
    | SendMessageCommandInputCodeWhispererStreaming
    | SendMessageCommandInputQDeveloperStreaming
export type SendMessageCommandOutput =
    | SendMessageCommandOutputCodeWhispererStreaming
    | SendMessageCommandOutputQDeveloperStreaming

export type ChatCommandInput = SendMessageCommandInput | GenerateAssistantResponseCommandInputCodeWhispererStreaming
export type ChatCommandOutput = SendMessageCommandOutput | GenerateAssistantResponseCommandOutputCodeWhispererStreaming

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
            requestHandler: new NodeHttpHandler({
                requestTimeout: CLIENT_TIMEOUT_MS,
            }),
            customUserAgent: customUserAgent,
        })
    }

    public async sendMessage(
        request: SendMessageCommandInputCodeWhispererStreaming,
        abortController?: AbortController
    ): Promise<SendMessageCommandOutputCodeWhispererStreaming> {
        const controller: AbortController = abortController ?? new AbortController()

        this.inflightRequests.add(controller)

        try {
            const response = await this.client.sendMessage(
                { ...request, profileArn: this.profileArn },
                {
                    abortSignal: controller.signal,
                }
            )

            return response
        } catch (e) {
            if (isUsageLimitError(e)) {
                throw new AmazonQUsageLimitError(e)
            }
            throw e
        } finally {
            this.inflightRequests.delete(controller)
        }
    }

    public async generateAssistantResponse(
        request: GenerateAssistantResponseCommandInputCodeWhispererStreaming,
        abortController?: AbortController
    ): Promise<GenerateAssistantResponseCommandOutputCodeWhispererStreaming> {
        const controller: AbortController = abortController ?? new AbortController()

        this.inflightRequests.add(controller)

        try {
            const response = await this.client.generateAssistantResponse(
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

        // Create a credential provider that fetches fresh credentials on each request
        const iamCredentialProvider: AwsCredentialIdentityProvider = async (): Promise<AwsCredentialIdentity> => {
            const creds = (await credentialsProvider.getCredentials('iam')) as Credentials
            logging.log(`Fetching new IAM credentials`)
            return {
                accessKeyId: creds.accessKeyId,
                secretAccessKey: creds.secretAccessKey,
                sessionToken: creds.sessionToken,
                expiration: creds.expireTime ? new Date(creds.expireTime) : new Date(), // Force refresh on each request if creds do not have expiration time
            }
        }

        this.client = sdkInitializator(QDeveloperStreaming, {
            region: region,
            endpoint: endpoint,
            credentials: iamCredentialProvider,
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
