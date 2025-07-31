import { standalone } from '@aws/language-server-runtimes/runtimes'
import {
    AmazonQServiceServerIAM,
    AmazonQServiceServerToken,
    CodeWhispererSecurityScanServerTokenProxy,
    CodeWhispererServerTokenProxy,
    QAgenticChatServerProxy,
    QConfigurationServerTokenProxy,
    QLocalProjectContextServerProxy,
    QNetTransformServerTokenProxy,
    WorkspaceContextServerTokenProxy,
} from '@aws/lsp-codewhisperer'
import { IdentityServer } from '@aws/lsp-identity'
import {
    BashToolsServer,
    FsToolsServer,
    QCodeAnalysisServer,
    McpToolsServer,
} from '@aws/lsp-codewhisperer/out/language-server/agenticChat/tools/toolServer'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'

const versionJson = require('./version.json')
const version = versionJson.agenticChat

const props = {
    version: version,
    servers: [
        CodeWhispererServerTokenProxy,
        CodeWhispererSecurityScanServerTokenProxy,
        QConfigurationServerTokenProxy,
        QNetTransformServerTokenProxy,
        QAgenticChatServerProxy,
        IdentityServer.create,
        FsToolsServer,
        QCodeAnalysisServer,
        BashToolsServer,
        QLocalProjectContextServerProxy,
        WorkspaceContextServerTokenProxy,
        McpToolsServer,
        // LspToolsServer,
        AmazonQServiceServerIAM,
        AmazonQServiceServerToken,
    ],
    name: 'AWS CodeWhisperer',
} as RuntimeProps

standalone(props)
