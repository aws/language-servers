import { SecurityScanServerToken } from './securityScan/codeWhispererSecurityScanServer'
import { CodewhispererServerFactory } from './inline-completion/codeWhispererServer'
import { CodeWhispererServiceIAM, CodeWhispererServiceToken } from '../client/codeWhispererService'
import { QNetTransformServerToken } from './netTransform/netTransformServer'
import { QChatServer } from './chat/qChatServer'
import { QConfigurationServerToken } from './configuration/qConfigurationServer'

export const CodeWhispererServerTokenProxy = CodewhispererServerFactory(
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

export const CodeWhispererServerIAMProxy = CodewhispererServerFactory(
    (credentialsProvider, workspace, awsQRegion, awsQEndpointUrl, sdkInitializator) => {
        return new CodeWhispererServiceIAM(
            credentialsProvider,
            workspace,
            awsQRegion,
            awsQEndpointUrl,
            sdkInitializator
        )
    }
)

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

export const QConfigurationServerTokenProxy = QConfigurationServerToken()
