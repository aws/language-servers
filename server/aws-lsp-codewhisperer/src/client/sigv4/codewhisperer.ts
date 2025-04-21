import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
const apiConfig = require('./service.json')
import CodeWhispererClient = require('./codewhisperersigv4client')
import { SDKInitializator, Logging } from '@aws/language-server-runtimes/server-interface'

export type CodeWhispererSigv4ClientConfigurationOptions = ServiceConfigurationOptions

export function createCodeWhispererSigv4Client(
    options: ServiceConfigurationOptions,
    sdkInitializator: SDKInitializator,
    logging: Logging
): CodeWhispererClient {
    return createService(options, sdkInitializator, logging) as CodeWhispererClient
}

function createService(
    options: ServiceConfigurationOptions,
    sdkInitializator: SDKInitializator,
    logging: Logging
): Service {
    logging.log(`Passing client for class Service to sdkInitializator (v2) for additional setup (e.g. proxy)`)
    const client = sdkInitializator.v2(Service, { apiConfig, ...options } as any)
    return client
}
