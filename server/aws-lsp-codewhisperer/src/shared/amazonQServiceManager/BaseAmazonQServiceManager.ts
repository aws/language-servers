import {
    CancellationToken,
    CredentialsProvider,
    CredentialsType,
    Logging,
    Lsp,
    Runtime,
    SDKInitializator,
    UpdateConfigurationParams,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererServiceBase } from '../codeWhispererService'
import {
    AmazonQConfigurationCache,
    AmazonQWorkspaceConfig,
    getAmazonQRelatedWorkspaceConfigs,
} from './configurationUtils'
import { AmazonQServiceInitializationError } from './errors'
import { StreamingClientServiceBase } from '../streamingClientService'

export interface QServiceManagerFeatures {
    lsp: Lsp
    logging: Logging
    runtime: Runtime
    credentialsProvider: CredentialsProvider
    sdkInitializator: SDKInitializator
    workspace: Workspace
}

export type AmazonQBaseServiceManager = BaseAmazonQServiceManager<CodeWhispererServiceBase, StreamingClientServiceBase>

export const CONFIGURATION_CHANGE_IN_PROGRESS_MSG = 'handleDidChangeConfiguration already in progress, exiting.'
type DidChangeConfigurationListener = (updatedConfig: AmazonQWorkspaceConfig) => void | Promise<void>

/**
 * BaseAmazonQServiceManager is a base abstract class that can be generically extended
 * to manage a centralized CodeWhispererService that extends CodeWhispererServiceBase and
 * a centralized StreamingClientService that extends StreamingClientServiceBase.
 *
 * It implements `handleDidChangeConfiguration` which is intended to be passed to the LSP server's
 * `didChangeConfiguration` and `onInitialized` handlers in the AmazonQServiceServer. Servers **should
 * not call this method directly** and can instead listen to  the completion of these configuration
 * updates by attaching a listener that handles the updated configuration as needed. The base class also
 * triggers the `updateCachedServiceConfig` method, updating the cached CodeWhisperer service if defined.
 *
 * @example
 *
 * ```ts
 * const listener = (updateConfig: AmazonQWorkspaceConfig) => { ... }
 * await serviceManager.addDidChangeConfigurationListener(listener)
 * // service manager attached and called the listener once to provide current config
 * await serviceManager.handleDidChangeConfiguration()
 * // configuration is updated and listener invoked with updatedConfig
 * ```
 *
 * Concrete implementations can define reponses to the `UpdateConfiguration` request and the on
 * credentials deleted event produced by the runtime's CredentialsProvider through the respective
 * abstract methods `handleOnUpdateConfiguration` and `handleOnCredentialsDeleted`. These handlers
 * are then wired accordingly in the `AmazonQServiceServer`. **Dependent servers should not call
 * these handlers directly**.
 *
 * @remarks
 *
 * 1. `BaseAmazonQServiceManager` is intended to be extended as a singleton which should only be
 * initialized in the corresponding `AmazonQServiceServer`. Other servers should not attempt to
 * initialize any concrete implementation of this class.
 *
 * 2. For testing, be aware that if other server's unit tests depend on the (LSP) handling defined by
 *  this class and provided through `AmazonQServiceServer`, the responses from this class (such as
 * `handleDidChangeConfiguration`) have to be manually triggered in your mock routines.
 *
 */
export abstract class BaseAmazonQServiceManager<
    C extends CodeWhispererServiceBase,
    S extends StreamingClientServiceBase,
> {
    protected features!: QServiceManagerFeatures
    protected logging!: Logging
    protected configurationCache = new AmazonQConfigurationCache()
    protected cachedCodewhispererService?: C
    protected cachedStreamingClient?: S

    private handleDidChangeConfigurationListeners = new Set<DidChangeConfigurationListener>()
    private isConfigChangeInProgress = false

    abstract getCodewhispererService(): C
    abstract getStreamingClient(): S

    public getConfiguration(): Readonly<AmazonQWorkspaceConfig> {
        return this.configurationCache.getConfig()
    }

    public async addDidChangeConfigurationListener(listener: DidChangeConfigurationListener) {
        this.handleDidChangeConfigurationListeners.add(listener)

        // invoke the listener once at attachment to bring them up-to-date
        const currentConfig = this.getConfiguration()
        await listener(currentConfig)

        this.logging.log('Attached new listener and notified of current config.')
    }

    public removeDidChangeConfigurationListener(listener: DidChangeConfigurationListener) {
        this.handleDidChangeConfigurationListeners.delete(listener)
    }

    abstract handleOnCredentialsDeleted(type: CredentialsType): void
    abstract handleOnUpdateConfiguration(params: UpdateConfigurationParams, token: CancellationToken): Promise<void>

    public async handleDidChangeConfiguration(): Promise<void> {
        if (this.isConfigChangeInProgress) {
            this.logging.debug(CONFIGURATION_CHANGE_IN_PROGRESS_MSG)
            return
        }

        try {
            this.isConfigChangeInProgress = true
            const amazonQConfig = await getAmazonQRelatedWorkspaceConfigs(this.features.lsp, this.features.logging)
            this.configurationCache.updateConfig(amazonQConfig)

            this.updateCachedServiceConfig()

            await this.notifyDidChangeConfigurationListeners()
        } catch (error) {
            this.logging.error(`Unexpected error in getAmazonQRelatedWorkspaceConfigs: ${error}`)
        } finally {
            this.isConfigChangeInProgress = false
        }
    }

    protected updateCachedServiceConfig(): void {
        if (this.cachedCodewhispererService) {
            const customizationArn = this.configurationCache.getProperty('customizationArn')
            this.logging.debug(`Using customization=${customizationArn}`)
            this.cachedCodewhispererService.customizationArn = customizationArn

            const shareCodeWhispererContentWithAWS = this.configurationCache.getProperty(
                'shareCodeWhispererContentWithAWS'
            )
            this.logging.debug(
                'Update shareCodeWhispererContentWithAWS setting on cachedCodewhispererService to ' +
                    shareCodeWhispererContentWithAWS
            )
            this.cachedCodewhispererService.shareCodeWhispererContentWithAWS = shareCodeWhispererContentWithAWS
        }
    }

    private async notifyDidChangeConfigurationListeners(): Promise<void> {
        this.logging.debug('Notifying did change configuration listeners')

        const updatedConfig = this.configurationCache.getConfig()
        const listenPromises = Array.from(this.handleDidChangeConfigurationListeners, async listener => {
            try {
                await listener(updatedConfig)
            } catch (error) {
                this.logging.error(`Error occured in did change configuration listener: ${error}`)
            }
        })

        await Promise.allSettled(listenPromises)
    }

    constructor(features: QServiceManagerFeatures) {
        if (!features || !features.logging || !features.lsp) {
            throw new AmazonQServiceInitializationError(
                'Service features not initialized. Please ensure proper initialization.'
            )
        }

        this.features = features
        this.logging = features.logging

        this.logging.debug('BaseAmazonQServiceManager functionality initialized')
    }
}
