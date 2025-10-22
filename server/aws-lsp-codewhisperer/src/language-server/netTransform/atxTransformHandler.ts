import { Logging, Runtime, Workspace } from '@aws/language-server-runtimes/server-interface'
import { ElasticGumbyFrontendClient, ListAvailableProfilesCommand } from '@amazon/elastic-gumby-frontend-client'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { DEFAULT_ATX_FES_ENDPOINT_URL } from '../../shared/constants'

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
    }

    /**
     * Initialize ATX FES client
     */
    private async initializeAtxClient(): Promise<boolean> {
        try {
            const endpoint = process.env.TCP_ENDPOINT || DEFAULT_ATX_FES_ENDPOINT_URL

            this.atxClient = new ElasticGumbyFrontendClient({
                region: 'us-east-1',
                endpoint: endpoint,
            })

            return true
        } catch (error) {
            this.logging.log(`ATX FES Client: Failed to initialize: ${error}`)
            return false
        }
    }

    /**
     * Add bearer token and Origin header to ATX FES commands
     */
    private async addAuthToCommand(command: any): Promise<void> {
        if (!this.serviceManager.isReady()) {
            throw new Error('ATX Token Service Manager not ready')
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

        this.logging.log(`ATX FES: ListAvailableProfiles returned ${response.profiles?.length || 0} profiles`)
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
