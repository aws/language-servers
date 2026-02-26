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
    CreateJobCommand,
    CreateArtifactUploadUrlCommand,
    CompleteArtifactUploadCommand,
    CreateArtifactDownloadUrlCommand,
    GetHitlTaskCommand,
    ListHitlTasksCommand,
    SubmitCriticalHitlTaskCommand,
    SubmitStandardHitlTaskCommand,
    UpdateHitlTaskCommand,
    GetJobCommand,
    ListJobPlanStepsCommand,
    ListWorklogsCommand,
    ListArtifactsCommand,
    StartJobCommand,
    StopJobCommand,
    SendMessageCommand,
    ListMessagesCommand,
    BatchGetMessageCommand,
    CategoryType,
    FileType,
    JobInfo,
    SubmitCriticalHitlTaskResponse,
} from '@amazon/elastic-gumby-frontend-client'
import { AtxTokenServiceManager } from '../../shared/amazonQServiceManager/AtxTokenServiceManager'
import { DEFAULT_ATX_FES_REGION, ATX_FES_REGION_ENV_VAR, getAtxEndPointByRegion } from '../../shared/constants'
import {
    AtxListOrCreateWorkspaceRequest,
    AtxListOrCreateWorkspaceResponse,
    AtxGetTransformInfoRequest,
    AtxGetTransformInfoResponse,
    AtxTransformationJob,
    AtxUploadPlanRequest,
    AtxUploadPlanResponse,
    AtxSetCheckpointsResponse,
    AtxTransformationPlan,
    AtxPlanStep,
    PlanStepStatus,
    createEmptyRootNode,
    AtxStepInformation,
    AtxCheckpointActionResponse,
    AtxUploadPackagesRequest,
    AtxUploadPackagesResponse,
    InteractiveMode,
} from './atxModels'
import { v4 as uuidv4 } from 'uuid'
import { request } from 'http'

