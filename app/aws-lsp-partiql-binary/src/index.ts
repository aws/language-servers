import { PartiQLLanguageServer } from '@aws/aws-lsp-partiql'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { standalone } from '@aws/language-server-runtimes/runtimes/standalone'

const props: RuntimeProps = {
    servers: [PartiQLLanguageServer],
    name: 'AWS PartiQL',
}
standalone(props)
