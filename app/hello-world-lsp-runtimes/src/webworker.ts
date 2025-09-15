import { HelloWorldServer } from '@aws/hello-world-lsp'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { webworker } from '@aws/language-server-runtimes/runtimes/webworker'

const props: RuntimeProps = {
    version: '0.1.0',
    servers: [HelloWorldServer],
    name: 'Hello World',
}
webworker(props)
