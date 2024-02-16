import { AWSError, Request, Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
const apiConfig = require('./service-2.json')
import CodeWhispererClient = require('./codewhispererclient')
const userApiConfig = require('./user-service-2.json')
import CodeWhispererUserClient = require('./codewhispereruserclient')

// PROOF OF CONCEPT
// This client fiddling was copied from the AWS Toolkit for VS Code
// https://github.com/aws/aws-toolkit-vscode/blob/5d621c8405a8b20ffe571ad0ba10ae700178e051/src/shared/awsClientBuilder.ts#L68
// We'll want to give this a common shape down in one of the core packages so
// that we can re-use it in other bearer token based clients.
interface RequestExtras {
    readonly service: AWS.Service
    readonly operation: string
    readonly params?: any
}

type RequestListener = (request: AWS.Request<any, AWSError> & RequestExtras) => void
export interface CodeWhispererTokenClientConfigurationOptions extends ServiceConfigurationOptions {
    onRequestSetup?: RequestListener | RequestListener[]
}

export function createCodeWhispererTokenClient(
    options: CodeWhispererTokenClientConfigurationOptions
): CodeWhispererClient {
    return createService(apiConfig, options) as CodeWhispererClient
}
export function createCodeWhispererTokenUserClient(
    options: CodeWhispererTokenClientConfigurationOptions
): CodeWhispererUserClient {
    return createService(userApiConfig, options) as CodeWhispererUserClient
}
function createService(apiConfig: any, options: CodeWhispererTokenClientConfigurationOptions): Service {
    const onRequest = options?.onRequestSetup ?? []
    const listeners = Array.isArray(onRequest) ? onRequest : [onRequest]
    const opt = { ...options }
    delete opt.onRequestSetup

    const client = new Service({ apiConfig, ...options } as any)
    const originalClient = client.setupRequestListeners.bind(client)

    client.setupRequestListeners = (request: Request<any, AWSError>) => {
        originalClient(request)
        listeners.forEach(l => l(request as AWS.Request<any, AWSError> & RequestExtras))
    }

    return client
}
