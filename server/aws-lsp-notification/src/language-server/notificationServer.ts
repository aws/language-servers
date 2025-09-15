import {
    InitializeParams,
    InitializedParams,
    PartialInitializeResult,
} from '@aws/language-server-runtimes/server-interface'
import { ServerBase, ServerState } from '@aws/lsp-core'
import { NotificationService } from './notificationService'
import { MessageType, NotificationFollowupParams, NotificationParams } from '@aws/language-server-runtimes/protocol'
import { FilesystemMetadataStore } from '../notifications/metadata/filesystemMetadataStore'
import { S3Fetcher } from '../notifications/toolkits/s3Fetcher'
import { CriteriaFilteringFetcher as CriteriaFilteringFetcher } from '../notifications/toolkits/criteriaFilteringFetcher'
import { MetadataFilteringFetcher } from '../notifications/metadata/metadataFilteringFetcher'
import { Fetcher } from '../notifications/fetcher'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

export class NotificationServer extends ServerBase {
    constructor(features: Features) {
        super(features)
    }

    static create(features: Features): () => void {
        features.logging.log('Creating notification server.')
        return new NotificationServer(features)[Symbol.dispose]
    }

    protected override async initialize(params: InitializeParams): Promise<PartialInitializeResult<any>> {
        const result = await super.initialize(params)

        // Initialize dependencies
        const metadataStore = new FilesystemMetadataStore()

        // TODO Pass in details to determine bucket and objects based on extension
        const immediateFetcher = this.createFetcherPipeline()

        const notificationService = new NotificationService(
            metadataStore,
            immediateFetcher,
            this.showNotification,
            this.observability
        )

        // JSON-RPC request/notification handlers (client->server)
        this.features.notification.onNotificationFollowup(
            async (params: NotificationFollowupParams) =>
                await notificationService.notificationFollowup(params).catch(reason => {
                    this.observability.logging.log(`NotificationFollowup failed. ${reason}`)
                    throw this.wrapInAwsResponseError(reason)
                })
        )

        return {
            ...result,
            ...{
                serverInfo: {
                    name: 'AWS Toolkit Language Server for Notifications',
                },
            },
        }
    }

    protected override initialized(params: InitializedParams): void {
        super.initialized(params)

        this.createFetcherPipeline()
        //startupFetcher.fetch()
        this.features.logging.log('Pushing test notification to client.')
        this.showNotification({
            id: '123',
            type: MessageType.Info,
            content: {
                text: 'Test notification',
            },
            actions: [
                {
                    type: 'Acknowledge',
                    text: 'Do not show again',
                },
            ],
        })
    }

    private createFetcherPipeline(): Fetcher {
        // TODO Pass in details to determine bucket and objects based on extension
        const s3Fetcher = new S3Fetcher()
        // TODO Pass IDE/version and extension/version from InitializeParams into CritieriaFilteringFetcher
        const criteriaFilteringFetcher = new CriteriaFilteringFetcher(s3Fetcher)
        const metadataFilteringFetcher = new MetadataFilteringFetcher(criteriaFilteringFetcher)

        return metadataFilteringFetcher
    }

    private showNotification(params: NotificationParams): void {
        // Drop notifications outside of Initialized state to avoid violating LSP spec
        // https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#initialize
        if (this.state !== ServerState.Initialized) {
            this.features.logging.warn(
                `Server attempted to send notification before initialization.\n\n${JSON.stringify(params)}`
            )
            return
        }

        this.features.notification.showNotification(params)
    }
}
