import { CodewhispererServerFactory } from './codeWhispererServer'
import { CodeWhispererServiceToken } from './codeWhispererService'

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
