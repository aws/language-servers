import { Fetcher } from './fetcher'
import { Notification } from '../notification'

export class MemoryCacheFetcher implements Fetcher {
    constructor(private readonly next: Fetcher) {}

    fetch(): AsyncGenerator<Notification> {
        return this.next.fetch()
    }
}
