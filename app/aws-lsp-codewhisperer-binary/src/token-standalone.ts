import { standalone } from '@aws/language-server-runtimes/runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import {
    CodeWhispererSecurityScanServerTokenProxy,
    CodeWhispererServerTokenProxy,
} from '@aws/lsp-codewhisperer/out/language-server/proxy-server'
import { NetTransformServer } from '@aws/lsp-codewhisperer/out/language-server/netTransformServer'

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [CodeWhispererServerTokenProxy, CodeWhispererSecurityScanServerTokenProxy, NetTransformServer],
    name: 'AWS CodeWhisperer',
}
standalone(props)
