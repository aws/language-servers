import { IdentityServer } from '@aws/lsp-identity'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { standalone } from '@aws/language-server-runtimes/runtimes/standalone'

const props: RuntimeProps = {
    version: '0.1.0',
    servers: [IdentityServer],
    name: 'LSP Server POC',
}
standalone(props)
