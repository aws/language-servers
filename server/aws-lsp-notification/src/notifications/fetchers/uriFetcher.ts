import { Fetcher } from './fetcher'
import { Notification } from '../notification'
import { Workspace } from '@aws/language-server-runtimes/server-interface'

export class UriFetcher implements Fetcher {
    constructor(private workspace: Workspace) {}

    async fetch(): Promise<Notification[]> {
        // fetch API doesn't currently support file URLs, so use fs for now
        //const file = await global.fetch('file://./sample.json')
        const file = await this.workspace.fs.readFile(
            '/Users/floralph/Source/language-servers/server/aws-lsp-notification/src/notifications/fetchers/sample.json'
        )
        return JSON.parse(file)
        // return Promise.resolve([
        //     {
        //         id: '1',
        //         type: MessageType.Error,
        //         criteria: {
        //             regions: {
        //                 code: { '==': 'IAD' },
        //             },
        //         },
        //         content: {
        //             'en-US': {
        //                 title: 'Test',
        //                 text: 'This is a test',
        //             },
        //         },
        //     },
        // ])
    }
}
