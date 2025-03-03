import {
    Logging,
    UpdateConfigurationParams,
    ResponseError,
    Lsp,
    ErrorCodes,
} from '@aws/language-server-runtimes/server-interface'
import { EventEmitter } from 'node:events'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../constants'

export const builderIdStartUrl = 'https://view.awsapps.com/start'

interface AmazonQUpdateConfigurationParams {
    section: 'amazon.q'
    settings: AmazonQConfig
}

interface AmazonQConfig {
    profileArn?: string
    ssoStartUrl?: string
    // Add other amazon.q specific fields here if needed
}

// Type for all possible configuration sections
interface ConfigurationMap {
    'amazon.q': AmazonQConfig
    // Add other section types here if needed
    [key: string]: any // For other sections that don't have specific types yet
}

export class UpdateConfigurationHandler extends EventEmitter {
    private static instance: UpdateConfigurationHandler | null = null
    private features?: { lsp: Lsp; logging: Logging }
    private logging?: Logging
    private configurationCache: Map<keyof ConfigurationMap, ConfigurationMap[keyof ConfigurationMap]> = new Map()
    private currentRegion?: string = DEFAULT_AWS_Q_REGION

    private constructor() {
        super()
    }

    public static getInstance(features: { lsp: Lsp; logging: Logging }): UpdateConfigurationHandler {
        if (!UpdateConfigurationHandler.instance) {
            UpdateConfigurationHandler.instance = new UpdateConfigurationHandler()
            UpdateConfigurationHandler.instance.initialize(features)
        }
        return UpdateConfigurationHandler.instance
    }

    private initialize(features: { lsp: Lsp; logging: Logging }): void {
        this.features = features
        this.logging = features.logging
        this.setupConfigurationListener()
    }

    private setupConfigurationListener(): void {
        if (!this.features) {
            throw new Error('Features not initialized')
        }

        this.logging?.log(`Amazon Q server: setting Q Language Server Configuration handler`)

        this.features.lsp.workspace.onUpdateConfiguration(async (params: UpdateConfigurationParams) => {
            try {
                if (params.section === 'amazon.q') {
                    await this.handleConfigurationChange({
                        section: 'amazon.q',
                        settings: params.settings,
                    })
                }
            } catch (error) {
                this.logging?.log(`Error handling configuration change: ${error}`)
                return new ResponseError(ErrorCodes.InternalError, 'Failed to update configuration')
            }
        })
    }

    private async handleConfigurationChange(params: AmazonQUpdateConfigurationParams): Promise<void> {
        if (!params.section) {
            throw new Error('Configuration section must be specified')
        }

        if (params.settings === undefined) {
            throw new Error('Settings cannot be undefined')
        }

        if (params.section !== 'amazon.q') {
            return
        }

        const cachedProfileArn = this.configurationCache.get('amazon.q')?.profileArn
        const newProfileArn = params.settings?.profileArn

        // TODO: Validation
        // Fetch and validate profile is active
        // Validate that SSO type is matches, etc.

        // Check if the profile ARN has changed
        if (newProfileArn !== cachedProfileArn) {
            let newRegion
            let newEndpoint
            if (params.settings.ssoStartUrl === builderIdStartUrl) {
                newRegion = DEFAULT_AWS_Q_ENDPOINT_URL
                newEndpoint = DEFAULT_AWS_Q_ENDPOINT_URL
            } else {
                // TODO: process other types.
                // If IDC: get correct region/endpoint
                newRegion = 'set-new-region'
                newEndpoint = 'set-new-endpoint'
            }

            // Emit the change event with the new profile ARN
            this.emit('profileArnChanged', {
                oldValue: cachedProfileArn,
                newValue: newProfileArn,
                newRegion: newRegion, // TODO: select region
                endpoint: newEndpoint, // TODO: select endpoint
            })
        }

        // Update cache
        this.configurationCache.set(params.section, params.settings)
    }

    // Optional: Method to reset the singleton instance (mainly for testing purposes)
    public static resetInstance(): void {
        UpdateConfigurationHandler.instance = null
    }
}
