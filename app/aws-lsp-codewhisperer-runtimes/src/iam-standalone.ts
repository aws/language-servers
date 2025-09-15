import { standalone } from '@aws/language-server-runtimes/runtimes'
import { CodeWhispererServerIAM, QChatServerIAMProxy } from '@aws/lsp-codewhisperer'
import { createIAMRuntimeProps } from './standalone-common'

const props = createIAMRuntimeProps('0.1.0', [CodeWhispererServerIAM, QChatServerIAMProxy])

standalone(props)
