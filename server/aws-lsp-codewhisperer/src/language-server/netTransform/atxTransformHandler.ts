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
    UpdateHitlTaskCommand,
    GetJobCommand,
    ListJobPlanStepsCommand,
    ListWorklogsCommand,
    ListArtifactsCommand,
    StartJobCommand,
    StopJobCommand,
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
        interactiveMode?: boolean
    }): Promise<{ jobId: string; status: string } | null> {
        try {
            this.logging.log(`ATX: Starting CreateJob for workspace: ${request.workspaceId}`)

            // Call ATX FES createJob API
            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            // Build objective object with target_framework and optionally interactive_mode
            const objective: any = {
                target_framework: request.targetFramework || 'net10.0',
                interactive_mode: request.interactiveMode || false,
            }

            const command = new CreateJobCommand({
                workspaceId: request.workspaceId,
                objective: JSON.stringify(objective),
                jobType: 'DOTNET_IDE' as any,
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
        interactiveMode?: boolean
        startTransformRequest: object
    }): Promise<{ TransformationJobId: string; ArtifactPath: string; UploadId: string } | null> {
        try {
            this.logging.log(`ATX: Starting transform workflow for workspace: ${request.workspaceId}`)

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

    async getJob(workspaceId: string, jobId: string): Promise<JobInfo | null> {
        try {
            this.logging.log(`ATX: Getting job: ${jobId} in workspace: ${workspaceId}`)

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

            this.logging.log(`ATX: UpdateHitl completed successfully`)
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
    ): Promise<{ PlanPath: string; ReportPath: string } | null> {
        try {
            this.logging.log(`ATX: Getting Hitl Agent Artifact for job: ${jobId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for GetHitlAgentArtifact')
                return null
            }

            const hitls = await this.listHitls(workspaceId, jobId)

            if (hitls && hitls.length != 1) {
                this.logging.log(`ATX: Found ${hitls.length} hitls (expected 1)`)
            } else if (!hitls) {
                this.logging.error(`ATX: No hitls available for download`)
                throw new Error('no or many HITLE_FROM_USER artifacts available for download (expects 1 artifact)')
            }

            const hitl = hitls[0]
            this.cachedHitl = hitl.taskId

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

            const planPath = path.join(pathToDownload, 'transformation-plan.md')
            const reportPath = path.join(pathToDownload, 'assessment-report.md')
            this.logging.log(`ATX: GetHitlAgentArtifact completed successfully`)
            return { PlanPath: planPath, ReportPath: reportPath }
        } catch (error) {
            this.logging.error(`ATX: GetHitlAgentArtifact error: ${String(error)}`)
            return null
        }
    }

    /**
     * Get transform info - dummy implementation
     */
    async getTransformInfo(request: AtxGetTransformInfoRequest): Promise<AtxGetTransformInfoResponse | null> {
        try {
            this.logging.log(`ATX: Getting transform info for job: ${request.TransformationJobId}`)

            const job = await this.getJob(request.WorkspaceId, request.TransformationJobId)

            if (!job) {
                this.logging.error(`ATX: Job not found: ${request.TransformationJobId}`)
                return null
            }

            const jobStatus = job.statusDetails?.status

            if (jobStatus === 'COMPLETED') {
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

                return {
                    TransformationJob: {
                        WorkspaceId: request.WorkspaceId,
                        JobId: request.TransformationJobId,
                        Status: jobStatus,
                    } as AtxTransformationJob,
                    TransformationPlan: plan,
                } as AtxGetTransformInfoResponse
            } else if (jobStatus === 'AWAITING_HUMAN_INPUT') {
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

            this.logging.log(`ATX: Successfully built plan tree with ${plan.Root.Children.length} root steps`)
            return plan
        } catch (error) {
            this.logging.error(`ATX: getTransformationPlan error: ${String(error)}`)
            return { Root: createEmptyRootNode() }
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

            // Step 2: Create JSON file with checkpoints mapping in artifact workspace
            const artifactDir = path.join(solutionRootPath, workspaceFolderName, jobId)
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
                    taskStatuses: ['AWAITING_HUMAN_INPUT'],
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
}
