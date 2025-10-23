import { QAgenticChatServer } from '../language-server/agenticChat/qAgenticChatServer'
import { SecurityScanServerToken } from '../language-server/securityScan/codeWhispererSecurityScanServer'
import { CodewhispererServerFactory } from '../language-server/inline-completion/codeWhispererServer'
import { QNetTransformServerToken } from '../language-server/netTransform/netTransformServer'
import { AtxNetTransformServerToken } from '../language-server/netTransform/atxNetTransformServer'
import { QChatServerFactory } from '../language-server/chat/qChatServer'
import { QConfigurationServerToken } from '../language-server/configuration/qConfigurationServer'
import { TransformConfigurationServerToken } from '../language-server/configuration/transformConfigurationServer'
import { getOrThrowBaseTokenServiceManager } from './amazonQServiceManager/AmazonQTokenServiceManager'
import { getOrThrowBaseIAMServiceManager } from './amazonQServiceManager/AmazonQIAMServiceManager'
import { LocalProjectContextServer } from '../language-server/localProjectContext/localProjectContextServer'
import { WorkspaceContextServer } from '../language-server/workspaceContext/workspaceContextServer'

export const CodeWhispererServerTokenProxy = CodewhispererServerFactory(getOrThrowBaseTokenServiceManager)

export const CodeWhispererServerIAMProxy = CodewhispererServerFactory(getOrThrowBaseIAMServiceManager)

export const CodeWhispererSecurityScanServerTokenProxy = SecurityScanServerToken()

export const QNetTransformServerTokenProxy = QNetTransformServerToken()

export const AtxNetTransformServerTokenProxy = AtxNetTransformServerToken()

export const QChatServerTokenProxy = QChatServerFactory(getOrThrowBaseTokenServiceManager)
export const QChatServerIAMProxy = QChatServerFactory(getOrThrowBaseIAMServiceManager)

export const QAgenticChatServerProxy = QAgenticChatServer()

export const QConfigurationServerTokenProxy = QConfigurationServerToken()

export const TransformConfigurationServerTokenProxy = TransformConfigurationServerToken()

export const ATXHandlerServerTokenProxy = AtxNetTransformServerToken()

export const QLocalProjectContextServerProxy = LocalProjectContextServer()

export const WorkspaceContextServerTokenProxy = WorkspaceContextServer()
