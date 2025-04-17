import { AWSError, Request, Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
const apiConfig = require('./bearer-token-service.json')
import CodeWhispererClient = require('./codewhispererbearertokenclient')
import { SDKInitializator, Logging } from '@aws/language-server-runtimes/server-interface'
// PROOF OF CONCEPT
// This client fiddling was copied from the AWS Toolkit for VS Code
// https://github.com/aws/aws-toolkit-vscode/blob/5d621c8405a8b20ffe571ad0ba10ae700178e051/src/shared/awsClientBuilder.ts#L68
// We'll want to give this a common shape down in one of the core packages so
// that we can re-use it in other bearer token based clients.
export interface RequestExtras {
    readonly service: AWS.Service
    readonly operation: string
    readonly params?: any
}

type RequestListener = (request: AWS.Request<any, AWSError> & RequestExtras) => void
export interface CodeWhispererTokenClientConfigurationOptions extends ServiceConfigurationOptions {
    onRequestSetup?: RequestListener | RequestListener[]
}

export function createCodeWhispererTokenClient(
    options: CodeWhispererTokenClientConfigurationOptions,
    sdkInitializator: SDKInitializator,
    logging: Logging
): CodeWhispererClient {
    return createService(options, sdkInitializator, logging) as CodeWhispererClient
}

function createService(
    options: CodeWhispererTokenClientConfigurationOptions,
    sdkInitializator: SDKInitializator,
    logging: Logging
): Service {
    const onRequest = options?.onRequestSetup ?? []
    const listeners = Array.isArray(onRequest) ? onRequest : [onRequest]
    const opt = { ...options }
    delete opt.onRequestSetup
    logging.log(`Passing client for class Service to sdkInitializator (v2) for additional setup (e.g. proxy)`)
    const client = sdkInitializator.v2(Service, { apiConfig, ...options } as any)
    const originalClient = client.setupRequestListeners.bind(client)

    client.setupRequestListeners = (request: Request<any, AWSError>) => {
        originalClient(request)
        listeners.forEach(l => l(request as AWS.Request<any, AWSError> & RequestExtras))
    }

    return client
}
