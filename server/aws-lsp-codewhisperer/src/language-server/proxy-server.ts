import { ChatSessionManagementService } from './chat/chatSessionManagementService'
import { ChatSessionServiceConfig } from './chat/chatSessionService'
import { SecurityScanServerToken } from './codeWhispererSecurityScanServer'
import { CodewhispererServerFactory } from './codeWhispererServer'
import { CodeWhispererServiceIAM, CodeWhispererServiceToken } from './codeWhispererService'
import { QNetTransformServerToken } from './netTransformServer'
import { QChatServer } from './qChatServer'
import { readFileSync } from 'fs'

export const CodeWhispererServerTokenProxy = CodewhispererServerFactory(credentialsProvider => {
    let additionalAwsConfig = {}
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
    const certs = process.env.AWS_CA_BUNDLE ? [readFileSync(process.env.AWS_CA_BUNDLE)] : undefined

    if (proxyUrl) {
        const { getProxyHttpAgent } = require('proxy-http-agent')
        const proxyAgent = getProxyHttpAgent({
            proxy: proxyUrl,
            ca: certs,
        })
        additionalAwsConfig = {
            httpOptions: proxyAgent,
        }
    }
    return new CodeWhispererServiceToken(credentialsProvider, additionalAwsConfig)
})

export const CodeWhispererServerIAMProxy = CodewhispererServerFactory(credentialsProvider => {
    let additionalAwsConfig = {}
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
    const certs = process.env.AWS_CA_BUNDLE ? [readFileSync(process.env.AWS_CA_BUNDLE)] : undefined

    if (proxyUrl) {
        const { getProxyHttpAgent } = require('proxy-http-agent')
        const proxyAgent = getProxyHttpAgent({
            proxy: proxyUrl,
            ca: certs,
        })
        additionalAwsConfig = {
            httpOptions: proxyAgent,
        }
    }
    return new CodeWhispererServiceIAM(credentialsProvider, additionalAwsConfig)
})

export const CodeWhispererSecurityScanServerTokenProxy = SecurityScanServerToken(credentialsProvider => {
    let additionalAwsConfig = {}
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
    const certs = process.env.AWS_CA_BUNDLE ? [readFileSync(process.env.AWS_CA_BUNDLE)] : undefined

    if (proxyUrl) {
        const { getProxyHttpAgent } = require('proxy-http-agent')
        const proxyAgent = getProxyHttpAgent({
            proxy: proxyUrl,
            ca: certs,
        })
        additionalAwsConfig = {
            httpOptions: proxyAgent,
        }
    }
    return new CodeWhispererServiceToken(credentialsProvider, additionalAwsConfig)
})

export const QNetTransformServerTokenProxy = QNetTransformServerToken(credentialsProvider => {
    let additionalAwsConfig = {}
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
    const certs = process.env.AWS_CA_BUNDLE ? [readFileSync(process.env.AWS_CA_BUNDLE)] : undefined

    if (proxyUrl) {
        const { getProxyHttpAgent } = require('proxy-http-agent')
        const proxyAgent = getProxyHttpAgent({
            proxy: proxyUrl,
            ca: certs,
        })
        additionalAwsConfig = {
            httpOptions: proxyAgent,
        }
    }
    return new CodeWhispererServiceToken(credentialsProvider, additionalAwsConfig)
})

export const QChatServerProxy = QChatServer(credentialsProvider => {
    let clientOptions: ChatSessionServiceConfig | undefined

    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
    const certs = process.env.AWS_CA_BUNDLE ? [readFileSync(process.env.AWS_CA_BUNDLE)] : undefined

    if (proxyUrl) {
        const { NodeHttpHandler } = require('@smithy/node-http-handler')

        /**
         * TODO: consolidate the libraries we need for http proxy
         *
         * proxy-http-agent is not compatible with smithy's node-http-handler,
         *  so we will use hpagent to create a new http handler
         *
         * At the same time, hpagent is not compatible with v2 sdk
         */
        const { HttpsProxyAgent } = require('hpagent')

        // passing client options as a function so a new http handler can be created
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
