import { ExportIntent } from '@amzn/codewhisperer-streaming'
import { Logging, Runtime, Workspace } from '@aws/language-server-runtimes/server-interface'
import * as fs from 'fs'
import * as archiver from 'archiver'
import got from 'got'
import { v4 as uuidv4 } from 'uuid'
import {
    ElasticGumbyFrontendClient,
    GetHitlTaskCommand,
    UpdateHitlTaskResponse,
} from '@amazon/elastic-gumby-frontend-client'
import {
    VerifySessionCommand,
    ListWorkspacesCommand,
    CreateWorkspaceCommand,
    CreateJobCommand,
    StartJobCommand,
    GetJobCommand,
    StopJobCommand,
    ListJobPlanStepsCommand,
    CreateArtifactUploadUrlCommand,
    CreateArtifactDownloadUrlCommand,
    CompleteArtifactUploadCommand,
    ListAvailableProfilesCommand,
    ListArtifactsCommand,
    CategoryType,
    ListHitlTasksCommand,
    SubmitStandardHitlTaskCommand,
    UpdateHitlTaskCommand,
    FileType,
} from '@amazon/elastic-gumby-frontend-client'
import {
    CreateUploadUrlResponse,
    GetTransformationRequest,
    StopTransformationRequest,
    TransformationJob,
} from '@amzn/codewhisperer-runtime'
import { ArtifactManager } from './artifactManager'
import { getCWStartTransformRequest, getCWStartTransformResponse } from './converter'
import {
    CancelTransformRequest,
    CancelTransformResponse,
    CancellationJobStatus,
    DownloadArtifactsResponse,
    GetTransformPlanRequest,
    GetTransformPlanResponse,
    GetTransformRequest,
    GetTransformResponse,
    StartTransformRequest,
    StartTransformResponse,
    TransformProjectMetadata,
    PollTransformationStatus,
    TransformationErrorCode,
    GetEditablePlanRequest,
    GetEditablePlanResponse,
    UploadEditablePlanRequest,
    UploadEditablePlanResponse,
} from './models'
import * as validation from './validation'
import path = require('path')
import AdmZip = require('adm-zip')
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { DEFAULT_ATX_FES_REGION, DEFAULT_ATX_FES_ENDPOINT } from '../../shared/constants'
import * as https from 'https'
import { URL } from 'url'

const workspaceFolderName = 'artifactWorkspace'

