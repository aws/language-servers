// TODO-NOTIFY: Should this be exported from server-interface in @aws/language-server-runtimes?
import {
    FollowupNotificationActionType,
    MessageType,
    NotificationFollowupParams,
} from '@aws/language-server-runtimes/protocol'
import { Disposables, disposeAll, Observability } from '@aws/lsp-core'
import { MetadataStore } from '../notifications/metadata/metadataStore'
import { Fetcher } from '../notifications/fetchers/fetcher'
import { NotificationClient } from './notificationServer'
import { NotificationConfiguration } from './notificationConfiguration'

export interface NotificationServiceOptions {
    periodicShowNotifications?: boolean
    showNotificationsIntervalMillis?: number
}

const defaultNotificationServiceOptions: NotificationServiceOptions = {
    periodicShowNotifications: true,
    showNotificationsIntervalMillis: 3000, // TODO-NOTIFY: set to a suitable value
}

export class NotificationService implements Disposable {
    private readonly disposables: Disposables = []
    private fetcher: Fetcher

    constructor(
        fetcher: Fetcher,
        private readonly metadataStore: MetadataStore,
        private readonly notificationClient: NotificationClient,
        private readonly observability: Observability,
        private readonly options: NotificationServiceOptions = {}
    ) {
        this.fetcher = fetcher
        this.options = { ...defaultNotificationServiceOptions, ...options }

        if (this.options.periodicShowNotifications) {
            const id = setInterval(
                async () => await this.showNotifications(),
                this.options.showNotificationsIntervalMillis
            )
            this.disposables.push(() => clearInterval(id))
        }
    }

    [Symbol.dispose](): void {
        disposeAll(this.disposables)
    }

    /**
     * Updates the fetcher used by the notification service
     * @param fetcher The new fetcher to use
     */
    async updateFetcher(fetcher: Fetcher): Promise<void> {
        this.fetcher = fetcher
        // Immediately show notifications with the new fetcher
        await this.showNotifications()
    }

    async notificationFollowup(params: NotificationFollowupParams): Promise<void> {
        if (params.action === FollowupNotificationActionType.Acknowledge) {
            // Synchronization/locking isn't needed as this is the only load/save section
            // in the server at this time, but may need to be introduced in the future
            const metadataFile = await this.metadataStore.load()
            metadataFile.acknowledged[params.source.id] = { acknowledgedAt: new Date().toISOString() }
            await this.metadataStore.save(metadataFile)
        }
    }

    private async showNotifications(): Promise<void> {
        // TODO-NOTIFY: Clones and/or freezes the clientState and pass it to fetch in a request object
        // to prevent race conditions with getConfiguration clientState updates.
        // TODO-NOTIFY: Rename fetcher/fetch to getNotifications
        // TODO-NOTIFY: How will the interval call which should have no context work?
        for await (const notification of this.fetcher.fetch()) {
            this.notificationClient.showNotification({
                id: notification.id,
                type: MessageType.Info,
                content: {
                    title: notification.content['en-US'].title,
                    text: notification.content['en-US'].text,
                },
                actions: undefined,
            })
        }
    }

    async updateClientConfiguration(config: NotificationConfiguration): Promise<void> {
        await this.showNotifications()
    }
}
