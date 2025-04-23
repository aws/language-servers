import {
    CredentialsProvider,
    Logging,
    Lsp,
    Runtime,
    SDKInitializator,
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

interface ConfigurableLspHandlers {
    onUpdateConfiguration?: Parameters<Lsp['workspace']['onUpdateConfiguration']>[0]
}

/**
 * BaseAmazonQServiceManager is a base abstract class that can be generically extended
 * to manage a centralized CodeWhispererService that extends CodeWhispererServiceBase and
 * a centralized StreamingClientService that extends StreamingClientServiceBase.
 *
 * It implements `handleDidChangeConfiguration` and hooks the method into the passed LSP server's
 * `didChangeConfiguration` and `onInitialized` notifications when `setupCommonLspHandlers` is
 * called. Servers can listen to the completion of these configuration updates by attaching a
 * listener that handles the updated configuration as
 * needed. The base class also triggers the `updateCachedServiceConfig` method, updating
 * the cached services if defined.
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
 * Furthermore, concrete implementations can configure the `onUpdateConfiguration` LSP handler
 * by registering a handler in the `configurableLspHandlers` dictionary. The `AmazonQServiceServer`
 * will then hook it into the corresponding LSP request using the `setupConfigurableLspHandlers`
 * method.
 *
 * @remarks
 *
 * 1. `BaseAmazonQServiceManager` is intended to be extended as a singleton which should only be
 * initialized in the corresponding `AmazonQServiceServer`. Other servers should not attempt to
 * initialize any concrete implementation of this class.
 *
 * 2. For testing, be aware that if other server's unit tests depend on the LSP handling done by this
 * class, the responses from this class (such as `handleDidChangeConfiguration`) have to be manually
 * triggered in your mock routines.
 *
 */
export abstract class BaseAmazonQServiceManager<
    C extends CodeWhispererServiceBase,
    S extends StreamingClientServiceBase,
> implements AmazonQService<C, S>
{
    protected features!: QServiceManagerFeatures
    protected logging!: Logging
    protected configurationCache = new AmazonQConfigurationCache()
    protected cachedCodewhispererService?: C
    protected cachedStreamingClient?: S
    protected configurableLspHandlers: ConfigurableLspHandlers = {}

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

    private async handleDidChangeConfiguration(): Promise<void> {
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

    public setupCommonLspHandlers(): void {
        this.handleDidChangeConfiguration = this.handleDidChangeConfiguration.bind(this)

        this.features.lsp.onInitialized(async () => {
            await this.handleDidChangeConfiguration()
        })

        this.features.lsp.didChangeConfiguration(async () => {
            this.logging.debug('Received didChangeconfiguration event')
            await this.handleDidChangeConfiguration()
        })

        this.logging.debug('Attached onInitialized and didChangeConfiguration lsp listeners.')
    }

    public setupConfigurableLspHandlers(): void {
        if (this.configurableLspHandlers.onUpdateConfiguration) {
            const { onUpdateConfiguration } = this.configurableLspHandlers
            this.features.lsp.workspace.onUpdateConfiguration(onUpdateConfiguration)

            this.logging.debug('Attached onUpdateConfiguration lsp listener.')
        }
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

export interface AmazonQService<C extends CodeWhispererServiceBase, S extends StreamingClientServiceBase> {
    getCodewhispererService(): C
    getStreamingClient(): S
    getConfiguration(): Readonly<AmazonQWorkspaceConfig>
    addDidChangeConfigurationListener(listener: DidChangeConfigurationListener): Promise<void>
    removeDidChangeConfigurationListener(listener: DidChangeConfigurationListener): void
}

export type AmazonQServiceBase = AmazonQServiceAPI<CodeWhispererServiceBase, StreamingClientServiceBase>

export class AmazonQServiceAPI<C extends CodeWhispererServiceBase, S extends StreamingClientServiceBase>
    implements AmazonQService<C, S>
{
    private cachedServiceManager?: BaseAmazonQServiceManager<C, S>

    constructor(private readonly serviceManagerFactory: () => BaseAmazonQServiceManager<C, S>) {}

    private get serviceManager() {
        if (!this.cachedServiceManager) {
            this.cachedServiceManager = this.serviceManagerFactory()
        }

        return this.cachedServiceManager
    }

    getCodewhispererService(): C {
        return this.serviceManager.getCodewhispererService()
    }

    getStreamingClient(): S {
        return this.serviceManager.getStreamingClient()
    }

    getConfiguration(): Readonly<AmazonQWorkspaceConfig> {
        return this.serviceManager.getConfiguration()
    }

    addDidChangeConfigurationListener(listener: DidChangeConfigurationListener): Promise<void> {
        return this.serviceManager.addDidChangeConfigurationListener(listener)
    }
    removeDidChangeConfigurationListener(listener: DidChangeConfigurationListener): void {
        return this.serviceManager.removeDidChangeConfigurationListener(listener)
    }
}
