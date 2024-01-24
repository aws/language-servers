import { standalone } from '@aws-placeholder/aws-language-server-runtimes'
import { RuntimeProps } from '@aws-placeholder/aws-language-server-runtimes/out/runtimes/runtime'
import { CodeWhispererServerTokenProxy } from '@lsp-placeholder/aws-lsp-codewhisperer/out/language-server/proxy-server'

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [CodeWhispererServerTokenProxy],
}
standalone(props)
