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

export interface Features {
    lsp: Lsp
    logging: Logging
    runtime: Runtime
    credentialsProvider: CredentialsProvider
    sdkInitializator: SDKInitializator
    workspace: Workspace
}

export type AmazonQBaseServiceManager = BaseAmazonQServiceManager<CodeWhispererServiceBase>

export const CONFIGURATION_CHANGE_IN_PROGRESS_MSG =
    'DidChangeConfiguration notification handling already in progress, exiting.'
type DidChangeConfigurationListener = (updatedConfig: AmazonQWorkspaceConfig) => void | Promise<void>

/**
 * BaseAmazonQServiceManager is a base abstract class that can be generically extended
 * to manage a centralized CodeWhispererService that extends CodeWhispererServiceBase.
 *
 * It implements `handleDidChangeConfiguration` and hooks it into the passed LSP server's
 * `didChangeConfiguration` notification. Servers can listen to the completion of these
 * configuration updates by attaching a listener that handles the updated configuration as
 * needed. The base class also triggers the `updateCachedServiceConfig` method, updating
 * the cached service if defined.
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
 */
export abstract class BaseAmazonQServiceManager<C extends CodeWhispererServiceBase> {
    protected features!: Features
    protected logging!: Logging
    protected configurationCache = new AmazonQConfigurationCache()
    protected cachedCodewhispererService?: C

    private handleDidChangeConfigurationListeners = new Set<DidChangeConfigurationListener>()
    private isConfigChangeInProgress = false

    abstract getCodewhispererService(): CodeWhispererServiceBase

    /**
     * This method calls `getAmazonQRelatedWorkspaceConfigs`, updates the configurationCache and
     * notifies all attached listeners.
     *
     * **Avoid calling this method directly** for processing configuration updates, and attach a listener
     * instead.
     */
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

    constructor(features: Features) {
        if (!features || !features.logging || !features.lsp) {
            throw new AmazonQServiceInitializationError(
                'Service features not initialized. Please ensure proper initialization.'
            )
        }

        this.features = features
        this.logging = features.logging

        this.handleDidChangeConfiguration = this.handleDidChangeConfiguration.bind(this)

        this.features.lsp.didChangeConfiguration(async () => {
            this.logging.debug('Received didChangeconfiguration event')
            await this.handleDidChangeConfiguration()
        })

        this.logging.debug('BaseAmazonQServiceManager functionality initialized')
    }
}
