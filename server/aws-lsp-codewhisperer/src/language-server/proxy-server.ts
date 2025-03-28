import { SecurityScanServerToken } from './codeWhispererSecurityScanServer'
import { CodewhispererServerFactory } from './codeWhispererServer'
import { CodeWhispererServiceToken } from './codeWhispererService'
import { QNetTransformServerToken } from './netTransformServer'
import { QChatServer } from './qChatServer'
import { QAgenticChatServer } from './agenticChat/qAgenticChatServer'
import { QConfigurationServerToken } from './configuration/qConfigurationServer'
import { initBaseServiceManager } from './amazonQServiceManager/factories'

export const CodeWhispererServerTokenProxy = CodewhispererServerFactory(initBaseServiceManager('bearer'))

export const CodeWhispererServerIAMProxy = CodewhispererServerFactory(initBaseServiceManager('iam'))

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
