// TODO Should this be exported from server-interface in @aws/language-server-runtimes?
import { NotificationFollowupParams, NotificationParams } from '@aws/language-server-runtimes/protocol'
import { Observability } from '@aws/lsp-core'
import { MetadataStore } from '../notifications/metadata/metadataStore'
import { Fetcher } from '../notifications/fetcher'

export type ShowNotification = (params: NotificationParams) => void

export class NotificationService {
    constructor(
        private readonly metadataStore: MetadataStore,
        private readonly fetcher: Fetcher,
        private readonly showNotification: ShowNotification,
        private readonly observability: Observability
    ) {
        // TODO Start scheduled fetching of immediate notifications using passed-in fetcher pipeline
    }

    async notificationFollowup(params: NotificationFollowupParams): Promise<void> {
        this.observability.logging.log(`Received NotificationFollowup: ${JSON.stringify(params)}`)
        // TODO: Acknowledge notification by ID in MetadataStore
    }
}
