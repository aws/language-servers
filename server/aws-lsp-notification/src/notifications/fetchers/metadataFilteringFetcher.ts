import { Fetcher } from './fetcher'
import { Notification } from '../notification'
import { MetadataStore } from '../metadata/metadataStore'

export class MetadataFilteringFetcher implements Fetcher {
    constructor(
        private readonly next: Fetcher,
        private readonly store: MetadataStore
    ) {}

    async *fetch(): AsyncGenerator<Notification> {
        const metadata = await this.store.load()

        for await (const notification of this.next.fetch()) {
            if (!metadata.acknowledged[notification.id]) {
                yield notification
            }
        }
    }
}
