import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
const apiConfig = require('./service.json')
import CodeWhispererClient = require('./codewhisperersigv4client')
import { SDKInitializator } from '@aws/language-server-runtimes/server-interface'

export type CodeWhispererSigv4ClientConfigurationOptions = ServiceConfigurationOptions

export function createCodeWhispererSigv4Client(
    options: ServiceConfigurationOptions,
    sdkInitializator: SDKInitializator
): CodeWhispererClient {
    return createService(options, sdkInitializator) as CodeWhispererClient
}

function createService(options: ServiceConfigurationOptions, sdkInitializator: SDKInitializator): Service {
    const client = sdkInitializator.v2(Service, { apiConfig, ...options } as any)
    return client
}
