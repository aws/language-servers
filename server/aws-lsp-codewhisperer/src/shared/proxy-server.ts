import { QAgenticChatServer } from '../language-server/agenticChat/qAgenticChatServer'
import { SecurityScanServerToken } from '../language-server/securityScan/codeWhispererSecurityScanServer'
import { CodewhispererServerFactory } from '../language-server/inline-completion/codeWhispererServer'
import { CodeWhispererServiceToken } from './codeWhispererService'
import { QNetTransformServerToken } from '../language-server/netTransform/netTransformServer'
import { QChatServerFactory } from '../language-server/chat/qChatServer'
import { QConfigurationServerToken } from '../language-server/configuration/qConfigurationServer'
import { initBaseTokenServiceManager } from './amazonQServiceManager/AmazonQTokenServiceManager'
import { initBaseIAMServiceManager } from './amazonQServiceManager/AmazonQIAMServiceManager'
import { LocalProjectContextServer } from '../language-server/localProjectContext/localProjectContextServer'

export const CodeWhispererServerTokenProxy = CodewhispererServerFactory(initBaseTokenServiceManager)

export const CodeWhispererServerIAMProxy = CodewhispererServerFactory(initBaseIAMServiceManager)

export const CodeWhispererSecurityScanServerTokenProxy = SecurityScanServerToken()

export const QNetTransformServerTokenProxy = QNetTransformServerToken(
    (credentialsProvider, workspace, awsQRegion, awsQEndpointUrl, sdkInitializator) => {
        return new CodeWhispererServiceToken(
            credentialsProvider,
            workspace,
            awsQRegion,
            awsQEndpointUrl,
            sdkInitializator
        )
    }
)

export const QChatServerTokenProxy = QChatServerFactory(initBaseTokenServiceManager)
export const QChatServerIAMProxy = QChatServerFactory(initBaseIAMServiceManager)

export const QAgenticChatServerTokenProxy = QAgenticChatServer()

export const QConfigurationServerTokenProxy = QConfigurationServerToken()

export const QLocalProjectContextServerTokenProxy = LocalProjectContextServer()
