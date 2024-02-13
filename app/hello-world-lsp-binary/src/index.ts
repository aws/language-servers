import { standalone } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes'
import { RuntimeProps } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes/runtime'
import { HelloWorldServer } from '@lsp-placeholder/hello-world-lsp'

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [HelloWorldServer],
    name: 'Hello World',
}
standalone(props)
