import { standalone } from '@aws/language-server-runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/out/runtimes/runtime'
import { ChatServer } from '@aws/lsp-codewhisperer/out/language-server/chatServer'
import { CodeWhispererServerTokenProxy } from '@aws/lsp-codewhisperer/out/language-server/proxy-server'

const MAJOR = 0
const MINOR = 1
const PATCH = 0
const VERSION = `${MAJOR}.${MINOR}.${PATCH}`

const props: RuntimeProps = {
    version: VERSION,
    // We currently don't support multiple servers handling the same LSP request,
    // e.g., both servers handing `doExecuteCommand`, only the last one will actually run,
    // but we have a design in progress to route requests to the right server.
    servers: [CodeWhispererServerTokenProxy, ChatServer],
    name: 'AWS CodeWhisperer',
}
standalone(props)
