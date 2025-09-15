export interface Fetcher {
    fetch(): Promise<Notification[]>
}
