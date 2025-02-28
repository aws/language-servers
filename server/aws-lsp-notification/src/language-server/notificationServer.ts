import { InitializeParams, PartialInitializeResult } from '@aws/language-server-runtimes/server-interface'
import { ServerBase, ServerState } from '@aws/lsp-core'
import { NotificationService } from './notificationService'
import { NotificationFollowupParams, NotificationParams } from '@aws/language-server-runtimes/protocol'
import { FilesystemMetadataStore } from '../notifications/metadata/filesystemMetadataStore'
import { CriteriaFilteringFetcher as CriteriaFilteringFetcher } from '../notifications/fetchers/criteriaFilteringFetcher'
import { MetadataFilteringFetcher } from '../notifications/fetchers/metadataFilteringFetcher'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { UriFetcher } from '../notifications/fetchers/uriFetcher'
import { CachingFetcher } from '../notifications/fetchers/cachingFetcher'

// Pattern: Model JSON-RPC requests/notifications calls (server->client) as
// interface implemented by the server to be injected into service
export interface NotificationClient {
    showNotification(params: NotificationParams): Promise<void>
}

const section: string = 'aws.notification.clientConfiguration'

export class NotificationServer extends ServerBase implements NotificationClient {
    private readonly notificationService: NotificationService

    constructor(features: Features) {
        super(features)

        // Initialize dependencies
        const metadataStore = new FilesystemMetadataStore()
        const next = new CriteriaFilteringFetcher(
            new MetadataFilteringFetcher(new CachingFetcher(new UriFetcher(features.workspace)))
        )

        this.notificationService = new NotificationService(next, metadataStore, this, this.observability)
    }

    static create(features: Features): () => void {
        features.logging.info('Creating notification server.')
        return new NotificationServer(features)[Symbol.dispose]
    }

    protected override async initialize(params: InitializeParams): Promise<PartialInitializeResult<any>> {
        const result = await super.initialize(params)

        // JSON-RPC request/notification handlers (client->server)
        this.features.notification.onNotificationFollowup(
            async (params: NotificationFollowupParams) =>
                await this.notificationService.notificationFollowup(params).catch(reason => {
                    this.observability.logging.error(`NotificationFollowup failed. ${reason}`)
                    throw this.wrapInAwsResponseError(reason)
                })
        )

        this.features.lsp.didChangeConfiguration(
            async () =>
                (this.notificationService.clientConfiguration =
                    await this.features.lsp.workspace.getConfiguration(section))
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

    showNotification(params: NotificationParams): Promise<void> {
        // Only send notifications in Initialized state to avoid violating LSP spec
        // https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#initialize
        if (this.state === ServerState.Initialized) {
            this.features.notification.showNotification(params)
        }

        return Promise.resolve()
    }
}
