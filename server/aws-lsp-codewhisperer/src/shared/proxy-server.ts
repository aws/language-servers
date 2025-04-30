import { QAgenticChatServer } from '../language-server/agenticChat/qAgenticChatServer'
import { SecurityScanServerToken } from '../language-server/securityScan/codeWhispererSecurityScanServer'
import { CodewhispererServerFactory } from '../language-server/inline-completion/codeWhispererServer'
import { QNetTransformServerToken } from '../language-server/netTransform/netTransformServer'
import { QChatServerFactory } from '../language-server/chat/qChatServer'
import { QConfigurationServerToken } from '../language-server/configuration/qConfigurationServer'
import { getOrThrowBaseTokenServiceManager } from './amazonQServiceManager/AmazonQTokenServiceManager'
import { getOrThrowBaseIAMServiceManager } from './amazonQServiceManager/AmazonQIAMServiceManager'
import { LocalProjectContextServer } from '../language-server/localProjectContext/localProjectContextServer'
import { WorkspaceContextServer } from '../language-server/workspaceContext/workspaceContextServer'

export const CodeWhispererServerTokenProxy = CodewhispererServerFactory(getOrThrowBaseTokenServiceManager)

export const CodeWhispererServerIAMProxy = CodewhispererServerFactory(getOrThrowBaseIAMServiceManager)

export const CodeWhispererSecurityScanServerTokenProxy = SecurityScanServerToken()

export const QNetTransformServerTokenProxy = QNetTransformServerToken()

export const QChatServerTokenProxy = QChatServerFactory(getOrThrowBaseTokenServiceManager)
export const QChatServerIAMProxy = QChatServerFactory(getOrThrowBaseIAMServiceManager)

export const QAgenticChatServerTokenProxy = QAgenticChatServer()

export const QConfigurationServerTokenProxy = QConfigurationServerToken()

export const QLocalProjectContextServerTokenProxy = LocalProjectContextServer()

export const WorkspaceContextServerTokenProxy = WorkspaceContextServer()
