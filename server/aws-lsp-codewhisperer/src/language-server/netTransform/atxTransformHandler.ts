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
} from './atxModels'
import { v4 as uuidv4 } from 'uuid'
import { request } from 'http'
import { TransformationPlan } from '@amzn/codewhisperer-runtime'

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
        workspaceName: string | null,
        workspaceDescription?: string
    ): Promise<{ workspaceId: string; workspaceName: string } | null> {
        try {
            this.logging.log(`ATX: Starting CreateWorkspace with name: ${workspaceName || 'auto-generated'}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const { CreateWorkspaceCommand } = await import('@amazon/elastic-gumby-frontend-client')
            const command = new CreateWorkspaceCommand({
                name: workspaceName || undefined,
                description:
                    workspaceDescription ||
                    (workspaceName ? `Workspace: ${workspaceName}` : 'Auto-generated workspace'),
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
                const newWorkspace = await this.createWorkspace(
                    request.CreateWorkspaceName,
                    request.CreateWorkspaceDescription
                )

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
    }): Promise<{ jobId: string; status: string } | null> {
        try {
            this.logging.log(`ATX: Starting CreateJob for workspace: ${request.workspaceId}`)

            // Call ATX FES createJob API
            if (!this.atxClient && !(await this.initializeAtxClient())) {
                throw new Error('ATX FES client not initialized')
            }

            const command = new CreateJobCommand({
                workspaceId: request.workspaceId,
                objective: JSON.stringify({ target_framework: request.targetFramework || 'net10.0' }),
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
        startTransformRequest: object
    }): Promise<{ TransformationJobId: string; ArtifactPath: string; UploadId: string } | null> {
        try {
            this.logging.log(`ATX: Starting transform workflow for workspace: ${request.workspaceId}`)

            // Step 1: Create transformation job
            const createJobResponse = await this.createJob({
                workspaceId: request.workspaceId,
                jobName: request.jobName || 'Transform Job',
                targetFramework: (request.startTransformRequest as any).TargetFramework,
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
    ): Promise<TransformationPlan> {
        try {
            // Get real plan steps from ATX FES (only if job status >= PLANNED)
            const planSteps = await this.getATXFESJobPlanSteps(workspaceId, jobId)

            if (planSteps) {
                this.logging.log(`ATX FES: Found ${planSteps.length} transformation steps`)

                // Sort steps by score (primary) and startTime (tiebreaker) to match RTS ordering
                planSteps.sort((a: any, b: any) => {
                    const scoreDiff = (a.score || 0) - (b.score || 0)
                    if (scoreDiff !== 0) return scoreDiff

                    // Tiebreaker for identical scores: sort by startTime
                    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0
                    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0
                    return timeA - timeB
                })

                // Return in exact same format as RTS with all required fields
                const transformationPlan = {
                    transformationSteps: planSteps.map((step: any, index: number) => {
                        try {
                            // Map substeps to ProgressUpdates for IDE display
                            const progressUpdates = (step.substeps || []).map((substep: any) => {
                                // Map ATX substep status to IDE TransformationProgressUpdateStatus enum values
                                let substepStatus = 'IN_PROGRESS' // Default - no NOT_STARTED in this enum
                                switch (substep.status) {
                                    case 'SUCCEEDED':
                                    case 'COMPLETED':
                                        substepStatus = 'COMPLETED'
                                        break
                                    case 'IN_PROGRESS':
                                    case 'RUNNING':
                                        substepStatus = 'IN_PROGRESS'
                                        break
                                    case 'FAILED':
                                        substepStatus = 'FAILED'
                                        break
                                    case 'SKIPPED':
                                        substepStatus = 'SKIPPED'
                                        break
                                    case 'NOT_STARTED':
                                    case 'CREATED':
                                    default:
                                        substepStatus = 'IN_PROGRESS' // No NOT_STARTED option in ProgressUpdate enum
                                        break
                                }

                                // Map nested progress updates (3rd level)
                                const nestedProgressUpdates = (substep.substeps || []).map((nestedUpdate: any) => {
                                    let nestedStatus = 'IN_PROGRESS'
                                    switch (nestedUpdate.status) {
                                        case 'SUCCEEDED':
                                        case 'COMPLETED':
                                            nestedStatus = 'COMPLETED'
                                            break
                                        case 'IN_PROGRESS':
                                        case 'RUNNING':
                                            nestedStatus = 'IN_PROGRESS'
                                            break
                                        case 'FAILED':
                                            nestedStatus = 'FAILED'
                                            break
                                        case 'SKIPPED':
                                            nestedStatus = 'SKIPPED'
                                            break
                                        default:
                                            nestedStatus = 'IN_PROGRESS'
                                            break
                                    }
                                    return {
                                        name: nestedUpdate.stepName || 'Unknown Nested Update',
                                        description: nestedUpdate.description || '',
                                        status: nestedStatus,
                                        stepId: nestedUpdate.stepId ?? undefined,
                                    }
                                })

                                return {
                                    name: substep.stepName || 'Unknown Substep',
                                    description: substep.description || '',
                                    status: substepStatus,
                                    startTime: substep.startTime ? new Date(substep.startTime) : undefined,
                                    endTime: substep.endTime ? new Date(substep.endTime) : undefined,
                                    stepId: substep.stepId ?? undefined,
                                    progressUpdates: nestedProgressUpdates,
                                }
                            })

                            // Use ATX status directly - IDE supports most values, minimal mapping needed
                            let mappedStatus = step.status || 'NOT_STARTED'
                            // Only map the few values IDE doesn't have
                            if (mappedStatus === 'SUCCEEDED') {
                                mappedStatus = 'COMPLETED'
                            } else if (mappedStatus === 'RUNNING') {
                                mappedStatus = 'IN_PROGRESS'
                            } else if (mappedStatus === 'CREATED') {
                                mappedStatus = 'NOT_STARTED'
                            }

                            // Use ATX step data directly without hardcoded ordering
                            const stepNumber = index + 1
                            const stepName = `Step ${stepNumber} - ${step.stepName || 'Unknown Step'}`

                            return {
                                id: step.stepId || `step-${stepNumber}`,
                                name: stepName,
                                description: step.description || '',
                                status: mappedStatus,
                                progressUpdates: progressUpdates,
                                startTime: step.startTime ? new Date(step.startTime) : undefined,
                                endTime: step.endTime ? new Date(step.endTime) : undefined,
                            }
                        } catch (error) {
                            this.logging.error(`ATX FES: Error mapping step ${index}: ${String(error)}`)
                            // Return a safe fallback step
                            const stepNumber = index + 1
                            return {
                                id: step.stepId || `fallback-${stepNumber}`,
                                name: `Step ${stepNumber} - ${step.stepName || `Step ${stepNumber}`}`,
                                description: step.description || '',
                                status: 'NOT_STARTED',
                                progressUpdates: [],
                                startTime: undefined,
                                endTime: undefined,
                            }
                        }
                    }),
                } as TransformationPlan
                try {
                    await this.listWorklogs(workspaceId, jobId, solutionRootPath)
                } catch (e) {
                    this.logging.log(`ATX FES: Could not get worklog for workspaces: ${workspaceId}, job id: ${jobId}`)
                }

                this.logging.log(
                    `ATX FES: Successfully mapped ${transformationPlan.transformationSteps?.length || 0} steps`
                )

                return transformationPlan
            } else {
                this.logging.log('ATX FES: No plan steps available yet - returning empty plan')
                return {
                    transformationSteps: [] as any,
                } as TransformationPlan
            }
        } catch (error) {
            this.logging.error(`ATX FES getTransformationPlan error: ${String(error)}`)
            // Return empty plan on error
            return {
                transformationSteps: [] as any,
            } as TransformationPlan
        }
    }

    private async getATXFESJobPlanSteps(workspaceId: string, jobId: string): Promise<any[] | null> {
        try {
            this.logging.log(`ATX FES: getting plan steps with substeps...`)
            const result = await this.listJobPlanSteps(workspaceId, jobId)
            if (result) {
                const steps = result || []
                this.logging.log(`ListJobPlanSteps: SUCCESS - Found ${steps.length} plan steps with substeps`)
                return steps
            }
            return null
        } catch (error) {
            this.logging.error(`ListJobPlanSteps error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Lists job plan steps using FES client with recursive substep fetching
     */
    private async listJobPlanSteps(workspaceId: string, jobId: string): Promise<any[] | null> {
        try {
            this.logging.log(`ATX: Starting ListJobPlanSteps for job: ${jobId}`)

            if (!this.atxClient && !(await this.initializeAtxClient())) {
                this.logging.error('ATX: Failed to initialize client for ListJobPlanSteps')
                return null
            }

            // Get root steps first
            const rootSteps = await this.getStepsRecursive(workspaceId, jobId, 'root')

            if (rootSteps && rootSteps.length > 0) {
                // For each root step, get its substeps
                for (const step of rootSteps) {
                    const substeps = await this.getStepsRecursive(workspaceId, jobId, step.stepId)
                    step.substeps = substeps || []

                    // Sort substeps by score (primary) and startTime (tiebreaker) to match RTS ordering
                    if (step.substeps.length > 0) {
                        step.substeps.sort((a: any, b: any) => {
                            const scoreDiff = (a.score || 0) - (b.score || 0)
                            if (scoreDiff !== 0) return scoreDiff

                            // Tiebreaker for identical scores: sort by startTime
                            const timeA = a.startTime ? new Date(a.startTime).getTime() : 0
                            const timeB = b.startTime ? new Date(b.startTime).getTime() : 0
                            return timeA - timeB
                        })
                        for (const substep of step.substeps) {
                            const superSubsteps = await this.getStepsRecursive(workspaceId, jobId, substep.stepId)
                            substep.substeps = superSubsteps || []

                            // Sort substeps by score (primary) and startTime (tiebreaker) to match RTS ordering
                            if (substep.substeps.length > 0) {
                                substep.substeps.sort((a: any, b: any) => {
                                    const scoreDiff = (a.score || 0) - (b.score || 0)
                                    if (scoreDiff !== 0) return scoreDiff

                                    // Tiebreaker for identical scores: sort by startTime
                                    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0
                                    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0
                                    return timeA - timeB
                                })
                            }
                        }
                    }
                }

                this.logging.log(`ATX: ListJobPlanSteps completed - Found ${rootSteps.length} steps with substeps`)
                return rootSteps
            }

            this.logging.log('ATX: ListJobPlanSteps - No root steps found')
            return null
        } catch (error) {
            this.logging.error(`ATX: ListJobPlanSteps error: ${String(error)}`)
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
            const result = await this.atxClient!.send(command)

            if (result && result.steps && result.steps.length > 0) {
                return result.steps
            }

            return null
        } catch (error) {
            this.logging.error(`Error getting steps for parent ${parentStepId}: ${String(error)}`)
            return null
        }
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
     * Lists artifacts using FES client with CUSTOMER_OUTPUT filtering
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
}
