import { webworker } from '@aws/language-server-runtimes/runtimes/webworker'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { CodeWhispererServerIAM } from '@aws/lsp-codewhisperer/out/language-server/codeWhispererServer'

const props: RuntimeProps = {
    version: '1.0.0',
    servers: [CodeWhispererServerIAM],
    name: 'AWS CodeWhisperer',
}

webworker(props)
