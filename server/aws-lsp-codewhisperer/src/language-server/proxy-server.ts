import { QAgenticChatServer } from './agenticChat/qAgenticChatServer'
import { SecurityScanServerToken } from './securityScan/codeWhispererSecurityScanServer'
import { CodewhispererServerFactory } from './inline-completion/codeWhispererServer'
import { CodeWhispererServiceToken } from '../shared/codeWhispererService'
import { QNetTransformServerToken } from './netTransform/netTransformServer'
import { QChatServer } from './chat/qChatServer'
import { QConfigurationServerToken } from './configuration/qConfigurationServer'
import { initBaseIAMServiceManager, initBaseTokenServiceManager } from './amazonQServiceManager/factories'

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

export const QChatServerProxy = QChatServer()

export const QAgenticChatServerProxy = QAgenticChatServer()

export const QConfigurationServerTokenProxy = QConfigurationServerToken()
