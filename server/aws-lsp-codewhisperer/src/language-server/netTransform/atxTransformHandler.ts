import { Logging, Runtime, Workspace } from '@aws/language-server-runtimes/server-interface'
import * as fs from 'fs'
import * as archiver from 'archiver'
import got from 'got'
import * as path from 'path'
import * as crypto from 'crypto'
import AdmZip = require('adm-zip')
import { ArtifactManager } from './artifactManager'
import {
    ElasticGumbyFrontendClient,
    ListAvailableProfilesCommand,
    CreateJobCommand,
    CreateArtifactUploadUrlCommand,
    CompleteArtifactUploadCommand,
    CreateArtifactDownloadUrlCommand,
    GetHitlTaskCommand,
    ListHitlTasksCommand,
    SubmitCriticalHitlTaskCommand,
    GetJobCommand,
    GetJobResponse,
    StartJobCommand,
    StopJobCommand,
    CategoryType,
    FileType,
    JobInfo,
    SubmitCriticalHitlTaskResponse,
} from '@amazon/elastic-gumby-frontend-client'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { DEFAULT_ATX_FES_ENDPOINT_URL, DEFAULT_ATX_FES_REGION, ATX_FES_REGION_ENV_VAR } from '../../shared/constants'
import {
    AtxListOrCreateWorkspaceRequest,
    AtxListOrCreateWorkspaceResponse,
    AtxGetTransformInfoRequest,
    AtxGetTransformInfoResponse,
    AtxJobStatus,
    AtxTransformationJob,
    AtxUploadPlanRequest,
    AtxUploadPlanResponse,
} from './atxModels'
import { v4 as uuidv4 } from 'uuid'
import { request } from 'http'
import { ToolInputSchemaFilterSensitiveLog } from '@amzn/codewhisperer-runtime'

