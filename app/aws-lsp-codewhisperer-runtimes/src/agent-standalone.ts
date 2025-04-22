import { standalone } from '@aws/language-server-runtimes/runtimes'
import {
    CodeWhispererSecurityScanServerTokenProxy,
    CodeWhispererServerTokenProxy,
    QAgenticChatServerTokenProxy,
    QConfigurationServerTokenProxy,
    QLocalProjectContextServerTokenProxy,
    QNetTransformServerTokenProxy,
} from '@aws/lsp-codewhisperer'
import { IdentityServer } from '@aws/lsp-identity'
import { BashToolsServer, FsToolsServer } from '@aws/lsp-codewhisperer/out/language-server/agenticChat/tools/toolServer'
import { createTokenRuntimeProps } from './common'

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props = createTokenRuntimeProps(VERSION, [
    CodeWhispererServerTokenProxy,
    CodeWhispererSecurityScanServerTokenProxy,
    QConfigurationServerTokenProxy,
    QNetTransformServerTokenProxy,
    QAgenticChatServerTokenProxy,
    IdentityServer.create,
    FsToolsServer,
    BashToolsServer,
    QLocalProjectContextServerTokenProxy,
    // McpToolsServer,
    // LspToolsServer,
])

standalone(props)
