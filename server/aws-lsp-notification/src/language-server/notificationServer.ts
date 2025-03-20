import { InitializeParams, PartialInitializeResult } from '@aws/language-server-runtimes/server-interface'
import { ServerBase, ServerState } from '@aws/lsp-core'
import { NotificationService } from './notificationService'
import {
    InitializedParams,
    NotificationFollowupParams,
    NotificationParams,
} from '@aws/language-server-runtimes/protocol'
import { FilesystemMetadataStore } from '../notifications/metadata/filesystemMetadataStore'
import { ConditionFilteringFetcher as ConditionFilteringFetcher } from '../notifications/fetchers/conditionFilteringFetcher'
import { MetadataFilteringFetcher } from '../notifications/fetchers/metadataFilteringFetcher'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { MemoryCacheFetcher } from '../notifications/fetchers/memoryCacheFetcher'
import { FilesystemFetcher } from '../notifications/fetchers/filesystemFetcher'

// Pattern: Model JSON-RPC requests/notifications calls (server->client) as
// interface implemented by the server to be injected into service
export interface NotificationClient {
    showNotification(params: NotificationParams): Promise<void>
}

export class NotificationServer extends ServerBase {
    private readonly notificationService: NotificationService

    constructor(features: Features) {
        super('AWS Toolkit Language Server for Notifications', features)

        // Initialize dependencies
        const metadataStore = new FilesystemMetadataStore(features.workspace, this.dataDirPath)
        const next = new ConditionFilteringFetcher(
            new MetadataFilteringFetcher(
                new MemoryCacheFetcher(new FilesystemFetcher(features.workspace)),
                metadataStore
            )
        )

        this.notificationService = new NotificationService(
            next,
            metadataStore,
            { showNotification: this.showNotification.bind(this) },
            this.observability
        )

        this.disposables.push(this.notificationService)
    }

    static create(features: Features): () => void {
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

        this.features.lsp.didChangeConfiguration(this.updateClientConfiguration.bind(this))

        return result
    }

    protected override async initialized(params: InitializedParams): Promise<void> {
        await super.initialized(params)
        await this.updateClientConfiguration()
    }

    private updateClientConfiguration(): Promise<void> {
        return this.notificationService.updateClientConfiguration(
            this.features.lsp.workspace.getConfiguration('aws.notification.clientConfiguration')
        )
    }

    private showNotification(params: NotificationParams): Promise<void> {
        // Only send notifications in Initialized state to avoid violating LSP spec
        // https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#initialize
        if (this.state === ServerState.Initialized) {
            this.features.notification.showNotification(params)
        }

        return Promise.resolve()
    }
}
