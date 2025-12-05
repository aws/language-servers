import {
    CancellationToken,
    GetConfigurationFromServerParams,
    InitializeParams,
    Logging,
    LSPErrorCodes,
    ResponseError,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { AmazonQDeveloperProfile } from '../../shared/amazonQServiceManager/qDeveloperProfiles'
import { ElasticGumbyFrontendClient, ListAvailableProfilesCommand } from '@amazon/elastic-gumby-frontend-client'
import { getATXEndpoints } from '../../shared/constants'
import {
    QServiceManagerFeatures,
    AmazonQBaseServiceManager,
} from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'

// Transform Configuration Sections
export const TRANSFORM_PROFILES_CONFIGURATION_SECTION = 'aws.transformProfiles'
export const ATX_TRANSFORM_PROFILES_CONFIGURATION_SECTION = 'aws.atx.transformProfiles'
export const ATX_CONFIGURATION_SECTION = 'aws.atx'

/**
 * Transform Configuration Server - standalone server for ATX FES profile management
 * Completely separate from qConfigurationServer to maintain clean RTS/ATX FES separation
 */
export class TransformConfigurationServer {
    private atxClient: ElasticGumbyFrontendClient | null = null

    constructor(
        private readonly logging: Logging,
        private readonly features: QServiceManagerFeatures
    ) {
        this.logging.log('TransformConfigurationServer: Constructor called - server created')
        this.logging.log(`TransformConfigurationServer: Features runtime available: ${!!this.features.runtime}`)
        this.logging.log(`TransformConfigurationServer: Features keys: ${Object.keys(this.features).join(', ')}`)
    }

    /**
     * Initialize as standalone LSP server
     */
    async initialize(params: InitializeParams): Promise<any> {
        this.logging.log('TransformConfigurationServer: Initialize called')

        return {
            capabilities: {},
            awsServerCapabilities: {
                configurationProvider: {
                    sections: [TRANSFORM_PROFILES_CONFIGURATION_SECTION, ATX_TRANSFORM_PROFILES_CONFIGURATION_SECTION],
                },
            },
        }
    }

    /**
     * Handle configuration requests for Transform profiles
     */
    async getConfiguration(params: GetConfigurationFromServerParams, token: CancellationToken): Promise<any> {
        this.logging.log(`TransformConfigurationServer: Configuration requested for section: ${params.section}`)

        switch (params.section) {
            case TRANSFORM_PROFILES_CONFIGURATION_SECTION:
            case ATX_TRANSFORM_PROFILES_CONFIGURATION_SECTION:
                const profiles = await this.listAvailableProfiles(token)
                return profiles
            default:
                throw new ResponseError(
                    LSPErrorCodes.RequestFailed,
                    `TransformConfigurationServer: Unsupported configuration section: ${params.section}`
                )
        }
    }

    /**
     * Add bearer token authentication to ATX FES command
     */
    private async addBearerTokenToCommand(command: any): Promise<void> {
        try {
            const runtime = this.features.runtime
            const atxCredentialsProvider = runtime?.getAtxCredentialsProvider?.()

            if (!atxCredentialsProvider) {
                throw new Error('ATX credentials provider not available')
            }

            const hasCredentials = atxCredentialsProvider.hasCredentials('bearer')

            if (!hasCredentials) {
                throw new Error('No ATX bearer credentials available')
            }

            const credentials = atxCredentialsProvider.getCredentials('bearer')
            if (!credentials || !('token' in credentials) || !credentials.token) {
                throw new Error('Bearer token is null or empty')
            }

            command.middlewareStack?.add(
                (next: any) => async (args: any) => {
                    args.request.headers = {
                        ...args.request.headers,
                        Authorization: `Bearer ${credentials.token}`,
                    }
                    return next(args)
                },
                { step: 'build', priority: 'high' }
            )
        } catch (error) {
            this.logging.error(`TransformConfigurationServer: Failed to add ATX bearer token: ${error}`)
            throw error
        }
    }

    /**
     * List available Transform profiles using ATX FES ListAvailableProfiles API
     * Uses multi-region discovery similar to RTS approach
     */
    async listAvailableProfiles(token: CancellationToken): Promise<AmazonQDeveloperProfile[]> {
        try {
            const allProfiles: AmazonQDeveloperProfile[] = []

            for (const [region, endpoint] of getATXEndpoints()) {
                try {
                    if (token?.isCancellationRequested) {
                        throw new ResponseError(LSPErrorCodes.RequestCancelled, 'Request cancelled')
                    }

                    const profiles = await this.listAvailableProfilesForRegion(region, endpoint)
                    allProfiles.push(...profiles)
                    this.logging.log(
                        `TransformConfigurationServer: Found ${profiles.length} profiles in region ${region}`
                    )
                } catch (error) {
                    this.logging.debug(
                        `TransformConfigurationServer: No profiles in region ${region}: ${String(error)}`
                    )
                }
            }

            this.logging.log(
                `TransformConfigurationServer: Total ${allProfiles.length} Transform profiles found across all regions`
            )

            // Cache profiles in AtxTokenServiceManager for ARN-based lookup
            try {
                const { AtxTokenServiceManager } = await import(
                    '../../shared/amazonQServiceManager/AtxTokenServiceManager'
                )
                const atxServiceManager = AtxTokenServiceManager.getInstance()

                atxServiceManager.cacheTransformProfiles(allProfiles)

                // Auto-select first profile if only one exists (for testing)
                if (allProfiles.length === 1) {
                    const firstProfile = allProfiles[0] as any
                    if (firstProfile.arn && firstProfile.applicationUrl) {
                        atxServiceManager.setActiveProfileByArn(firstProfile.arn)
                        this.logging.log(`TransformConfigurationServer: Auto-selected single profile`)
                    }
                }
            } catch (error) {
                this.logging.error(`TransformConfigurationServer: Failed to cache profiles: ${String(error)}`)
            }

            return allProfiles
        } catch (error) {
            this.logging.warn(`TransformConfigurationServer: ListAvailableProfiles failed: ${String(error)}`)
            return []
        }
    }

    /**
     * List available profiles for a specific region (similar to RTS listAvailableCustomizationsForProfileAndRegion)
     */
    private async listAvailableProfilesForRegion(region: string, endpoint: string): Promise<AmazonQDeveloperProfile[]> {
        this.logging.log(`TransformConfigurationServer: Querying region: ${region}, endpoint: ${endpoint}`)

        try {
            // Create region-specific client (similar to RTS approach)
            const regionClient = new ElasticGumbyFrontendClient({
                region: region,
                endpoint: endpoint,
            })

            const command = new ListAvailableProfilesCommand({
                maxResults: 100,
            })

            await this.addBearerTokenToCommand(command)

            const response = await regionClient.send(command)

            // Convert ATX FES profiles to AmazonQDeveloperProfile format
            const transformProfiles: AmazonQDeveloperProfile[] = (response.profiles || []).map((profile: any) => {
                const convertedProfile = {
                    arn: profile.arn || '',
                    name: profile.profileName || profile.applicationUrl || 'Unnamed Transform Profile',
                    applicationUrl: (profile.applicationUrl || '').replace(/\/$/, ''), // Strip trailing slash
                    identityDetails: {
                        region: region,
                        accountId: profile.accountId || '',
                    },
                }

                return convertedProfile
            })

            this.logging.log(
                `TransformConfigurationServer: Converted ${transformProfiles.length} profiles for region: ${region}`
            )
            return transformProfiles
        } catch (error) {
            this.logging.error(`TransformConfigurationServer: Error querying region ${region}: ${error}`)
            return []
        }
    }
}

/**
 * Transform Configuration Server Token - creates standalone Transform configuration server
 */
export const TransformConfigurationServerToken = (serviceManager: () => AmazonQBaseServiceManager): Server => {
    return ({ credentialsProvider, lsp, logging, runtime, workspace, sdkInitializator }) => {
        let transformConfigurationServer: TransformConfigurationServer

        lsp.addInitializer(async params => {
            // Get features from the initialized service manager, but use the runtime from server parameters
            const manager = serviceManager()
            const features = {
                ...(manager as any).features,
                runtime: runtime, // Use the runtime from server parameters instead of service manager
            } as QServiceManagerFeatures
            transformConfigurationServer = new TransformConfigurationServer(logging, features)
            return transformConfigurationServer.initialize(params)
        })

        lsp.extensions.onGetConfigurationFromServer(
            async (params: GetConfigurationFromServerParams, token: CancellationToken) => {
                logging.log('TransformConfigurationServer: onGetConfigurationFromServer handler called')
                return transformConfigurationServer.getConfiguration(params, token)
            }
        )

        return () => {}
    }
}
