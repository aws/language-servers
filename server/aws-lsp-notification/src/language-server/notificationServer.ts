import { InitializeParams, PartialInitializeResult } from '@aws/language-server-runtimes/server-interface'
import { ServerBase, ServerState } from '@aws/lsp-core'
import { NotificationService } from './notificationService'
import {
    InitializedParams,
    NotificationFollowupParams,
    NotificationParams,
} from '@aws/language-server-runtimes/protocol'
import { FilesystemMetadataStore } from '../notifications/metadata/filesystemMetadataStore'
import { ConditionFilteringFetcher } from '../notifications/fetchers/conditionFilteringFetcher'
import { MetadataFilteringFetcher } from '../notifications/fetchers/metadataFilteringFetcher'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { UriNotificationFetcher } from '../notifications/fetchers/uriNotificationFetcher'
import {
    UriResolverBuilder,
    CachedContentHandler,
    HttpHandler,
    FileHandler,
    UriCacheRepository,
    DefaultUriCacheLocation,
    UriResolver,
} from '@aws/lsp-core'

// Pattern: Model JSON-RPC requests/notifications calls (server->client) as
// interface implemented by the server to be injected into service
export interface NotificationClient {
    showNotification(params: NotificationParams): Promise<void>
}

export class NotificationServer extends ServerBase {
    private readonly notificationService: NotificationService
    private readonly uriResolver: UriResolver
    private readonly metadataStore: FilesystemMetadataStore
    private uriFetcher?: UriNotificationFetcher

    constructor(features: Features) {
        super('AWS Toolkit Language Server for Notifications', features)

        // Create cache repository for URI resolver
        const cacheLocation = DefaultUriCacheLocation.path
        const cacheRepository = new UriCacheRepository(cacheLocation)

        // Build URI resolver with caching
        this.uriResolver = new UriResolverBuilder()
            .addHandler(new CachedContentHandler({ cacheRepository }))
            .addHandler(new HttpHandler())
            .addHandler(new FileHandler())
            .build()

        // Initialize metadata store
        this.metadataStore = new FilesystemMetadataStore(features.workspace, this.dataDirPath)

        // The notification service will be fully initialized in the initialize method
        // when we receive the sourceUrl from the client
        this.notificationService = new NotificationService(
            // We'll create a proper fetcher chain in initialize
            // For now, create a dummy fetcher that yields no notifications
            { fetch: async function* () {} },
            this.metadataStore,
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

        // Get the notification source URL from initialization options
        // TODO: Define proper configuration structure for notification source URL
        const sourceUrl = params.initializationOptions?.aws?.awsClientCapabilities?.notification?.sourceUrl

        if (sourceUrl) {
            this.observability.logging.info(`Initializing notification service with source URL: ${sourceUrl}`)

            // Create the fetcher chain with the provided URL
            this.uriFetcher = new UriNotificationFetcher(this.uriResolver, sourceUrl, this.features.logging)
            const conditionFetcher = new ConditionFilteringFetcher(this.uriFetcher)
            const metadataFetcher = new MetadataFilteringFetcher(conditionFetcher, this.metadataStore)

            // Update the notification service with the new fetcher
            await this.notificationService.updateFetcher(metadataFetcher)
        } else {
            this.observability.logging.warn('No notification source URL provided in initialization options')
        }

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

    private async updateClientConfiguration(): Promise<void> {
        const config = await this.features.lsp.workspace.getConfiguration('aws.notification.clientConfiguration')
        return this.notificationService.updateClientConfiguration(config)
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
