import { standalone } from '@aws/language-server-runtimes/runtimes'
import { CodeWhispererServerIAMProxy, QChatServerIAMProxy } from '@aws/lsp-codewhisperer'
import { createRuntimeProps } from './standalone-common'

const props = createRuntimeProps('0.1.0', [CodeWhispererServerIAMProxy, QChatServerIAMProxy])

standalone(props)
