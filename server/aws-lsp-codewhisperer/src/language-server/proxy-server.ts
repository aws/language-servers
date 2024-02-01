import { HttpsProxyAgent } from 'https-proxy-agent'
import { CodewhispererServerFactory } from './codeWhispererServer'
import { CodeWhispererServiceToken } from './codeWhispererService'

export const CodeWhispererServerTokenProxy = CodewhispererServerFactory(credentialsProvider => {
    let additionalAwsConfig = {}
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy

    if (proxyUrl) {
        const proxyAgent = new HttpsProxyAgent(proxyUrl)
        additionalAwsConfig = {
            proxy: proxyAgent,
        }
    }
    return new CodeWhispererServiceToken(credentialsProvider, additionalAwsConfig)
})
