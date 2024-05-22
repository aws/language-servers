import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { standalone } from '@aws/language-server-runtimes/runtimes/standalone'
import { PartiQLLanguageServer } from '@aws/lsp-partiql'

const props: RuntimeProps = {
    servers: [PartiQLLanguageServer],
    name: 'AWS PartiQL',
}
standalone(props)
