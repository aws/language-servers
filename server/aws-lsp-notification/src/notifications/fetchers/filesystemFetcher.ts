import { Fetcher } from './fetcher'
import { Notification } from '../notification'
import { Workspace } from '@aws/language-server-runtimes/server-interface'

export class FilesystemFetcher implements Fetcher {
    constructor(private readonly workspace: Workspace) {}

    async *fetch(): AsyncGenerator<Notification> {
        const notificationsFile = await this.workspace.fs.readFile(
            '/Users/floralph/Source/language-servers/server/aws-lsp-notification/src/notifications/fetchers/sample.json'
        )

        yield* JSON.parse(notificationsFile)
    }
}
