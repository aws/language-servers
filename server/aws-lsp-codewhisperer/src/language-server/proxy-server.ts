import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { ChatSessionServiceConfig } from './chat/chatSessionService'
import { SecurityScanServerToken } from './codeWhispererSecurityScanServer'
import { CodewhispererServerFactory } from './codeWhispererServer'
import { CodeWhispererServiceToken } from './codeWhispererService'
import { QChatServerToken } from './qChatServer'

export const CodeWhispererServerTokenProxy = CodewhispererServerFactory(credentialsProvider => {
    let additionalAwsConfig = {}
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy

    if (proxyUrl) {
        const { getProxyHttpAgent } = require('proxy-http-agent')
        const proxyAgent = getProxyHttpAgent({
            proxy: proxyUrl,
        })
        additionalAwsConfig = {
            proxy: proxyAgent,
        }
    }
    return new CodeWhispererServiceToken(credentialsProvider, additionalAwsConfig)
})

export const CodeWhispererSecurityScanServerTokenProxy = SecurityScanServerToken(credentialsProvider => {
    let additionalAwsConfig = {}
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy

    if (proxyUrl) {
        const { getProxyHttpAgent } = require('proxy-http-agent')
        const proxyAgent = getProxyHttpAgent({
            proxy: proxyUrl,
        })
        additionalAwsConfig = {
            proxy: proxyAgent,
        }
    }
    return new CodeWhispererServiceToken(credentialsProvider, additionalAwsConfig)
})

export const QChatServerTokenProxy = QChatServerToken(credentialsProvider => {
    let clientOptions: ChatSessionServiceConfig | undefined

    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy

    if (proxyUrl) {
        const { getProxyHttpAgent } = require('proxy-http-agent')
        const { NodeHttpHandler } = require('@smithy/node-http-handler')

        // passing as a function so a new http handler can be created
        clientOptions = () => ({
            requestHandler: new NodeHttpHandler({
                httpsAgent: getProxyHttpAgent({
                    proxy: proxyUrl,
                }),
            }),
        })
    }

    return new ChatSessionManagementService(credentialsProvider, clientOptions)
})
