import { Notification } from '../notification'

export interface Fetcher {
    fetch(): Promise<Notification[]>
}
