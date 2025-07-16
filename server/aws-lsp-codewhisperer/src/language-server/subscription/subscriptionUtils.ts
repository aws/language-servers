import { InitializeParams } from '@aws/language-server-runtimes/protocol'
import { QClientCapabilities } from '../configuration/qConfigurationServer'

export function isSubscriptionDetailsEnabled(params: InitializeParams | undefined): boolean {
    const qCapabilities = params?.initializationOptions?.aws?.awsClientCapabilities?.q as
        | QClientCapabilities
        | undefined
    return qCapabilities?.subscriptionDetails || false
}
