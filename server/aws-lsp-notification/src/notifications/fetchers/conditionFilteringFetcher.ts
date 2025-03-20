import { Fetcher } from './fetcher'
import { Notification } from '../notification'

// TODO Implement set operations

export class ConditionFilteringFetcher implements Fetcher {
    constructor(private readonly next: Fetcher) {}

    fetch(): AsyncGenerator<Notification> {
        return this.next.fetch()
    }
}
