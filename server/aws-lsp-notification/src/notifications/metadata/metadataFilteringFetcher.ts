import { Fetcher } from '../fetcher'

export class MetadataFilteringFetcher implements Fetcher {
    constructor(private readonly next: Fetcher) {}

    fetch(): Promise<Notification[]> {
        throw new Error('Method not implemented.')
    }
}