import { Utils, workspaceFolderName } from './utils'

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
    private cachedHitl: string | null = null
    private cachedStepHitl: string | null = null
    private cachedInteractiveMode: InteractiveMode | null = null

    constructor(serviceManager: AtxTokenServiceManager, workspace: Workspace, logging: Logging, runtime: Runtime) {
        this.serviceManager = serviceManager
        this.workspace = workspace
        this.logging = logging
        this.runtime = runtime

        this.serviceManager.registerCacheCallback(() => this.onProfileUpdate())
    }

    /**
     * Initialize ATX FES client
     */
    private async initializeAtxClient(): Promise<boolean> {
        try {
            this.logging.log('ATX: Starting client initialization')

            let region = process.env[ATX_FES_REGION_ENV_VAR]

            if (!region) {
                // Try to get region from active profile
                region = await this.getRegionFromProfile()
                if (!region) {
                    this.logging.error('ATX: No region available - cannot initialize client')
                    return false
                }
            }

            const endpoint = process.env.TCP_ENDPOINT || getAtxEndPointByRegion(region)
            this.logging.log(`ATX: Using region ${region} with endpoint ${endpoint}`)

            this.atxClient = new ElasticGumbyFrontendClient({
                region: region,
                endpoint: endpoint,
            })

            this.logging.log('ATX: Client initialization completed')
            return true
        } catch (error) {
            this.logging.error(`ATX: Failed to initialize client: ${String(error)}`)
            return false
        }
    }

    private async getRegionFromProfile(): Promise<string | undefined> {
        try {
            if (!this.serviceManager.hasValidCredentials()) {
                return undefined
            }

            // Get active profile applicationURL and extract region from it
            const atxServiceManager = AtxTokenServiceManager.getInstance()
            const applicationUrl = atxServiceManager.getActiveApplicationUrl()

            if (applicationUrl) {
                // Extract region from applicationURL: https://xxx.transform.REGION.on.aws
                const urlMatch = applicationUrl.match(/\.transform(?:-gamma)?\.([^.]+)\.on\.aws/)
                if (urlMatch && urlMatch[1]) {
                    return urlMatch[1]
                }
            }

            return DEFAULT_ATX_FES_REGION
        } catch (error) {
            this.logging.error(`ATX: Error getting region from profile: ${String(error)}`)
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

                // Add test classification header if running in test mode
                const testId = process.env.ATX_TEST_ID
                if (testId) {
                    args.request.headers['x-amzn-qt-test-id'] = testId
                }

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
     * Gets the applicationUrl for the active Transform profile with caching
     */
    async getActiveTransformProfileApplicationUrl(): Promise<string | null> {
        try {
            // Get applicationUrl from service manager (cached from configuration)
            const applicationUrl = this.serviceManager.getActiveApplicationUrl()

            if (!applicationUrl) {
                this.logging.error('ATX: No applicationUrl found - profile not selected')
                return null
            }

            return applicationUrl
        } catch (error) {
            this.logging.error(`ATX: Error getting applicationUrl: ${String(error)}`)
            return null
        }
    }

    /**
     * Reset atx client (for profile update scenarios)
     */
    onProfileUpdate(): void {
        this.atxClient = null
    }

    /**
     * Clear cached job state (for terminal job statuses)
     */
    private clearJobCache(): void {
        this.cachedHitl = null
        this.cachedStepHitl = null
        this.cachedInteractiveMode = null
        this.logging.log('ATX: Cleared job cache')
    }

    /**
     * Verify session (internal LSP method called before each ATX API)
     */
    private async verifySession(): Promise<boolean> {
        try {
            if (!(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for session verification')
                return false
            }

            // Verify authentication details
            await this.serviceManager.getBearerToken()
            await this.getActiveTransformProfileApplicationUrl()

            return true
        } catch (error) {
            this.logging.error(`ATX: Session verification error: ${String(error)}`)
            return false
        }
    }

    /**
     * List available workspaces
     */
    async listWorkspaces(): Promise<any[]> {
        try {
            this.logging.log('ATX: Starting ListWorkspaces operation')

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const { ListWorkspacesCommand } = await import('@amazon/elastic-gumby-frontend-client')
            const command = new ListWorkspacesCommand({})
            await this.addAuthToCommand(command)

            const response = await this.atxClient!.send(command)
            this.logging.log(`ATX: ListWorkspaces completed - found ${response.items?.length || 0} workspaces`)
            this.logging.log(`ATX: ListWorkspaces RequestId: ${response.$metadata?.requestId}`)

            // Convert ATX API format to IDE expected format
            const workspaces = (response.items || []).map(workspace => ({
                Id: workspace.id,
                Name: workspace.name,
                CreatedDate: new Date().toISOString(), // Use current date since createdDate not available
            }))

            return workspaces
        } catch (error) {
            this.logging.error(`ATX: ListWorkspaces error: ${String(error)}`)
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
            this.logging.log(`ATX: Starting CreateWorkspace with name: ${workspaceName || 'auto-generated'}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const { CreateWorkspaceCommand } = await import('@amazon/elastic-gumby-frontend-client')
            const command = new CreateWorkspaceCommand({
                name: workspaceName || undefined,
                description: workspaceName ? `Workspace: ${workspaceName}` : 'Auto-generated workspace',
            })
            await this.addAuthToCommand(command)

            const response = await this.atxClient!.send(command)
            this.logging.log(`ATX: CreateWorkspace RequestId: ${response.$metadata?.requestId}`)

            if (response.workspace?.id && response.workspace?.name) {
                const result = {
                    workspaceId: response.workspace.id,
                    workspaceName: response.workspace.name,
                }
                this.logging.log(`ATX: CreateWorkspace completed successfully: ${response.workspace.id}`)
                return result
            }

            this.logging.error('ATX: CreateWorkspace failed - no workspace in response')
            return null
        } catch (error) {
            this.logging.error(`ATX: CreateWorkspace error: ${String(error)}`)
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
            this.logging.log('ATX: Starting ListOrCreateWorkspace operation')

            // Call verifySession ONCE at the beginning
            if (!(await this.verifySession())) {
                this.logging.error('ATX: Session verification failed for listOrCreateWorkspace')
                return null
            }

            // Always get list of existing workspaces
            const workspaces = await this.listWorkspaces()

            const response: AtxListOrCreateWorkspaceResponse = {
                AvailableWorkspaces: workspaces,
                CreatedWorkspace: undefined,
            }

            // Optionally create new workspace
            if (request.CreateWorkspaceName !== undefined) {
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
                }
            }

            this.logging.log(
                `ATX: ListOrCreateWorkspace completed - ${response.AvailableWorkspaces.length} workspaces available`
            )
            return response
        } catch (error) {
            this.logging.error(`ATX: ListOrCreateWorkspace error: ${String(error)}`)
            return null
        }
    }

    /**
     * Create ATX transformation job
     */
    async createJob(request: {
        workspaceId: string
        jobName?: string
        targetFramework?: string
        interactiveMode?: InteractiveMode
    }): Promise<{ jobId: string; status: string } | null> {
        try {
            this.logging.log(`ATX: Starting CreateJob for workspace: ${request.workspaceId}`)

            // Call ATX FES createJob API
            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            // Map InteractiveMode enum to backend format (all strings)
            // Autonomous -> "autonomous", OnFailure -> "on_failure", Interactive -> "interactive"
            let interactiveModeValue: string = 'autonomous'
            if (request.interactiveMode === 'Interactive') {
                interactiveModeValue = 'interactive'
            } else if (request.interactiveMode === 'OnFailure') {
                interactiveModeValue = 'on_failure'
            }

            // Build objective object with target_framework and interactive_mode
            const objective: any = {
                target_framework: request.targetFramework || 'net10.0',
                interactive_mode: interactiveModeValue,
            }

            this.logging.log(`ATX: CreateJob objective: ${JSON.stringify(objective)}`)

            const command = new CreateJobCommand({
                workspaceId: request.workspaceId,
                objective: JSON.stringify(objective),
                // jobType: 'DOTNET_IDE' as any,
                orchestratorAgent: 'dotnet-chatty-agent-internal',
                jobName: request.jobName || `transform-job-${Date.now()}`,
                intent: 'LANGUAGE_UPGRADE',
                idempotencyToken: uuidv4(),
            })

            await this.addAuthToCommand(command)
            const response = (await this.atxClient!.send(command)) as any
            this.logging.log(`ATX: CreateJob completed - jobId: ${response.jobId}, status: ${response.status}`)
            this.logging.log(`ATX: CreateJob RequestId: ${response.$metadata?.requestId}`)

            if (response.jobId && response.status) {
                return { jobId: response.jobId, status: response.status }
            }

            this.logging.error('ATX: CreateJob failed - no jobId or status in response')
            return null
        } catch (error) {
            this.logging.error(`ATX: CreateJob error: ${String(error)}`)
            return null
        }
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
            this.logging.log(`ATX: Starting CreateArtifactUploadUrl for job: ${jobId}`)

            // Initialize ATX client
            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            // Calculate file checksum - exact reference repo implementation
            const sha256 = await Utils.getSha256Async(filePath)

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
            const result = (await this.atxClient!.send(command)) as any
            this.logging.log(`ATX: CreateArtifactUploadUrl RequestId: ${result.$metadata?.requestId}`)

            if (result && result.artifactId && result.s3PreSignedUrl) {
                this.logging.log(`ATX: CreateArtifactUploadUrl completed successfully`)
                return {
                    uploadId: result.artifactId,
                    uploadUrl: result.s3PreSignedUrl,
                    requestHeaders: result.requestHeaders,
                }
            } else {
                this.logging.error('ATX: CreateArtifactUploadUrl failed - missing artifactId or s3PreSignedUrl')
                return null
            }
        } catch (error) {
            this.logging.error(`ATX: CreateArtifactUploadUrl error: ${String(error)}`)
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
            this.logging.log(`ATX: Starting CompleteArtifactUpload for artifact: ${artifactId}`)

            // Initialize ATX client
            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }
            const command = new CompleteArtifactUploadCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                artifactId: artifactId,
            })

            await this.addAuthToCommand(command)
            const result = (await this.atxClient!.send(command)) as any

            this.logging.log(`ATX: CompleteArtifactUpload completed successfully`)
            return { success: true }
        } catch (error) {
            this.logging.error(`ATX: CompleteArtifactUpload error: ${String(error)}`)
            return null
        }
    }

    /**
     * Start transformation job
     */
    async startJob(workspaceId: string, jobId: string): Promise<{ success: boolean } | null> {
        try {
            this.logging.log(`ATX: Starting job: ${jobId}`)

            // Initialize ATX client
            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const command = new StartJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
            })

            await this.addAuthToCommand(command)
            const result = (await this.atxClient!.send(command)) as any
            this.logging.log(`ATX: StartJob RequestId: ${result.$metadata?.requestId}`)

            this.logging.log(`ATX: Job started successfully`)
            return { success: true }
        } catch (error) {
            this.logging.error(`ATX: StartJob error: ${String(error)}`)
            return null
        }
    }

    /**
     * Create ZIP file from solution using ArtifactManager
     */
    async createZip(request: any): Promise<string> {
        try {
            this.logging.log('ATX: Starting ZIP file creation from solution')

            const workspacePath = Utils.getWorkspacePath(request.SolutionRootPath)

            const artifactManager = new ArtifactManager(
                this.workspace,
                this.logging,
                workspacePath,
                request.SolutionRootPath
            )

            const zipFilePath = await artifactManager.createZip(request)
            this.logging.log(`ATX: ZIP file created successfully: ${zipFilePath}`)
            return zipFilePath
        } catch (error) {
            this.logging.error(`ATX: createZip error: ${String(error)}`)
            throw error
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
        interactiveMode?: InteractiveMode
        startTransformRequest: object
        includeMissingPackageAnalysis?: boolean
    }): Promise<{ TransformationJobId: string; ArtifactPath: string; UploadId: string } | null> {
        try {
            this.logging.log(`ATX: Starting transform workflow for workspace: ${request.workspaceId}`)

            // Cache the interactive mode setting
            this.cachedInteractiveMode = request.interactiveMode || 'Autonomous'

            // Step 1: Create transformation job
            const createJobResponse = await this.createJob({
                workspaceId: request.workspaceId,
                jobName: request.jobName || 'Transform Job',
                targetFramework: (request.startTransformRequest as any).TargetFramework,
                interactiveMode: request.interactiveMode,
            })

            if (!createJobResponse?.jobId) {
                throw new Error('Failed to create ATX transformation job')
            }

            // Step 2: Create ZIP file
            const zipFilePath = await this.createZip(request.startTransformRequest)

            if (!zipFilePath) {
                throw new Error('Failed to create ZIP file for ATX transformation')
            }

            // Step 3: Create artifact upload URL
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

            // Step 4: Upload ZIP file to S3
            const uploadSuccess = await Utils.uploadArtifact(
                uploadResponse.uploadUrl,
                zipFilePath,
                uploadResponse.requestHeaders,
                this.logging
            )

            if (!uploadSuccess) {
                throw new Error('Failed to upload ZIP file to S3')
            }

            // Step 5: Complete artifact upload
            const completeResponse = await this.completeArtifactUpload(
                request.workspaceId,
                createJobResponse.jobId,
                uploadResponse.uploadId
            )

            if (!completeResponse?.success) {
                throw new Error('Failed to complete artifact upload')
            }

            // Step 6: Start the transformation job
            const startJobResponse = await this.startJob(request.workspaceId, createJobResponse.jobId)

            if (!startJobResponse?.success) {
                throw new Error('Failed to start ATX transformation job')
            }

            this.logging.log('ATX: Transform workflow completed successfully')

            return {
                TransformationJobId: createJobResponse.jobId,
                ArtifactPath: zipFilePath,
                UploadId: uploadResponse.uploadId,
            }
        } catch (error) {
            this.logging.error(`ATX: StartTransform workflow error: ${String(error)}`)
            return null
        }
    }

    async getJob(workspaceId: string, jobId: string, includeObjective: boolean = false): Promise<JobInfo | null> {
        try {
            this.logging.log(`ATX: Getting job: ${jobId} in workspace: ${workspaceId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: GetJob client not initialized')
                return null
            }

            const command = new GetJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                includeObjective: includeObjective,
            })

            await this.addAuthToCommand(command)
            const response = await this.atxClient!.send(command)

            this.logging.log(`ATX: GetJob completed - Job status: ${response.job?.statusDetails?.status}`)
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
            this.logging.log(`ATX: Starting CreateArtifactDownloadUrl for job: ${jobId}`)

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
                this.logging.log(`ATX: CreateArtifactDownloadUrl completed successfully`)

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
                this.logging.error('ATX: CreateArtifactDownloadUrl failed - missing s3PreSignedUrl')
                return null
            }
        } catch (error) {
            this.logging.error(`ATX: CreateArtifactDownloadUrl error: ${String(error)}`)
            return null
        }
    }

    async listHitls(workspaceId: string, jobId: string): Promise<any[] | null> {
        try {
            this.logging.log(`ATX: Starting ListHitls for job: ${jobId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for ListHitls')
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

            this.logging.log(`ATX: ListHitls completed - Found ${result.hitlTasks?.length || 0} tasks`)
            return result.hitlTasks || []
        } catch (error) {
            this.logging.error(`ATX: ListHitls error: ${String(error)}`)
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
            this.logging.log(`ATX: Starting SubmitHitl for task: ${taskId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for SubmitHitl')
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

            this.logging.log(`ATX: SubmitHitl completed - task status: ${result.status || 'UNKNOWN'}`)
            return result
        } catch (error) {
            this.logging.error(`ATX: SubmitHitl error: ${String(error)}`)
            return null
        }
    }

    async updateHitl(workspaceId: string, jobId: string, taskId: string, humanArtifactId: string): Promise<any | null> {
        try {
            this.logging.log(`ATX: Starting UpdateHitl for task: ${taskId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for UpdateHitl')
                return null
            }

            const command = new UpdateHitlTaskCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                taskId: taskId,
                humanArtifact: {
                    artifactId: humanArtifactId,
                },
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            this.logging.log(`ATX: UpdateHitl completed successfully with status ${result.status}`)
            return result
        } catch (error) {
            this.logging.error(`ATX: UpdateHitl error: ${String(error)}`)
            return null
        }
    }

    async getHitl(workspaceId: string, jobId: string, taskId: string): Promise<any | null> {
        try {
            this.logging.log(`ATX: Getting Hitl task: ${taskId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for GetHitl')
                return null
            }

            const command = new GetHitlTaskCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                taskId: taskId,
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            this.logging.log(`ATX: GetHitl completed successfully`)
            return result.task || null
        } catch (error) {
            this.logging.error(`ATX: GetHitl error: ${String(error)}`)
            return null
        }
    }

    async pollHitlTask(workspaceId: string, jobId: string, taskId: string): Promise<string | null> {
        this.logging.log('ATX: Starting polling for hitl after upload')

        try {
            var count = 0
            while (count < 100) {
                const jobStatus = await this.getHitl(workspaceId, jobId, taskId)
                this.logging.log(`ATX: Hitl polling status: ${jobStatus?.status}`)

                if (jobStatus && jobStatus.status == 'CLOSED') {
                    return 'Validation Success!'
                } else if (jobStatus && jobStatus.status == 'CLOSED_PENDING_NEXT_TASK') {
                    return 'Submitted plan did not pass validation, please check the plan for details....'
                } else if (jobStatus && jobStatus.status == 'CANCELLED') {
                    return 'Timeout occured during planning, proceeding with default plan....'
                } else {
                    await Utils.sleep(10 * 1000)
                    count++
                }
            }

            this.logging.log('ATX: Hitl polling timeout after 100 attempts')
            return null
        } catch (error) {
            this.logging.error(`ATX: Hitl polling error: ${String(error)}`)
            return null
        }
    }

    async getHitlAgentArtifact(
        workspaceId: string,
        jobId: string,
        solutionRootPath: string
    ): Promise<{
        PlanPath?: string
        ReportPath?: string
        MissingPackageJsonPath?: string
        HitlTag?: string
    } | null> {
        try {
            this.logging.log(`ATX: Getting Hitl Agent Artifact for job: ${jobId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for GetHitlAgentArtifact')
                return null
            }

            const hitls = await this.listHitls(workspaceId, jobId)

            if (!hitls || hitls.length === 0) {
                this.logging.log(`ATX: No hitls available`)
                return null
            }

            if (hitls.length != 1) {
                this.logging.log(`ATX: Found ${hitls.length} hitls (expected 1)`)
            }

            const hitl = hitls[0]
            this.cachedHitl = hitl.taskId
            const hitlTag = hitl.tag || null
            const downloadInfo = await this.createArtifactDownloadUrl(workspaceId, jobId, hitl.agentArtifact.artifactId)

            if (!downloadInfo) {
                throw new Error('Failed to get ATX FES download URL')
            }

            const pathToDownload = path.join(solutionRootPath, workspaceFolderName, jobId)

            await Utils.downloadAndExtractArchive(
                downloadInfo.s3PresignedUrl,
                downloadInfo.requestHeaders,
                pathToDownload,
                'transformation-plan-download.zip',
                this.logging
            )

            const fs = require('fs')
            const extractedFiles = fs.readdirSync(pathToDownload)
            this.logging.log(`ATX: Extracted files in ${pathToDownload}: ${JSON.stringify(extractedFiles)}`)

            const planPath = path.join(pathToDownload, 'transformation-plan.md')
            const reportPath = path.join(pathToDownload, 'assessment-report.md')
            const missingPackageJsonPath = path.join(pathToDownload, 'missing-packages.json')

            this.logging.log(`ATX: GetHitlAgentArtifact completed successfully`)
            return {
                PlanPath: fs.existsSync(planPath) ? planPath : undefined,
                ReportPath: fs.existsSync(reportPath) ? reportPath : undefined,
                MissingPackageJsonPath: fs.existsSync(missingPackageJsonPath) ? missingPackageJsonPath : undefined,
                HitlTag: hitlTag,
            }
        } catch (error) {
            this.logging.error(`ATX: GetHitlAgentArtifact error: ${String(error)}`)
            return null
        }
    }

    /**
     * Get transform info
     */
    async getTransformInfo(request: AtxGetTransformInfoRequest): Promise<AtxGetTransformInfoResponse | null> {
        try {
            this.logging.log(`ATX: Getting transform info for job: ${request.TransformationJobId}`)

            // Check if we need to determine interactive mode from the job objective
            const needObjective = this.cachedInteractiveMode === null
            const job = await this.getJob(request.WorkspaceId, request.TransformationJobId, needObjective)

            if (!job) {
                this.logging.error(`ATX: Job not found: ${request.TransformationJobId}`)
                return null
            }

            // If interactive mode is not cached, try to get it from the job objective
            if (this.cachedInteractiveMode === null && job.objective) {
                try {
                    const objective = JSON.parse(job.objective)
                    // Map backend string format to InteractiveMode enum
                    // "interactive" -> Interactive, "on_failure" -> OnFailure, "autonomous" -> Autonomous
                    if (objective.interactive_mode === 'interactive') {
                        this.cachedInteractiveMode = 'Interactive'
                    } else if (objective.interactive_mode === 'on_failure') {
                        this.cachedInteractiveMode = 'OnFailure'
                    } else {
                        this.cachedInteractiveMode = 'Autonomous'
                    }
                    this.logging.log(
                        `ATX: Determined interactive mode from job objective: ${this.cachedInteractiveMode}`
                    )
                } catch (e) {
                    this.logging.log('ATX: Could not parse job objective for interactive mode')
                    this.cachedInteractiveMode = 'Autonomous'
                }
            }

            const jobStatus = job.statusDetails?.status

            if (jobStatus === 'COMPLETED') {
                // Clear cached state for terminal job status
                this.clearJobCache()

                const pathToArtifact = await this.downloadFinalArtifact(
                    request.WorkspaceId,
                    request.TransformationJobId,
                    request.SolutionRootPath
                )
                const plan = await this.getTransformationPlan(
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
                    ArtifactPath: pathToArtifact,
                    TransformationPlan: plan,
                } as AtxGetTransformInfoResponse
            } else if (jobStatus === 'FAILED') {
                // Clear cached state for terminal job status
                this.clearJobCache()

                this.logging.error(`ATX: Job failed - Reason: ${job?.statusDetails?.failureReason ?? 'Unknown'}`)
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
                // Clear cached state for terminal job status
                this.clearJobCache()

                return {
                    TransformationJob: {
                        WorkspaceId: request.WorkspaceId,
                        JobId: request.TransformationJobId,
                        Status: jobStatus,
                    } as AtxTransformationJob,
                    ErrorString: 'Transformation job stopped',
                } as AtxGetTransformInfoResponse
            } else if (jobStatus === 'PLANNED') {
                const plan = await this.getTransformationPlan(
                    request.WorkspaceId,
                    request.TransformationJobId,
                    request.SolutionRootPath
                )

                // If GetCheckpoints is requested, populate HasCheckpoint field on steps
                if (request.GetCheckpoints) {
                    this.populateCheckpointsOnPlan(plan, request.TransformationJobId, request.SolutionRootPath)
                }

                return {
                    TransformationJob: {
                        WorkspaceId: request.WorkspaceId,
                        JobId: request.TransformationJobId,
                        Status: jobStatus,
                    } as AtxTransformationJob,
                    TransformationPlan: plan,
                } as AtxGetTransformInfoResponse
            } else if (jobStatus === 'AWAITING_HUMAN_INPUT') {
                return await this.handleAwaitingHumanInput(request)
            } else {
                await this.listWorklogs(request.WorkspaceId, request.TransformationJobId, request.SolutionRootPath)

                return {
                    TransformationJob: {
                        WorkspaceId: request.WorkspaceId,
                        JobId: request.TransformationJobId,
                        Status: jobStatus,
                    } as AtxTransformationJob,
                } as AtxGetTransformInfoResponse
            }
        } catch (error) {
            this.logging.error(`ATX: GetTransformInfo error: ${String(error)}`)
            return null
        }
    }

    /**
     * Handles AWAITING_HUMAN_INPUT status.
     * Two scenarios:
     * 1. Planning phase: No plan exists yet, need to get HITL artifacts (plan.md, report.md)
     * 2. Execution phase: Plan exists, HITL raised for a specific step
     */
    private async handleAwaitingHumanInput(request: AtxGetTransformInfoRequest): Promise<AtxGetTransformInfoResponse> {
        // Try to get the transformation plan first
        const plan = await this.getTransformationPlan(
            request.WorkspaceId,
            request.TransformationJobId,
            request.SolutionRootPath
        )

        const hasPlan = plan.Root.Children[0].Children.length > 0

        if (hasPlan) {
            // Execution phase: Plan exists, HITL raised during transformation
            return await this.handleExecutionPhaseHitl(request, plan)
        } else {
            // Planning phase: No plan yet, get HITL artifacts for plan review
            return await this.handlePlanningPhaseHitl(request)
        }
    }

    /**
     * Handles HITL during planning phase - downloads plan.md and report.md for user review.
     */
    private async handlePlanningPhaseHitl(request: AtxGetTransformInfoRequest): Promise<AtxGetTransformInfoResponse> {
        const response = await this.getHitlAgentArtifact(
            request.WorkspaceId,
            request.TransformationJobId,
            request.SolutionRootPath
        )

        return {
            TransformationJob: {
                WorkspaceId: request.WorkspaceId,
                JobId: request.TransformationJobId,
                Status: 'AWAITING_HUMAN_INPUT',
            } as AtxTransformationJob,
            PlanPath: response?.PlanPath,
            ReportPath: response?.ReportPath,
            MissingPackageJsonPath: response?.MissingPackageJsonPath,
            HitlTag: response?.HitlTag,
        } as AtxGetTransformInfoResponse
    }

    /**
     * Handles HITL during execution phase - plan exists, step-level HITL raised.
     */
    private async handleExecutionPhaseHitl(
        request: AtxGetTransformInfoRequest,
        plan: AtxTransformationPlan
    ): Promise<AtxGetTransformInfoResponse> {
        this.logging.log(`ATX: Execution phase HITL - plan has ${plan.Root.Children.length} steps`)

        // If GetCheckpoints is requested, populate HasCheckpoint field on steps
        if (request.GetCheckpoints) {
            this.populateCheckpointsOnPlan(plan, request.TransformationJobId, request.SolutionRootPath)
        }

        try {
            // Find the step with PENDING_HUMAN_INPUT status in the plan
            const pendingStep = this.findPendingHumanInputStep(plan.Root)

            if (!pendingStep) {
                this.logging.log('ATX: No step with PENDING_HUMAN_INPUT status found in plan')
                return {
                    TransformationJob: {
                        WorkspaceId: request.WorkspaceId,
                        JobId: request.TransformationJobId,
                        Status: 'AWAITING_HUMAN_INPUT',
                    } as AtxTransformationJob,
                    TransformationPlan: plan,
                } as AtxGetTransformInfoResponse
            }

            this.logging.log(`ATX: Found pending step: ${pendingStep.StepId}`)

            // Find the step-level HITL using tag: {stepId}-review
            const stepHitl = await this.findStepLevelHitl(
                request.WorkspaceId,
                request.TransformationJobId,
                pendingStep.StepId
            )

            if (!stepHitl) {
                this.logging.log('ATX: No step-level HITL found, returning plan only')
                return {
                    TransformationJob: {
                        WorkspaceId: request.WorkspaceId,
                        JobId: request.TransformationJobId,
                        Status: 'AWAITING_HUMAN_INPUT',
                    } as AtxTransformationJob,
                    TransformationPlan: plan,
                } as AtxGetTransformInfoResponse
            }

            // Download and parse the agent artifact JSON
            const stepInformation = await this.downloadAndParseStepHitlArtifact(
                request.WorkspaceId,
                request.TransformationJobId,
                stepHitl,
                pendingStep.StepId,
                request.SolutionRootPath
            )

            return {
                TransformationJob: {
                    WorkspaceId: request.WorkspaceId,
                    JobId: request.TransformationJobId,
                    Status: 'AWAITING_HUMAN_INPUT',
                } as AtxTransformationJob,
                TransformationPlan: plan,
                StepInformation: stepInformation,
            } as AtxGetTransformInfoResponse
        } catch (error) {
            this.logging.error(`ATX: handleExecutionPhaseHitl error: ${String(error)}`)
            return {
                TransformationJob: {
                    WorkspaceId: request.WorkspaceId,
                    JobId: request.TransformationJobId,
                    Status: 'AWAITING_HUMAN_INPUT',
                } as AtxTransformationJob,
                TransformationPlan: plan,
            } as AtxGetTransformInfoResponse
        }
    }

    /**
     * Recursively finds a step with PENDING_HUMAN_INPUT status in the plan tree.
     */
    private findPendingHumanInputStep(step: AtxPlanStep): AtxPlanStep | null {
        if (step.Status === 'PENDING_HUMAN_INPUT') {
            return step
        }

        for (const child of step.Children) {
            const found = this.findPendingHumanInputStep(child)
            if (found) {
                return found
            }
        }

        return null
    }

    /**
     * Finds the step-level HITL task by filtering for the "{stepId}-review" tag.
     */
    private async findStepLevelHitl(workspaceId: string, jobId: string, stepId: string): Promise<any | null> {
        try {
            this.logging.log(`ATX: Finding step-level HITL for job: ${jobId}, step: ${stepId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for findStepLevelHitl')
                return null
            }

            // List HITLs with "{stepId}-review" tag
            const command = new ListHitlTasksCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                taskType: 'NORMAL',
                taskFilter: {
                    taskStatuses: ['AWAITING_HUMAN_INPUT'],
                    tag: `${stepId}-review`,
                },
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            if (!result.hitlTasks || result.hitlTasks.length === 0) {
                this.logging.log(`ATX: No step-level HITL found with tag ${stepId}-review`)
                return null
            }

            const stepHitl = result.hitlTasks[0]
            this.logging.log(`ATX: Found step-level HITL: ${stepHitl.taskId}`)

            // Cache the step HITL task ID for later use in checkpointAction
            this.cachedStepHitl = stepHitl.taskId || null

            return stepHitl
        } catch (error) {
            this.logging.error(`ATX: findStepLevelHitl error: ${String(error)}`)
            return null
        }
    }

    /**
     * Downloads and parses the step HITL agent artifact JSON, and extracts the diff artifact.
     */
    private async downloadAndParseStepHitlArtifact(
        workspaceId: string,
        jobId: string,
        hitlTask: any,
        stepId: string,
        solutionRootPath: string
    ): Promise<AtxStepInformation | null> {
        try {
            const taskId = hitlTask.taskId
            const agentArtifactId = hitlTask.agentArtifact?.artifactId

            if (!agentArtifactId) {
                this.logging.error('ATX: Step HITL has no agent artifact')
                return null
            }

            this.logging.log(`ATX: Downloading step HITL artifact: ${agentArtifactId}`)

            // Download the agent artifact JSON
            const downloadInfo = await this.createArtifactDownloadUrl(workspaceId, jobId, agentArtifactId)
            if (!downloadInfo) {
                throw new Error('Failed to get download URL for step HITL artifact')
            }

            // Download the JSON content
            const response = await got.get(downloadInfo.s3PresignedUrl, {
                headers: downloadInfo.requestHeaders || {},
                responseType: 'text',
            })

            const artifactJson = JSON.parse(response.body)
            this.logging.log(`ATX: Parsed step HITL artifact JSON`)

            // Extract diff artifact if present
            let diffArtifactPath = ''
            if (artifactJson.diffArtifactId) {
                diffArtifactPath = await this.downloadDiffArtifact(
                    workspaceId,
                    jobId,
                    artifactJson.diffArtifactId,
                    solutionRootPath,
                    stepId
                )
            }

            return {
                StepId: stepId,
                DiffArtifactPath: diffArtifactPath,
                // Use retryInstruction if available, otherwise fall back to originalInstruction
                RetryInstruction: artifactJson.retryInstruction || artifactJson.originalInstruction,
                ...(artifactJson.isInvalid !== undefined && { IsInvalid: artifactJson.isInvalid }),
                ...(artifactJson.invalidInstruction && { InvalidInstruction: artifactJson.invalidInstruction }),
                ...(artifactJson.invalidReason && { InvalidReason: artifactJson.invalidReason }),
                ...(artifactJson.expiryTimestampUTC && { ExpiryTimestampUTC: artifactJson.expiryTimestampUTC }),
            }
        } catch (error) {
            this.logging.error(`ATX: downloadAndParseStepHitlArtifact error: ${String(error)}`)
            return null
        }
    }

    /**
     * Downloads and extracts the diff artifact ZIP.
     */
    private async downloadDiffArtifact(
        workspaceId: string,
        jobId: string,
        diffArtifactId: string,
        solutionRootPath: string,
        stepId: string
    ): Promise<string> {
        try {
            this.logging.log(`ATX: Downloading diff artifact: ${diffArtifactId}`)

            const downloadInfo = await this.createArtifactDownloadUrl(workspaceId, jobId, diffArtifactId)
            if (!downloadInfo) {
                throw new Error('Failed to get download URL for diff artifact')
            }

            const pathToDownload = path.join(solutionRootPath, workspaceFolderName, jobId, 'checkpoints', stepId)

            await Utils.downloadAndExtractArchive(
                downloadInfo.s3PresignedUrl,
                downloadInfo.requestHeaders,
                pathToDownload,
                `${stepId}.zip`,
                this.logging
            )

            this.logging.log(`ATX: Diff artifact extracted to: ${pathToDownload}`)
            return pathToDownload
        } catch (error) {
            this.logging.error(`ATX: downloadDiffArtifact error: ${String(error)}`)
            return ''
        }
    }

    /**
     * Populates HasCheckpoint field on plan steps based on checkpoint-settings.json or defaults to true.
     */
    private populateCheckpointsOnPlan(plan: AtxTransformationPlan, jobId: string, solutionRootPath: string): void {
        try {
            const checkpointSettingsPath = path.join(
                solutionRootPath,
                workspaceFolderName,
                jobId,
                'checkpoints',
                'checkpoint-settings.json'
            )

            let checkpointSettings: Record<string, boolean> | null = null

            // Check if checkpoint-settings.json exists
            if (fs.existsSync(checkpointSettingsPath)) {
                try {
                    const fileContent = fs.readFileSync(checkpointSettingsPath, 'utf-8')
                    checkpointSettings = JSON.parse(fileContent)
                    this.logging.log(`ATX: Loaded checkpoint settings from ${checkpointSettingsPath}`)
                } catch (e) {
                    this.logging.error(`ATX: Failed to parse checkpoint-settings.json: ${String(e)}`)
                }
            } else {
                this.logging.log('ATX: No checkpoint-settings.json found, defaulting all steps to HasCheckpoint=true')
            }

            // Recursively set HasCheckpoint on all steps
            this.setCheckpointsOnSteps(plan.Root, checkpointSettings)
        } catch (error) {
            this.logging.error(`ATX: populateCheckpointsOnPlan error: ${String(error)}`)
        }
    }

    /**
     * Recursively sets HasCheckpoint on steps based on settings or defaults to true.
     */
    private setCheckpointsOnSteps(step: AtxPlanStep, settings: Record<string, boolean> | null): void {
        // Skip the root node
        if (step.StepId !== 'root') {
            if (settings && settings[step.StepId] !== undefined) {
                step.HasCheckpoint = settings[step.StepId]
            } else {
                // Default to true if no settings file or step not in settings
                step.HasCheckpoint = true
            }
        }

        // Recursively process children
        for (const child of step.Children) {
            this.setCheckpointsOnSteps(child, settings)
        }
    }

    async uploadPlan(request: AtxUploadPlanRequest): Promise<AtxUploadPlanResponse | null> {
        this.logging.log('ATX: Starting upload plan')

        if (!this.cachedHitl) {
            this.logging.error('ATX: UploadPlan error: No cached hitl')
            return null
        }

        try {
            const pathToZip = path.join(path.dirname(request.PlanPath), 'transformation-plan-upload.zip')
            await Utils.zipFile(request.PlanPath, pathToZip)

            const uploadInfo = await this.createArtifactUploadUrl(
                request.WorkspaceId,
                request.TransformationJobId,
                pathToZip,
                CategoryType.HITL_FROM_USER,
                FileType.ZIP
            )

            if (!uploadInfo) {
                this.logging.error('ATX: UploadPlan error: Failed to get upload URL')
                return null
            }

            const uploadSuccess = await Utils.uploadArtifact(
                uploadInfo.uploadUrl,
                pathToZip,
                uploadInfo.requestHeaders,
                this.logging
            )

            if (!uploadSuccess) {
                throw new Error('Failed to upload ZIP file to S3')
            }

            const completeResponse = await this.completeArtifactUpload(
                request.WorkspaceId,
                request.TransformationJobId,
                uploadInfo.uploadId
            )

            if (!completeResponse?.success) {
                throw new Error('Failed to complete artifact upload')
            }

            this.logging.log('ATX: Plan uploaded, submitting hitl')

            const submitHitl = await this.submitHitl(
                request.WorkspaceId,
                request.TransformationJobId,
                this.cachedHitl,
                uploadInfo.uploadId
            )

            if (!submitHitl) {
                throw new Error('Failed to submit hitl')
            }

            this.logging.log('ATX: Hitl submitted, polling for status')

            const validation = await this.pollHitlTask(
                request.WorkspaceId,
                request.TransformationJobId,
                this.cachedHitl
            )

            if (!validation) {
                throw new Error('Failed to poll hitl task')
            }

            if (validation === 'Submitted plan did not pass validation, please check the plan for details....') {
                const response = await this.getHitlAgentArtifact(
                    request.WorkspaceId,
                    request.TransformationJobId,
                    path.dirname(path.dirname(path.dirname(request.PlanPath)))
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

    // Upload Missing package dependencies
    async uploadPackages(request: AtxUploadPackagesRequest): Promise<AtxUploadPackagesResponse | null> {
        this.logging.log('ATX: Starting upload packages')

        if (!this.cachedHitl) {
            this.logging.error('ATX: UploadPackages error: No cached hitl')
            return { Success: false, Message: 'No cached HITL task' }
        }

        try {
            if (!request.PackagesZipPath) {
                this.logging.log('ATX: No packages to upload, submitting HITL without artifact')
                return { Success: false, Message: "No Package xip path found. Can't proceed with HITL" }
            }

            var humanArtifactId = await this.uploadArtifactAndComplete(
                request.WorkspaceId,
                request.TransformationJobId,
                request.PackagesZipPath
            )

            if (!humanArtifactId) {
                return { Success: false, Message: 'Failed to upload packages' }
            }

            this.logging.log('ATX: Packages uploaded successfully')

            // Submit HITL (with or without artifact)
            const submitHitl = await this.submitHitl(
                request.WorkspaceId,
                request.TransformationJobId,
                this.cachedHitl,
                humanArtifactId
            )

            if (!submitHitl) {
                throw new Error('Failed to submit hitl')
            }

            this.logging.log('ATX: HITL submitted successfully')

            return {
                Success: true,
                Message: 'Packages uploaded and HITL submitted successfully',
            }
        } catch (error) {
            this.logging.error(`ATX: UploadPackages error: ${String(error)}`)
            return { Success: false, Message: String(error) }
        }
    }

    private async uploadArtifactAndComplete(
        workspaceId: string,
        jobId: string,
        filePath: string
    ): Promise<string | null> {
        const uploadInfo = await this.createArtifactUploadUrl(
            workspaceId,
            jobId,
            filePath,
            CategoryType.HITL_FROM_USER,
            FileType.ZIP
        )

        if (!uploadInfo) {
            this.logging.error('ATX: Failed to get upload URL')
            return null
        }

        const uploadSuccess = await Utils.uploadArtifact(
            uploadInfo.uploadUrl,
            filePath,
            uploadInfo.requestHeaders,
            this.logging
        )

        if (!uploadSuccess) {
            this.logging.error('ATX: Failed to upload to S3')
            return null
        }

        const completeResponse = await this.completeArtifactUpload(workspaceId, jobId, uploadInfo.uploadId)

        if (!completeResponse?.success) {
            this.logging.error('ATX: Failed to complete artifact upload')
            return null
        }

        return uploadInfo.uploadId
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

            // Clear cached state when user initiates stop
            this.clearJobCache()

            this.logging.log(`ATX: StopJob SUCCESS - Status: ${response.status}`)
            this.logging.log(`ATX: StopJob RequestId: ${response.$metadata?.requestId}`)
            return response.status || 'STOPPED'
        } catch (error) {
            this.logging.error(`ATX: StopJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return 'FAILED'
        }
    }

    async downloadFinalArtifact(workspaceId: string, jobId: string, solutionRootPath: string): Promise<string | null> {
        try {
            this.logging.log(`ATX: Starting download final artifact for job: ${jobId}`)

            const artifacts = await this.listArtifacts(workspaceId, jobId)
            if (!artifacts || artifacts.length === 0) {
                throw new Error('No CUSTOMER_OUTPUT artifacts available for download')
            }

            const artifact = artifacts[0]
            const artifactId = artifact.artifactId
            this.logging.log(`ATX: Found artifact: ${artifactId}, size: ${artifact.sizeInBytes} bytes`)

            const downloadInfo = await this.createArtifactDownloadUrl(workspaceId, jobId, artifactId)
            if (!downloadInfo) {
                throw new Error('Failed to get ATX FES download URL')
            }

            const pathToDownload = path.join(solutionRootPath, workspaceFolderName, jobId)

            await Utils.downloadAndExtractArchive(
                downloadInfo.s3PresignedUrl,
                downloadInfo.requestHeaders,
                pathToDownload,
                'ExportResultsArchive.zip',
                this.logging
            )

            this.logging.log(`ATX: Download final artifact completed successfully`)
            return pathToDownload
        } catch (error) {
            this.logging.error(`ATX: Download final artifact failed: ${String(error)}`)
            return null
        }
    }

    async getTransformationPlan(
        workspaceId: string,
        jobId: string,
        solutionRootPath: string
    ): Promise<AtxTransformationPlan> {
        try {
            const plan = await this.fetchPlanTree(workspaceId, jobId)

            // Fetch worklogs in parallel (fire and forget, don't block plan return)
            this.fetchWorklogs(workspaceId, jobId, solutionRootPath).catch(e => {
                this.logging.log(`ATX: Could not get worklogs for workspace: ${workspaceId}, job: ${jobId}`)
            })

            // For interactive mode (Interactive or OnFailure), download completed step artifacts if not already present
            if (this.cachedInteractiveMode && this.cachedInteractiveMode !== 'Autonomous') {
                await this.downloadCompletedStepArtifacts(workspaceId, jobId, solutionRootPath, plan)
            }

            this.logging.log(`ATX: Successfully built plan tree with ${plan.Root.Children.length} root steps`)
            return plan
        } catch (error) {
            this.logging.error(`ATX: getTransformationPlan error: ${String(error)}`)
            return { Root: createEmptyRootNode() }
        }
    }

    /**
     * Downloads artifacts for completed steps in interactive mode if they don't already exist,
     * then applies the changes in order, tracking progress in checkpoints-applied.json.
     */
    private async downloadCompletedStepArtifacts(
        workspaceId: string,
        jobId: string,
        solutionRootPath: string,
        plan: AtxTransformationPlan
    ): Promise<void> {
        try {
            const completedSteps = this.findCompletedSteps(plan.Root)

            // Sort by score to ensure correct application order
            completedSteps.sort((a, b) => (a.score || 0) - (b.score || 0))

            this.logging.log(`ATX: Found ${completedSteps.length} completed steps to check for artifacts`)

            // Load the list of already applied steps
            const appliedSteps = this.loadAppliedCheckpoints(solutionRootPath, jobId)

            for (const step of completedSteps) {
                const stepCheckpointPath = path.join(
                    solutionRootPath,
                    workspaceFolderName,
                    jobId,
                    'checkpoints',
                    step.StepId
                )

                // Check if the checkpoint folder already exists
                if (!fs.existsSync(stepCheckpointPath)) {
                    // Download the artifact for this completed step
                    await this.downloadCompletedStepArtifact(workspaceId, jobId, step.StepId, solutionRootPath)
                }

                // Apply changes if not already applied
                if (!appliedSteps.includes(step.StepId)) {
                    // Check if checkpoint folder exists after download attempt
                    if (fs.existsSync(stepCheckpointPath)) {
                        const result = await this.applyChanges(stepCheckpointPath, solutionRootPath)
                        if (result.success) {
                            // Mark this step as applied
                            this.saveAppliedCheckpoint(solutionRootPath, jobId, step.StepId)
                            this.logging.log(`ATX: Applied changes for step: ${step.StepId}`)
                        } else {
                            this.logging.error(`ATX: Failed to apply changes for step ${step.StepId}: ${result.error}`)
                        }
                    } else {
                        this.logging.log(
                            `ATX: Checkpoint folder not available for step: ${step.StepId}, skipping apply`
                        )
                    }
                } else {
                    this.logging.log(`ATX: Changes already applied for step: ${step.StepId}`)
                }
            }
        } catch (error) {
            this.logging.error(`ATX: downloadCompletedStepArtifacts error: ${String(error)}`)
        }
    }

    /**
     * Loads the list of step IDs that have already had their changes applied.
     */
    private loadAppliedCheckpoints(solutionRootPath: string, jobId: string): string[] {
        try {
            const appliedPath = path.join(
                solutionRootPath,
                workspaceFolderName,
                jobId,
                'checkpoints',
                'checkpoints-applied.json'
            )

            if (fs.existsSync(appliedPath)) {
                const content = fs.readFileSync(appliedPath, 'utf-8')
                const data = JSON.parse(content)
                return data.appliedSteps || []
            }

            return []
        } catch (error) {
            this.logging.error(`ATX: loadAppliedCheckpoints error: ${String(error)}`)
            return []
        }
    }

    /**
     * Saves a step ID to the list of applied checkpoints.
     */
    private saveAppliedCheckpoint(solutionRootPath: string, jobId: string, stepId: string): void {
        try {
            const checkpointsDir = path.join(solutionRootPath, workspaceFolderName, jobId, 'checkpoints')
            const appliedPath = path.join(checkpointsDir, 'checkpoints-applied.json')

            // Ensure directory exists
            if (!fs.existsSync(checkpointsDir)) {
                fs.mkdirSync(checkpointsDir, { recursive: true })
            }

            // Load existing data or create new
            let data: { appliedSteps: string[] } = { appliedSteps: [] }
            if (fs.existsSync(appliedPath)) {
                const content = fs.readFileSync(appliedPath, 'utf-8')
                data = JSON.parse(content)
            }

            // Add step if not already present
            if (!data.appliedSteps.includes(stepId)) {
                data.appliedSteps.push(stepId)
            }

            // Save back to file
            fs.writeFileSync(appliedPath, JSON.stringify(data, null, 2))
            this.logging.log(`ATX: Saved applied checkpoint: ${stepId}`)
        } catch (error) {
            this.logging.error(`ATX: saveAppliedCheckpoint error: ${String(error)}`)
        }
    }

    /**
     * Recursively finds all leaf steps with SUCCEEDED status in the plan tree.
     * Returns steps sorted by their score to ensure correct application order.
     */
    private findCompletedSteps(step: AtxPlanStep): (AtxPlanStep & { score?: number })[] {
        const completedSteps: (AtxPlanStep & { score?: number })[] = []

        // PlanStepStatus uses 'SUCCEEDED' for completed steps (not 'COMPLETED')
        // Only add leaf steps (steps without children) as those are the actual checkpoints
        if (step.Status === 'SUCCEEDED' && step.Children.length === 0) {
            completedSteps.push(step)
        }

        // Process children
        for (const child of step.Children) {
            completedSteps.push(...this.findCompletedSteps(child))
        }

        return completedSteps
    }

    /**
     * Downloads and extracts the artifact for a completed step.
     */
    private async downloadCompletedStepArtifact(
        workspaceId: string,
        jobId: string,
        stepId: string,
        solutionRootPath: string
    ): Promise<void> {
        try {
            this.logging.log(`ATX: Downloading artifact for completed step: ${stepId}`)

            // List artifacts filtered by stepId and CUSTOMER_OUTPUT category
            const artifacts = await this.listArtifactsForStep(workspaceId, jobId, stepId)

            if (!artifacts || artifacts.length === 0) {
                this.logging.log(`ATX: No CUSTOMER_OUTPUT artifact found for step: ${stepId}`)
                return
            }

            // There should be only one artifact that matches
            const artifact = artifacts[0]
            this.logging.log(`ATX: Found artifact ${artifact.artifactId} for step: ${stepId}`)

            // Download and extract the artifact
            await this.downloadDiffArtifact(workspaceId, jobId, artifact.artifactId, solutionRootPath, stepId)
        } catch (error) {
            this.logging.error(`ATX: downloadCompletedStepArtifact error for step ${stepId}: ${String(error)}`)
        }
    }

    /**
     * Lists artifacts filtered by stepId and CUSTOMER_OUTPUT category.
     */
    private async listArtifactsForStep(workspaceId: string, jobId: string, stepId: string): Promise<any[] | null> {
        try {
            this.logging.log(`ATX: Listing artifacts for step: ${stepId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for listArtifactsForStep')
                return null
            }

            const command = new ListArtifactsCommand({
                workspaceId: workspaceId,
                jobFilter: {
                    jobId: jobId,
                    categoryType: 'CUSTOMER_OUTPUT',
                    planStepId: stepId,
                },
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            this.logging.log(`ATX: Found ${result.artifacts?.length || 0} artifacts for step: ${stepId}`)
            return result.artifacts || []
        } catch (error) {
            this.logging.error(`ATX: listArtifactsForStep error: ${String(error)}`)
            return null
        }
    }

    /**
     * Fetches all plan steps in a single API call and builds the tree locally.
     */
    private async fetchPlanTree(workspaceId: string, jobId: string): Promise<AtxTransformationPlan> {
        const root = createEmptyRootNode()

        if (!this.atxClient && !(await this.initializeAtxClient())) {
            this.logging.error('ATX: Failed to initialize client for fetchPlanTree')
            return { Root: root }
        }

        // Fetch ALL steps in a single call (no parentStepId = returns all steps)
        const allSteps = await this.fetchAllSteps(workspaceId, jobId)
        if (!allSteps || allSteps.length === 0) {
            this.logging.log('ATX: No plan steps available yet')
            return { Root: root }
        }

        // Build tree from flat list
        root.Children = this.buildTreeFromFlatList(allSteps)

        this.logging.log(
            `ATX: fetchPlanTree completed - Built tree with ${root.Children.length} root steps from ${allSteps.length} total steps`
        )
        return { Root: root }
    }

    /**
     * Fetches all steps in a single API call (no parentStepId filter).
     */
    private async fetchAllSteps(workspaceId: string, jobId: string): Promise<any[]> {
        const allSteps: any[] = []
        let nextToken: string | undefined

        try {
            do {
                const command = new ListJobPlanStepsCommand({
                    workspaceId: workspaceId,
                    jobId: jobId,
                    maxResults: 100,
                    ...(nextToken && { nextToken }),
                })

                await this.addAuthToCommand(command)
                const result = await this.atxClient!.send(command)

                if (result?.steps) {
                    allSteps.push(...result.steps)
                }
                nextToken = result?.nextToken
            } while (nextToken)

            this.logging.log(`ATX: Fetched ${allSteps.length} total steps`)
            return allSteps
        } catch (error) {
            this.logging.error(`ATX: Error fetching all steps: ${String(error)}`)
            return []
        }
    }

    /**
     * Builds a tree structure from a flat list of steps using ParentStepId relationships.
     */
    private buildTreeFromFlatList(flatSteps: any[]): AtxPlanStep[] {
        // Create a map of StepId -> AtxPlanStep for quick lookup
        const stepMap = new Map<string, AtxPlanStep>()

        // First pass: convert all API steps to AtxPlanStep objects
        for (const apiStep of flatSteps) {
            const step = this.mapApiStepToNode(apiStep)
            if (step.StepId) {
                stepMap.set(step.StepId, step)
            }
        }

        // Second pass: build parent-child relationships
        const rootChildren: AtxPlanStep[] = []

        for (const step of stepMap.values()) {
            if (step.ParentStepId === 'root' || !step.ParentStepId) {
                rootChildren.push(step)
            } else {
                const parent = stepMap.get(step.ParentStepId)
                if (parent) {
                    parent.Children.push(step)
                } else {
                    // Orphan step - treat as root level
                    rootChildren.push(step)
                }
            }
        }

        // Sort all children arrays by score
        this.sortStepsByScore(rootChildren)
        for (const step of stepMap.values()) {
            if (step.Children.length > 0) {
                this.sortStepsByScore(step.Children)
            }
        }

        return rootChildren
    }

    /**
     * Maps an API step response to AtxPlanStep.
     * Converts from FES camelCase to C#-compatible PascalCase.
     */
    private mapApiStepToNode(apiStep: any): AtxPlanStep & { score?: number } {
        return {
            StepId: apiStep.stepId || '',
            ParentStepId: apiStep.parentStepId === 'root' ? null : apiStep.parentStepId || null,
            StepName: apiStep.stepName || '',
            Description: apiStep.description || '',
            Status: this.mapApiStatus(apiStep.status),
            Children: [],
            // Keep score for sorting (not sent to C#)
            score: apiStep.score || 0,
        }
    }

    /**
     * Maps API status string to PlanStepStatus.
     * Returns the status directly if valid, otherwise defaults to NOT_STARTED.
     */
    private mapApiStatus(status: string | undefined): PlanStepStatus {
        if (!status) return 'NOT_STARTED'
        // The API returns valid PlanStepStatus values directly
        return status as PlanStepStatus
    }

    /**
     * Sorts steps by score (primary).
     */
    private sortStepsByScore(steps: (AtxPlanStep & { score?: number })[]): void {
        steps.sort((a, b) => (a.score || 0) - (b.score || 0))
    }

    /**
     * Fetches worklogs for a job and saves them to disk.
     */
    private async fetchWorklogs(workspaceId: string, jobId: string, solutionRootPath: string): Promise<void> {
        await this.listWorklogs(workspaceId, jobId, solutionRootPath)
    }

    /**
     * Lists artifacts using FES client with filtering - default to CUSTOMER_OUTPUT
     */
    private async listArtifacts(
        workspaceId: string,
        jobId: string,
        filter: CategoryType = 'CUSTOMER_OUTPUT'
    ): Promise<any[] | null> {
        try {
            this.logging.log(`ATX: Starting ListArtifacts for job: ${jobId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for ListArtifacts')
                return null
            }

            const command = new ListArtifactsCommand({
                workspaceId: workspaceId,
                jobFilter: {
                    jobId: jobId,
                    categoryType: filter, // Server-side filtering for customer output artifacts
                },
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            this.logging.log(`ATX: ListArtifacts completed - Found ${result.artifacts?.length || 0} artifacts`)
            return result.artifacts || []
        } catch (error) {
            this.logging.error(`ATX: ListArtifacts error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Lists worklogs for a job and saves them to disk grouped by step ID.
     */
    private async listWorklogs(
        workspaceId: string,
        jobId: string,
        solutionRootPath: string,
        stepId?: string
    ): Promise<any[] | null> {
        try {
            this.logging.log(`ATX: Starting ListWorklogs for job: ${jobId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for ListWorklogs')
                return null
            }

            const command = new ListWorklogsCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                ...(stepId && {
                    worklogFilter: {
                        stepIdFilter: {
                            stepId: stepId,
                        },
                    },
                }),
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            this.logging.log(`ATX: ListWorklogs completed - Found ${result.worklogs?.length || 0} entries`)
            for (const value of result.worklogs || []) {
                const currentStepId = value.attributeMap?.STEP_ID || stepId || 'Progress'
                await Utils.saveWorklogsToJson(jobId, currentStepId, value.description || '', solutionRootPath)
            }

            return result.worklogs || []
        } catch (error) {
            this.logging.error(`ATX: ListWorklogs error: ${String(error)}`)
            return null
        }
    }

    /**
     * Set checkpoints for interactive mode transformation.
     * Lists HITLs with "checkpoint-settings" tag, uploads checkpoints as JSON artifact,
     * and updates the HITL task with the new artifact ID.
     */
    async setCheckpoints(
        workspaceId: string,
        jobId: string,
        solutionRootPath: string,
        checkpoints: Record<string, boolean>
    ): Promise<AtxSetCheckpointsResponse> {
        try {
            this.logging.log(`ATX: Starting setCheckpoints for job: ${jobId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                return { Success: false, Error: 'ATX FES client not initialized' }
            }

            // Step 1: List HITLs with "checkpoint-settings" tag
            const hitlTask = await this.findCheckpointSettingsHitl(workspaceId, jobId)

            if (!hitlTask) {
                return { Success: false, Error: 'No HITL task found with checkpoint-settings tag' }
            }

            this.logging.log(`ATX: Found checkpoint-settings HITL task: ${hitlTask.taskId}`)

            // Step 2: Create JSON file with checkpoints mapping in checkpoints folder
            const artifactDir = path.join(solutionRootPath, workspaceFolderName, jobId, 'checkpoints')
            if (!fs.existsSync(artifactDir)) {
                fs.mkdirSync(artifactDir, { recursive: true })
            }

            const jsonFilePath = path.join(artifactDir, 'checkpoint-settings.json')
            fs.writeFileSync(jsonFilePath, JSON.stringify(checkpoints, null, 2))

            // Step 3: Upload the JSON artifact
            const uploadInfo = await this.createArtifactUploadUrl(
                workspaceId,
                jobId,
                jsonFilePath,
                CategoryType.HITL_FROM_USER,
                FileType.JSON
            )

            if (!uploadInfo) {
                return { Success: false, Error: 'Failed to create artifact upload URL' }
            }

            const uploadSuccess = await Utils.uploadArtifact(
                uploadInfo.uploadUrl,
                jsonFilePath,
                uploadInfo.requestHeaders,
                this.logging
            )

            if (!uploadSuccess) {
                return { Success: false, Error: 'Failed to upload checkpoints artifact to S3' }
            }

            // Step 4: Complete artifact upload
            const completeResponse = await this.completeArtifactUpload(workspaceId, jobId, uploadInfo.uploadId)

            if (!completeResponse?.success) {
                return { Success: false, Error: 'Failed to complete artifact upload' }
            }

            // Step 5: Update HITL task with the new artifact ID
            const updateResult = await this.updateHitl(workspaceId, jobId, hitlTask.taskId, uploadInfo.uploadId)

            if (!updateResult) {
                return { Success: false, Error: 'Failed to update HITL task with checkpoints artifact' }
            }

            this.logging.log(`ATX: setCheckpoints completed successfully`)
            return { Success: true }
        } catch (error) {
            this.logging.error(`ATX: setCheckpoints error: ${String(error)}`)
            return { Success: false, Error: String(error) }
        }
    }

    /**
     * Find HITL task with "checkpoint-settings" tag
     */
    private async findCheckpointSettingsHitl(workspaceId: string, jobId: string): Promise<any | null> {
        try {
            this.logging.log(`ATX: Looking for HITL task with checkpoint-settings tag`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for findCheckpointSettingsHitl')
                return null
            }

            const command = new ListHitlTasksCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                taskType: 'NORMAL',
                taskFilter: {
                    taskStatuses: ['AWAITING_HUMAN_INPUT', 'IN_PROGRESS'],
                    tag: `${jobId}-checkpoint`,
                },
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            if (result.hitlTasks && result.hitlTasks.length > 0) {
                this.logging.log(`ATX: Found ${result.hitlTasks.length} HITL task(s) with checkpoint-settings tag`)
                return result.hitlTasks[0]
            }

            this.logging.log('ATX: No HITL task found with checkpoint-settings tag')
            return null
        } catch (error) {
            this.logging.error(`ATX: findCheckpointSettingsHitl error: ${String(error)}`)
            return null
        }
    }

    /**
     * Handle checkpoint action (APPLY or RETRY) for a step-level HITL.
     */
    async checkpointAction(
        workspaceId: string,
        jobId: string,
        stepId: string,
        action: string,
        solutionRootPath: string,
        newInstruction?: string
    ): Promise<AtxCheckpointActionResponse> {
        try {
            this.logging.log(`ATX: Starting checkpointAction for job: ${jobId}, step: ${stepId}, action: ${action}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                return { Success: false, Error: 'ATX FES client not initialized' }
            }

            // Get the cached step HITL task ID, or query for it if not cached
            let taskId: string | null = this.cachedStepHitl
            if (!taskId) {
                this.logging.log('ATX: No cached step HITL, querying for active step HITL')
                const stepHitl = await this.findStepLevelHitl(workspaceId, jobId, stepId)
                if (!stepHitl || !stepHitl.taskId) {
                    return { Success: false, Error: 'No active step HITL found' }
                }
                taskId = stepHitl.taskId
            }

            // At this point taskId is guaranteed to be a string
            const validTaskId = taskId as string

            // Create the human artifact JSON
            const artifactContent: any = {
                action: action,
            }
            if (action === 'RETRY' && newInstruction) {
                artifactContent.newInstruction = newInstruction
            }

            // Create the JSON file at {solutionRootPath}/{workspaceFolderName}/{jobId}/checkpoints/checkpoint-action.json
            const artifactDir = path.join(solutionRootPath, workspaceFolderName, jobId, 'checkpoints')
            if (!fs.existsSync(artifactDir)) {
                fs.mkdirSync(artifactDir, { recursive: true })
            }

            const jsonFilePath = path.join(artifactDir, 'checkpoint-action.json')
            fs.writeFileSync(jsonFilePath, JSON.stringify(artifactContent, null, 2))

            // Upload the JSON artifact
            const uploadInfo = await this.createArtifactUploadUrl(
                workspaceId,
                jobId,
                jsonFilePath,
                CategoryType.HITL_FROM_USER,
                FileType.JSON
            )

            if (!uploadInfo) {
                return { Success: false, Error: 'Failed to create artifact upload URL' }
            }

            const uploadSuccess = await Utils.uploadArtifact(
                uploadInfo.uploadUrl,
                jsonFilePath,
                uploadInfo.requestHeaders,
                this.logging
            )

            if (!uploadSuccess) {
                return { Success: false, Error: 'Failed to upload checkpoint action artifact to S3' }
            }

            // Complete artifact upload
            const completeResponse = await this.completeArtifactUpload(workspaceId, jobId, uploadInfo.uploadId)

            if (!completeResponse?.success) {
                return { Success: false, Error: 'Failed to complete artifact upload' }
            }

            // Submit the standard HITL task with the human artifact
            const submitResult = await this.submitStandardHitl(workspaceId, jobId, validTaskId, uploadInfo.uploadId)

            if (!submitResult) {
                return { Success: false, Error: 'Failed to submit checkpoint action' }
            }

            // Poll the HITL task until it's closed
            this.logging.log('ATX: Polling step HITL task for completion')
            const pollResult = await this.pollHitlTask(workspaceId, jobId, validTaskId)

            if (!pollResult) {
                return { Success: false, Error: 'Timeout waiting for checkpoint action to complete' }
            }

            // Clear the cached step HITL after successful submission
            this.cachedStepHitl = null

            this.logging.log(`ATX: checkpointAction completed successfully - ${pollResult}`)
            return { Success: true }
        } catch (error) {
            this.logging.error(`ATX: checkpointAction error: ${String(error)}`)
            return { Success: false, Error: String(error) }
        }
    }

    /**
     * Submit a standard HITL task with a human artifact.
     */
    private async submitStandardHitl(
        workspaceId: string,
        jobId: string,
        taskId: string,
        humanArtifactId: string
    ): Promise<any | null> {
        try {
            this.logging.log(`ATX: Starting SubmitStandardHitl for task: ${taskId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for SubmitStandardHitl')
                return null
            }

            const command = new SubmitStandardHitlTaskCommand({
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

            this.logging.log(`ATX: SubmitStandardHitl completed - task status: ${result.status || 'UNKNOWN'}`)
            return result
        } catch (error) {
            this.logging.error(`ATX: SubmitStandardHitl error: ${String(error)}`)
            return null
        }
    }

    /**
     * Apply changes from a checkpoint folder to the solution root.
     * Reads metadata.json and applies file additions, removals, updates, and moves.
     */
    private async applyChanges(
        checkpointFolderPath: string,
        solutionRootPath: string
    ): Promise<{
        success: boolean
        error?: string
        filesAdded?: number
        filesRemoved?: number
        filesUpdated?: number
        filesMoved?: number
    }> {
        try {
            this.logging.log(`ATX: Starting applyChanges from ${checkpointFolderPath} to ${solutionRootPath}`)

            // Read metadata.json from checkpoint folder
            const metadataPath = path.join(checkpointFolderPath, 'metadata.json')
            if (!fs.existsSync(metadataPath)) {
                return { success: false, error: `metadata.json not found at ${metadataPath}` }
            }

            const metadataContent = fs.readFileSync(metadataPath, 'utf-8')
            const metadata = JSON.parse(metadataContent)

            const filesAdded = metadata.filesAdded || []
            const filesRemoved = metadata.filesRemoved || []
            const filesUpdated = metadata.filesUpdated || []
            const movedFilesMap = metadata.movedFilesMap || []

            let addedCount = 0
            let removedCount = 0
            let updatedCount = 0
            let movedCount = 0

            // Handle filesAdded: Copy from {checkpointFolder}/after/{relativePath} to {solutionRootPath}/{relativePath}
            for (const relativePath of filesAdded) {
                try {
                    const sourcePath = path.join(checkpointFolderPath, 'after', relativePath)
                    const destPath = path.join(solutionRootPath, relativePath)

                    // Ensure destination directory exists
                    const destDir = path.dirname(destPath)
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true })
                    }

                    fs.copyFileSync(sourcePath, destPath)
                    addedCount++
                    this.logging.log(`ATX: Added file: ${relativePath}`)
                } catch (e) {
                    this.logging.error(`ATX: Failed to add file ${relativePath}: ${String(e)}`)
                }
            }

            // Handle filesRemoved: Delete file at {solutionRootPath}/{relativePath}
            for (const relativePath of filesRemoved) {
                try {
                    const filePath = path.join(solutionRootPath, relativePath)
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath)
                        removedCount++
                        this.logging.log(`ATX: Removed file: ${relativePath}`)
                    }
                } catch (e) {
                    this.logging.error(`ATX: Failed to remove file ${relativePath}: ${String(e)}`)
                }
            }

            // Handle filesUpdated: Copy from {checkpointFolder}/after/{relativePath} to {solutionRootPath}/{relativePath}
            for (const relativePath of filesUpdated) {
                try {
                    const sourcePath = path.join(checkpointFolderPath, 'after', relativePath)
                    const destPath = path.join(solutionRootPath, relativePath)

                    // Ensure destination directory exists
                    const destDir = path.dirname(destPath)
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true })
                    }

                    fs.copyFileSync(sourcePath, destPath)
                    updatedCount++
                    this.logging.log(`ATX: Updated file: ${relativePath}`)
                } catch (e) {
                    this.logging.error(`ATX: Failed to update file ${relativePath}: ${String(e)}`)
                }
            }

            // Handle filesMoved: Use movedFilesMap to copy content from before to after location, delete before file
            for (const mapping of movedFilesMap) {
                try {
                    const beforePath = path.join(solutionRootPath, mapping.before)
                    const afterPath = path.join(solutionRootPath, mapping.after)

                    // Ensure destination directory exists
                    const afterDir = path.dirname(afterPath)
                    if (!fs.existsSync(afterDir)) {
                        fs.mkdirSync(afterDir, { recursive: true })
                    }

                    // Copy content from before to after
                    if (fs.existsSync(beforePath)) {
                        fs.copyFileSync(beforePath, afterPath)
                        // Delete the before file
                        fs.unlinkSync(beforePath)
                        movedCount++
                        this.logging.log(`ATX: Moved file: ${mapping.before} -> ${mapping.after}`)
                    }
                } catch (e) {
                    this.logging.error(`ATX: Failed to move file ${mapping.before} -> ${mapping.after}: ${String(e)}`)
                }
            }

            this.logging.log(
                `ATX: applyChanges completed - Added: ${addedCount}, Removed: ${removedCount}, Updated: ${updatedCount}, Moved: ${movedCount}`
            )
            return {
                success: true,
                filesAdded: addedCount,
                filesRemoved: removedCount,
                filesUpdated: updatedCount,
                filesMoved: movedCount,
            }
        } catch (error) {
            this.logging.error(`ATX: applyChanges error: ${String(error)}`)
            return { success: false, error: String(error) }
        }
    }

    /**
     * Send chat message to Transform service
     */
    async sendMessage(request: {
        workspaceId: string
        jobId?: string
        text: string
        skipPolling?: boolean
    }): Promise<any> {
        try {
            this.logging.log(`ATX: Sending chat message for workspace: ${request.workspaceId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const command = new SendMessageCommand({
                text: request.text,
                idempotencyToken: uuidv4(),
                metadata: {
                    resourcesOnScreen: {
                        workspace: {
                            workspaceId: request.workspaceId,
                            ...(request.jobId ? { jobs: [{ jobId: request.jobId, focusState: 'ACTIVE' }] } : {}),
                        },
                    },
                },
            })

            await this.addAuthToCommand(command)
            const sendResult = (await this.atxClient!.send(command)) as any
            const sentMessageId = sendResult?.message?.messageId

            if (!sentMessageId || request.skipPolling) {
                return { success: true, data: sendResult }
            }

            // Poll for response
            for (let attempt = 0; attempt < 8; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 2000))

                const listResult = await this.listMessages({
                    workspaceId: request.workspaceId,
                    jobId: request.jobId,
                    maxResults: 10,
                })

                const messageIds = listResult?.messageIds ?? []
                if (!messageIds.length) continue

                const batchResult = await this.batchGetMessages({
                    workspaceId: request.workspaceId,
                    messageIds,
                })

                const responses = (batchResult?.messages ?? []).filter(
                    (m: any) => m.parentMessageId === sentMessageId && m.messageOrigin === 'SYSTEM'
                )

                const finalResponse = responses.find((m: any) => m.processingInfo?.messageType === 'FINAL_RESPONSE')

                if (finalResponse) {
                    return {
                        success: true,
                        data: {
                            sentMessage: sendResult.message,
                            response: {
                                messageId: finalResponse.messageId,
                                text: finalResponse.text,
                                messageType: 'FINAL_RESPONSE',
                                interactions: finalResponse.interactions,
                                createdAt: finalResponse.createdAt,
                            },
                        },
                    }
                }
            }

            return {
                success: true,
                data: {
                    sentMessage: sendResult.message,
                    response: null,
                    note: 'No final response within 16s. Use listMessages + batchGetMessages to check later.',
                },
            }
        } catch (error) {
            this.logging.error(`ATX: SendMessage error: ${String(error)}`)
            throw error
        }
    }

    /**
     * List chat messages
     */
    async listMessages(request: {
        workspaceId: string
        jobId?: string
        maxResults?: number
        nextToken?: string
        startTimestamp?: Date
    }): Promise<any> {
        try {
            this.logging.log(`ATX: Listing messages for workspace: ${request.workspaceId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const workspace: any = { workspaceId: request.workspaceId }
            if (request.jobId) {
                workspace.jobs = [{ jobId: request.jobId, focusState: 'ACTIVE' }]
            }

            const command = new ListMessagesCommand({
                metadata: { resourcesOnScreen: { workspace } },
                ...(request.maxResults && { maxResults: request.maxResults }),
                ...(request.nextToken && { nextToken: request.nextToken }),
                ...(request.startTimestamp && { startTimestamp: request.startTimestamp }),
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            this.logging.log(`ATX: ListMessages completed - Found ${result.messageIds?.length || 0} messages`)
            return result
        } catch (error) {
            this.logging.error(`ATX: ListMessages error: ${String(error)}`)
            throw error
        }
    }

    /**
     * Batch get messages by IDs
     */
    async batchGetMessages(request: { workspaceId: string; messageIds: string[] }): Promise<any> {
        try {
            this.logging.log(`ATX: Batch getting ${request.messageIds.length} messages`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const command = new BatchGetMessageCommand({
                messageIds: request.messageIds,
                workspaceId: request.workspaceId,
            })

            await this.addAuthToCommand(command)
            const result = await this.atxClient!.send(command)

            this.logging.log(`ATX: BatchGetMessages completed`)
            return result
        } catch (error) {
            this.logging.error(`ATX: BatchGetMessages error: ${String(error)}`)
            throw error
        }
    }
}
