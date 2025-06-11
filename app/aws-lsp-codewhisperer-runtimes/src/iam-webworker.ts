import { webworker } from '@aws/language-server-runtimes/runtimes/webworker'
import { BaseCodeWhispererServer } from '@aws/lsp-codewhisperer/src/language-server/inline-completion/codeWhispererServer'
import { BaseQChatServer } from '@aws/lsp-codewhisperer/src/language-server/chat/qChatServer'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import { BaseAmazonQServiceServer } from '@aws/lsp-codewhisperer/out/shared/amazonQServer'

// all bundles depend on AmazonQServiceServer, make sure to always include it. The standalone helper
// to inject the AmazonQServiceServer does not work for webworker as it triggers missing polyfill errors
const props: RuntimeProps = {
    version: '1.0.0',
    servers: [BaseAmazonQServiceServer, BaseCodeWhispererServer, BaseQChatServer],
    name: 'AWS CodeWhisperer',
}

webworker(props)
