import { Fetcher } from '../fetcher'

export class S3Fetcher implements Fetcher {
    fetch(): Promise<Notification[]> {
        throw new Error('Method not implemented.')
    }
}
