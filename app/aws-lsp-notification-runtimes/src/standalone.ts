import { standalone } from '@aws/language-server-runtimes/runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { NotificationServer } from '@aws/lsp-notification'

const props: RuntimeProps = {
    version: '0.1.0',
    servers: [NotificationServer.create],
    name: 'Notification Server',
}

standalone(props)
