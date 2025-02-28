import { Fetcher } from './fetcher'
import { Notification } from '../notification'

export class MetadataFilteringFetcher implements Fetcher {
    constructor(private readonly next: Fetcher) {}

    fetch(): Promise<Notification[]> {
        return this.next.fetch()
    }
}
