import {
    CancellationToken,
    CredentialsProvider,
    GetConfigurationFromServerParams,
    InitializeParams,
    Logging,
    LSPErrorCodes,
    ResponseError,
    Server,
    BearerCredentials,
} from '@aws/language-server-runtimes/server-interface'
import { AmazonQDeveloperProfile } from '../../shared/amazonQServiceManager/qDeveloperProfiles'
import { ElasticGumbyFrontendClient, ListAvailableProfilesCommand } from '@amazon/elastic-gumby-frontend-client'
import {
    DEFAULT_ATX_FES_ENDPOINT_URL,
    DEFAULT_ATX_FES_REGION,
    ATX_FES_REGION_ENV_VAR,
    ATX_FES_ENDPOINT_URL_ENV_VAR,
    getATXEndpoints,
} from '../../shared/constants'
import { getBearerTokenFromProvider } from '../../shared/utils'

// Transform Configuration Sections
export const TRANSFORM_PROFILES_CONFIGURATION_SECTION = 'aws.atx.transformProfiles'
export const ATX_CONFIGURATION_SECTION = 'aws.atx'

/**
 * Transform Configuration Server - standalone server for ATX FES profile management
 * Completely separate from qConfigurationServer to maintain clean RTS/ATX FES separation
 */
export class TransformConfigurationServer {
    private atxClient: ElasticGumbyFrontendClient | null = null

    constructor(
        private readonly logging: Logging,
        private readonly credentialsProvider: CredentialsProvider
    ) {
        this.logging.log('TransformConfigurationServer: Constructor called - server created')
    }

    /**
     * Initialize as standalone LSP server
     */
    async initialize(params: InitializeParams): Promise<any> {
        this.logging.log('TransformConfigurationServer: Initialize called')

        // const profileType = (params.initializationOptions as any)?.aws?.profileType

        // if (profileType !== 'transform') {
        //     this.logging.log('TransformConfigurationServer: Not Transform Profile')
        //     return {
        //         capabilities: {},
        //         awsServerCapabilities: {},
        //     }
        // }

        this.logging.log('TransformConfigurationServer: Transform Profile intialized section aws.transfomProfiles')

        return {
            capabilities: {},
            awsServerCapabilities: {
                configurationProvider: {
                    sections: [TRANSFORM_PROFILES_CONFIGURATION_SECTION],
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
     * Initialize ATX FES client with bearer token authentication
     */
    private async initializeAtxClient(): Promise<boolean> {
        try {
            if (!this.credentialsProvider?.hasCredentials('bearer')) {
                return false
            }

            const credentials = (await this.credentialsProvider.getCredentials('bearer')) as BearerCredentials
            if (!credentials?.token) {
                return false
            }

            const region = await this.getClientRegion()
            const endpoint = this.getEndpointForRegion(region)

            this.logging.log(
                `TransformConfigurationServer: Initializing ATX client with region: ${region}, endpoint: ${endpoint}`
            )

            this.atxClient = new ElasticGumbyFrontendClient({
                region: region,
                endpoint: endpoint,
            })

            return true
        } catch (error) {
            const region = await this.getClientRegion()
            const endpoint = this.getEndpointForRegion(region)
            this.logging.warn(
                `TransformConfigurationServer: Failed to initialize ATX client with region: ${region}, endpoint: ${endpoint}. Error: ${error}`
            )
            return false
        }
    }

    /**
     * Get region for ATX FES client - supports dynamic region selection
     */
    private async getClientRegion(): Promise<string> {
        // Check environment variable first
        const envRegion = process.env[ATX_FES_REGION_ENV_VAR]
        if (envRegion) {
            return envRegion
        }

        // Try to get region from profile
        const profileRegion = await this.getRegionFromProfile()
        if (profileRegion) {
            return profileRegion
        }

        // Fall back to default
        return DEFAULT_ATX_FES_REGION
    }

    private async getRegionFromProfile(): Promise<string | undefined> {
        try {
            if (!this.credentialsProvider?.hasCredentials('bearer')) {
                return undefined
            }

            const tempClient = new ElasticGumbyFrontendClient({
                region: DEFAULT_ATX_FES_REGION,
                endpoint: DEFAULT_ATX_FES_ENDPOINT_URL,
            })

            const command = new ListAvailableProfilesCommand({ maxResults: 100 })
            const response = await tempClient.send(command)
            const profiles = response.profiles || []

            const activeProfile = profiles.find((p: any) => p.arn)
            if (activeProfile?.arn) {
                const arnParts = activeProfile.arn.split(':')
                if (arnParts.length >= 4) {
                    return arnParts[3]
                }
            }

            return undefined
        } catch (error) {
            return undefined
        }
    }

    /**
     * Get endpoint URL for the specified region
     */
    private getEndpointForRegion(region: string): string {
        return (
            process.env[ATX_FES_ENDPOINT_URL_ENV_VAR] || getATXEndpoints().get(region) || DEFAULT_ATX_FES_ENDPOINT_URL
        )
    }

    /**
     * Add bearer token authentication to ATX FES command
     */
    private async addBearerTokenToCommand(command: any): Promise<void> {
        const credentials = (await this.credentialsProvider.getCredentials('bearer')) as BearerCredentials
        if (!credentials?.token) {
            throw new Error('No bearer token available for ATX FES authentication')
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
                    this.logging.debug(`TransformConfigurationServer: No profiles in region ${region}: ${error}`)
                }
            }

            this.logging.log(
                `TransformConfigurationServer: Total ${allProfiles.length} Transform profiles found across all regions`
            )
            return allProfiles
        } catch (error) {
            this.logging.warn(`TransformConfigurationServer: ListAvailableProfiles failed: ${error}`)
            return []
        }
    }

    /**
     * List available profiles for a specific region (similar to RTS listAvailableCustomizationsForProfileAndRegion)
     */
    private async listAvailableProfilesForRegion(region: string, endpoint: string): Promise<AmazonQDeveloperProfile[]> {
        this.logging.log(`TransformConfigurationServer: Querying region: ${region}, endpoint: ${endpoint}`)

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

        return transformProfiles
    }
}

/**
 * Transform Configuration Server Token - creates standalone Transform configuration server
 */
export const TransformConfigurationServerToken = (): Server => {
    return ({ credentialsProvider, lsp, logging }) => {
        let transformConfigurationServer: TransformConfigurationServer

        lsp.addInitializer(async params => {
            transformConfigurationServer = new TransformConfigurationServer(logging, credentialsProvider)
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
