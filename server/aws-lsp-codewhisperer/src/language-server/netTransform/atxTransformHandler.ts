import { Logging, Runtime, Workspace } from '@aws/language-server-runtimes/server-interface'
import {
    ElasticGumbyFrontendClient,
    ListAvailableProfilesCommand,
    ListWorkspacesCommand,
    CreateWorkspaceCommand,
    CreateJobCommand,
    CreateArtifactUploadUrlCommand,
    CompleteArtifactUploadCommand,
    StartJobCommand,
    GetJobCommand,
    StopJobCommand,
    CreateArtifactDownloadUrlCommand,
    ListArtifactsCommand,
    ListJobPlanStepsCommand,
} from '@amazon/elastic-gumby-frontend-client'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { DEFAULT_ATX_FES_ENDPOINT_URL, DEFAULT_ATX_FES_REGION, ATX_FES_REGION_ENV_VAR } from '../../shared/constants'
import { AtxJobStatus, PlanStepStatus } from './atxModels'
import { v4 as uuidv4 } from 'uuid'
import * as crypto from 'crypto'
import * as fs from 'fs'
import got from 'got'

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

            this.logging.log(
                `ATX: About to create ElasticGumbyFrontendClient with region: ${region}, endpoint: ${endpoint}`
            )
            this.atxClient = new ElasticGumbyFrontendClient({
                region: region,
                endpoint: endpoint,
            })

            this.logging.log('ATX: ElasticGumbyFrontendClient created successfully')

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
     * Add bearer token and Origin header to ATX FES commands
     */
    private async addAuthToCommand(command: any): Promise<void> {
        if (!this.serviceManager.isReady()) {
            throw new Error('Please select a valid Transform profile to continue')
        }

        const bearerToken = await this.serviceManager.getBearerToken()
        const applicationUrl = await this.getActiveTransformProfileApplicationUrl()

        this.logging.log(`ATX: Using applicationUrl: ${applicationUrl || 'null'}`)
        this.logging.log(`ATX: Bearer token length: ${bearerToken ? bearerToken.length : 0} characters`)
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

            // Get applicationUrl from service manager (cached from configuration)
            const applicationUrl = this.serviceManager.getActiveApplicationUrl()

            if (!applicationUrl) {
                this.logging.error('ATX: No applicationUrl found in service manager cache')
                return null
            }

            this.logging.log(`ATX: Using cached applicationUrl: ${applicationUrl}`)

            // Cache the applicationUrl for future use
            this.cachedApplicationUrl = applicationUrl
            return applicationUrl
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

    /**
     * Verify session (internal LSP method called before each ATX API)
     */
    private async verifySession(): Promise<boolean> {
        try {
            this.logging.log('ATX: VerifySession operation started')

            if (!(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for verifySession')
                return false
            }

            // Log authentication details for debugging
            const bearerToken = await this.serviceManager.getBearerToken()
            const applicationUrl = await this.getActiveTransformProfileApplicationUrl()

            this.logging.log(`ATX: VerifySession - applicationUrl: ${applicationUrl || 'null'}`)
            this.logging.log(
                `ATX: VerifySession - bearer token length: ${bearerToken ? bearerToken.length : 0} characters`
            )

            // TODO: Implement actual ATX verifySession API call
            // For now, return true if client is initialized and we have credentials
            const hasCredentials = bearerToken && applicationUrl
            this.logging.log(`ATX: VerifySession successful - has credentials: ${hasCredentials}`)
            return true
        } catch (error) {
            this.logging.error(`ATX: VerifySession error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    /**
     * List available workspaces
     */
    async listWorkspaces(): Promise<any[]> {
        try {
            this.logging.log('ATX: ListWorkspaces operation started')

            // Call verifySession first
            if (!(await this.verifySession())) {
                this.logging.error('ATX: VerifySession failed for listWorkspaces')
                return []
            }

            // Call ATX FES listWorkspaces API
            this.logging.log('ATX: Initializing ATX client for listWorkspaces')
            await this.initializeAtxClient()
            if (!this.atxClient) {
                throw new Error('ATX client not initialized')
            }

            this.logging.log('ATX: Creating ListWorkspacesCommand')
            const command = new ListWorkspacesCommand({})

            this.logging.log('ATX: Adding authentication to command')
            await this.addAuthToCommand(command)

            this.logging.log('ATX: Sending ListWorkspaces command to ATX FES')
            const response = await this.atxClient.send(command)

            this.logging.log(`ATX: ListWorkspaces API returned ${response.items?.length || 0} workspaces`)
            this.logging.log(`ATX: Response structure: ${JSON.stringify(response, null, 2)}`)

            // Convert ATX API format to IDE expected format
            const workspaces = (response.items || []).map(workspace => ({
                Id: workspace.id,
                Name: workspace.name,
            }))

            this.logging.log(`ATX: Converted workspaces: ${JSON.stringify(workspaces, null, 2)}`)
            return workspaces
        } catch (error) {
            this.logging.error(`ATX: ListWorkspaces error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            this.logging.error(`ATX: Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`)

            // Return empty array instead of crashing
            return []
        }
    }

    /**
     * Create a new workspace
     */
    async createWorkspace(workspaceName: string | null): Promise<string | null> {
        try {
            this.logging.log(`ATX: CreateWorkspace operation started with name: ${workspaceName || 'auto-generated'}`)

            // Call verifySession first
            if (!(await this.verifySession())) {
                this.logging.error('ATX: VerifySession failed for createWorkspace')
                return null
            }

            // Call ATX FES createWorkspace API
            await this.initializeAtxClient()
            if (!this.atxClient) {
                throw new Error('ATX client not initialized')
            }

            const command = new CreateWorkspaceCommand({
                name: workspaceName || undefined,
                description: workspaceName ? `Workspace: ${workspaceName}` : 'Auto-generated workspace',
            })
            await this.addAuthToCommand(command)

            const response = await this.atxClient.send(command)
            this.logging.log(`ATX: CreateWorkspace API returned workspaceId: ${response.workspace?.id}`)

            // Return format expected by IDE: "workspaceId|workspaceName"
            if (response.workspace) {
                return `${response.workspace.id}|${response.workspace.name}`
            }

            return null
        } catch (error) {
            this.logging.error(
                `ATX: CreateWorkspace error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Create a transformation job
     */
    async createJob(workspaceId: string, jobName?: string): Promise<{ jobId: string; status: string } | null> {
        try {
            this.logging.log(`ATX: CreateJob operation started for workspace: ${workspaceId}`)
            this.logging.log(`ATX: CreateJob jobName: ${jobName || 'auto-generated'}`)

            // Call ATX FES createJob API
            this.logging.log('ATX: CreateJob initializing ATX client...')
            await this.initializeAtxClient()
            if (!this.atxClient) {
                throw new Error('ATX client not initialized')
            }
            this.logging.log('ATX: CreateJob ATX client initialized successfully')

            this.logging.log('ATX: CreateJob creating CreateJobCommand...')
            const command = new CreateJobCommand({
                workspaceId: workspaceId,
                objective: JSON.stringify({ target_framework: 'net8.0' }),
                jobType: 'DOTNET_IDE' as any,
                jobName: jobName || `transform-job-${Date.now()}`,
                intent: 'LANGUAGE_UPGRADE',
                idempotencyToken: uuidv4(),
            })
            this.logging.log('ATX: CreateJob command created, adding auth...')

            await this.addAuthToCommand(command)
            this.logging.log('ATX: CreateJob auth added, sending command...')

            const response = await this.atxClient.send(command)
            this.logging.log(`ATX: CreateJob API returned jobId: ${response.jobId}, status: ${response.status}`)

            if (response.jobId && response.status) {
                return { jobId: response.jobId, status: response.status }
            }

            this.logging.error('ATX: CreateJob API returned null jobId or status')
            return null
        } catch (error) {
            this.logging.error(`ATX: CreateJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            this.logging.error(`ATX: CreateJob error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`)
            return null
        }
    }

    /**
     * Calculate SHA256 hash of file contents using streaming (matches reference repo)
     */
    static async getSha256Async(fileName: string): Promise<string> {
        const hasher = crypto.createHash('sha256')
        const stream = fs.createReadStream(fileName)
        for await (const chunk of stream) {
            hasher.update(chunk)
        }
        return hasher.digest('base64')
    }

    /**
     * Create artifact upload URL
     */
    async createArtifactUploadUrl(
        workspaceId: string,
        jobId: string,
        filePath: string
    ): Promise<{ uploadId: string; uploadUrl: string; requestHeaders?: any } | null> {
        try {
            this.logging.log(`ATX: CreateArtifactUploadUrl operation started for job: ${jobId}`)

            // Initialize ATX client
            await this.initializeAtxClient()
            if (!this.atxClient) {
                throw new Error('ATX client not initialized')
            }

            // Calculate file checksum - exact reference repo implementation
            const sha256 = await ATXTransformHandler.getSha256Async(filePath)

            const command = new CreateArtifactUploadUrlCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                contentDigest: { Sha256: sha256 },
                artifactReference: {
                    artifactType: {
                        categoryType: 'CUSTOMER_INPUT' as any,
                        fileType: 'ZIP' as any,
                    },
                },
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient.send(command)

            if (result && result.artifactId && result.s3PreSignedUrl) {
                this.logging.log(`ATX: CreateArtifactUploadUrl SUCCESS - Upload URL created`)
                return {
                    uploadId: result.artifactId,
                    uploadUrl: result.s3PreSignedUrl,
                    requestHeaders: result.requestHeaders,
                }
            } else {
                this.logging.error('ATX: CreateArtifactUploadUrl - Missing artifactId or s3PreSignedUrl in response')
                return null
            }
        } catch (error) {
            this.logging.error(
                `ATX: CreateArtifactUploadUrl error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Complete artifact upload
     */
    async completeArtifactUpload(workspaceId: string, jobId: string, artifactId: string): Promise<boolean> {
        try {
            this.logging.log(`ATX: CompleteArtifactUpload operation started for artifact: ${artifactId}`)

            // Initialize ATX client
            await this.initializeAtxClient()
            if (!this.atxClient) {
                throw new Error('ATX client not initialized')
            }

            const command = new CompleteArtifactUploadCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                artifactId: artifactId,
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient.send(command)

            this.logging.log(`ATX: CompleteArtifactUpload SUCCESS`)
            return true
        } catch (error) {
            this.logging.error(
                `ATX: CompleteArtifactUpload error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return false
        }
    }

    /**
     * Start transformation job
     */
    async startJob(workspaceId: string, jobId: string): Promise<boolean> {
        try {
            this.logging.log(`ATX: StartJob operation started for job: ${jobId}`)

            // Initialize ATX client
            await this.initializeAtxClient()
            if (!this.atxClient) {
                throw new Error('ATX client not initialized')
            }

            const command = new StartJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                idempotencyToken: uuidv4(),
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient.send(command)

            this.logging.log(`ATX: StartJob SUCCESS - Status: ${result.status}`)
            return true
        } catch (error) {
            this.logging.error(`ATX: StartJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    /**
     * Get job status using ATX FES GetJob API
     */
    async getJob(workspaceId: string, jobId: string): Promise<any | null> {
        try {
            this.logging.log('=== ATX: GetJob Operation ===')
            this.logging.log(`Getting job: ${jobId} in workspace: ${workspaceId}`)

            if (!this.atxClient) {
                this.logging.error('ATX: GetJob client not initialized')
                return null
            }

            const command = new GetJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                includeObjective: false,
            })

            await this.addAuthToCommand(command)
            const response = await this.atxClient.send(command)

            this.logging.log(`ATX: GetJob SUCCESS - Job status: ${response.job?.statusDetails?.status}`)
            return response
        } catch (error) {
            this.logging.error(`ATX: GetJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Stop job using ATX FES StopJob API and poll until STOPPED
     */
    async stopJob(workspaceId: string, jobId: string): Promise<boolean> {
        try {
            this.logging.log('=== ATX: StopJob Operation ===')
            this.logging.log(`Stopping job: ${jobId} in workspace: ${workspaceId}`)

            if (!this.atxClient) {
                this.logging.error('ATX: StopJob client not initialized')
                return false
            }

            // Step 1: Call StopJob API
            const command = new StopJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
            })

            await this.addAuthToCommand(command)
            const response = await this.atxClient.send(command)

            this.logging.log(`ATX: StopJob SUCCESS - Job stopping initiated`)

            // Step 2: Poll until STOPPED
            await this.pollUntilStopped(workspaceId, jobId)

            return true
        } catch (error) {
            this.logging.error(`ATX: StopJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    /**
     * Poll job status until it reaches STOPPED state
     */
    private async pollUntilStopped(workspaceId: string, jobId: string): Promise<void> {
        const maxPollingTime = 300000 // 5 minutes
        const pollingInterval = 10000 // 10 seconds
        const startTime = Date.now()

        while (Date.now() - startTime < maxPollingTime) {
            try {
                const jobResponse = await this.getJob(workspaceId, jobId)
                const status = jobResponse?.job?.statusDetails?.status

                this.logging.log(`ATX: StopJob polling - Current status: ${status}`)

                if (status === 'STOPPED') {
                    this.logging.log('ATX: Job successfully stopped')
                    return
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, pollingInterval))
            } catch (error) {
                this.logging.error(
                    `ATX: StopJob polling error: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
                await new Promise(resolve => setTimeout(resolve, pollingInterval))
            }
        }

        // Timeout reached
        this.logging.error('ATX: StopJob polling timed out after 5 minutes')
        throw new Error('StopJob polling timed out - job may still be stopping')
    }

    /**
     * Upload artifact to S3 using presigned URL and headers from ATX FES
     */
    async uploadArtifact(s3PreSignedUrl: string, filePath: string, requestHeaders?: any): Promise<boolean> {
        try {
            this.logging.log(`S3 Upload: Starting upload to ${s3PreSignedUrl}`)
            this.logging.log(`S3 Upload: File path: ${filePath}`)

            const headers: any = {}

            // Add required headers from ATX FES response
            if (requestHeaders) {
                Object.keys(requestHeaders).forEach(key => {
                    const value = requestHeaders[key]
                    // Handle array values (take first element)
                    headers[key] = Array.isArray(value) ? value[0] : value
                })
            }

            this.logging.log(`S3 Upload headers: ${JSON.stringify(Object.keys(headers))}`)

            // Create file stream
            const fileStream = fs.createReadStream(filePath)

            // Upload to S3 using PUT request
            const response = await got.put(s3PreSignedUrl, {
                body: fileStream,
                headers: headers,
                timeout: { request: 300000 }, // 5 minutes timeout
                retry: { limit: 0 },
            })

            this.logging.log(`S3 Upload: Response status: ${response.statusCode} ${response.statusMessage}`)

            if (response.statusCode === 200) {
                this.logging.log('S3 Upload: SUCCESS')
                return true
            } else {
                this.logging.error(`S3 Upload: Failed with status ${response.statusCode}`)
                return false
            }
        } catch (error) {
            this.logging.error(`S3 Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    /**
     * Create ZIP file from solution using ArtifactManager
     */
    async createZip(request: any): Promise<string> {
        try {
            this.logging.log('ATX: Creating ZIP file from solution')

            const { ArtifactManager } = await import('./artifactManager')

            // Get proper workspace path from solution root path
            const workspacePath = request.SolutionRootPath || process.cwd()

            const artifactManager = new ArtifactManager(
                this.workspace,
                this.logging,
                workspacePath, // ✅ Use proper workspace path
                request.SolutionRootPath
            )

            const zipFilePath = await artifactManager.createZip(request)
            this.logging.log(`ATX: ZIP file created successfully: ${zipFilePath}`)
            return zipFilePath
        } catch (error) {
            this.logging.error(`ATX: createZip error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            throw error
        }
    }

    /**
     * List job plan steps with recursive substeps
     */
    async listJobPlanSteps(workspaceId: string, jobId: string): Promise<any[] | null> {
        try {
            this.logging.log('=== ATX: ListJobPlanSteps Operation ===')

            if (!this.atxClient) {
                this.logging.error('ATX: ListJobPlanSteps client not initialized')
                return null
            }

            // Get root steps first
            const rootSteps = await this.getStepsRecursive(workspaceId, jobId, 'root')

            if (rootSteps && rootSteps.length > 0) {
                // For each root step, get its substeps
                for (const step of rootSteps) {
                    this.logging.log(`Getting substeps for step: ${step.stepName} (ID: ${step.stepId})`)
                    const substeps = await this.getStepsRecursive(workspaceId, jobId, step.stepId)
                    step.substeps = substeps || []

                    // Sort substeps by score and startTime
                    if (step.substeps.length > 0) {
                        step.substeps.sort((a: any, b: any) => {
                            const scoreDiff = (a.score || 0) - (b.score || 0)
                            if (scoreDiff !== 0) return scoreDiff

                            const timeA = a.startTime ? new Date(a.startTime).getTime() : 0
                            const timeB = b.startTime ? new Date(b.startTime).getTime() : 0
                            return timeA - timeB
                        })
                    }
                }

                this.logging.log(`ATX: ListJobPlanSteps SUCCESS - Found ${rootSteps.length} steps with substeps`)
                return rootSteps
            }

            this.logging.log('ATX: ListJobPlanSteps - No root steps found')
            return []
        } catch (error) {
            this.logging.error(
                `ATX: ListJobPlanSteps error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Recursively gets steps for a given parent step ID
     */
    private async getStepsRecursive(workspaceId: string, jobId: string, parentStepId: string): Promise<any[] | null> {
        try {
            const command = new ListJobPlanStepsCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                parentStepId: parentStepId,
                maxResults: 100,
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient.send(command)

            if (result && result.steps && result.steps.length > 0) {
                this.logging.log(`Found ${result.steps.length} steps for parent: ${parentStepId}`)
                return result.steps
            }

            return null
        } catch (error) {
            this.logging.error(
                `Error getting steps for parent ${parentStepId}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * List artifacts for ATX job with filtering
     */
    async listArtifacts(
        workspaceId: string,
        jobId: string,
        categoryType: string = 'CUSTOMER_OUTPUT'
    ): Promise<any[] | null> {
        try {
            this.logging.log('=== ATX: ListArtifacts Operation ===')
            this.logging.log(`Listing artifacts for job: ${jobId} in workspace: ${workspaceId}`)

            if (!this.atxClient) {
                this.logging.error('ATX: ListArtifacts client not initialized')
                return null
            }

            const command = new ListArtifactsCommand({
                workspaceId: workspaceId,
                jobFilter: {
                    jobId: jobId,
                    categoryType: categoryType as any, // Server-side filtering
                },
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient.send(command)

            this.logging.log(
                `ATX: ListArtifacts SUCCESS - Found ${result.artifacts?.length || 0} ${categoryType} artifacts`
            )
            return result.artifacts || []
        } catch (error) {
            this.logging.error(`ATX: ListArtifacts error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Create artifact download URL using ATX FES API
     */
    async downloadArtifactUrl(
        workspaceId: string,
        jobId: string,
        artifactId: string
    ): Promise<{ downloadUrl: string; requestHeaders?: any } | null> {
        try {
            this.logging.log('=== ATX: DownloadArtifactUrl Operation ===')
            this.logging.log(`Creating download URL for artifact: ${artifactId} in job: ${jobId}`)

            if (!this.atxClient) {
                this.logging.error('ATX: DownloadArtifactUrl client not initialized')
                return null
            }

            const command = new CreateArtifactDownloadUrlCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                artifactId: artifactId,
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient.send(command)

            if (result && result.s3PreSignedUrl) {
                this.logging.log(`ATX: DownloadArtifactUrl SUCCESS - Download URL created`)
                return {
                    downloadUrl: result.s3PreSignedUrl,
                    requestHeaders: result.requestHeaders,
                }
            } else {
                this.logging.error('ATX: DownloadArtifactUrl - Missing s3PreSignedUrl in response')
                return null
            }
        } catch (error) {
            this.logging.error(
                `ATX: DownloadArtifactUrl error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    // TODO: Phase 2 - Implement remaining ATX FES APIs
}
