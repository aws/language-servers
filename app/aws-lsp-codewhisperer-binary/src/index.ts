import { standalone } from '@aws/language-server-runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/out/runtimes/runtime'
import { CodeWhispererServerTokenProxy } from '@aws/lsp-codewhisperer/out/language-server/proxy-server'

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [CodeWhispererServerTokenProxy],
    name: 'AWS CodeWhisperer',
}
standalone(props)