/**
 * Generates a UUID for idempotency tokens
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0
        const v = c == 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

export class TransformHandler {
    private serviceManager: AmazonQTokenServiceManager
    private workspace: Workspace
    private logging: Logging
    private runtime: Runtime
    private cancelPollingEnabled: Boolean = false
    private logATXFESResponse(apiName: string, response: any): void {
        this.logging.log(`ATX FES ${apiName} response received`)
    }

    private currentWorkspaceId: string | null = null
    private cachedApplicationUrl: string | null = null
    private fesClient: any = null
    private atxClient: ElasticGumbyFrontendClient | null = null
    private cachedHitlId: string | null = null

    constructor(serviceManager: AmazonQTokenServiceManager, workspace: Workspace, logging: Logging, runtime: Runtime) {
        this.serviceManager = serviceManager
        this.workspace = workspace
        this.logging = logging
        this.runtime = runtime
    }

    /**
     * Ensure ATX client is initialized with proper authentication
     */
    private async ensureATXClient(): Promise<boolean> {
        if (this.atxClient) {
            return true
        }

        try {
            const endpoint = process.env.TCP_ENDPOINT || DEFAULT_ATX_FES_ENDPOINT

            this.logging.log(`ATX client initializing with endpoint: ${endpoint}`)

            this.atxClient = new ElasticGumbyFrontendClient({
                region: DEFAULT_ATX_FES_REGION,
                endpoint: endpoint,
            })

            this.logging.log('ATX client initialized successfully')
            return true
        } catch (error) {
            this.logging.error(
                `Failed to initialize ATX client: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return false
        }
    }

    /**
     * Add bearer token and Origin header to command via middleware
     */
    private async addBearerTokenToCommand(command: any): Promise<void> {
        const credentialsProvider = (this.serviceManager as any).features?.credentialsProvider
        if (!credentialsProvider) return

        const credentials = await credentialsProvider.getCredentials('bearer')
        if (!credentials?.token) return

        const applicationUrl = await this.getActiveTransformProfileApplicationUrl()
        const cleanOrigin = applicationUrl
            ? applicationUrl.endsWith('/')
                ? applicationUrl.slice(0, -1)
                : applicationUrl
            : ''

        command.middlewareStack?.add(
            (next: any) => async (args: any) => {
                if (!args.request.headers) {
                    args.request.headers = {}
                }
                args.request.headers['Authorization'] = `Bearer ${credentials.token}`
                if (cleanOrigin) {
                    args.request.headers['Origin'] = cleanOrigin
                }

                try {
                    if (cleanOrigin) {
                        const tenantMatch = cleanOrigin.match(/https:\/\/([^.]+)\./)
                        if (tenantMatch) {
                            args.request.headers['x-tenant-id'] = tenantMatch[1]
                        }
                    }

                    const profileArn = await this.getActiveTransformProfileArn()
                    if (profileArn) {
                        args.request.headers['x-amzn-qt-profileArn'] = profileArn

                        const accountMatch = profileArn.match(/arn:aws:transform:[^:]+:([^:]+):/)
                        if (accountMatch) {
                            args.request.headers['x-amzn-qt-accountId'] = accountMatch[1]
                        }
                    }
                } catch (error) {
                    this.logging.log(
                        `Warning: Could not extract tenant/profile headers: ${error instanceof Error ? error.message : 'Unknown error'}`
                    )
                }

                args.request.headers['Content-Type'] = 'application/json; charset=UTF-8'
                args.request.headers['Content-Encoding'] = 'amz-1.0'
                return next(args)
            },
            { step: 'build', name: 'addBearerTokenAndOriginAndHeaders' }
        )
    }

    async startTransformation(userInputrequest: StartTransformRequest): Promise<StartTransformResponse> {
        var unsupportedProjects: string[] = []
        const isProject = validation.isProject(userInputrequest)
        const containsUnsupportedViews = await validation.checkForUnsupportedViews(
            userInputrequest,
            isProject,
            this.logging
        )

        // Check if current profile is Transform profile
        const activeProfileArn = this.serviceManager.getActiveProfileArn()
        const isTransformProfile = activeProfileArn?.includes(':transform:') ?? false

        this.logging.log(`Active profile: ${activeProfileArn}`)
        this.logging.log(`Is Transform profile: ${isTransformProfile}`)

        if (isTransformProfile) {
            this.logging.log('=== Using ATX FES Flow for Transform Profile ===')
            return await this.startTransformationATXFES(userInputrequest, unsupportedProjects, containsUnsupportedViews)
        } else {
            this.logging.log('=== Using RTS Flow for Q Developer Profile ===')
            return await this.startTransformationRTS(userInputrequest, unsupportedProjects, containsUnsupportedViews)
        }
    }

    private async startTransformationRTS(
        userInputrequest: StartTransformRequest,
        unsupportedProjects: string[],
        containsUnsupportedViews: boolean
    ): Promise<StartTransformResponse> {
        const artifactManager = new ArtifactManager(
            this.workspace,
            this.logging,
            this.getWorkspacePath(userInputrequest.SolutionRootPath),
            userInputrequest.SolutionRootPath
        )
        try {
            const payloadFilePath = await this.zipCodeAsync(userInputrequest, artifactManager)
            this.logging.log('Payload path: ' + payloadFilePath)

            const uploadId = await this.preTransformationUploadCode(payloadFilePath)
            const request = getCWStartTransformRequest(userInputrequest, uploadId, this.logging)
            this.logging.log('Sending request to start transform api: ' + JSON.stringify(request))
            const response = await this.serviceManager
                .getCodewhispererService()
                .codeModernizerStartCodeTransformation(request)
            this.logging.log('Received transformation job Id: ' + response?.transformationJobId)
            return getCWStartTransformResponse(
                response,
                uploadId,
                payloadFilePath,
                unsupportedProjects,
                containsUnsupportedViews
            )
        } catch (error) {
            let errorMessage = (error as Error).message ?? 'Error in StartTransformation API call'
            if (errorMessage.includes('Invalid transformation specification')) {
                errorMessage =
                    'Your profile credentials are not allow-listed or lack the necessary access. Please check your credentials.'
            }
            this.logging.log(errorMessage)
            throw new Error(errorMessage)
        } finally {
            artifactManager.cleanup()
        }
    }

    private async startTransformationATXFES(
        userInputrequest: StartTransformRequest,
        unsupportedProjects: string[],
        containsUnsupportedViews: boolean
    ): Promise<StartTransformResponse> {
        this.logging.log('=== ATX FES Transformation Flow ===')

        try {
            const artifactManager = new ArtifactManager(
                this.workspace,
                this.logging,
                this.getWorkspacePath(userInputrequest.SolutionRootPath),
                userInputrequest.SolutionRootPath
            )
            const payloadFilePath = await this.zipCodeAsync(userInputrequest, artifactManager)
            this.logging.log('Payload path: ' + payloadFilePath)

            const applicationUrl = await this.getActiveTransformProfileApplicationUrl()
            if (!applicationUrl) {
                throw new Error('Could not get applicationUrl for active Transform profile')
            }

            this.logging.log('Getting or creating ATX FES workspace...')
            this.logging.log(`Requested workspace ID: ${userInputrequest.WorkspaceId || 'none specified'}`)
            const workspaceResult = await this.getOrCreateWorkspace(applicationUrl, userInputrequest.WorkspaceId)
            if (!workspaceResult) {
                throw new Error('Failed to create ATX FES workspace')
            }

            this.currentWorkspaceId = workspaceResult.workspaceId
            this.logging.log(`ATX FES Workspace created successfully: ${workspaceResult.workspaceId}`)

            this.logging.log('Creating ATX FES job with DOTNET_IDE...')
            const jobResult = await this.createJobFESClient(workspaceResult.workspaceId)
            if (!jobResult) {
                throw new Error('Failed to create ATX FES job')
            }

            this.logging.log(`ATX FES Job created successfully: ${jobResult.jobId}`)

            this.logging.log('Creating ATX FES artifact upload URL...')
            const uploadResult = await this.createArtifactUploadUrlFESClient(
                workspaceResult.workspaceId,
                jobResult.jobId,
                payloadFilePath
            )
            if (!uploadResult) {
                throw new Error('Failed to create ATX FES artifact upload URL')
            }

            this.logging.log(`ATX FES Upload URL created successfully: ${uploadResult.uploadId}`)

            this.logging.log('Uploading artifact to S3...')
            const uploadSuccess = await this.uploadArtifactToS3ATX(
                payloadFilePath,
                uploadResult.uploadUrl,
                uploadResult.requestHeaders
            )
            if (!uploadSuccess) {
                throw new Error('Failed to upload artifact to S3')
            }

            this.logging.log('ATX FES S3 upload completed successfully')

            this.logging.log('Completing ATX FES artifact upload...')
            const completeResult = await this.completeArtifactUploadFESClient(
                workspaceResult.workspaceId,
                jobResult.jobId,
                uploadResult.uploadId
            )
            if (!completeResult) {
                throw new Error('Failed to complete ATX FES artifact upload')
            }

            this.logging.log('ATX FES artifact upload completed successfully')

            this.logging.log('Starting ATX FES transformation job...')
            const startResult = await this.startJobFESClient(workspaceResult.workspaceId, jobResult.jobId)
            if (!startResult) {
                throw new Error('Failed to start ATX FES transformation job')
            }

            this.logging.log('ATX FES transformation job started successfully')

            // TODO: Implement polling APIs to replace RTS calls

            this.logging.log('=== ATX FES CreateJob SUCCESS ===')
            this.logging.log(`Job ID: ${jobResult.jobId}`)
            this.logging.log(`Job Status: ${jobResult.status}`)

            return {
                TransformationJobId: jobResult.jobId,
                UploadId: uploadResult.uploadId,
                ArtifactPath: '',
                UnSupportedProjects: unsupportedProjects,
                ContainsUnsupportedViews: containsUnsupportedViews,
            } as StartTransformResponse
        } catch (error) {
            this.logging.error(
                `ATX FES transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )

            // Return error response
            throw new Error(
                `ATX FES transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
        }
    }

    /**
     * Verifies session via ATX VerifySession API using official client
     * No bearer token needed per Smithy model @authenticate(strategy: "NONE")
     */
    private async verifyATXFESSession(applicationUrl: string): Promise<{ userId: string } | null> {
        try {
            this.logging.log(`=== ATX VerifySession Operation (Official Client) ===`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('VerifySession: Failed to initialize ATX client')
                return null
            }

            // VerifySession needs both Origin header and bearer token (despite Smithy model)
            const command = new VerifySessionCommand({})
            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('VerifySession', result)

            this.logging.log(`VerifySession: SUCCESS - Session verified`)
            return { userId: result.userId || 'verified' }
        } catch (error) {
            this.logging.error(`Error in VerifySession: ${error instanceof Error ? error.message : 'Unknown error'}`)

            // Log detailed error information
            if (error && typeof error === 'object') {
                const errorObj = error as any
                this.logging.error(
                    `VerifySession error details: ${JSON.stringify({
                        name: errorObj.name,
                        message: errorObj.message,
                        code: errorObj.code,
                        statusCode: errorObj.$metadata?.httpStatusCode,
                        requestId: errorObj.$metadata?.requestId,
                    })}`
                )
            }

            return null
        }
    }

    /**
     * Gets a specific workspace by ID or creates a new one if none specified
     */
    private async getOrCreateWorkspace(
        applicationUrl: string,
        selectedWorkspaceId?: string
    ): Promise<{ workspaceId: string; name: string } | null> {
        try {
            this.logging.log(`=== ATX GetOrCreateWorkspace Operation ===`)
            this.logging.log(`Selected workspace ID: ${selectedWorkspaceId || 'none - will use first available'}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('GetOrCreateWorkspace: Failed to initialize ATX client')
                return null
            }

            // First verify session to establish tenant mapping (required for all ATX operations)
            this.logging.log('GetOrCreateWorkspace: Calling verifySession first to establish tenant mapping...')
            const sessionResult = await this.verifyATXFESSession(applicationUrl)

            if (!sessionResult) {
                this.logging.error('GetOrCreateWorkspace: VerifySession failed - cannot establish tenant mapping')
                return null
            }

            this.logging.log('GetOrCreateWorkspace: Session verified, proceeding with workspace operations...')

            // If a specific workspace was selected, use it
            if (selectedWorkspaceId) {
                this.logging.log(`Using selected workspace: ${selectedWorkspaceId}`)
                // For now, we'll assume the workspace ID is valid
                // In a full implementation, we might want to validate it exists
                return { workspaceId: selectedWorkspaceId, name: selectedWorkspaceId }
            }

            // No specific workspace selected - list existing workspaces
            this.logging.log('No workspace selected, checking for existing workspaces...')
            const listCommand = new ListWorkspacesCommand({ maxResults: 10 })
            await this.addBearerTokenToCommand(listCommand)
            const listResult = await this.atxClient!.send(listCommand)
            this.logATXFESResponse('ListWorkspaces', listResult)

            if (listResult.items && listResult.items.length > 0) {
                // Use the first existing workspace as fallback
                const workspace = listResult.items[0]
                this.logging.log(`Using first available workspace: ${workspace.name} (${workspace.id})`)
                return { workspaceId: workspace.id!, name: workspace.name! }
            }

            // No existing workspaces, create a new one
            this.logging.log('No existing workspaces found, creating new workspace...')
            const createCommand = new CreateWorkspaceCommand({
                name: `Transform-Workspace-${Date.now()}`,
                description: 'Workspace for .NET Framework to .NET 8.0 transformation',
                idempotencyToken: this.generateUUID(),
            })
            await this.addBearerTokenToCommand(createCommand)
            const createResult = await this.atxClient!.send(createCommand)
            this.logATXFESResponse('CreateWorkspace', createResult)

            if (createResult.workspace) {
                this.logging.log(
                    `CreateWorkspace: SUCCESS - Workspace created with ID: ${createResult.workspace.id}, Name: ${createResult.workspace.name}`
                )
                return { workspaceId: createResult.workspace.id!, name: createResult.workspace.name! }
            } else {
                this.logging.error(`CreateWorkspace: No workspace in response`)
                return null
            }
        } catch (error) {
            this.logging.error(
                `Error in GetOrCreateWorkspace: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Creates a new workspace via manual HTTP (FES client is broken)
     */
    private async createWorkspaceManualHTTP(
        applicationUrl: string
    ): Promise<{ workspaceId: string; name: string } | null> {
        try {
            this.logging.log(`=== ATX FES CreateWorkspace Operation (Manual HTTP) ===`)
            this.logging.log(`Using applicationUrl: ${applicationUrl}`)

            // Get credentials provider from service manager
            const credentialsProvider = (this.serviceManager as any).features?.credentialsProvider
            if (!credentialsProvider || !credentialsProvider.hasCredentials('bearer')) {
                this.logging.log(`CreateWorkspace: No bearer token credentials available`)
                return null
            }

            // Get bearer token from credentials provider
            const credentials = await credentialsProvider.getCredentials('bearer')
            if (!credentials || !credentials.token) {
                this.logging.log(`CreateWorkspace: Failed to get bearer token`)
                return null
            }

            const bearerToken = credentials.token
            this.logging.log(`CreateWorkspace: Got bearer token, making API call`)

            // ATX FES endpoint
            const endpoint = process.env.TCP_ENDPOINT || DEFAULT_ATX_FES_ENDPOINT
            const url = new URL(endpoint)

            // Generate request body
            const requestBody = JSON.stringify({
                name: `Transform-Workspace-${Date.now()}`,
                description: 'Workspace for .NET Framework to .NET 8.0 transformation',
                idempotencyToken: this.generateUUID(),
            })

            // Clean up applicationUrl for Origin header
            const cleanApplicationUrl = applicationUrl.endsWith('/') ? applicationUrl.slice(0, -1) : applicationUrl

            // Prepare ATX FES headers for CreateWorkspace
            const headers = {
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Encoding': 'amz-1.0',
                'X-Amz-Target': 'com.amazon.elasticgumbyfrontendservice.ElasticGumbyFrontEndService.CreateWorkspace',
                Authorization: `Bearer ${bearerToken}`,
                Origin: cleanApplicationUrl,
                'Content-Length': Buffer.byteLength(requestBody).toString(),
            }

            const path = `/workspaces`
            this.logging.log(`CreateWorkspace: Making request to ${endpoint}${path}`)
            this.logging.log(`CreateWorkspace: Request body: ${requestBody}`)

            // Make the ATX FES CreateWorkspace API call
            const https = await import('https')
            const response = await new Promise<{ statusCode: number; statusMessage: string; data: string }>(
                (resolve, reject) => {
                    const req = https.request(
                        {
                            hostname: url.hostname,
                            port: url.port || 443,
                            path: path,
                            method: 'POST',
                            headers: headers,
                        },
                        res => {
                            let data = ''
                            res.on('data', chunk => {
                                data += chunk
                            })
                            res.on('end', () => {
                                resolve({
                                    statusCode: res.statusCode || 0,
                                    statusMessage: res.statusMessage || '',
                                    data: data,
                                })
                            })
                        }
                    )

                    req.on('error', error => {
                        reject(error)
                    })

                    req.write(requestBody)
                    req.end()
                }
            )

            this.logging.log(`CreateWorkspace: Response status: ${response.statusCode} ${response.statusMessage}`)
            this.logging.log(`CreateWorkspace: Raw response: ${response.data}`)

            if (response.statusCode < 200 || response.statusCode >= 300) {
                this.logging.error(`CreateWorkspace: API call failed: ${response.statusCode} ${response.statusMessage}`)
                this.logging.error(`CreateWorkspace: Error response: ${response.data}`)
                return null
            }

            const data = JSON.parse(response.data)
            this.logging.log(`CreateWorkspace: Parsed response: ${JSON.stringify(data)}`)

            const workspaceId = data.workspace?.id || data.workspaceId
            const name = data.workspace?.name || data.name

            if (workspaceId) {
                this.logging.log(`CreateWorkspace: SUCCESS - Workspace created with ID: ${workspaceId}, Name: ${name}`)
                return { workspaceId, name }
            } else {
                this.logging.error(`CreateWorkspace: No workspaceId in response`)
                return null
            }
        } catch (error) {
            this.logging.error(`Error in CreateWorkspace: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0
            const v = c == 'x' ? r : (r & 0x3) | 0x8
            return v.toString(16)
        })
    }
    private async createATXFESWorkspace(applicationUrl: string): Promise<{ workspaceId: string; name: string } | null> {
        try {
            this.logging.log(`=== ATX FES CreateWorkspace Operation (FES Client) ===`)
            this.logging.log(`Using applicationUrl: ${applicationUrl}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('CreateWorkspace: Failed to initialize FES client')
                return null
            }

            // Call FES client createWorkspace method
            this.logging.log(
                `CreateWorkspace: Calling FES client with request: ${JSON.stringify({
                    name: `Transform-Workspace-${Date.now()}`,
                    description: 'Workspace for .NET Framework to .NET 8.0 transformation',
                    idempotencyToken: generateUUID(),
                })}`
            )

            const result = await this.fesClient.createWorkspace({
                name: `Transform-Workspace-${Date.now()}`,
                description: 'Workspace for .NET Framework to .NET 8.0 transformation',
                idempotencyToken: generateUUID(),
            })

            this.logging.log(`CreateWorkspace: FES client response received`)

            if (result && result.success && result.data) {
                const workspaceId = result.data.workspace?.id || result.data.workspaceId
                const name = result.data.workspace?.name || result.data.name

                if (workspaceId) {
                    this.logging.log(
                        `CreateWorkspace: SUCCESS - Workspace created with ID: ${workspaceId}, Name: ${name}`
                    )
                    return { workspaceId, name }
                } else {
                    this.logging.error(
                        `CreateWorkspace: No workspaceId found in response - API may not be returning workspace ID`
                    )
                    this.logging.log(`CreateWorkspace: Available fields: ${Object.keys(result.data || {}).join(', ')}`)
                    return null
                }
            } else {
                this.logging.error(`CreateWorkspace: Workspace creation failed`)
                return null
            }
        } catch (error) {
            this.logging.error(`Error in CreateWorkspace: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Uploads artifact to S3 using ATX FES pre-signed URL and headers
     */
    private async uploadArtifactToS3ATX(
        filePath: string,
        s3PreSignedUrl: string,
        requestHeaders: any
    ): Promise<boolean> {
        try {
            this.logging.log('=== ATX FES S3 Upload Operation ===')
            this.logging.log(`Uploading file: ${filePath}`)
            this.logging.log(`S3 URL: ${s3PreSignedUrl}`)

            // Prepare headers for S3 upload
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
                this.logging.log('S3 Upload: SUCCESS - File uploaded successfully')
                return true
            } else {
                this.logging.error(`S3 Upload: Failed with status: ${response.statusCode}`)
                return false
            }
        } catch (error) {
            this.logging.error(`Error in S3 upload: ${error instanceof Error ? error.message : 'Unknown error'}`)

            // Log detailed error information
            if (error && typeof error === 'object') {
                const errorObj = error as any
                if (errorObj.response) {
                    this.logging.error(`S3 Upload: Error response status: ${errorObj.response.statusCode}`)
                    this.logging.error(`S3 Upload: Error response body: ${errorObj.response.body}`)
                }
            }

            return false
        }
    }

    /**
     * Starts the transformation job in ATX FES using FES TypeScript client
     */
    private async startJob(workspaceId: string, jobId: string): Promise<boolean> {
        return await this.startJobFESClient(workspaceId, jobId)
    }

    /**
     * Stops the transformation job in ATX FES using FES TypeScript client
     */
    private async stopJobATXFES(workspaceId: string, jobId: string): Promise<boolean> {
        try {
            this.logging.log('=== ATX FES StopJob Operation (FES Client) ===')
            this.logging.log(`Stopping job: ${jobId} in workspace: ${workspaceId}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('StopJob: Failed to initialize FES client')
                return false
            }

            // Call FES client stopJob method
            const command = new StopJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('StopJob', result)

            this.logging.log(`StopJob: FES client response: ${JSON.stringify(result)}`)
            this.logging.log(`StopJob: SUCCESS - Job stop request submitted`)
            return true
        } catch (error) {
            this.logging.error(`Error in StopJob: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    /**
     * Creates an artifact download URL using ATX FES API
     */
    private async createArtifactDownloadUrlATXFES(
        workspaceId: string,
        jobId: string,
        artifactId: string
    ): Promise<{ downloadUrl: string; requestHeaders?: any } | null> {
        try {
            this.logging.log('=== ATX FES CreateArtifactDownloadUrl Operation ===')
            this.logging.log(`Creating download URL for artifact: ${artifactId} in job: ${jobId}`)

            // Get applicationUrl for this Transform profile
            const applicationUrl = await this.getActiveTransformProfileApplicationUrl()
            if (!applicationUrl) {
                this.logging.error('CreateArtifactDownloadUrl: No applicationUrl found for active Transform profile')
                return null
            }

            // Get credentials for the active profile
            const credentialsProvider = (this.serviceManager as any).features?.credentialsProvider
            if (!credentialsProvider) {
                this.logging.error('CreateArtifactDownloadUrl: No credentials provider available')
                return null
            }

            const credentials = await credentialsProvider.getCredentials('bearer')
            if (!credentials || !credentials.token) {
                this.logging.error('CreateArtifactDownloadUrl: No bearer token available')
                return null
            }

            const bearerToken = credentials.token
            this.logging.log(`CreateArtifactDownloadUrl: Got bearer token, making API call`)

            // ATX FES endpoint
            const endpoint = DEFAULT_ATX_FES_ENDPOINT

            // Generate request body per Smithy model
            const requestBody = JSON.stringify({
                workspaceId: workspaceId,
                jobId: jobId,
                artifactId: artifactId,
            })

            // Clean applicationUrl for Origin header
            const cleanApplicationUrl = applicationUrl.endsWith('/') ? applicationUrl.slice(0, -1) : applicationUrl

            // Prepare ATX FES headers for CreateArtifactDownloadUrl
            const headers = {
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Encoding': 'amz-1.0',
                'X-Amz-Target':
                    'com.amazon.elasticgumbyfrontendservice.ElasticGumbyFrontEndService.CreateArtifactDownloadUrl',
                Authorization: `Bearer ${bearerToken}`,
                Origin: cleanApplicationUrl,
                'Content-Length': Buffer.byteLength(requestBody).toString(),
            }

            const path = `/workspaces/${workspaceId}/jobs/${jobId}/artifacts/${artifactId}/download`
            this.logging.log(`CreateArtifactDownloadUrl: Making request to ${endpoint}${path}`)
            this.logging.log(`CreateArtifactDownloadUrl: Request body: ${requestBody}`)

            // Make the ATX FES CreateArtifactDownloadUrl API call
            const response = await got.post(`${endpoint}${path}`, {
                body: requestBody,
                headers: headers,
                timeout: { request: 60000 },
                retry: { limit: 0 },
            })

            this.logging.log(
                `CreateArtifactDownloadUrl: Response status: ${response.statusCode} ${response.statusMessage}`
            )
            this.logging.log(`CreateArtifactDownloadUrl: Raw response: ${response.body}`)

            if (response.statusCode !== 200) {
                this.logging.error(
                    `CreateArtifactDownloadUrl: API call failed: ${response.statusCode} ${response.statusMessage}`
                )
                this.logging.error(`CreateArtifactDownloadUrl: Error response body: ${response.body}`)
                return null
            }

            // Parse response
            const data = JSON.parse(response.body)
            this.logging.log(`CreateArtifactDownloadUrl: Parsed response: ${JSON.stringify(data)}`)

            if (data.downloadUrl) {
                this.logging.log(`CreateArtifactDownloadUrl: SUCCESS - Download URL created`)
                return {
                    downloadUrl: data.downloadUrl,
                    requestHeaders: data.requestHeaders,
                }
            } else {
                this.logging.error(`CreateArtifactDownloadUrl: No downloadUrl in response`)
                return null
            }
        } catch (error) {
            this.logging.error(
                `Error in CreateArtifactDownloadUrl: ${error instanceof Error ? error.message : 'Unknown error'}`
            )

            // Log detailed error information
            if (error && typeof error === 'object') {
                const errorObj = error as any
                if (errorObj.response) {
                    this.logging.error(
                        `CreateArtifactDownloadUrl: Error response status: ${errorObj.response.statusCode}`
                    )
                    this.logging.error(`CreateArtifactDownloadUrl: Error response body: ${errorObj.response.body}`)
                }
            }

            return null
        }
    }

    /**
     * Gets job status from ATX FES using FES TypeScript client (replaces RTS getTransformation)
     */
    private async getJobATXFES(workspaceId: string, jobId: string): Promise<any | null> {
        try {
            this.logging.log('=== ATX FES GetJob Operation (FES Client) ===')
            this.logging.log(`Getting job status: ${jobId} in workspace: ${workspaceId}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('GetJob: Failed to initialize FES client')
                return null
            }

            // Call FES client getJob method
            const result = await this.fesClient.getJob({
                workspaceId: workspaceId,
                jobId: jobId,
                includeObjective: true,
            })

            this.logging.log(`GetJob: FES client response: ${JSON.stringify(result)}`)

            if (result && result.success && result.data && result.data.job) {
                const job = result.data.job
                const status = job.statusDetails?.status || 'Unknown'
                this.logging.log(`GetJob: SUCCESS - Job status: ${status}`)
                return job
            } else {
                this.logging.error(`GetJob: No job in response`)
                return null
            }
        } catch (error) {
            this.logging.error(`Error in GetJob: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Gets the applicationUrl for the active Transform profile
     */
    private async getActiveTransformProfileApplicationUrl(): Promise<string | null> {
        try {
            // Return cached URL if available (avoids expensive profile discovery)
            if (this.cachedApplicationUrl) {
                this.logging.log(`Using cached applicationUrl: ${this.cachedApplicationUrl}`)
                return this.cachedApplicationUrl
            }

            this.logging.log('Getting applicationUrl for active Transform profile...')

            // Get all available profiles (this includes ATX FES profiles with applicationUrl)
            const credentialsProvider = (this.serviceManager as any).features?.credentialsProvider
            const logging = this.logging

            if (!credentialsProvider) {
                this.logging.log('No credentials provider available')
                return null
            }

            // Import the profile handler
            const { getListAllAvailableProfilesHandler } = await import(
                '../../shared/amazonQServiceManager/qDeveloperProfiles'
            )
            const handler = getListAllAvailableProfilesHandler((region: string, endpoint: string) => {
                return this.serviceManager.getServiceFactory()(region, endpoint)
            })

            // Get all profiles including ATX FES profiles
            const profiles = await handler({
                connectionType: credentialsProvider.getConnectionType(),
                logging: logging,
                credentialsProvider: credentialsProvider,
                token: { isCancellationRequested: false } as any,
            })

            // Get active profile ARN
            const activeProfileArn = this.serviceManager.getActiveProfileArn()
            this.logging.log(`Looking for applicationUrl for profile: ${activeProfileArn}`)

            // Log profile scopes for debugging
            profiles.forEach(profile => {
                this.logging.log(`Profile: ${profile.name} (${profile.arn})`)
                this.logging.log(`  Profile type: ${profile.arn.includes(':transform:') ? 'Transform' : 'Q Developer'}`)
                if (profile.applicationUrl) {
                    this.logging.log(`  ApplicationUrl: ${profile.applicationUrl}`)
                }
            })

            // Find the exact matching profile with applicationUrl
            const matchingProfile = profiles.find(p => p.arn === activeProfileArn && p.applicationUrl)

            if (matchingProfile && matchingProfile.applicationUrl) {
                this.logging.log(`Found applicationUrl: ${matchingProfile.applicationUrl}`)

                // Cache the applicationUrl for future calls
                this.cachedApplicationUrl = matchingProfile.applicationUrl
                return matchingProfile.applicationUrl
            } else {
                // Check if profile exists but without applicationUrl
                const profileExists = profiles.find(p => p.arn === activeProfileArn)
                if (profileExists) {
                    this.logging.error(`Transform profile ${activeProfileArn} exists but has no applicationUrl`)
                    this.logging.error('This profile may not be compatible with ATX FES operations')
                } else {
                    this.logging.error(`Transform profile ${activeProfileArn} not found in available profiles`)
                }

                // List available Transform profiles with applicationUrl for debugging
                const availableTransformProfiles = profiles.filter(
                    p => p.arn?.includes(':transform:') && p.applicationUrl
                )
                if (availableTransformProfiles.length > 0) {
                    this.logging.log('Available Transform profiles with applicationUrl:')
                    availableTransformProfiles.forEach(p => {
                        this.logging.log(`  - ${p.name} (${p.arn})`)
                    })
                }

                return null
            }
        } catch (error) {
            this.logging.error(
                `Error getting applicationUrl: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Gets the ARN for the active Transform profile
     */
    private async getActiveTransformProfileArn(): Promise<string | null> {
        try {
            // Get active profile ARN directly from service manager
            const activeProfileArn = this.serviceManager.getActiveProfileArn()

            // Verify it's a Transform profile
            if (activeProfileArn && activeProfileArn.includes(':transform:')) {
                return activeProfileArn
            }

            this.logging.log(`Active profile ${activeProfileArn} is not a Transform profile`)
            return null
        } catch (error) {
            this.logging.error(
                `Error getting active Transform profile ARN: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Refreshes the bearer token when it expires (403 errors)
     */
    private async refreshBearerToken(): Promise<boolean> {
        try {
            this.logging.log('=== Token Refresh Operation ===')
            this.logging.log('Requesting new bearer token from credentials provider...')

            // Log current active profile for debugging
            try {
                const activeProfileArn = this.serviceManager.getActiveProfileArn()
                this.logging.log(`Token refresh: Current active profile ARN: ${activeProfileArn}`)
            } catch (e) {
                this.logging.log(`Token refresh: Could not get active profile ARN: ${e}`)
            }

            // Get credentials provider from service manager
            const credentialsProvider = (this.serviceManager as any).features?.credentialsProvider
            if (!credentialsProvider) {
                this.logging.error('Token refresh: No credentials provider available')
                return false
            }

            // Request fresh credentials (this should trigger token refresh in the IDE)
            const newCredentials = await credentialsProvider.getCredentials('bearer')
            if (!newCredentials || !newCredentials.token) {
                this.logging.error('Token refresh: Failed to get new bearer token')
                return false
            }

            this.logging.log('Token refresh: SUCCESS - Got new bearer token')
            this.logging.log(`Token refresh: New token length: ${newCredentials.token.length}`)
            this.logging.log(
                `Token refresh: New token preview: ${newCredentials.token.substring(0, 20)}...${newCredentials.token.substring(newCredentials.token.length - 20)}`
            )

            return true
        } catch (error) {
            this.logging.error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    /**
     * Maps ATX FES job statuses to RTS-compatible statuses
     */
    private mapATXStatusToRTS(atxStatus: string): string {
        switch (atxStatus) {
            case 'CREATED':
                return 'CREATED'
            case 'STARTING':
            case 'ASSESSING':
            case 'PLANNING':
            case 'PLANNED':
            case 'EXECUTING':
            case 'AWAITING_HUMAN_INPUT':
                return 'IN_PROGRESS'
            case 'COMPLETED':
                return 'COMPLETED'
            case 'FAILED':
                return 'FAILED'
            case 'STOPPED':
            case 'STOPPING':
                return 'STOPPED'
            default:
                this.logging.log(`Unknown ATX FES status: ${atxStatus}, mapping to IN_PROGRESS`)
                return 'IN_PROGRESS'
        }
    }

    /**
     * Get job status from ATX FES GetJob API with complete workflow handling
     */
    private async getATXFESJobStatus(
        jobId: string
    ): Promise<{ status: string; createdAt?: string; originalStatus: string } | null> {
        try {
            this.logging.log('=== ATX FES GetJob Operation (FES Client) ===')
            this.logging.log(`Getting status for job: ${jobId}`)

            const credentialsProvider = (this.serviceManager as any).features?.credentialsProvider
            if (!credentialsProvider?.hasCredentials('bearer')) {
                this.logging.error('GetJob: No bearer token credentials available')
                return null
            }

            const credentials = await credentialsProvider.getCredentials('bearer')
            if (!credentials?.token) {
                this.logging.error('GetJob: Failed to get bearer token')
                return null
            }

            // Get workspace ID from cached data
            const workspaceId = this.currentWorkspaceId || 'default-workspace'

            const result = await this.getJobFESClient(workspaceId, jobId)
            if (result) {
                const atxStatus = result.job?.statusDetails?.status
                this.logging.log(`GetJob: ATX FES Status: ${atxStatus}`)

                // Handle ATX FES workflow based on status
                await this.handleATXFESWorkflow(workspaceId, jobId, atxStatus)

                // Map to RTS status for compatibility
                const mappedStatus = this.mapATXStatusToRTS(atxStatus)
                this.logging.log(`GetJob: Mapped to RTS Status: ${mappedStatus}`)

                return {
                    status: mappedStatus,
                    createdAt: result.job?.creationTime || result.creationTime,
                    originalStatus: atxStatus,
                }
            } else {
                this.logging.error('GetJob: Failed to get job status')
                return null
            }
        } catch (error) {
            this.logging.error(`Error in GetJob: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Handle ATX FES workflow based on job status
     */
    private async handleATXFESWorkflow(workspaceId: string, jobId: string, status: string): Promise<void> {
        try {
            switch (status) {
                case 'PLANNED':
                    // Job plan is ready - fetch the transformation steps
                    await this.handlePlannedStatus(workspaceId, jobId)
                    break

                case 'COMPLETED':
                    // Job completed - download artifacts
                    await this.handleCompletedStatus(workspaceId, jobId)
                    break

                case 'FAILED':
                    // Job failed - log details
                    this.logging.error(`ATX FES Job ${jobId} failed`)
                    break

                default:
                    // Other statuses (CREATED, STARTING, ASSESSING, PLANNING, EXECUTING) - just log
                    this.logging.log(`ATX FES Job ${jobId} status: ${status}`)
                    break
            }
        } catch (error) {
            this.logging.error(
                `Error handling ATX FES workflow for status ${status}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
        }
    }

    /**
     * Handle PLANNED status - fetch job plan steps
     */
    private async handlePlannedStatus(workspaceId: string, jobId: string): Promise<void> {
        try {
            this.logging.log(`ATX FES Job ${jobId} reached PLANNED status - fetching plan steps...`)

            const steps = await this.listJobPlanStepsFESClient(workspaceId, jobId)
            if (steps && steps.length > 0) {
                this.logging.log(`ATX FES Job ${jobId} - Found ${steps.length} transformation steps:`)
                steps.forEach((step, index) => {
                    this.logging.log(`  Step ${index + 1}: ${step.stepName} (${step.status || 'Unknown status'})`)
                })
            } else {
                this.logging.log(`ATX FES Job ${jobId} - No transformation steps found`)
            }
        } catch (error) {
            this.logging.error(
                `Error fetching plan steps for job ${jobId}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
        }
    }

    /**
     * Handle COMPLETED status - job completed, ready for download
     */
    private async handleCompletedStatus(workspaceId: string, jobId: string): Promise<void> {
        try {
            this.logging.log(`ATX FES Job ${jobId} completed - transformation finished successfully`)
            this.logging.log(`ATX FES Job ${jobId} - Artifacts are ready for download when IDE requests them`)

            // Note: Actual download will happen when IDE calls downloadExportResultArchive
            // We don't download here to avoid duplicate operations
        } catch (error) {
            this.logging.error(
                `Error handling completed status for job ${jobId}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
        }
    }
    private async getATXFESJobStatusWithRetry(
        jobId: string,
        isRetry: boolean
    ): Promise<{ status: string; createdAt?: string } | null> {
        try {
            this.logging.log(`=== ATX FES GetJob Operation ${isRetry ? '(Retry)' : ''} (FES Client) ===`)
            this.logging.log(`Getting status for job: ${jobId}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('GetJob: Failed to initialize FES client')
                return { status: 'FAILED', createdAt: new Date().toISOString() }
            }

            // We need workspaceId to call GetJob - get it from stored context
            const workspaceId = this.currentWorkspaceId
            if (!workspaceId) {
                this.logging.error('GetJob: No workspace ID available')
                return { status: 'FAILED', createdAt: new Date().toISOString() }
            }

            // Call FES client getJob method
            const result = await this.fesClient.getJob({
                workspaceId: workspaceId,
                jobId: jobId,
                includeObjective: false,
            })

            this.logging.log(`GetJob: FES client response: ${JSON.stringify(result)}`)

            // Response format: { job: { statusDetails: { status: "CREATED" }, creationTime: "..." } }
            const job = result.job
            if (job && job.statusDetails) {
                const atxStatus = job.statusDetails.status
                const mappedStatus = this.mapATXStatusToRTS(atxStatus)

                this.logging.log(`GetJob: ATX FES status: ${atxStatus} -> Mapped to RTS: ${mappedStatus}`)

                return {
                    status: mappedStatus,
                    createdAt: job.creationTime,
                }
            } else {
                this.logging.error('GetJob: Invalid response format - missing job.statusDetails')
                return { status: 'FAILED', createdAt: new Date().toISOString() }
            }
        } catch (error) {
            this.logging.error(`GetJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)

            // Handle token expiration with retry (like RTS pattern)
            if (
                !isRetry &&
                error instanceof Error &&
                (error.message.includes('401') || error.message.includes('403'))
            ) {
                this.logging.log('GetJob: Token expired, retrying with fresh token...')
                // Clear cached applicationUrl to force refresh if needed
                this.cachedApplicationUrl = null
                // Retry once with fresh token
                return this.getATXFESJobStatusWithRetry(jobId, true)
            }

            return { status: 'FAILED', createdAt: new Date().toISOString() }
        }
    }

    /**
     * Get job plan steps from ATX FES ListJobPlanSteps API using FES TypeScript client
     * Only returns steps if job status >= PLANNED
     */
    private async getATXFESJobPlanSteps(jobId: string): Promise<any[] | null> {
        try {
            const workspaceId = this.currentWorkspaceId
            if (!workspaceId) {
                this.logging.error('ListJobPlanSteps: No workspace ID available')
                return null
            }

            // First check job status - only get plan steps if job is PLANNED or later
            this.logging.log('ATX FES: Checking job status before getting plan steps...')
            const jobResponse = await this.getJobFESClient(workspaceId, jobId)

            if (!jobResponse || !jobResponse.job || !jobResponse.job.statusDetails) {
                this.logging.error('ATX FES: Could not get job status - invalid response structure')
                return null
            }

            const currentStatus = jobResponse.job.statusDetails.status.toUpperCase()
            this.logging.log(`ATX FES: Current job status: ${currentStatus}`)

            // Only get plan steps if job has reached PLANNED status or later (per Smithy model)
            const plannedStatuses = [
                'PLANNED',
                'EXECUTING',
                'AWAITING_HUMAN_INPUT',
                'COMPLETED',
                'FAILED',
                'STOPPING',
                'STOPPED',
            ]
            if (!plannedStatuses.includes(currentStatus)) {
                this.logging.log(
                    `ATX FES: Job status ${currentStatus} - plan steps not available yet. Need status >= PLANNED`
                )
                return null // Return null so IDE knows plan isn't ready yet
            }

            this.logging.log(`ATX FES: Job status ${currentStatus} - getting plan steps with substeps...`)
            const result = await this.listJobPlanStepsFESClient(workspaceId, jobId)
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

    async preTransformationUploadCode(payloadFilePath: string): Promise<string> {
        try {
            const uploadId = await this.uploadPayloadAsync(payloadFilePath)
            this.logging.log('Artifact was successfully uploaded. Upload tracking id: ' + uploadId)
            return uploadId
        } catch (error) {
            const errorMessage = (error as Error).message ?? 'Failed to upload zip file'
            throw new Error(errorMessage)
        }
    }

    async uploadPayloadAsync(payloadFileName: string): Promise<string> {
        const sha256 = await ArtifactManager.getSha256Async(payloadFileName)
        let response: CreateUploadUrlResponse
        try {
            response = await this.serviceManager.getCodewhispererService().codeModernizerCreateUploadUrl({
                contentChecksum: sha256,
                contentChecksumType: 'SHA_256',
                uploadIntent: 'TRANSFORMATION',
            })
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in CreateUploadUrl API call'
            this.logging.log('Error when creating upload url: ' + errorMessage)
            throw new Error(errorMessage)
        }

        try {
            await this.uploadArtifactToS3Async(payloadFileName, response, sha256)
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in uploadArtifactToS3 call'
            this.logging.log('Error when calling uploadArtifactToS3Async: ' + errorMessage)
            throw new Error(errorMessage)
        }
        return response.uploadId || ''
    }

    async zipCodeAsync(request: StartTransformRequest, artifactManager: ArtifactManager): Promise<string> {
        try {
            return await artifactManager.createZip(request)
        } catch (e: any) {
            this.logging.log('Error creating zip: ' + e)
            throw e
        }
    }

    async uploadArtifactToS3Async(fileName: string, resp: CreateUploadUrlResponse, sha256: string) {
        const headersObj = this.getHeadersObj(sha256, resp.kmsKeyArn)
        try {
            const fileStream = fs.createReadStream(fileName)
            const response = await got.put(resp.uploadUrl || '', {
                body: fileStream,
                headers: headersObj,
            })

            this.logging.log(`CodeTransform: Response from S3 Upload = ${response.statusCode}`)
        } catch (e: any) {
            const error = e as Error
            const errorMessage = `error: ${error.message || 'Error in S3 UploadZip API call'}, please see https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/troubleshooting-code-transformation.html#project-upload-fail`
            this.logging.log(errorMessage)
            throw new Error(errorMessage)
        }
    }

    getHeadersObj(sha256: string, kmsKeyArn: string | undefined) {
        let headersObj = {}
        if (kmsKeyArn === undefined || kmsKeyArn.length === 0) {
            headersObj = {
                'x-amz-checksum-sha256': sha256,
                'Content-Type': 'application/zip',
            }
        } else {
            headersObj = {
                'x-amz-checksum-sha256': sha256,
                'Content-Type': 'application/zip',
                'x-amz-server-side-encryption': 'aws:kms',
                'x-amz-server-side-encryption-aws-kms-key-id': kmsKeyArn,
            }
        }
        return headersObj
    }
    /**
     * Retrieves the status and details of a transformation job.
     * Includes error code when the job has failed.
     *
     * @param request - The request containing the transformation job ID
     * @returns The transformation job details with error code if applicable, or null if the request fails
     */
    async getTransformation(request: GetTransformRequest) {
        try {
            // Check if we should use ATX FES or RTS
            if (this.serviceManager.isAWSTransformProfile()) {
                this.logging.log('Using ATX FES GetJob for Transform profile')

                try {
                    // Get real job status from ATX FES
                    const jobStatus = await this.getATXFESJobStatus(request.TransformationJobId)

                    if (jobStatus) {
                        return {
                            TransformationJob: {
                                jobId: request.TransformationJobId,
                                status: jobStatus.status,
                                creationTime: jobStatus.createdAt ? new Date(jobStatus.createdAt) : new Date(),
                            } as any,
                            ErrorCode: TransformationErrorCode.NONE,
                        } as GetTransformResponse
                    } else {
                        // Fallback if API call fails
                        this.logging.log('ATX FES GetJob failed, using fallback response')
                        return {
                            TransformationJob: {
                                jobId: request.TransformationJobId,
                                status: 'IN_PROGRESS',
                                creationTime: new Date(),
                            } as any,
                            ErrorCode: TransformationErrorCode.NONE,
                        } as GetTransformResponse
                    }
                } catch (error) {
                    this.logging.error(
                        `ATX FES GetJob error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    )
                    // Return fallback response on error
                    return {
                        TransformationJob: {
                            jobId: request.TransformationJobId,
                            status: 'IN_PROGRESS',
                            creationTime: new Date(),
                        } as any,
                        ErrorCode: TransformationErrorCode.NONE,
                    } as GetTransformResponse
                }
            }

            // Original RTS implementation
            const getCodeTransformationRequest = {
                transformationJobId: request.TransformationJobId,
            } as GetTransformationRequest
            const response = await this.serviceManager
                .getCodewhispererService()
                .codeModernizerGetCodeTransformation(getCodeTransformationRequest)
            this.logging.log('Transformation status: ' + response.transformationJob?.status)

            // Use validation function to determine the error code
            const errorCode = validation.getTransformationErrorCode(response.transformationJob)

            return {
                TransformationJob: response.transformationJob,
                ErrorCode: errorCode,
            } as GetTransformResponse
        } catch (e: any) {
            const errorMessage = (e as Error).message ?? 'Error in GetTransformation API call'
            this.logging.log('Error: ' + errorMessage)

            // Never return null - always return a valid response with error status
            return {
                TransformationJob: {
                    jobId: request.TransformationJobId,
                    status: 'FAILED',
                    creationTime: new Date(),
                    reason: errorMessage,
                } as any,
                ErrorCode: TransformationErrorCode.UNKNOWN_ERROR,
            } as GetTransformResponse
        }
    }
    async getTransformationPlan(request: GetTransformPlanRequest) {
        // Check if we should use ATX FES or RTS
        if (this.serviceManager.isAWSTransformProfile()) {
            this.logging.log('Using ATX FES for Transform profile - real ListJobPlanSteps')

            try {
                // Get real plan steps from ATX FES (only if job status >= PLANNED)
                const planSteps = await this.getATXFESJobPlanSteps(request.TransformationJobId)

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
                    const mappedResponse = {
                        TransformationPlan: {
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

                                        return {
                                            name: substep.stepName || 'Unknown Substep',
                                            description: substep.description || '',
                                            status: substepStatus,
                                            startTime: substep.startTime ? new Date(substep.startTime) : undefined,
                                            endTime: substep.endTime ? new Date(substep.endTime) : undefined,
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

                                    this.logging.log(
                                        `ATX Step ${stepNumber}: ${step.stepName} (${step.status} → ${mappedStatus}) with ${progressUpdates.length} substeps`
                                    )

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
                                    this.logging.error(
                                        `ATX FES: Error mapping step ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`
                                    )
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
                        },
                    } as GetTransformPlanResponse

                    this.logging.log(
                        `ATX FES: Successfully mapped ${mappedResponse.TransformationPlan.transformationSteps?.length || 0} steps`
                    )
                    if (mappedResponse.TransformationPlan.transformationSteps?.[0]) {
                        this.logging.log(
                            `ATX FES: First step mapped - id: ${mappedResponse.TransformationPlan.transformationSteps[0].id}, name: ${mappedResponse.TransformationPlan.transformationSteps[0].name}`
                        )
                    }

                    return mappedResponse
                } else {
                    this.logging.log('ATX FES: No plan steps available yet - returning empty plan')
                    return {
                        TransformationPlan: {
                            transformationSteps: [] as any,
                        } as any,
                    } as GetTransformPlanResponse
                }
            } catch (error) {
                this.logging.error(
                    `ATX FES getTransformationPlan error: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
                // Return empty plan on error
                return {
                    TransformationPlan: {
                        transformationSteps: [] as any,
                    } as any,
                } as GetTransformPlanResponse
            }
        }

        // Original RTS implementation
        let getTransformationPlanAttempt = 0
        let getTransformationPlanMaxAttempts = 3
        while (true) {
            try {
                const getCodeTransformationPlanRequest = {
                    transformationJobId: request.TransformationJobId,
                } as GetTransformationRequest
                const response = await this.serviceManager
                    .getCodewhispererService()
                    .codeModernizerGetCodeTransformationPlan(getCodeTransformationPlanRequest)
                return {
                    TransformationPlan: response.transformationPlan,
                } as GetTransformPlanResponse
            } catch (e: any) {
                const errorMessage = (e as Error).message ?? 'Error in GetTransformationPlan API call'
                this.logging.log('Error: ' + errorMessage)

                getTransformationPlanAttempt += 1
                if (getTransformationPlanAttempt >= getTransformationPlanMaxAttempts) {
                    this.logging.log(`GetTransformationPlan failed after ${getTransformationPlanMaxAttempts} attempts.`)
                    throw e
                }

                const expDelayMs = this.getExpDelayForApiRetryMs(getTransformationPlanAttempt)
                this.logging.log(
                    `Attempt ${getTransformationPlanAttempt}/${getTransformationPlanMaxAttempts} to get transformation plan failed, retry in ${expDelayMs} seconds`
                )
                await this.sleep(expDelayMs * 1000)
            }
        }
    }

    async cancelTransformation(request: CancelTransformRequest) {
        // Check if we should use ATX FES or RTS
        if (this.serviceManager.isAWSTransformProfile()) {
            this.logging.log('Using ATX FES StopJob for Transform profile')

            try {
                // We need workspaceId to call StopJob - get it from stored context
                const workspaceId = this.currentWorkspaceId
                if (!workspaceId) {
                    this.logging.error('StopJob: No workspace ID available')
                    return {
                        TransformationJobStatus: CancellationJobStatus.FAILED_TO_CANCEL,
                    } as CancelTransformResponse
                }

                // Call ATX FES StopJob
                const stopResult = await this.stopJobATXFES(workspaceId, request.TransformationJobId)

                if (stopResult) {
                    this.logging.log('ATX FES StopJob: SUCCESS')
                    return {
                        TransformationJobStatus: CancellationJobStatus.SUCCESSFULLY_CANCELLED,
                    } as CancelTransformResponse
                } else {
                    this.logging.log('ATX FES StopJob: FAILED')
                    return {
                        TransformationJobStatus: CancellationJobStatus.FAILED_TO_CANCEL,
                    } as CancelTransformResponse
                }
            } catch (error) {
                this.logging.error(`ATX FES StopJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                return {
                    TransformationJobStatus: CancellationJobStatus.FAILED_TO_CANCEL,
                } as CancelTransformResponse
            }
        }

        // Original RTS implementation
        let cancelTransformationAttempt = 0
        let cancelTransformationMaxAttempts = 3
        while (true) {
            try {
                const stopCodeTransformationRequest = {
                    transformationJobId: request.TransformationJobId,
                } as StopTransformationRequest
                this.logging.log(
                    'Sending CancelTransformRequest with job Id: ' + stopCodeTransformationRequest.transformationJobId
                )
                const response = await this.serviceManager
                    .getCodewhispererService()
                    .codeModernizerStopCodeTransformation(stopCodeTransformationRequest)
                this.logging.log('Transformation status: ' + response.transformationStatus)
                let status: CancellationJobStatus
                switch (response.transformationStatus) {
                    case 'STOPPED':
                        status = CancellationJobStatus.SUCCESSFULLY_CANCELLED
                        break
                    default:
                        status = CancellationJobStatus.FAILED_TO_CANCEL
                        break
                }
                return {
                    TransformationJobStatus: status,
                } as CancelTransformResponse
            } catch (e: any) {
                const errorMessage = (e as Error).message ?? 'Error in CancelTransformation API call'
                this.logging.log('Error: ' + errorMessage)

                cancelTransformationAttempt += 1
                if (cancelTransformationAttempt >= cancelTransformationMaxAttempts) {
                    this.logging.log(`CancelTransformation failed after ${cancelTransformationMaxAttempts} attempts.`)
                    return {
                        TransformationJobStatus: CancellationJobStatus.FAILED_TO_CANCEL,
                    } as CancelTransformResponse
                }

                const expDelayMs = this.getExpDelayForApiRetryMs(cancelTransformationAttempt)
                this.logging.log(
                    `Attempt ${cancelTransformationAttempt}/${cancelTransformationMaxAttempts} to get transformation plan failed, retry in ${expDelayMs} seconds`
                )
                await this.sleep(expDelayMs * 1000)
            }
        }
    }

    async sleep(duration = 0): Promise<void> {
        return new Promise(r => setTimeout(r, Math.max(duration, 0)))
    }

    async pollTransformation(request: GetTransformRequest, validExitStatus: string[], failureStates: string[]) {
        // Check if we should use ATX FES or RTS
        if (this.serviceManager.isAWSTransformProfile()) {
            this.logging.log('Using ATX FES for Transform profile - real polling')

            if (!validExitStatus.includes('Planning')) {
                validExitStatus = ['AWAITING_HUMAN_INPUT']
            }

            try {
                // Get real job status from ATX FES
                var count = 0
                while (count < 300) {
                    const jobStatus = await this.getATXFESJobStatus(request.TransformationJobId)

                    if (jobStatus && validExitStatus.includes(jobStatus.originalStatus)) {
                        return {
                            TransformationJob: {
                                jobId: request.TransformationJobId,
                                status: jobStatus.status,
                                creationTime: jobStatus.createdAt ? new Date(jobStatus.createdAt) : new Date(),
                            } as any,
                            ErrorCode: TransformationErrorCode.NONE,
                        } as GetTransformResponse
                    } else if (jobStatus && failureStates.includes(jobStatus.originalStatus)) {
                        // Fallback to placeholder if API call fails
                        this.logging.log('ATX FES polling failed, using placeholder')
                        return {
                            TransformationJob: {
                                jobId: request.TransformationJobId,
                                status: 'IN_PROGRESS',
                                creationTime: new Date(),
                            } as any,
                            ErrorCode: TransformationErrorCode.NONE,
                        } as GetTransformResponse
                    } else {
                        this.logging.log('ATX FES polling in progress....')
                        await this.sleep(10 * 1000)
                        count++
                    }
                }
            } catch (error) {
                this.logging.error(`ATX FES polling error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                // Return fallback response on error
                return {
                    TransformationJob: {
                        jobId: request.TransformationJobId,
                        status: 'IN_PROGRESS',
                        creationTime: new Date(),
                    } as any,
                    ErrorCode: TransformationErrorCode.NONE,
                } as GetTransformResponse
            }
        }

        // Original RTS implementation
        let timer = 0
        let getTransformAttempt = 0
        let getTransformMaxAttempts = 3
        const getCodeTransformationRequest = {
            transformationJobId: request.TransformationJobId,
        } as GetTransformationRequest
        let response = await this.serviceManager
            .getCodewhispererService()
            .codeModernizerGetCodeTransformation(getCodeTransformationRequest)
        this.logging.log('Start polling for transformation plan.')
        this.logging.log('The valid status to exit polling are: ' + validExitStatus)
        this.logging.log('The failure status are: ' + failureStates)

        this.logging.log('Transformation status: ' + response.transformationJob?.status)
        let status = response?.transformationJob?.status ?? PollTransformationStatus.NOT_FOUND

        while (status != PollTransformationStatus.TIMEOUT && !failureStates.includes(status)) {
            try {
                if (this.cancelPollingEnabled) {
                    // Reset the flag
                    this.cancelPollingEnabled = false
                    return {
                        TransformationJob: response.transformationJob,
                    } as GetTransformResponse
                }
                const apiStartTime = Date.now()

                const getCodeTransformationRequest = {
                    transformationJobId: request.TransformationJobId,
                } as GetTransformationRequest
                response = await this.serviceManager
                    .getCodewhispererService()
                    .codeModernizerGetCodeTransformation(getCodeTransformationRequest)
                this.logging.log('Transformation status: ' + response.transformationJob?.status)

                if (validExitStatus.includes(status)) {
                    this.logging.log('Exiting polling for transformation plan with transformation status: ' + status)
                    break
                }

                status = response.transformationJob?.status!
                await this.sleep(10 * 1000)
                timer += 10

                if (timer > 24 * 3600 * 1000) {
                    status = PollTransformationStatus.TIMEOUT
                    break
                }
                getTransformAttempt = 0 // a successful polling will reset attempt
            } catch (e: any) {
                const errorMessage = (e as Error).message ?? 'Error in GetTransformation API call'
                this.logging.log('Error polling transformation job from the server: ' + errorMessage)

                getTransformAttempt += 1
                if (getTransformAttempt >= getTransformMaxAttempts) {
                    this.logging.log(`GetTransformation failed after ${getTransformMaxAttempts} attempts.`)
                    status = PollTransformationStatus.NOT_FOUND
                    break
                }

                const expDelayMs = this.getExpDelayForApiRetryMs(getTransformAttempt)
                this.logging.log(
                    `Attempt ${getTransformAttempt}/${getTransformMaxAttempts} to get transformation plan failed, retry in ${expDelayMs} seconds`
                )
                await this.sleep(expDelayMs * 1000)
            }
        }
        this.logging.log('Returning response from server : ' + JSON.stringify(response))
        this.logSuggestionForFailureResponse(request, response.transformationJob!, failureStates)
        return {
            TransformationJob: response.transformationJob,
        } as GetTransformResponse
    }

    /**
     * ATX FES version of downloadExportResultArchive
     */
    async downloadExportResultArchiveATXFES(exportId: string, saveToDir: string): Promise<DownloadArtifactsResponse> {
        try {
            this.logging.log('=== ATX FES Download Export Result Archive ===')
            this.logging.log(`Called with exportId: ${exportId}, saveToDir: ${saveToDir}`)

            // Get workspace and job IDs from cached data
            const workspaceId = this.currentWorkspaceId
            const jobId = exportId // In ATX FES context, exportId should be the jobId

            this.logging.log(`Using workspaceId: ${workspaceId}, jobId: ${jobId}`)

            if (!workspaceId) {
                throw new Error('No workspace ID available for ATX FES download')
            }

            this.logging.log(`Listing CUSTOMER_OUTPUT artifacts for job: ${jobId}`)
            const artifacts = await this.listArtifactsFESClient(workspaceId, jobId)
            if (!artifacts || artifacts.length === 0) {
                throw new Error('No CUSTOMER_OUTPUT artifacts available for download')
            }

            const artifact = artifacts[0]
            const artifactId = artifact.artifactId
            this.logging.log(`Found artifact: ${artifactId}, size: ${artifact.sizeInBytes} bytes`)

            this.logging.log(`Creating download URL for artifactId: ${artifactId}`)
            const downloadInfo = await this.createArtifactDownloadUrlFESClient(workspaceId, jobId, artifactId)
            if (!downloadInfo) {
                throw new Error('Failed to get ATX FES download URL')
            }

            this.logging.log(`Got S3 download URL`)
            this.logging.log(`Request headers: ${JSON.stringify(Object.keys(downloadInfo.requestHeaders || {}))}`)

            this.logging.log('Starting S3 download...')
            const got = await import('got')
            const s3Response = await got.default.get(downloadInfo.downloadUrl, {
                headers: downloadInfo.requestHeaders || {},
                timeout: { request: 300000 },
                responseType: 'buffer',
            })

            this.logging.log(
                `S3 download completed - Status: ${s3Response.statusCode}, Size: ${s3Response.body.length} bytes`
            )

            const buffer = [s3Response.body]
            const saveToWorkspace = path.join(saveToDir, workspaceFolderName)
            this.logging.log(`Saving artifacts to workspace: ${saveToWorkspace}`)

            const pathContainingArchive = await this.archivePathGenerator(artifactId, buffer, saveToWorkspace)
            this.logging.log(`Archive extracted to: ${pathContainingArchive}`)

            const downloadResponse = {
                PathTosave: pathContainingArchive,
            } as DownloadArtifactsResponse

            this.logging.log(`=== ATX FES Download SUCCESS ===`)
            this.logging.log(`Returning response to IDE: ${JSON.stringify(downloadResponse)}`)
            return downloadResponse
        } catch (error) {
            this.logging.error(`ATX FES download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
            this.logging.error(`Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`)
            return {
                Error: error instanceof Error ? error.message : 'ATX FES download failed',
            } as DownloadArtifactsResponse
        }
    }

    async downloadExportResultArchive(exportId: string, saveToDir: string): Promise<DownloadArtifactsResponse> {
        // Check if we should use ATX FES or RTS
        if (this.serviceManager.isAWSTransformProfile()) {
            this.logging.log('Using ATX FES for artifact download')
            return await this.downloadExportResultArchiveATXFES(exportId, saveToDir)
        }

        // Original RTS implementation
        let result
        try {
            result = await this.serviceManager.getStreamingClient().exportResultArchive({
                exportId,
                exportIntent: ExportIntent.TRANSFORMATION,
            })

            const buffer = []
            this.logging.log('Artifact was successfully downloaded.')

            if (result.body === undefined) {
                throw new Error('Empty response from CodeWhisperer streaming service.')
            }

            for await (const chunk of result.body) {
                if (chunk.binaryPayloadEvent) {
                    const chunkData = chunk.binaryPayloadEvent
                    if (chunkData.bytes) {
                        buffer.push(chunkData.bytes)
                    }
                }
            }
            const saveToWorkspace = path.join(saveToDir, workspaceFolderName)
            this.logging.log(`Identified path of directory to save artifacts is ${saveToDir}`)
            const pathContainingArchive = await this.archivePathGenerator(exportId, buffer, saveToWorkspace)
            this.logging.log('PathContainingArchive :' + pathContainingArchive)
            return {
                PathTosave: pathContainingArchive,
            } as DownloadArtifactsResponse
        } catch (error) {
            const errorMessage = (error as Error).message ?? 'Failed to download the artifacts'
            return {
                Error: errorMessage,
            } as DownloadArtifactsResponse
        }
    }

    async cancelPollingAsync() {
        this.cancelPollingEnabled = true
    }

    async extractAllEntriesTo(pathContainingArchive: string, zipEntries: AdmZip.IZipEntry[]) {
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
                    this.logging.log(`Attempted to extract a file that does not exist : ${entry.entryName}`)
                } else {
                    throw extractError
                }
            }
        }
    }

    async archivePathGenerator(exportId: string, buffer: Uint8Array[], saveToDir: string) {
        try {
            const tempDir = path.join(saveToDir, exportId)
            const pathToArchive = path.join(tempDir, 'ExportResultsArchive.zip')
            await this.directoryExists(tempDir)
            await fs.writeFileSync(pathToArchive, Buffer.concat(buffer))
            let pathContainingArchive = ''
            pathContainingArchive = path.dirname(pathToArchive)
            const zip = new AdmZip(pathToArchive)
            const zipEntries = zip.getEntries()
            await this.extractAllEntriesTo(pathContainingArchive, zipEntries)
            return pathContainingArchive
        } catch (error) {
            this.logging.log(`error received ${JSON.stringify(error)}`)
            return ''
        }
    }

    async directoryExists(directoryPath: any) {
        try {
            await fs.accessSync(directoryPath)
        } catch (error) {
            // Directory doesn't exist, create it
            this.logging.log(`Directory doesn't exist, creating it ${directoryPath}`)
            await fs.mkdirSync(directoryPath, { recursive: true })
        }
    }

    getWorkspacePath(solutionRootPath: string): string {
        const randomPath = uuidv4().substring(0, 8)
        const workspacePath = path.join(solutionRootPath, workspaceFolderName, randomPath)
        if (!fs.existsSync(workspacePath)) {
            fs.mkdirSync(workspacePath, { recursive: true })
        }
        return workspacePath
    }

    getExpDelayForApiRetryMs(attempt: number): number {
        const exponentialDelayFactor = 2
        const exponentialDelay = 10 * Math.pow(exponentialDelayFactor, attempt)
        const jitteredDelay = Math.floor(Math.random() * 10)
        return exponentialDelay + jitteredDelay // returns in milliseconds
    }

    logSuggestionForFailureResponse(request: GetTransformRequest, job: TransformationJob, failureStates: string[]) {
        let status = job?.status ?? PollTransformationStatus.NOT_FOUND
        let reason = job?.reason ?? ''
        if (failureStates.includes(status)) {
            let suggestion = ''
            if (reason.toLowerCase().includes('build validation failed')) {
                suggestion =
                    'Please close Visual Studio, delete the directories where build artifacts are generated (e.g. bin and obj), and try running the transformation again.'
            }
            this.logging
                .log(`Transformation job for job ${request.TransformationJobId} is ${status} due to "${reason}". 
                ${suggestion}`)
        }
    }

    // ===== FES CLIENT METHODS (Replace Manual HTTP) =====

    /**
     * Creates a transformation job using FES client
     */
    private async createJobFESClient(workspaceId: string): Promise<{ jobId: string; status: string } | null> {
        try {
            this.logging.log('=== ATX FES CreateJob Operation (FES Client) ===')
            this.logging.log(`Creating job for workspace: ${workspaceId}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('CreateJob: Failed to initialize ATX client')
                return null
            }

            const command = new CreateJobCommand({
                workspaceId: workspaceId,
                objective: JSON.stringify({ target_framework: '.NET 8.0' }),
                jobType: 'DOTNET_IDE' as any, // Now available in package 2
                jobName: `transform-job-${Date.now()}`,
                intent: 'LANGUAGE_UPGRADE',
                idempotencyToken: uuidv4(),
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('CreateJob', result)

            if (result && result.jobId && result.status) {
                this.logging.log(`CreateJob: SUCCESS - Job created with ID: ${result.jobId}, Status: ${result.status}`)
                return { jobId: result.jobId, status: result.status }
            } else {
                this.logging.error('CreateJob: Missing jobId or status in response')
                return null
            }
        } catch (error) {
            this.logging.error(`CreateJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Starts a transformation job using FES client
     */
    private async startJobFESClient(workspaceId: string, jobId: string): Promise<boolean> {
        try {
            this.logging.log('=== ATX FES StartJob Operation (FES Client) ===')
            this.logging.log(`Starting job: ${jobId} in workspace: ${workspaceId}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('StartJob: Failed to initialize ATX client')
                return false
            }

            const command = new StartJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                idempotencyToken: uuidv4(),
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('StartJob', result)

            this.logging.log(`StartJob: SUCCESS - Status: ${result.status}`)
            return true
        } catch (error) {
            this.logging.error(`StartJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    /**
     * Gets job status using FES client
     */
    private async getJobFESClient(workspaceId: string, jobId: string): Promise<any | null> {
        try {
            this.logging.log('=== ATX FES GetJob Operation (FES Client) ===')
            this.logging.log(`Getting job: ${jobId} in workspace: ${workspaceId}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('GetJob: Failed to initialize ATX client')
                return null
            }

            const command = new GetJobCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                includeObjective: false,
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('GetJob', result)

            this.logging.log(`GetJob: SUCCESS - Job data received`)
            return result
        } catch (error) {
            this.logging.error(`GetJob error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Creates artifact upload URL using FES client
     */
    private async createArtifactUploadUrlFESClient(
        workspaceId: string,
        jobId: string,
        payloadFilePath: string,
        categoryType: CategoryType = 'CUSTOMER_INPUT',
        fileType: FileType = 'ZIP'
    ): Promise<{ uploadId: string; uploadUrl: string; requestHeaders?: any } | null> {
        try {
            this.logging.log('=== ATX FES CreateArtifactUploadUrl Operation (FES Client) ===')

            if (!(await this.ensureATXClient())) {
                this.logging.error('CreateArtifactUploadUrl: Failed to initialize ATX client')
                return null
            }

            // Calculate file checksum
            const sha256 = await ArtifactManager.getSha256Async(payloadFilePath)

            const command = new CreateArtifactUploadUrlCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                contentDigest: { Sha256: sha256 },
                artifactReference: {
                    artifactType: {
                        categoryType: categoryType, // ✅ Fixed: User uploads source code
                        fileType: fileType,
                    },
                },
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('CreateArtifactUploadUrl', result)

            if (result && result.artifactId && result.s3PreSignedUrl) {
                this.logging.log(`CreateArtifactUploadUrl: SUCCESS - Upload URL created`)
                return {
                    uploadId: result.artifactId,
                    uploadUrl: result.s3PreSignedUrl,
                    requestHeaders: result.requestHeaders,
                }
            } else {
                this.logging.error('CreateArtifactUploadUrl: Missing artifactId or s3PreSignedUrl in response')
                return null
            }
        } catch (error) {
            this.logging.error(
                `CreateArtifactUploadUrl error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Completes artifact upload using FES client
     */
    private async completeArtifactUploadFESClient(
        workspaceId: string,
        jobId: string,
        artifactId: string
    ): Promise<boolean> {
        try {
            this.logging.log('=== ATX FES CompleteArtifactUpload Operation (FES Client) ===')

            if (!(await this.ensureATXClient())) {
                this.logging.error('CompleteArtifactUpload: Failed to initialize ATX client')
                return false
            }

            const command = new CompleteArtifactUploadCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                artifactId: artifactId,
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('CompleteArtifactUpload', result)

            this.logging.log(`CompleteArtifactUpload: SUCCESS`)
            return true
        } catch (error) {
            this.logging.error(
                `CompleteArtifactUpload error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return false
        }
    }

    /**
     * Lists job plan steps using FES client with recursive substep fetching
     */
    private async listJobPlanStepsFESClient(workspaceId: string, jobId: string): Promise<any[] | null> {
        try {
            this.logging.log('=== ATX FES ListJobPlanSteps Operation (FES Client) ===')

            if (!(await this.ensureATXClient())) {
                this.logging.error('ListJobPlanSteps: Failed to initialize ATX client')
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
                    }

                    this.logging.log(`Step ${step.stepName}: Found ${step.substeps.length} substeps`)

                    // Log substep details for debugging
                    if (step.substeps.length > 0) {
                        step.substeps.forEach((substep: any, index: number) => {
                            this.logging.log(
                                `  Substep ${index + 1}: ${substep.stepName} (${substep.status || 'No status'})`
                            )
                        })
                    }
                }

                this.logging.log(`ListJobPlanSteps: SUCCESS - Found ${rootSteps.length} steps with substeps`)
                return rootSteps
            }

            this.logging.log('ListJobPlanSteps: No root steps found')
            return null
        } catch (error) {
            this.logging.error(`ListJobPlanSteps error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse(`ListJobPlanSteps(${parentStepId})`, result)

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
     * Lists available profiles using FES client
     */
    private async listAvailableProfilesFESClient(): Promise<any[] | null> {
        try {
            this.logging.log('=== ATX FES ListAvailableProfiles Operation (FES Client) ===')

            if (!(await this.ensureATXClient())) {
                this.logging.error('ListAvailableProfiles: Failed to initialize ATX client')
                return null
            }

            const command = new ListAvailableProfilesCommand({
                maxResults: 100,
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('ListAvailableProfiles', result)

            this.logging.log(`ListAvailableProfiles: SUCCESS - Found ${result.profiles?.length || 0} profiles`)
            return result.profiles || []
        } catch (error) {
            this.logging.error(
                `ListAvailableProfiles error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Lists artifacts using FES client with filtering - default to CUSTOMER_OUTPUT
     */
    private async listArtifactsFESClient(
        workspaceId: string,
        jobId: string,
        filter: CategoryType = 'CUSTOMER_OUTPUT'
    ): Promise<any[] | null> {
        try {
            this.logging.log('=== ATX FES ListArtifacts Operation (FES Client) ===')
            this.logging.log(`Listing artifacts for job: ${jobId} in workspace: ${workspaceId}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('ListArtifacts: Failed to initialize ATX client')
                return null
            }

            const command = new ListArtifactsCommand({
                workspaceId: workspaceId,
                jobFilter: {
                    jobId: jobId,
                    categoryType: filter, // Server-side filtering for customer output artifacts
                },
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('ListArtifacts', result)

            this.logging.log(
                `ListArtifacts: SUCCESS - Found ${result.artifacts?.length || 0} CUSTOMER_OUTPUT artifacts`
            )
            return result.artifacts || []
        } catch (error) {
            this.logging.error(`ListArtifacts error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Creates artifact download URL using FES client
     */
    private async createArtifactDownloadUrlFESClient(
        workspaceId: string,
        jobId: string,
        artifactId: string
    ): Promise<{ downloadUrl: string; requestHeaders?: any } | null> {
        try {
            this.logging.log('=== ATX FES CreateArtifactDownloadUrl Operation (FES Client) ===')

            if (!(await this.ensureATXClient())) {
                this.logging.error('CreateArtifactDownloadUrl: Failed to initialize ATX client')
                return null
            }

            const command = new CreateArtifactDownloadUrlCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                artifactId: artifactId,
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('CreateArtifactDownloadUrl', result)

            if (result && result.s3PreSignedUrl) {
                this.logging.log(`CreateArtifactDownloadUrl: SUCCESS - Download URL created`)

                const normalizedHeaders: Record<string, string> = {}
                if (result.requestHeaders) {
                    for (const [key, value] of Object.entries(result.requestHeaders)) {
                        normalizedHeaders[key] = Array.isArray(value) ? value[0] : value
                    }
                }

                return {
                    downloadUrl: result.s3PreSignedUrl,
                    requestHeaders: normalizedHeaders,
                }
            } else {
                this.logging.error('CreateArtifactDownloadUrl: Missing s3PreSignedUrl in response')
                return null
            }
        } catch (error) {
            this.logging.error(
                `CreateArtifactDownloadUrl error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            return null
        }
    }

    /**
     * Lists available workspaces for the user using ATX client
     */
    async listWorkspaces(): Promise<any[]> {
        try {
            this.logging.log('=== ATX FES ListWorkspaces Operation (ATX Client) ===')

            if (!(await this.ensureATXClient())) {
                this.logging.error('ListWorkspaces: Failed to initialize ATX client')
                return []
            }

            const command = new ListWorkspacesCommand({ maxResults: 10 })
            await this.addBearerTokenToCommand(command)
            const response = await this.atxClient!.send(command)

            this.logging.log(`ListWorkspaces: SUCCESS - Found ${response.items?.length || 0} workspaces`)

            const workspaces = (response.items || []).map(workspace => ({
                Id: workspace.id,
                Name: workspace.name,
            }))

            this.logging.log(`ListWorkspaces: Returning ${workspaces.length} workspaces`)
            return workspaces
        } catch (error) {
            this.logging.error(`ListWorkspaces error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return []
        }
    }

    /**
     * Creates a new workspace with the given name using ATX client
     */
    async createWorkspace(name: string | null): Promise<string | null> {
        try {
            this.logging.log('=== ATX FES CreateWorkspace Operation (ATX Client) ===')
            this.logging.log(`Creating workspace: ${name || 'auto-generated'}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('CreateWorkspace: Failed to initialize ATX client')
                return null
            }

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    this.logging.log(`CreateWorkspace: Attempt ${attempt}/3`)

                    this.logging.log('CreateWorkspace: Calling verifySession first to establish tenant mapping...')
                    const verifyCommand = new VerifySessionCommand({})
                    await this.addBearerTokenToCommand(verifyCommand)
                    const sessionResult = await this.atxClient!.send(verifyCommand)

                    if (!sessionResult || !sessionResult.userId) {
                        this.logging.error('CreateWorkspace: VerifySession failed - cannot establish tenant mapping')
                        if (attempt === 3) return null
                        continue
                    }

                    this.logging.log('CreateWorkspace: Session verified, proceeding with CreateWorkspace...')

                    await new Promise(resolve => setTimeout(resolve, 100))

                    const command = new CreateWorkspaceCommand({
                        name: name || undefined,
                        idempotencyToken: uuidv4(),
                    })

                    await this.addBearerTokenToCommand(command)
                    const response = await this.atxClient!.send(command)

                    const workspaceId = response.workspace?.id
                    const workspaceName = response.workspace?.name
                    this.logging.log(`CreateWorkspace: SUCCESS - Created workspace ${workspaceId}`)
                    this.logging.log(`CreateWorkspace: Workspace name: ${workspaceName || 'not provided'}`)

                    if (workspaceId && workspaceName) {
                        return `${workspaceId}|${workspaceName}`
                    }
                    return workspaceId || null
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    this.logging.error(`CreateWorkspace attempt ${attempt} error: ${errorMessage}`)

                    if (errorMessage.includes('User to tenant mapping does not exist') && attempt < 3) {
                        this.logging.log(`Retrying CreateWorkspace due to tenant mapping error...`)
                        this.atxClient = null
                        this.cachedApplicationUrl = null
                        await this.ensureATXClient()
                        continue
                    }

                    if (attempt === 3) {
                        this.logging.error(`CreateWorkspace failed after ${attempt} attempts`)
                        return null
                    }
                }
            }

            return null
        } catch (error) {
            this.logging.error(`CreateWorkspace error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Lists Hitls using FES client
     */
    private async listHitlsFESClient(workspaceId: string, jobId: string): Promise<any[] | null> {
        try {
            this.logging.log('=== ATX FES ListHitls Operation (FES Client) ===')
            this.logging.log(`Listing Hitls for job: ${jobId} in workspace: ${workspaceId}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('ListHitls: Failed to initialize ATX client')
                return null
            }

            const command = new ListHitlTasksCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                taskType: 'NORMAL',
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('ListHitls', result)

            this.logging.log(`ListHitls: SUCCESS - Found ${result.hitlTasks?.length || 0} HITL_FROM_USER artifacts`)
            return result.hitlTasks || []
        } catch (error) {
            this.logging.error(`ListHitls error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    /**
     * Update Hitl using FES client
     */
    private async updateHitlFESClient(
        workspaceId: string,
        jobId: string,
        taskId: string,
        humanArtifactId: string
    ): Promise<UpdateHitlTaskResponse | null> {
        try {
            this.logging.log('=== ATX FES UpdateHitl Operation (FES Client) ===')
            this.logging.log(`Updating Hitl: ${taskId} for job: ${jobId} in workspace: ${workspaceId}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('UpdateHitl: Failed to initialize ATX client')
                return null
            }

            const command = new UpdateHitlTaskCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                taskId: taskId,
                humanArtifact: {
                    artifactId: humanArtifactId,
                },
                postUpdateAction: 'SEND_FOR_APPROVAL',
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('UpdateHitl', result)

            this.logging.log(`UpdateHitl: SUCCESS - task status: ${result.status || 'UNKNOWN'} `)
            return result
        } catch (error) {
            this.logging.error(`ListHitls error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    private async getHitlStatusFES(workspaceId: string, jobId: string, taskId: string): Promise<any | null> {
        try {
            this.logging.log('=== ATX FES Get Hitl Operation (FES Client) ===')
            this.logging.log(`Getting Hitl: ${jobId} in workspace: ${workspaceId}`)

            if (!(await this.ensureATXClient())) {
                this.logging.error('GetHitl: Failed to initialize ATX client')
                return null
            }

            const command = new GetHitlTaskCommand({
                workspaceId: workspaceId,
                jobId: jobId,
                taskId: taskId,
            })

            await this.addBearerTokenToCommand(command)
            const result = await this.atxClient!.send(command)
            this.logATXFESResponse('Get Hitl', result)

            this.logging.log(`GetHitl: SUCCESS - Job data received`)
            return result.task || null
        } catch (error) {
            this.logging.error(`GetHitl error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return null
        }
    }

    private async pollHitlFESClient(workspaceId: string, jobId: string, taskId: string): Promise<boolean> {
        this.logging.log('Starting polling for hitl after upload')

        try {
            var count = 0
            while (count < 300) {
                const jobStatus = await this.getHitlStatusFES(workspaceId, jobId, taskId)

                if (jobStatus && jobStatus.status == 'CLOSED') {
                    return true
                } else if (jobStatus && jobStatus.action == 'REJECT') {
                    // Fallback to placeholder if API call fails
                    this.logging.log('Hitl Polling get action reject')
                    return false
                } else {
                    this.logging.log('Hitl polling in progress....')
                    await this.sleep(10 * 1000)
                    count++
                }
            }

            this.logging.log('Returning false, 300 polls and no approve or reject')
            return false
        } catch (error) {
            this.logging.error(`Hitl polling error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            // Return placeholder on error
            return false
        }
    }

    async getEditablePlan(request: GetEditablePlanRequest): Promise<GetEditablePlanResponse> {
        this.logging.log('Getting editable plan for path')

        try {
            this.logging.log('=== ATX FES Get Editable Plan ===')

            // Get workspace and job IDs from cached data
            const workspaceId = this.currentWorkspaceId
            const jobId = request.TransformationJobId

            if (!workspaceId) {
                throw new Error('No workspace ID available for ATX FES download')
            }

            // List hitls

            const hitls = await this.listHitlsFESClient(workspaceId, jobId)

            if (hitls && hitls.length != 1) {
                this.logging.log(`ATX FES Job ${jobId} - Found ${hitls.length} hitls`)
            } else if (!hitls) {
                this.logging.log(`ATX FES Job ${jobId} - no or many hitls available for download (expects 1 hitl)`)

                // Need to remove this later

                return {
                    Status: true,
                    PlanPath: path.join(
                        request.SolutionRootPath,
                        workspaceFolderName,
                        'temp',
                        'transformation-plan.md'
                    ),
                    ReportPath: path.join(
                        request.SolutionRootPath,
                        workspaceFolderName,
                        'temp',
                        'assessment-report.json'
                    ),
                } as GetEditablePlanResponse

                // throw new Error("no or many HITLE_FROM_USER artifacts available for download (expects 1 artifact)")
            }

            const hitl = hitls[0]

            this.cachedHitlId = hitl.taskId

            const downloadInfo = await this.createArtifactDownloadUrlFESClient(
                workspaceId,
                jobId,
                hitl.agentArtifact.artifactId
            )

            if (!downloadInfo) {
                throw new Error('Failed to get ATX FES download URL')
            }

            this.logging.log(`ATX FES Job ${jobId} - Artifact download URL created: ${downloadInfo.downloadUrl}`)

            const headers = {}
            if (downloadInfo.requestHeaders) {
                downloadInfo.requestHeaders.host =
                    downloadInfo.requestHeaders.host?.[0] ?? downloadInfo.requestHeaders.host
            }

            // Download from S3
            const got = await import('got')
            const response = await got.default.get(downloadInfo.downloadUrl, {
                headers: downloadInfo.requestHeaders || {},
                timeout: { request: 300000 }, // 5 minutes
            })

            // Save, extract, and return paths
            const buffer = [Buffer.from(response.body)]

            const tempDir = path.join(request.SolutionRootPath, workspaceFolderName, request.TransformationJobId)
            await this.directoryExists(tempDir)
            const pathToArchive = path.join(tempDir, 'downloaded-transformation-plans.json')
            await fs.writeFileSync(pathToArchive, Buffer.concat(buffer))
            this.logging.log(`Downloaded plan to ${pathToArchive}`)

            // Temporary
            const pathToPlan = pathToArchive
            const pathToReport = pathToArchive
            // let pathContainingArchive = ''
            // pathContainingArchive = path.dirname(pathToArchive)
            // const zip = new AdmZip(pathToArchive)
            // const zipEntries = zip.getEntries()
            // await this.extractAllEntriesTo(pathContainingArchive, zipEntries)

            // const extractedPaths = zipEntries.map(entry => path.join(pathContainingArchive, entry.entryName))

            // const pathToPlan = extractedPaths.find(filePath => path.basename(filePath) === 'transformation-plan.md')
            // const pathToReport = extractedPaths.find(filePath => path.basename(filePath) === 'assessment-report.json')

            return {
                Status: true,
                PlanPath: pathToPlan,
                ReportPath: pathToReport,
            } as GetEditablePlanResponse
        } catch (error) {
            this.logging.error(`ATX FES download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return {
                Status: false,
            } as GetEditablePlanResponse
        }
    }

    async uploadEditablePlan(request: UploadEditablePlanRequest): Promise<UploadEditablePlanResponse> {
        this.logging.log('Uploading editable plan with')
        this.logging.log(JSON.stringify(request, null, 2))
        try {
            // zip transformation-plan
            const pathToPlan = request.PlanPath
            // const pathToZip = path.join(tempDir, 'transformation-plan.zip')

            // await this.zipFile(pathToPlan, pathToZip)

            const workspaceId = this.currentWorkspaceId
            const jobId = request.TransformationJobId

            if (!workspaceId) {
                throw new Error('No workspace ID available for ATX FES download')
            }

            // List Hitls

            // const hitls = await this.listHitlsFESClient(workspaceId, jobId)

            // if (hitls && hitls.length != 1) {
            //     this.logging.log(`ATX FES Job ${jobId} - Found ${hitls.length} hitls`)
            // } else if (!hitls) {
            //     this.logging.log(`ATX FES Job ${jobId} - no or many hitls available (expects 1 hitl)`)
            //     throw new Error('no or many hitls available (expects 1 hitl)')
            // }

            // const hitl = hitls[0]

            // createartifactuploadurl

            this.logging.log('Creating ATX FES artifact upload URL for transformation-plan.zip...')

            const uploadResult = await this.createArtifactUploadUrlFESClient(
                this.currentWorkspaceId!,
                request.TransformationJobId,
                pathToPlan,
                'HITL_FROM_USER',
                'JSON'
            )
            if (!uploadResult) {
                throw new Error('Failed to create ATX FES artifact upload URL')
            }

            this.logging.log(`ATX FES Upload URL created successfully: ${uploadResult.uploadId}`)

            //  Upload to S3
            this.logging.log('Uploading transformationplan to S3...')
            const uploadSuccess = await this.uploadArtifactToS3ATX(
                pathToPlan,
                uploadResult.uploadUrl,
                uploadResult.requestHeaders
            )
            if (!uploadSuccess) {
                throw new Error('Failed to upload artifact to S3')
            }

            this.logging.log('ATX FES S3 upload completed successfully')

            // CompleteArtifactUpload (using FES client)
            this.logging.log('Completing ATX FES artifact upload for transformation plan')
            const completeResult = await this.completeArtifactUploadFESClient(
                this.currentWorkspaceId!,
                request.TransformationJobId,
                uploadResult.uploadId
            )
            if (!completeResult) {
                throw new Error('Failed to complete ATX FES artifact upload')
            }

            // Update Hitl Task

            this.logging.log('Updating Hitl Task')
            const updateResult = await this.updateHitlFESClient(
                this.currentWorkspaceId!,
                request.TransformationJobId,
                this.cachedHitlId!,
                uploadResult.uploadId
            )
            if (!updateResult) {
                throw new Error('Failed to update hitl')
            }

            this.logging.log('ATX FES Updated hitl successfully')
        } catch (error) {
            this.logging.error(
                `Upload transformation plan failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )

            // Return error response
            return {
                VerificationStatus: false,
            } as UploadEditablePlanResponse
        }

        // validate plan

        const validation = await this.pollHitlFESClient(
            this.currentWorkspaceId!,
            request.TransformationJobId,
            this.cachedHitlId!
        )

        if (validation) {
            return {
                VerificationStatus: true,
            } as UploadEditablePlanResponse
        }

        return {
            VerificationStatus: false,
        } as UploadEditablePlanResponse
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
            archive.finalize()
        })
    }
}
