import { Fetcher } from './fetcher'
import { Notification } from '../notification'
import { Workspace } from '@aws/language-server-runtimes/server-interface'

export class HttpsFetcher implements Fetcher {
    constructor(private workspace: Workspace) {}

    async *fetch(): AsyncGenerator<Notification> {
        const response = await global.fetch(
            // TODO Upload proper sample file to beta buck and fix URI below
            'https://idetoolkits-hostedfiles.amazonaws.com/Notifications/integ/VSCode/startup/1.x.json'
        )
        if (!response.ok) {
            // TODO fix how to handle failed downloads
            throw new Error('Temporary error, fix how to handle failed downloads')
        }

        const json = await response.json()
        const notifications = json as unknown as { notifications: [] }
        yield* notifications.notifications
    }
}
