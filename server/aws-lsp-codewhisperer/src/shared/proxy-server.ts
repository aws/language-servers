import { QAgenticChatServer } from '../language-server/agenticChat/qAgenticChatServer'
import { SecurityScanServerToken } from '../language-server/securityScan/codeWhispererSecurityScanServer'
import { CodeWhispererServer } from '../language-server/inline-completion/codeWhispererServer'
import { QNetTransformServerToken } from '../language-server/netTransform/netTransformServer'
import { QChatServer } from '../language-server/chat/qChatServer'
import { QConfigurationServerToken } from '../language-server/configuration/qConfigurationServer'
import { LocalProjectContextServer } from '../language-server/localProjectContext/localProjectContextServer'
import { WorkspaceContextServer } from '../language-server/workspaceContext/workspaceContextServer'

export const CodeWhispererServerProxy = CodeWhispererServer

export const CodeWhispererSecurityScanServerTokenProxy = SecurityScanServerToken()

export const QNetTransformServerTokenProxy = QNetTransformServerToken()

export const QChatServerProxy = QChatServer

export const QAgenticChatServerTokenProxy = QAgenticChatServer()

export const QConfigurationServerTokenProxy = QConfigurationServerToken()

export const QLocalProjectContextServerTokenProxy = LocalProjectContextServer()

export const WorkspaceContextServerTokenProxy = WorkspaceContextServer()
