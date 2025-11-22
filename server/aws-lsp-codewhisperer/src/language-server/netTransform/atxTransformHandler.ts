import { Logging, Runtime, Workspace } from '@aws/language-server-runtimes/server-interface'
import { ElasticGumbyFrontendClient, ListAvailableProfilesCommand } from '@amazon/elastic-gumby-frontend-client'
import { parse } from '@aws-sdk/util-arn-parser'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { DEFAULT_ATX_FES_ENDPOINT_URL, DEFAULT_ATX_FES_REGION, ATX_FES_REGION_ENV_VAR } from '../../shared/constants'

/**
 * ATX Transform Handler - Business logic for ATX FES Transform operations
 * Parallel to RTS TransformHandler but uses AtxTokenServiceManager and ATX FES APIs
 */
export class ATXTransformHandler {
    private serviceManager: AtxTokenServiceManager
    private workspace: Workspace
    private logging: Logging
    private runtime: Runtime
    private atxClient: ElasticGumbyFrontendClient | null = null
    private cachedApplicationUrl: string | null = null

    constructor(serviceManager: AtxTokenServiceManager, workspace: Workspace, logging: Logging, runtime: Runtime) {
        this.serviceManager = serviceManager
        this.workspace = workspace
        this.logging = logging
        this.runtime = runtime

        this.serviceManager.registerCacheCallback(() => this.clearApplicationUrlCache())
    }

    /**
     * Initialize ATX FES client
     */
    private async initializeAtxClient(): Promise<boolean> {
        try {
            let region = process.env[ATX_FES_REGION_ENV_VAR]

            if (!region) {
                region = await this.getRegionFromProfile()
            }

            if (!region) {
                region = DEFAULT_ATX_FES_REGION
            }

            const endpoint = process.env.TCP_ENDPOINT || DEFAULT_ATX_FES_ENDPOINT_URL

            this.clearApplicationUrlCache()

            this.atxClient = new ElasticGumbyFrontendClient({
                region: region,
                endpoint: endpoint,
            })

            return true
        } catch (error) {
            const region = process.env[ATX_FES_REGION_ENV_VAR] || DEFAULT_ATX_FES_REGION
            const endpoint = process.env.TCP_ENDPOINT || DEFAULT_ATX_FES_ENDPOINT_URL
            this.logging.log(
                `ATX FES Client: Failed to initialize with region: ${region}, endpoint: ${endpoint}. Error: ${error}`
            )
            return false
        }
    }

    private async getRegionFromProfile(): Promise<string | undefined> {
        try {
            if (!this.serviceManager.hasValidCredentials()) {
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
                try {
                    const parsed = parse(activeProfile.arn)
                    return parsed.region
                } catch {
                    return undefined
                }
            }

            return undefined
        } catch (error) {
            return undefined
        }
    }

    /**
     * Add bearer token and Origin header to ATX FES commands
     */
    private async addAuthToCommand(command: any): Promise<void> {
        if (!this.serviceManager.isReady()) {
            throw new Error('Please select a valid Transform profile to continue')
        }

        const bearerToken = await this.serviceManager.getBearerToken()
        const applicationUrl = await this.getActiveTransformProfileApplicationUrl()

        command.middlewareStack?.add(
            (next: any) => async (args: any) => {
                if (!args.request.headers) {
                    args.request.headers = {}
                }
                args.request.headers['Authorization'] = `Bearer ${bearerToken}`

                if (applicationUrl) {
                    const cleanOrigin = applicationUrl.endsWith('/') ? applicationUrl.slice(0, -1) : applicationUrl
                    args.request.headers['Origin'] = cleanOrigin
                }

                args.request.headers['Content-Type'] = 'application/json; charset=UTF-8'
                args.request.headers['Content-Encoding'] = 'amz-1.0'

                return next(args)
            },
            {
                step: 'build',
                name: 'addAtxAuthMiddleware',
                priority: 'high',
            }
        )
    }

    /**
     * List available Transform profiles from ATX FES
     */
    async listAvailableProfiles(maxResults: number = 100): Promise<{ profiles: any[] }> {
        if (!this.atxClient && !(await this.initializeAtxClient())) {
            throw new Error('ATX FES client not initialized')
        }

        const command = new ListAvailableProfilesCommand({
            maxResults: maxResults,
        })

        await this.addAuthToCommand(command)
        const response = await this.atxClient!.send(command)

        return { profiles: response.profiles || [] }
    }

    /**
     * Gets the applicationUrl for the active Transform profile with caching
     */
    async getActiveTransformProfileApplicationUrl(): Promise<string | null> {
        try {
            // Return cached URL if available (avoids expensive profile discovery)
            if (this.cachedApplicationUrl) {
                return this.cachedApplicationUrl
            }

            const response = await this.listAvailableProfiles(100)
            const profiles = response.profiles || []

            // For now, use the first available profile with applicationUrl
            // TODO: In future, get active profile ARN from service manager and match exactly
            const profileWithUrl = profiles.find((p: any) => p.applicationUrl)

            if (profileWithUrl && profileWithUrl.applicationUrl) {
                this.cachedApplicationUrl = profileWithUrl.applicationUrl
                return profileWithUrl.applicationUrl
            } else {
                this.logging.error('ATX FES: No Transform profile found with applicationUrl')
                return null
            }
        } catch (error) {
            this.logging.error(
                `ATX FES: Error getting applicationUrl: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Clear cached applicationUrl (for token refresh scenarios)
     */
    clearApplicationUrlCache(): void {
        this.cachedApplicationUrl = null
    }

    // TODO: Phase 2 - Implement remaining ATX FES APIs
}
