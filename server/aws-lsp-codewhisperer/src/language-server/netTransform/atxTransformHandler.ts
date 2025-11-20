import { Logging, Runtime, Workspace } from '@aws/language-server-runtimes/server-interface'
import * as fs from 'fs'
import * as crypto from 'crypto'
import {
    ElasticGumbyFrontendClient,
    ListAvailableProfilesCommand,
    CreateJobCommand,
    CreateArtifactUploadUrlCommand,
    CompleteArtifactUploadCommand,
    StartJobCommand,
} from '@amazon/elastic-gumby-frontend-client'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { DEFAULT_ATX_FES_ENDPOINT_URL, DEFAULT_ATX_FES_REGION, ATX_FES_REGION_ENV_VAR } from '../../shared/constants'
import { AtxListOrCreateWorkspaceRequest, AtxListOrCreateWorkspaceResponse, CategoryType, FileType } from './atxModels'
import { v4 as uuidv4 } from 'uuid'

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
            this.logging.log('DEBUG-ATX-INIT: Starting ATX client initialization')

            let region = process.env[ATX_FES_REGION_ENV_VAR]
            this.logging.log(`DEBUG-ATX-INIT: Environment region: ${region || 'not set'}`)

            if (!region) {
                // Try to get region from active profile
                region = await this.getRegionFromProfile()
                if (region) {
                    this.logging.log(`DEBUG-ATX-INIT: Using region from active profile: ${region}`)
                } else {
                    this.logging.log('DEBUG-ATX-INIT: No active profile region, using default region')
                    region = DEFAULT_ATX_FES_REGION
                    this.logging.log(`DEBUG-ATX-INIT: Using default region: ${region}`)
                }
            }

            const endpoint = process.env.TCP_ENDPOINT || DEFAULT_ATX_FES_ENDPOINT_URL
            this.logging.log(`DEBUG-ATX-INIT: Using endpoint: ${endpoint}`)

            this.clearApplicationUrlCache()
            this.logging.log('DEBUG-ATX-INIT: Cleared application URL cache')

            this.logging.log('DEBUG-ATX-INIT: About to create ElasticGumbyFrontendClient')
            this.atxClient = new ElasticGumbyFrontendClient({
                region: region,
                endpoint: endpoint,
            })
            this.logging.log('DEBUG-ATX-INIT: ElasticGumbyFrontendClient created successfully')

            return true
        } catch (error) {
            const region = process.env[ATX_FES_REGION_ENV_VAR] || DEFAULT_ATX_FES_REGION
            const endpoint = process.env.TCP_ENDPOINT || DEFAULT_ATX_FES_ENDPOINT_URL
            this.logging.log(
                `DEBUG-ATX-INIT: Failed to initialize with region: ${region}, endpoint: ${endpoint}. Error: ${error}`
            )
            return false
        }
    }

    private async getRegionFromProfile(): Promise<string | undefined> {
        try {
            this.logging.log('DEBUG-ATX-REGION: Starting getRegionFromProfile()')

            if (!this.serviceManager.hasValidCredentials()) {
                this.logging.log('DEBUG-ATX-REGION: No valid credentials, returning undefined')
                return undefined
            }
            this.logging.log('DEBUG-ATX-REGION: Valid credentials found')

            // Get active profile applicationURL and extract region from it
            const atxServiceManager = AtxTokenServiceManager.getInstance()
            const applicationUrl = atxServiceManager.getActiveApplicationUrl()

            if (applicationUrl) {
                // Extract region from applicationURL: https://xxx.transform.REGION.on.aws
                const urlMatch = applicationUrl.match(/\.transform\.([^.]+)\.on\.aws/)
                if (urlMatch && urlMatch[1]) {
                    const region = urlMatch[1]
                    this.logging.log(`DEBUG-ATX-REGION: Extracted region from applicationURL: ${region}`)
                    return region
                }
            }

            this.logging.log('DEBUG-ATX-REGION: No active applicationURL, using default region')
            return undefined
        } catch (error) {
            this.logging.log(
                `DEBUG-ATX-REGION: Error in getRegionFromProfile: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
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
                this.logging.log(`DEBUG-ATX-URL: Using cached applicationUrl: ${this.cachedApplicationUrl}`)
                return this.cachedApplicationUrl
            }

            // Get applicationUrl from service manager (cached from configuration)
            const applicationUrl = this.serviceManager.getActiveApplicationUrl()

            if (!applicationUrl) {
                this.logging.error('DEBUG-ATX-URL: No applicationUrl found in service manager cache')
                this.logging.error('DEBUG-ATX-URL: Profile not selected or not cached yet')
                return null
            }

            this.logging.log(`DEBUG-ATX-URL: Using service manager applicationUrl: ${applicationUrl}`)

            // Cache the applicationUrl for future use
            this.cachedApplicationUrl = applicationUrl
            return applicationUrl
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX-URL: Error getting applicationUrl: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            this.logging.log('DEBUG-ATX: VerifySession operation started')

            this.logging.log('DEBUG-ATX: About to call initializeAtxClient()')
            if (!(await this.initializeAtxClient())) {
                this.logging.error('DEBUG-ATX: Failed to initialize client for verifySession')
                return false
            }
            this.logging.log('DEBUG-ATX: initializeAtxClient() completed successfully')

            // Log authentication details for debugging
            this.logging.log('DEBUG-ATX: About to call getBearerToken()')
            const bearerToken = await this.serviceManager.getBearerToken()
            this.logging.log('DEBUG-ATX: getBearerToken() completed')

            this.logging.log('DEBUG-ATX: About to call getActiveTransformProfileApplicationUrl()')
            const applicationUrl = await this.getActiveTransformProfileApplicationUrl()
            this.logging.log('DEBUG-ATX: getActiveTransformProfileApplicationUrl() completed')

            this.logging.log(`DEBUG-ATX: VerifySession - applicationUrl: ${applicationUrl || 'null'}`)
            this.logging.log(
                `DEBUG-ATX: VerifySession - bearer token length: ${bearerToken ? bearerToken.length : 0} characters`
            )

            // Always return true like reference repo
            this.logging.log(`DEBUG-ATX: VerifySession successful`)
            return true
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX: VerifySession error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return false
        }
    }

    /**
     * List available workspaces
     */
    async listWorkspaces(): Promise<any[]> {
        try {
            this.logging.log('DEBUG-ATX: ListWorkspaces operation started')

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const { ListWorkspacesCommand } = await import('@amazon/elastic-gumby-frontend-client')
            const command = new ListWorkspacesCommand({})
            await this.addAuthToCommand(command)

            this.logging.log('DEBUG-ATX: Sending ListWorkspaces command to ATX FES')
            const response = await this.atxClient!.send(command)
            this.logging.log(`DEBUG-ATX: ListWorkspaces API returned ${response.items?.length || 0} workspaces`)

            // Convert ATX API format to IDE expected format
            const workspaces = (response.items || []).map(workspace => ({
                Id: workspace.id,
                Name: workspace.name,
                CreatedDate: new Date().toISOString(), // Use current date since createdDate not available
            }))

            this.logging.log(`DEBUG-ATX: Converted workspaces: ${JSON.stringify(workspaces, null, 2)}`)
            return workspaces
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX: ListWorkspaces error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return []
        }
    }

    /**
     * Create a new workspace
     */
    async createWorkspace(
        workspaceName: string | null
    ): Promise<{ workspaceId: string; workspaceName: string } | null> {
        try {
            this.logging.log(
                `DEBUG-ATX: CreateWorkspace operation started with name: ${workspaceName || 'auto-generated'}`
            )

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const { CreateWorkspaceCommand } = await import('@amazon/elastic-gumby-frontend-client')
            const command = new CreateWorkspaceCommand({
                name: workspaceName || undefined,
                description: workspaceName ? `Workspace: ${workspaceName}` : 'Auto-generated workspace',
            })
            await this.addAuthToCommand(command)

            this.logging.log('DEBUG-ATX: Sending CreateWorkspace command to ATX FES')
            const response = await this.atxClient!.send(command)
            this.logging.log(`DEBUG-ATX: CreateWorkspace API returned workspaceId: ${response.workspace?.id}`)

            if (response.workspace?.id && response.workspace?.name) {
                const result = {
                    workspaceId: response.workspace.id,
                    workspaceName: response.workspace.name,
                }
                this.logging.log(`DEBUG-ATX: CreateWorkspace success: ${JSON.stringify(result)}`)
                return result
            }

            this.logging.log('DEBUG-ATX: CreateWorkspace failed - no workspace in response')
            return null
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX: CreateWorkspace error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * List workspaces and optionally create new workspace (CONSOLIDATED API)
     */
    async listOrCreateWorkspace(
        request: AtxListOrCreateWorkspaceRequest
    ): Promise<AtxListOrCreateWorkspaceResponse | null> {
        try {
            this.logging.log('DEBUG-ATX: ListOrCreateWorkspace consolidated operation started')
            this.logging.log(`DEBUG-ATX: Request: ${JSON.stringify(request, null, 2)}`)

            // Call verifySession ONCE at the beginning
            if (!(await this.verifySession())) {
                this.logging.error('DEBUG-ATX: VerifySession failed for listOrCreateWorkspace')
                return null
            }

            // Always get list of existing workspaces
            this.logging.log('DEBUG-ATX: Getting list of existing workspaces')
            const workspaces = await this.listWorkspaces()

            const response: AtxListOrCreateWorkspaceResponse = {
                AvailableWorkspaces: workspaces,
                CreatedWorkspace: undefined,
            }

            // Optionally create new workspace
            if (request.CreateWorkspaceName !== undefined) {
                this.logging.log(
                    `DEBUG-ATX: Creating new workspace: ${request.CreateWorkspaceName || 'auto-generated'}`
                )
                const newWorkspace = await this.createWorkspace(request.CreateWorkspaceName)

                if (newWorkspace) {
                    response.CreatedWorkspace = {
                        WorkspaceId: newWorkspace.workspaceId,
                        WorkspaceName: newWorkspace.workspaceName,
                    }

                    // Add the new workspace to the available list
                    response.AvailableWorkspaces.push({
                        Id: newWorkspace.workspaceId,
                        Name: newWorkspace.workspaceName,
                        CreatedDate: new Date().toISOString(),
                    })
                    this.logging.log(`DEBUG-ATX: Added new workspace to available list`)
                }
            }

            this.logging.log(
                `DEBUG-ATX: ListOrCreateWorkspace completed - ${response.AvailableWorkspaces.length} workspaces available`
            )
            this.logging.log(`DEBUG-ATX: Final response: ${JSON.stringify(response, null, 2)}`)
            return response
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX: ListOrCreateWorkspace error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Create ATX transformation job
     */
    async createJob(request: {
        workspaceId: string
        jobName?: string
    }): Promise<{ jobId: string; status: string } | null> {
        try {
            this.logging.log(`DEBUG-ATX-CREATE-JOB: CreateJob operation started for workspace: ${request.workspaceId}`)
            this.logging.log(`DEBUG-ATX-CREATE-JOB: jobName: ${request.jobName || 'auto-generated'}`)

            // Call ATX FES createJob API
            this.logging.log('DEBUG-ATX-CREATE-JOB: initializing ATX client...')
            await this.initializeAtxClient()
            if (!this.atxClient) {
                throw new Error('ATX client not initialized')
            }
            this.logging.log('DEBUG-ATX-CREATE-JOB: ATX client initialized successfully')

            this.logging.log('DEBUG-ATX-CREATE-JOB: creating CreateJobCommand...')
            const command = new CreateJobCommand({
                workspaceId: request.workspaceId,
                objective: JSON.stringify({ target_framework: 'net8.0' }),
                jobType: 'DOTNET_IDE' as any,
                jobName: request.jobName || `transform-job-${Date.now()}`,
                intent: 'LANGUAGE_UPGRADE',
                idempotencyToken: uuidv4(),
            })
            this.logging.log('DEBUG-ATX-CREATE-JOB: command created, adding auth...')

            await this.addAuthToCommand(command)
            this.logging.log('DEBUG-ATX-CREATE-JOB: auth added, sending command...')

            const response = (await this.atxClient.send(command)) as any
            this.logging.log(`DEBUG-ATX-CREATE-JOB: API returned jobId: ${response.jobId}, status: ${response.status}`)

            if (response.jobId && response.status) {
                return { jobId: response.jobId, status: response.status }
            }

            this.logging.error('DEBUG-ATX-CREATE-JOB: API returned null jobId or status')
            return null
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX-CREATE-JOB: Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
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
        filePath: string,
        categoryType: string,
        fileType: string
    ): Promise<{ uploadId: string; uploadUrl: string; requestHeaders?: any } | null> {
        try {
            this.logging.log(`DEBUG-ATX-UPLOAD-URL: CreateArtifactUploadUrl operation started for job: ${jobId}`)

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
                        categoryType: categoryType as any,
                        fileType: fileType as any,
                    },
                },
            })

            await this.addAuthToCommand(command)
            const result = (await this.atxClient.send(command)) as any

            if (result && result.artifactId && result.s3PreSignedUrl) {
                this.logging.log(`DEBUG-ATX-UPLOAD-URL: SUCCESS - Upload URL created`)
                return {
                    uploadId: result.artifactId,
                    uploadUrl: result.s3PreSignedUrl,
                    requestHeaders: result.requestHeaders,
                }
            } else {
                this.logging.error('DEBUG-ATX-UPLOAD-URL: Missing artifactId or s3PreSignedUrl in response')
                return null
            }
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX-UPLOAD-URL: Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Complete artifact upload
     */
    async completeArtifactUpload(
        workspaceId: string,
        jobId: string,
        artifactId: string
    ): Promise<{ success: boolean } | null> {
        try {
            this.logging.log(
                `DEBUG-ATX-COMPLETE-UPLOAD: CompleteArtifactUpload operation started for artifact: ${artifactId}`
            )

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
            const result = (await this.atxClient.send(command)) as any

            this.logging.log(`DEBUG-ATX-COMPLETE-UPLOAD: Upload completed successfully`)
            return { success: true }
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX-COMPLETE-UPLOAD: Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Start transformation job
     */
    async startJob(workspaceId: string, jobId: string): Promise<{ success: boolean } | null> {
        try {
            this.logging.log(`DEBUG-ATX-START-JOB: StartJob operation started for job: ${jobId}`)

            // Initialize ATX client
            await this.initializeAtxClient()
            if (!this.atxClient) {
                throw new Error('ATX client not initialized')
            }

            const command = new StartJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
            })

            await this.addAuthToCommand(command)
            const result = (await this.atxClient.send(command)) as any

            this.logging.log(`DEBUG-ATX-START-JOB: Job started successfully`)
            return { success: true }
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX-START-JOB: Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Create ZIP file from solution using ArtifactManager
     */
    async createZip(request: any): Promise<string> {
        try {
            this.logging.log('DEBUG-ATX: Creating ZIP file from solution')

            const { ArtifactManager } = await import('./artifactManager')

            // Create workspace path like RTS does: {solutionRoot}/artifactWorkspace/{uuid}
            const workspacePath = this.getWorkspacePath(request.SolutionRootPath)

            const artifactManager = new ArtifactManager(
                this.workspace,
                this.logging,
                workspacePath, // Use RTS-style workspace path
                request.SolutionRootPath
            )

            const zipFilePath = await artifactManager.createZip(request)
            this.logging.log(`DEBUG-ATX: ZIP file created successfully: ${zipFilePath}`)
            return zipFilePath
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX: createZip error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            throw error
        }
    }

    /**
     * Create workspace path like RTS does: {solutionRoot}/artifactWorkspace/{uuid}
     */
    getWorkspacePath(solutionRootPath: string): string {
        const { v4: uuidv4 } = require('uuid')
        const randomPath = uuidv4().substring(0, 8)
        const path = require('path')
        const workspacePath = path.join(solutionRootPath, 'artifactWorkspace', randomPath)
        if (!fs.existsSync(workspacePath)) {
            fs.mkdirSync(workspacePath, { recursive: true })
        }
        return workspacePath
    }

    /**
     * Upload artifact to S3 using presigned URL and headers from ATX FES
     */
    async uploadArtifact(s3PreSignedUrl: string, filePath: string, requestHeaders?: any): Promise<boolean> {
        try {
            this.logging.log(`DEBUG-ATX: Starting S3 upload to ${s3PreSignedUrl}`)
            this.logging.log(`DEBUG-ATX: File path: ${filePath}`)

            const headers: any = {}

            // Add required headers from ATX FES response
            if (requestHeaders) {
                Object.keys(requestHeaders).forEach(key => {
                    const value = requestHeaders[key]
                    // Handle array values (take first element)
                    headers[key] = Array.isArray(value) ? value[0] : value
                })
            }

            this.logging.log(`DEBUG-ATX: S3 Upload headers: ${JSON.stringify(Object.keys(headers))}`)

            // Create file stream
            const fileStream = fs.createReadStream(filePath)

            // Upload to S3 using PUT request
            const got = (await import('got')).default
            const response = await got.put(s3PreSignedUrl, {
                body: fileStream,
                headers: headers,
                timeout: { request: 300000 }, // 5 minutes timeout
                retry: { limit: 0 },
            })

            this.logging.log(`DEBUG-ATX: S3 Upload response status: ${response.statusCode} ${response.statusMessage}`)

            if (response.statusCode === 200) {
                this.logging.log('DEBUG-ATX: S3 Upload SUCCESS')
                return true
            } else {
                this.logging.error(`DEBUG-ATX: S3 Upload failed with status ${response.statusCode}`)
                return false
            }
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX: S3 Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return false
        }
    }

    /**
     * Start ATX Transform - Orchestrates the full workflow
     * Step 1: CreateJob ✅
     * Step 2: ZIP Creation and Upload
     */
    async startTransform(request: {
        workspaceId: string
        jobName?: string
        startTransformRequest: object
    }): Promise<{ TransformationJobId: string; ArtifactPath: string; UploadId: string } | null> {
        try {
            this.logging.log(`DEBUG-ATX-START: StartTransform workflow started for workspace: ${request.workspaceId}`)

            // Step 1: Create transformation job
            this.logging.log('DEBUG-ATX-START: Step 1 - Creating transformation job')
            const createJobResponse = await this.createJob({
                workspaceId: request.workspaceId,
                jobName: request.jobName || 'Transform Job',
            })

            if (!createJobResponse?.jobId) {
                throw new Error('Failed to create ATX transformation job')
            }

            this.logging.log(
                `DEBUG-ATX-START: Step 1 - Created job: ${createJobResponse.jobId} with status: ${createJobResponse.status}`
            )

            // Step 2: Create ZIP file
            this.logging.log('DEBUG-ATX-START: Step 2 - Creating ZIP file from solution')
            const zipFilePath = await this.createZip(request.startTransformRequest)

            if (!zipFilePath) {
                throw new Error('Failed to create ZIP file for ATX transformation')
            }

            this.logging.log(`DEBUG-ATX-START: Step 2 - Created ZIP file: ${zipFilePath}`)

            // Step 3: Create artifact upload URL
            this.logging.log('DEBUG-ATX-START: Step 3 - Creating artifact upload URL')
            const uploadResponse = await this.createArtifactUploadUrl(
                request.workspaceId,
                createJobResponse.jobId,
                zipFilePath,
                CategoryType.CUSTOMER_INPUT,
                FileType.ZIP
            )

            if (!uploadResponse?.uploadUrl) {
                throw new Error('Failed to create artifact upload URL')
            }

            this.logging.log(`DEBUG-ATX-START: Step 3 - Created upload URL with uploadId: ${uploadResponse.uploadId}`)

            // Step 4: Upload ZIP file to S3
            this.logging.log('DEBUG-ATX-START: Step 4 - Uploading ZIP file to S3')
            const uploadSuccess = await this.uploadArtifact(
                uploadResponse.uploadUrl,
                zipFilePath,
                uploadResponse.requestHeaders
            )

            if (!uploadSuccess) {
                throw new Error('Failed to upload ZIP file to S3')
            }

            this.logging.log('DEBUG-ATX-START: Step 4 - Successfully uploaded ZIP file to S3')

            // Step 5: Complete artifact upload
            this.logging.log('DEBUG-ATX-START: Step 5 - Completing artifact upload')
            const completeResponse = await this.completeArtifactUpload(
                request.workspaceId,
                createJobResponse.jobId,
                uploadResponse.uploadId
            )

            if (!completeResponse?.success) {
                throw new Error('Failed to complete artifact upload')
            }

            this.logging.log('DEBUG-ATX-START: Step 5 - Successfully completed artifact upload')

            // Step 6: Start the transformation job
            this.logging.log('DEBUG-ATX-START: Step 6 - Starting transformation job')
            const startJobResponse = await this.startJob(request.workspaceId, createJobResponse.jobId)

            if (!startJobResponse?.success) {
                throw new Error('Failed to start ATX transformation job')
            }

            this.logging.log('DEBUG-ATX-START: Step 6 - Successfully started transformation job')
            this.logging.log('DEBUG-ATX-START: Full workflow completed successfully!')

            return {
                TransformationJobId: createJobResponse.jobId,
                ArtifactPath: zipFilePath,
                UploadId: uploadResponse.uploadId,
            }
        } catch (error) {
            this.logging.error(
                `DEBUG-ATX-START: StartTransform workflow error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }
}
