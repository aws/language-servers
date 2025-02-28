import { Fetcher } from './fetcher'
import { Notification } from '../notification'

export class PeriodicFetcher implements Fetcher {
    constructor(private readonly next: Fetcher) {}

    fetch(): Promise<Notification[]> {
        throw new Error('Method not implemented.')
    }
}
