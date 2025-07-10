import { Notification } from '../notification'

export interface Fetcher {
    fetch(): AsyncGenerator<Notification>
}
