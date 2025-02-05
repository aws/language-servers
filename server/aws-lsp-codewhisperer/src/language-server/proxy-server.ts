import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { ChatSessionServiceConfig } from './chat/chatSessionService'
import { SecurityScanServerToken } from './codeWhispererSecurityScanServer'
import { CodewhispererServerFactory } from './codeWhispererServer'
import { CodeWhispererServiceIAM, CodeWhispererServiceToken } from './codeWhispererService'
import { QNetTransformServerToken } from './netTransformServer'
import { QChatServer } from './qChatServer'
import { QConfigurationServerToken } from './configuration/qConfigurationServer'
import { readFileSync } from 'fs'
import { HttpsProxyAgent } from 'hpagent'
import { NodeHttpHandler } from '@smithy/node-http-handler'

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

export const CodeWhispererSecurityScanServerTokenProxy = SecurityScanServerToken(
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

export const QChatServerProxy = QChatServer((credentialsProvider, awsQRegion, awsQEndpointUrl, sdkInitializator) => {
    let clientOptions: ChatSessionServiceConfig | undefined
    // short term solution to fix webworker bundling, broken due to this node.js specific logic in here
    const isNodeJS: boolean = typeof process !== 'undefined' && process.release && process.release.name === 'node'
    const proxyUrl = isNodeJS ? (process.env.HTTPS_PROXY ?? process.env.https_proxy) : undefined
    const certs = isNodeJS
        ? process.env.AWS_CA_BUNDLE
            ? [readFileSync(process.env.AWS_CA_BUNDLE)]
            : undefined
        : undefined

    if (proxyUrl) {
        clientOptions = () => {
            // this mimics aws-sdk-v3-js-proxy
            const agent = new HttpsProxyAgent({
                proxy: proxyUrl,
                ca: certs,
            })

            return {
                requestHandler: new NodeHttpHandler({
                    httpAgent: agent,
                    httpsAgent: agent,
                }),
            }
        }
    }

    return ChatSessionManagementService.getInstance()
        .withCredentialsProvider(credentialsProvider)
        .withCodeWhispererEndpoint(awsQEndpointUrl)
        .withCodeWhispererRegion(awsQRegion)
        .withSdkRuntimeConfigurator(sdkInitializator)
        .withConfig(clientOptions)
})

export const QConfigurationServerTokenProxy = QConfigurationServerToken(
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
