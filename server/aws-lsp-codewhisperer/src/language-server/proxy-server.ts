import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { ChatSessionServiceConfig } from './chat/chatSessionService'
import { SecurityScanServerToken } from './codeWhispererSecurityScanServer'
import { CodewhispererServerFactory } from './codeWhispererServer'
import { CodeWhispererServiceIAM, CodeWhispererServiceToken } from './codeWhispererService'
import { QNetTransformServerToken } from './netTransformServer'
import { QChatServer } from './qChatServer'
import { QConfigurationServerToken } from './configuration/qConfigurationServer'
import { readFileSync } from 'fs'
import { ConfigurationOptions } from 'aws-sdk'
import { HttpsProxyAgent } from 'hpagent'

const makeProxyConfig = () => {
    let additionalAwsConfig: ConfigurationOptions = {}
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy

    if (proxyUrl) {
        const certs = process.env.AWS_CA_BUNDLE ? [readFileSync(process.env.AWS_CA_BUNDLE)] : undefined
        const agent = new HttpsProxyAgent({
            proxy: proxyUrl,
            ca: certs,
        })

        additionalAwsConfig = {
            httpOptions: {
                agent: agent,
            },
        }
    }

    return additionalAwsConfig
}

export const CodeWhispererServerTokenProxy = CodewhispererServerFactory(credentialsProvider => {
    const additionalAwsConfig = makeProxyConfig()

    return new CodeWhispererServiceToken(credentialsProvider, additionalAwsConfig)
})

export const CodeWhispererServerIAMProxy = CodewhispererServerFactory(credentialsProvider => {
    const additionalAwsConfig = makeProxyConfig()
    return new CodeWhispererServiceIAM(credentialsProvider, additionalAwsConfig)
})

export const CodeWhispererSecurityScanServerTokenProxy = SecurityScanServerToken(credentialsProvider => {
    const additionalAwsConfig = makeProxyConfig()
    return new CodeWhispererServiceToken(credentialsProvider, additionalAwsConfig)
})

export const QNetTransformServerTokenProxy = QNetTransformServerToken(credentialsProvider => {
    const additionalAwsConfig = makeProxyConfig()
    return new CodeWhispererServiceToken(credentialsProvider, additionalAwsConfig)
})

export const QChatServerProxy = QChatServer(credentialsProvider => {
    let clientOptions: ChatSessionServiceConfig | undefined

    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
    const certs = process.env.AWS_CA_BUNDLE ? [readFileSync(process.env.AWS_CA_BUNDLE)] : undefined

    if (proxyUrl) {
        const { NodeHttpHandler } = require('@smithy/node-http-handler')

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

export const QConfigurationServerTokenProxy = QConfigurationServerToken(credentialsProvider => {
    const additionalAwsConfig = makeProxyConfig()
    return new CodeWhispererServiceToken(credentialsProvider, additionalAwsConfig)
})
