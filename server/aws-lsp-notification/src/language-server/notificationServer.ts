import {
    InitializeParams,
    InitializedParams,
    HandlerResult,
    PartialInitializeResult,
    InitializeError,
} from '@aws/language-server-runtimes/server-interface'
import { ServerBase, ServerFeatures } from '@aws/lsp-core'
import { NotificationService, ShowNotification } from './notificationService'
import { MessageType, NotificationFollowupParams, NotificationParams } from '@aws/language-server-runtimes/protocol'
import { FilesystemMetadataStore } from '../notifications/metadata/filesystemMetadataStore'
import { S3Fetcher } from '../notifications/toolkits/s3Fetcher'
import { CritieriaFilteringFetcher } from '../notifications/toolkits/criteriaFilteringFetcher'
import { MetadataFilteringFetcher } from '../notifications/metadata/metadataFilteringFetcher'
import { Fetcher } from '../notifications/fetcher'

export class NotificationServer extends ServerBase {
    // Silently drop notifications from constructor to initliaze when ability to send notifications is available
    private showNotification: ShowNotification = (params: NotificationParams) => {}

    constructor(features: ServerFeatures) {
        super(features)
    }

    static create(features: ServerFeatures): () => void {
        features.logging.log('Creating notification server.')
        return new NotificationServer(features)[Symbol.dispose]
    }

    protected override initialize(
        params: InitializeParams
    ): HandlerResult<PartialInitializeResult<any>, InitializeError> {
        // Callbacks for server->client JSON-RPC calls
        this.showNotification = (params: NotificationParams) => this.features.notification.showNotification(params)

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
            serverInfo: {
                name: 'AWS Toolkit Language Server for Notifications',
            },
            capabilities: {},
        }
    }

    protected override initialized(params: InitializedParams): void {
        const startupFetcher = this.createFetcherPipeline()
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
        const critieriaFilteringFetcher = new CritieriaFilteringFetcher(s3Fetcher)
        const metadataFilteringFetcher = new MetadataFilteringFetcher(critieriaFilteringFetcher)

        return metadataFilteringFetcher
    }
}
