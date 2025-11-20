import { ExecuteCommandParams } from 'vscode-languageserver'

// ATX CategoryType enum (matches schema)
export enum CategoryType {
    CUSTOMER_OUTPUT = 'CUSTOMER_OUTPUT',
    HITL_FROM_USER = 'HITL_FROM_USER',
    CUSTOMER_INPUT = 'CUSTOMER_INPUT',
    PLAN_STEP_SUMMARY = 'PLAN_STEP_SUMMARY',
}

// ATX FileType enum (matches schema)
export enum FileType {
    JSON = 'JSON',
    ZIP = 'ZIP',
    PDF = 'PDF',
    HTML = 'HTML',
    TXT = 'TXT',
    MARKDOWN = 'MARKDOWN',
    CSV = 'CSV',
    PPTX = 'PPTX',
    XLSX = 'XLSX',
    OTHER = 'OTHER',
}

// ATX request models
export interface AtxCreateWorkspaceRequest extends ExecuteCommandParams {
    WorkspaceName?: string // Optional workspace name
}

export interface AtxCreateJobRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobName?: string
}

export interface AtxCreateArtifactUploadUrlRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
    FilePath: string
    CategoryType: CategoryType // Required
    FileType: FileType // Required
}

export interface AtxCompleteArtifactUploadRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
    ArtifactId: string
}

export interface AtxStartJobRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
}

export interface AtxGetJobRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
}

export interface AtxStopJobRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
}

export interface AtxDownloadArtifactUrlRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
    ArtifactId: string
}

export interface AtxListArtifactsRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
    CategoryType?: CategoryType // Optional, defaults to CUSTOMER_OUTPUT
}

export interface AtxListJobPlanStepsRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
}

export interface AtxCreateZipRequest extends ExecuteCommandParams {
    StartTransformRequest: object // Generic object containing solution details for ZIP creation
}

export interface AtxUploadArtifactToS3Request extends ExecuteCommandParams {
    FilePath: string
    S3PreSignedUrl: string
    RequestHeaders: any
}

// ATX Start Transform request/response (orchestration)
export interface AtxStartTransformRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobName?: string
    StartTransformRequest: object // Original RTS-style request for ZIP creation
}

export interface AtxStartTransformResponse {
    TransformationJobId: string
    ArtifactPath: string
    UploadId: string
    UnSupportedProjects: string[]
    ContainsUnsupportedViews: boolean
}

// ATX List or Create Workspace request/response (consolidation)
export interface AtxListOrCreateWorkspaceRequest extends ExecuteCommandParams {
    CreateWorkspaceName?: string // Optional - if provided, creates new workspace
}

export interface AtxListOrCreateWorkspaceResponse {
    AvailableWorkspaces: Array<{
        Id: string
        Name: string
        CreatedDate?: string
    }>
    CreatedWorkspace?: {
        WorkspaceId: string
        WorkspaceName: string
    }
}

// ATX Get Job Status Info request/response (consolidation)
export interface AtxGetJobStatusInfoRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
    IncludePlanSteps?: boolean
    IncludeArtifacts?: boolean
}

export interface AtxGetJobStatusInfoResponse {
    // Job Status (always included)
    JobId: string
    Status: string
    Progress?: number

    // Plan Steps (included when requested and status = PLANNED)
    PlanSteps?: Array<{
        StepName: string
        Status: string
        Description?: string
    }>

    // Artifacts (included when requested and status = COMPLETED)
    Artifacts?: Array<{
        ArtifactId: string
        Name: string
        CategoryType: string
        FileType: string
        DownloadUrl?: string
    }>
}

// ATX FES job status enum
export enum AtxJobStatus {
    CREATED = 'CREATED',
    STARTING = 'STARTING',
    ASSESSING = 'ASSESSING',
    PLANNING = 'PLANNING',
    PLANNED = 'PLANNED',
    EXECUTING = 'EXECUTING',
    AWAITING_HUMAN_INPUT = 'AWAITING_HUMAN_INPUT',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    STOPPING = 'STOPPING',
    STOPPED = 'STOPPED',
}

// ATX FES plan step status enum
export enum PlanStepStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    SUCCEEDED = 'SUCCEEDED',
    PENDING_HUMAN_INPUT = 'PENDING_HUMAN_INPUT',
    FAILED = 'FAILED',
    STOPPED = 'STOPPED',
}
