import { Fetcher } from './fetcher'
import { Notification } from '../notification'

export class CachingFetcher implements Fetcher {
    constructor(private readonly next: Fetcher) {}

    fetch(): Promise<Notification[]> {
        return this.next.fetch()
    }
}
