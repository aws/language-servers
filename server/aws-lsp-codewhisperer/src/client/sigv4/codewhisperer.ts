import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
const apiConfig = require('./service.json')
import CodeWhispererClient = require('./codewhispererclient')

export function createCodeWhispererSigv4Client(options: ServiceConfigurationOptions): CodeWhispererClient {
    return createService(options) as CodeWhispererClient
}

function createService(options: ServiceConfigurationOptions): Service {
    const client = new Service({ apiConfig, ...options } as any)
    return client
}
