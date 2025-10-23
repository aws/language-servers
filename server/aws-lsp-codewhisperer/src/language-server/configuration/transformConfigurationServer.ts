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
import { DEFAULT_ATX_FES_ENDPOINT_URL } from '../../shared/constants'
import { getBearerTokenFromProvider } from '../../shared/utils'

// Transform Configuration Sections
export const TRANSFORM_PROFILES_CONFIGURATION_SECTION = 'aws.transformProfiles'

/**
 * Transform Configuration Server - standalone server for ATX FES profile management
 * Completely separate from qConfigurationServer to maintain clean RTS/ATX FES separation
 */
export class TransformConfigurationServer {
    private atxClient: ElasticGumbyFrontendClient | null = null

    constructor(
        private readonly logging: Logging,
        private readonly credentialsProvider: CredentialsProvider
    ) {}

    /**
     * Initialize as standalone LSP server
     */
    async initialize(params: InitializeParams): Promise<any> {
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

            // Initialize ATX FES client
            this.atxClient = new ElasticGumbyFrontendClient({
                region: 'us-east-1',
                endpoint: DEFAULT_ATX_FES_ENDPOINT_URL,
            })

            return true
        } catch (error) {
            this.logging.error(`TransformConfigurationServer: Failed to initialize ATX client: ${error}`)
            return false
        }
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
     */
    async listAvailableProfiles(token: CancellationToken): Promise<AmazonQDeveloperProfile[]> {
        try {
            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('TransformConfigurationServer: Failed to initialize ATX FES client')
                return []
            }

            const command = new ListAvailableProfilesCommand({
                maxResults: 100,
            })

            await this.addBearerTokenToCommand(command)
            const response = await this.atxClient!.send(command)

            this.logging.log(
                `TransformConfigurationServer: ATX FES returned ${response.profiles?.length || 0} profiles`
            )

            // Convert ATX FES profiles to AmazonQDeveloperProfile format
            const transformProfiles: AmazonQDeveloperProfile[] = (response.profiles || []).map((profile: any) => {
                const convertedProfile = {
                    arn: profile.arn || '',
                    name: profile.profileName || profile.applicationUrl || 'Unnamed Transform Profile',
                    applicationUrl: (profile.applicationUrl || '').replace(/\/$/, ''), // Strip trailing slash
                    identityDetails: {
                        region: profile.region || 'us-east-1',
                        accountId: profile.accountId || '',
                    },
                }

                return convertedProfile
            })

            return transformProfiles
        } catch (error) {
            this.logging.error(`TransformConfigurationServer: ListAvailableProfiles failed: ${error}`)
            return []
        }
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
                return transformConfigurationServer.getConfiguration(params, token)
            }
        )

        return () => {}
    }
}
