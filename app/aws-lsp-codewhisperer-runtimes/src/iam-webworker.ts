import { webworker } from '@aws/language-server-runtimes/runtimes/webworker'
import { CodeWhispererServerIAM } from '@aws/lsp-codewhisperer/out/language-server/inline-completion/codeWhispererServer'
import { QChatServerIAM } from '@aws/lsp-codewhisperer/out/language-server/chat/qChatServer'
import { createIAMRuntimeProps } from './common'

const props = createIAMRuntimeProps('1.0.0', [CodeWhispererServerIAM, QChatServerIAM])

webworker(props)
