import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
const apiConfig = require('./service.json')
import CodeWhispererClient = require('./codewhisperersigv4client')
import { SDKRuntimeConfigurator } from '@aws/language-server-runtimes/server-interface'

export type CodeWhispererSigv4ClientConfigurationOptions = ServiceConfigurationOptions

export function createCodeWhispererSigv4Client(
    options: ServiceConfigurationOptions,
    sdkRuntimeConfigurator: SDKRuntimeConfigurator
): CodeWhispererClient {
    return createService(options, sdkRuntimeConfigurator) as CodeWhispererClient
}

function createService(options: ServiceConfigurationOptions, sdkRuntimeConfigurator: SDKRuntimeConfigurator): Service {
    const client = sdkRuntimeConfigurator.v2(Service, { apiConfig, ...options } as any)
    return client
}
