import { standalone } from '@aws/language-server-runtimes/runtimes'
import {
    CodeWhispererSecurityScanServerTokenProxy,
    CodeWhispererServerProxy,
    QChatServerProxy,
    QConfigurationServerTokenProxy,
    QNetTransformServerTokenProxy,
    QLocalProjectContextServerProxy,
    WorkspaceContextServerTokenProxy,
} from '@aws/lsp-codewhisperer'
import { IdentityServer } from '@aws/lsp-identity'
import { createRuntimeProps } from './standalone-common'

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props = createRuntimeProps(VERSION, [
    CodeWhispererServerProxy,
    CodeWhispererSecurityScanServerTokenProxy,
    QConfigurationServerTokenProxy,
    QNetTransformServerTokenProxy,
    QChatServerProxy,
    IdentityServer.create,
    QLocalProjectContextServerProxy,
    WorkspaceContextServerTokenProxy,
])

standalone(props)
