import { standalone } from '@aws/language-server-runtimes/runtimes'
import { CodeWhispererServer, QChatServerProxy } from '@aws/lsp-codewhisperer'
import { createRuntimeProps } from './standalone-common'

const props = createRuntimeProps('0.1.0', [CodeWhispererServer, QChatServerProxy])

standalone(props)
