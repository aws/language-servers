import { standalone } from '@aws/language-server-runtimes/runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import {
    CodeWhispererSecurityScanServerTokenProxy,
    CodeWhispererServerTokenProxy,
    QAgenticChatServerTokenProxy,
    QConfigurationServerTokenProxy,
    QLocalProjectContextServerTokenProxy,
    QNetTransformServerTokenProxy,
} from '@aws/lsp-codewhisperer'
import { IdentityServer } from '@aws/lsp-identity'
import {
    BashToolsServer,
    FsToolsServer,
    McpToolsServer,
} from '@aws/lsp-codewhisperer/out/language-server/agenticChat/tools/toolServer'

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    servers: [
        CodeWhispererServerTokenProxy,
        CodeWhispererSecurityScanServerTokenProxy,
        QConfigurationServerTokenProxy,
        QNetTransformServerTokenProxy,
        QAgenticChatServerTokenProxy,
        IdentityServer.create,
        FsToolsServer,
        BashToolsServer,
        QLocalProjectContextServerTokenProxy,
        McpToolsServer,
        // LspToolsServer,
    ],
    name: 'AWS CodeWhisperer',
}
standalone(props)
