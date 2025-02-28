// TODO Should this be exported from server-interface in @aws/language-server-runtimes?
import { NotificationFollowupParams, NotificationParams } from '@aws/language-server-runtimes/protocol'
import { Observability } from '@aws/lsp-core'
import { MetadataStore } from '../notifications/metadata/metadataStore'
import { NotificationConfiguration } from './notificationConfiguration'
import { Notification } from '../notifications/notification'
import { Fetcher } from '../notifications/fetchers/fetcher'
import { NotificationClient } from './notificationServer'

export type ShowNotification = (params: NotificationParams) => void

export class NotificationService implements Fetcher {
    #clientConfiguration?: NotificationConfiguration

    get clientConfiguration(): NotificationConfiguration | undefined {
        return this.#clientConfiguration
    }

    set clientConfiguration(value: NotificationConfiguration) {
        this.#clientConfiguration = value
        this.onClientConfigurationChanged()
    }

    constructor(
        private readonly next: Fetcher,
        private readonly metadataStore: MetadataStore,
        private readonly notificationClient: NotificationClient,
        private readonly observability: Observability
    ) {}

    async notificationFollowup(params: NotificationFollowupParams): Promise<void> {
        this.observability.logging.log(`Received NotificationFollowup: ${JSON.stringify(params)}`)
        // TODO: Acknowledge notification by ID in MetadataStore
    }

    async fetch(): Promise<Notification[]> {
        const notifications = await this.next.fetch()

        notifications.forEach(notification => {
            this.notificationClient.showNotification({
                id: notification.id,
                type: notification.type,
                content: {
                    title: notification.content['en-US'].title,
                    text: notification.content['en-US'].text,
                },
                actions: undefined,
            })
        })

        return notifications
    }

    private onClientConfigurationChanged() {
        this.fetch().catch(reason => {
            this.observability.logging.error(`Failed to send notifications: ${reason}`)
        })
    }
}
