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

export const CodeWhispererServerTokenProxy = CodewhispererServerFactory((credentialsProvider, workspace) => {
    return new CodeWhispererServiceToken(credentialsProvider, workspace)
})

export const CodeWhispererServerIAMProxy = CodewhispererServerFactory((credentialsProvider, workspace) => {
    return new CodeWhispererServiceIAM(credentialsProvider, workspace)
})

export const CodeWhispererSecurityScanServerTokenProxy = SecurityScanServerToken((credentialsProvider, workspace) => {
    return new CodeWhispererServiceToken(credentialsProvider, workspace)
})

export const QNetTransformServerTokenProxy = QNetTransformServerToken((credentialsProvider, workspace) => {
    return new CodeWhispererServiceToken(credentialsProvider, workspace)
})

export const QChatServerProxy = QChatServer(credentialsProvider => {
    let clientOptions: ChatSessionServiceConfig | undefined

    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
    const certs = process.env.AWS_CA_BUNDLE ? [readFileSync(process.env.AWS_CA_BUNDLE)] : undefined

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
        .withConfig(clientOptions)
})

export const QConfigurationServerTokenProxy = QConfigurationServerToken((credentialsProvider, workspace) => {
    return new CodeWhispererServiceToken(credentialsProvider, workspace)
})