export const ArtifactWorkspaceName = 'artifactWorkspace'
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
    private cachedHitl: string | null = null

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
            this.logging.log(`DEBUG-ATX-REGION: Error in getRegionFromProfile: ${String(error)}`)
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
            this.logging.error(`DEBUG-ATX-URL: Error getting applicationUrl: ${String(error)}`)
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
            this.logging.error(`DEBUG-ATX: VerifySession error: ${String(error)}`)
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
            this.logging.log(`ATX: ListWorkspaces RequestId: ${response.$metadata?.requestId}`)

            // Convert ATX API format to IDE expected format
            const workspaces = (response.items || []).map(workspace => ({
                Id: workspace.id,
                Name: workspace.name,
                CreatedDate: new Date().toISOString(), // Use current date since createdDate not available
            }))

            this.logging.log(`DEBUG-ATX: Converted workspaces: ${JSON.stringify(workspaces, null, 2)}`)
            return workspaces
        } catch (error) {
            this.logging.error(`DEBUG-ATX: ListWorkspaces error: ${String(error)}`)
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
            this.logging.log(`ATX: CreateWorkspace RequestId: ${response.$metadata?.requestId}`)

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
            this.logging.error(`DEBUG-ATX: CreateWorkspace error: ${String(error)}`)
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
            this.logging.error(`DEBUG-ATX: ListOrCreateWorkspace error: ${String(error)}`)
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
            this.logging.log(`ATX: CreateJob RequestId: ${response.$metadata?.requestId}`)

            if (response.jobId && response.status) {
                return { jobId: response.jobId, status: response.status }
            }

            this.logging.error('DEBUG-ATX-CREATE-JOB: API returned null jobId or status')
            return null
        } catch (error) {
            this.logging.error(`DEBUG-ATX-CREATE-JOB: Error: ${String(error)}`)
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
        categoryType: CategoryType,
        fileType: FileType
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
                        categoryType: categoryType,
                        fileType: fileType,
                    },
                },
            })

            await this.addAuthToCommand(command)
            const result = (await this.atxClient.send(command)) as any
            this.logging.log(`ATX: CreateArtifactUploadUrl RequestId: ${result.$metadata?.requestId}`)

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
            this.logging.error(`DEBUG-ATX-UPLOAD-URL: Error: ${String(error)}`)
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
            this.logging.error(`DEBUG-ATX-COMPLETE-UPLOAD: Error: ${String(error)}`)
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
            this.logging.log(`ATX: StartJob RequestId: ${result.$metadata?.requestId}`)

            this.logging.log(`DEBUG-ATX-START-JOB: Job started successfully`)
            return { success: true }
        } catch (error) {
            this.logging.error(`DEBUG-ATX-START-JOB: Error: ${String(error)}`)
            return null
        }
    }

    /**
     * Create ZIP file from solution using ArtifactManager
     */
    async createZip(request: any): Promise<string> {
        try {
            this.logging.log('DEBUG-ATX: Creating ZIP file from solution')

            const workspacePath = this.getWorkspacePath(request.SolutionRootPath)

            const artifactManager = new ArtifactManager(
                this.workspace,
                this.logging,
                workspacePath,
                request.SolutionRootPath
            )

            const zipFilePath = await artifactManager.createZip(request)
            this.logging.log(`DEBUG-ATX: ZIP file created successfully: ${zipFilePath}`)
            return zipFilePath
        } catch (error) {
            this.logging.error(`DEBUG-ATX: createZip error: ${String(error)}`)
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
            this.logging.error(`DEBUG-ATX: S3 Upload error: ${String(error)}`)
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
            this.logging.error(`DEBUG-ATX-START: StartTransform workflow error: ${String(error)}`)
            return null
        }
    }

    async sleep(duration = 0): Promise<void> {
        return new Promise(r => setTimeout(r, Math.max(duration, 0)))
    }

    async getJob(workspaceId: string, jobId: string): Promise<JobInfo | null> {
        try {
            this.logging.log(`Getting job: ${jobId} in workspace: ${workspaceId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: GetJob client not initialized')
                return null
            }

            const command = new GetJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                includeObjective: false,
            })

            await this.addAuthToCommand(command)
            const response = await this.atxClient!.send(command)

            this.logging.log(`ATX: GetJob SUCCESS - Job status: ${response.job?.statusDetails?.status}`)
            return response.job || null
        } catch (error) {
            this.logging.error(`ATX: GetJob error: ${String(error)}`)
            return null
        }
    }

    async createArtifactDownloadUrl(
        workspaceId: string,
        jobId: string,
        artifactId: string
    ): Promise<{ s3PresignedUrl: string; requestHeaders?: any } | null> {
        try {
            this.logging.log(`DEBUG-ATX-UPLOAD-URL: CreateArtifactDownloadUrl operation started for job: ${jobId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX client not initialized')
            }

            const command = new CreateArtifactDownloadUrlCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                artifactId: artifactId,
            })

            await this.addAuthToCommand(command)
            const result = (await this.atxClient!.send(command)) as any
            if (result && result.s3PreSignedUrl) {
                this.logging.log(`ATX: DownloadArtifactUrl SUCCESS - Download URL created`)

                const normalizedHeaders: Record<string, string> = {}
                if (result.requestHeaders) {
                    for (const [key, value] of Object.entries(result.requestHeaders)) {
                        normalizedHeaders[key] = Array.isArray(value) ? value[0] : value
                    }
                }

                return {
                    s3PresignedUrl: result.s3PreSignedUrl,
                    requestHeaders: normalizedHeaders,
                }
            } else {
                this.logging.error('ATX: DownloadArtifactUrl - Missing s3PreSignedUrl in response')
                return null
            }
        } catch (error) {
            this.logging.error(`DEBUG-ATX-UPLOAD-URL: Error: ${String(error)}`)
            return null
        }
    }

    async listHitls(workspaceId: string, jobId: string): Promise<any[] | null> {
        try {
            this.logging.log('=== ATX FES ListHitls Operation (FES Client) ===')
            this.logging.log(`Listing Hitls for job: ${jobId} in workspace: ${workspaceId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ListHitls: Failed to initialize ATX client')
                return null
            }

            const command = new ListHitlTasksCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                taskType: 'NORMAL',
                taskFilter: {
                    taskStatuses: ['AWAITING_HUMAN_INPUT'],
                },
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            this.logging.log(`ListHitls: SUCCESS - Found ${result.hitlTasks?.length || 0} HITL_FROM_USER artifacts`)
            return result.hitlTasks || []
        } catch (error) {
            this.logging.error(`ListHitls error: ${String(error)}`)
            return null
        }
    }

    async submitHitl(
        workspaceId: string,
        jobId: string,
        taskId: string,
        humanArtifactId: string
    ): Promise<SubmitCriticalHitlTaskResponse | null> {
        try {
            this.logging.log('=== ATX FES SubmitHitl Operation (FES Client) ===')
            this.logging.log(`Updating Hitl: ${taskId} for job: ${jobId} in workspace: ${workspaceId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('SubmitHitl: Failed to initialize ATX client')
                return null
            }

            const command = new SubmitCriticalHitlTaskCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                taskId: taskId,
                action: 'APPROVE',
                humanArtifact: {
                    artifactId: humanArtifactId,
                },
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            this.logging.log(`SubmitHitl: SUCCESS - task status: ${result.status || 'UNKNOWN'} `)
            return result
        } catch (error) {
            this.logging.error(`ListHitls error: ${String(error)}`)
            return null
        }
    }

    async getHitl(workspaceId: string, jobId: string, taskId: string): Promise<any | null> {
        try {
            this.logging.log('=== ATX FES Get Hitl Operation (FES Client) ===')
            this.logging.log(`Getting Hitl: ${jobId} in workspace: ${workspaceId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('GetHitl: Failed to initialize ATX client')
                return null
            }

            const command = new GetHitlTaskCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                taskId: taskId,
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            this.logging.log(`GetHitl: SUCCESS - Job data received`)
            return result.task || null
        } catch (error) {
            this.logging.error(`GetHitl error: ${String(error)}`)
            return null
        }
    }

    async pollHitlTask(workspaceId: string, jobId: string, taskId: string): Promise<string | null> {
        this.logging.log('Starting polling for hitl after upload')

        try {
            var count = 0
            while (count < 100) {
                const jobStatus = await this.getHitl(workspaceId, jobId, taskId)
                this.logging.log(`Hitl Polling get status: ${jobStatus?.status}`)

                if (jobStatus && jobStatus.status == 'CLOSED') {
                    this.logging.log('Hitl Polling get status CLOSED')
                    return 'Validation Success!'
                } else if (jobStatus && jobStatus.status == 'CLOSED_PENDING_NEXT_TASK') {
                    // Fallback to placeholder if API call fails
                    this.logging.log('Hitl Polling get status CLOSED_PENDING_NEXT_TASK')
                    return 'Submitted plan did not pass validation, please check the plan for details....'
                } else if (jobStatus && jobStatus.status == 'CANCELLED') {
                    // Fallback to placeholder if API call fails
                    this.logging.log('Hitl Polling get status CANCELLED')
                    return 'Timeout occured during planning, proceeding with default plan....'
                } else {
                    this.logging.log('Hitl polling in progress....')
                    await this.sleep(10 * 1000)
                    count++
                }
            }

            this.logging.log('Returning null, 100 polls and no approve or reject')
            return null
        } catch (error) {
            this.logging.error(`Hitl polling error: ${String(error)}`)
            return null
        }
    }

    async getHitlAgentArtifact(
        workspaceId: string,
        jobId: string,
        solutionRootPath: string
    ): Promise<{ PlanPath: string; ReportPath: string } | null> {
        try {
            this.logging.log('=== ATX FES Get Hitl Agent Artifact Operation (FES Client) ===')
            this.logging.log(`Getting Hitl Agent Artifact: ${jobId} in workspace: ${workspaceId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('GetHitlAgentArtifact: Failed to initialize ATX client')
                return null
            }

            const hitls = await this.listHitls(workspaceId, jobId)

            if (hitls && hitls.length != 1) {
                this.logging.log(`ATX FES Job ${jobId} - Found ${hitls.length} hitls`)
            } else if (!hitls) {
                this.logging.log(`ATX FES Job ${jobId} - no or many hitls available for download (expects 1 hitl)`)
                throw new Error('no or many HITLE_FROM_USER artifacts available for download (expects 1 artifact)')
            }

            const hitl = hitls[0]

            this.cachedHitl = hitl.taskId

            const downloadInfo = await this.createArtifactDownloadUrl(workspaceId, jobId, hitl.agentArtifact.artifactId)

            if (!downloadInfo) {
                throw new Error('Failed to get ATX FES download URL')
            }

            this.logging.log(`ATX FES Job ${jobId} - Artifact download URL created: ${downloadInfo.s3PresignedUrl}`)

            const pathToDownload = path.join(solutionRootPath, ArtifactWorkspaceName, jobId)

            await this.downloadAndExtractArchive(
                downloadInfo.s3PresignedUrl,
                downloadInfo.requestHeaders,
                pathToDownload,
                'transformation-plan-download.zip'
            )

            const planPath = path.join(pathToDownload, 'transformation-plan.md')
            const reportPath = path.join(pathToDownload, 'assessment-report.md')
            return { PlanPath: planPath, ReportPath: reportPath }
        } catch (error) {
            this.logging.error(`GetHitlAgentArtifact error: ${String(error)}`)
            return null
        }
    }

    /**
     * Get transform info - dummy implementation
     */
    async getTransformInfo(request: AtxGetTransformInfoRequest): Promise<AtxGetTransformInfoResponse | null> {
        try {
            this.logging.log(`DEBUG-ATX-GET-INFO: getTransformInfo called with: ${JSON.stringify(request)}`)

            const job = await this.getJob(request.WorkspaceId, request.TransformationJobId)

            if (!job) {
                this.logging.log(`DEBUG-ATX-GET-INFO: Get Job returned null`)
                return null
            }

            const jobStatus = job.statusDetails?.status

            if (jobStatus === 'COMPLETED') {
                this.logging.log(`DEBUG-ATX-GET-INFO: Job completed successfully`)
                return null
            } else if (jobStatus === 'FAILED') {
                this.logging.log(`DEBUG-ATX-GET-INFO: Job failed`)
                return {
                    TransformationJob: {
                        WorkspaceId: request.WorkspaceId,
                        JobId: request.TransformationJobId,
                        Status: jobStatus,
                        FailureReason: job?.statusDetails?.failureReason,
                    } as AtxTransformationJob,
                    ErrorString: 'Transformation job failed',
                } as AtxGetTransformInfoResponse
            } else if (jobStatus === 'STOPPING' || jobStatus === 'STOPPED') {
                this.logging.log(`DEBUG-ATX-GET-INFO: Job stopping`)
                return {
                    TransformationJob: {
                        WorkspaceId: request.WorkspaceId,
                        JobId: request.TransformationJobId,
                        Status: jobStatus,
                    } as AtxTransformationJob,
                    ErrorString: 'Transformation job stopped',
                } as AtxGetTransformInfoResponse
            } else if (jobStatus === 'PLANNED') {
                this.logging.log(`DEBUG-ATX-GET-INFO: Job in PLANNED`)
                return null
            } else if (jobStatus === 'AWAITING_HUMAN_INPUT') {
                this.logging.log(`DEBUG-ATX-GET-INFO: Job in AWAITING_HUMAN_INPUT`)

                const response = await this.getHitlAgentArtifact(
                    request.WorkspaceId,
                    request.TransformationJobId,
                    request.SolutionRootPath
                )

                return {
                    TransformationJob: {
                        WorkspaceId: request.WorkspaceId,
                        JobId: request.TransformationJobId,
                        Status: jobStatus,
                    } as AtxTransformationJob,
                    PlanPath: response?.PlanPath,
                    ReportPath: response?.ReportPath,
                } as AtxGetTransformInfoResponse
            } else {
                this.logging.log(`DEBUG-ATX-GET-INFO: Job in PLANNING`)
                return {
                    TransformationJob: {
                        WorkspaceId: request.WorkspaceId,
                        JobId: request.TransformationJobId,
                        Status: jobStatus,
                    } as AtxTransformationJob,
                } as AtxGetTransformInfoResponse
            }
        } catch (error) {
            this.logging.error(`ATX: Get TransformInfo error: ${String(error)}`)
            return null
        }
    }

    async uploadPlan(request: AtxUploadPlanRequest): Promise<AtxUploadPlanResponse | null> {
        this.logging.info('Starting upload plan')

        if (!this.cachedHitl) {
            this.logging.error('ATX: UploadPlan error: No cached hitl')
            return null
        }

        try {
            const pathToZip = path.join(path.dirname(request.PlanPath), 'transformation-plan-upload.md')
            await this.zipFile(request.PlanPath, pathToZip)

            const uploadInfo = await this.createArtifactUploadUrl(
                request.WorkspaceId,
                request.TransformationJobId,
                pathToZip,
                CategoryType.HITL_FROM_USER,
                FileType.ZIP
            )

            if (!uploadInfo) {
                this.logging.error('ATX: UploadPlan error: Failed to get ATX upload URL')
                return null
            }

            this.logging.log(`ATX: UploadPlan: Artifact upload URL created: ${uploadInfo.uploadUrl}`)

            const uploadSuccess = await this.uploadArtifact(uploadInfo.uploadUrl, pathToZip, uploadInfo.requestHeaders)

            if (!uploadSuccess) {
                throw new Error('Failed to upload ZIP file to S3')
                return null
            }

            const completeResponse = await this.completeArtifactUpload(
                request.WorkspaceId,
                request.TransformationJobId,
                uploadInfo.uploadId
            )

            if (!completeResponse?.success) {
                throw new Error('Failed to complete artifact upload')
            }

            this.logging.info('Uploaded plan, submitting hitl')

            const submitHitl = await this.submitHitl(
                request.WorkspaceId,
                request.TransformationJobId,
                this.cachedHitl,
                uploadInfo.uploadId
            )

            if (!submitHitl) {
                throw new Error('Failed to submit hitl')
            }

            this.logging.info('Submitted hitl, polling for status')

            const validation = await this.pollHitlTask(
                request.WorkspaceId,
                request.TransformationJobId,
                this.cachedHitl
            )

            if (!validation) {
                throw new Error('Failed to poll hitl task')
                return null
            }

            if (validation === 'Submitted plan did not pass validation, please check the plan for details....') {
                const response = await this.getHitlAgentArtifact(
                    request.WorkspaceId,
                    request.TransformationJobId,
                    path.dirname(request.PlanPath)
                )

                return {
                    VerificationStatus: false,
                    Message: validation,
                    PlanPath: response?.PlanPath,
                    ReportPath: response?.ReportPath,
                } as AtxUploadPlanResponse
            } else {
                return {
                    VerificationStatus: true,
                    Message: validation,
                } as AtxUploadPlanResponse
            }
        } catch (error) {
            this.logging.error(`ATX: UploadPlan error: ${String(error)}`)
            return null
        }
    }

    /**
     * Stop ATX transformation job
     */
    async stopJob(workspaceId: string, jobId: string): Promise<string> {
        try {
            this.logging.log(`ATX: StopJob operation started for job: ${jobId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const command = new StopJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
            })

            await this.addAuthToCommand(command)
            const response = await this.atxClient!.send(command)

            this.logging.log(`ATX: StopJob SUCCESS - Status: ${response.status}`)
            this.logging.log(`ATX: StopJob RequestId: ${response.$metadata?.requestId}`)
            return response.status || 'STOPPED'
        } catch (error) {
            this.logging.error(`ATX: StopJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return 'FAILED'
        }
    }

    async downloadAndExtractArchive(
        downloadUrl: string,
        requestHeaders: any,
        saveToDir: string,
        exportName: string
    ): Promise<string> {
        const response = await got.get(downloadUrl, {
            headers: requestHeaders || {},
            timeout: { request: 300000 }, // 5 minutes
            responseType: 'buffer',
        })

        // Save, extract, and return paths
        const buffer = [Buffer.from(response.body)]
        return await this.extractArchiveFromBuffer(exportName, buffer, saveToDir)
    }

    /**
     * Extracts ZIP archive from buffer using AdmZip
     */
    async extractArchiveFromBuffer(exportName: string, buffer: Uint8Array[], saveToDir: string): Promise<string> {
        const pathToArchive = path.join(saveToDir, exportName)
        await this.directoryExists(saveToDir)
        await fs.writeFileSync(pathToArchive, Buffer.concat(buffer))

        const pathContainingArchive = path.dirname(pathToArchive)
        const zip = new AdmZip(pathToArchive)
        const zipEntries = zip.getEntries()
        await this.extractAllEntriesTo(pathContainingArchive, zipEntries)
        return pathContainingArchive
    }

    async directoryExists(directoryPath: string): Promise<void> {
        try {
            await fs.promises.access(directoryPath)
        } catch (error) {
            this.logging.log(`Directory doesn't exist, creating it: ${directoryPath}`)
            await fs.promises.mkdir(directoryPath, { recursive: true })
        }
    }

    /**
     * Extracts all ZIP entries to target directory
     */
    async extractAllEntriesTo(pathContainingArchive: string, zipEntries: AdmZip.IZipEntry[]): Promise<void> {
        for (const entry of zipEntries) {
            try {
                const entryPath = path.join(pathContainingArchive, entry.entryName)
                if (entry.isDirectory) {
                    await fs.promises.mkdir(entryPath, { recursive: true })
                } else {
                    const parentDir = path.dirname(entryPath)
                    await fs.promises.mkdir(parentDir, { recursive: true })
                    await fs.promises.writeFile(entryPath, entry.getData())
                }
            } catch (extractError: any) {
                if (extractError instanceof Error && 'code' in extractError && extractError.code === 'ENOENT') {
                    this.logging.log(`Attempted to extract a file that does not exist: ${entry.entryName}`)
                } else {
                    throw extractError
                }
            }
        }
    }

    private async zipFile(sourceFilePath: string, outputZipPath: string): Promise<void> {
        const archive = archiver('zip', { zlib: { level: 9 } })
        const stream = fs.createWriteStream(outputZipPath)

        return new Promise<void>((resolve, reject) => {
            archive
                .file(sourceFilePath, { name: path.basename(sourceFilePath) })
                .on('error', err => reject(err))
                .pipe(stream)

            stream.on('close', () => resolve())
            void archive.finalize()
        })
    }
}
