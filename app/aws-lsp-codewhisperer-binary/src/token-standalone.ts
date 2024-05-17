import { standalone } from '@aws/language-server-runtimes/runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { NetTransformServer } from '@aws/lsp-codewhisperer/out/language-server/netTransformServer'
import {
    CodeWhispererSecurityScanServerTokenProxy,
    CodeWhispererServerTokenProxy,
    QChatServerProxy,
} from '@aws/lsp-codewhisperer/out/language-server/proxy-server'

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [
        CodeWhispererServerTokenProxy,
        CodeWhispererSecurityScanServerTokenProxy,
        QChatServerProxy,
        NetTransformServer,
    ],
    name: 'AWS CodeWhisperer',
}

standalone(props)
