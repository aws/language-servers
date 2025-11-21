import { ExecuteCommandParams } from 'vscode-languageserver'
import { TransformationPlan } from '@amzn/codewhisperer-runtime'

// ATX Job Status enum (matches client-side C# definition)
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

// ATX Workspace Models
export interface AtxWorkspaceInfo {
    Id: string
    Name: string
    CreatedDate?: string
}

export interface AtxCreatedWorkspaceInfo {
    WorkspaceId: string
    WorkspaceName: string
}

// ATX Transformation Job (matches client-side C# definition)
export interface AtxTransformationJob {
    WorkspaceId: string
    JobId: string
    Status: AtxJobStatus
    FailureReason?: string
}

// ATX Consolidated API Request/Response Models
export interface AtxListOrCreateWorkspaceRequest extends ExecuteCommandParams {
    CreateWorkspaceName?: string // Optional - if provided, creates new workspace
}

export interface AtxListOrCreateWorkspaceResponse {
    AvailableWorkspaces: AtxWorkspaceInfo[]
    CreatedWorkspace?: AtxCreatedWorkspaceInfo
}

// ATX Job Status Models
export interface AtxGetJobStatusInfoRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
    IncludePlanSteps?: boolean
    IncludeArtifacts?: boolean
}

export interface AtxGetJobStatusInfoResponse {
    JobId: string
    Status: string
    Progress?: number
    PlanSteps?: any[]
    Artifacts?: any[]
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
}

// ATX Get Transform Info request/response (orchestration)
export interface AtxGetTransformInfoRequest extends ExecuteCommandParams {
    TransformationJobId: string
    WorkspaceId: string
    SolutionRootPath: string
}

export interface AtxGetTransformInfoResponse {
    TransformationJob: AtxTransformationJob
    PlanPath?: string | null
    ReportPath?: string | null
    WorklogPath?: string | null
    TransformationPlan?: TransformationPlan | null
    ArtifactPath?: string | null
    ErrorString?: string | null
}

// ATX Stop Job request
export interface AtxStopJobRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
}
export interface AtxUploadPlanRequest extends ExecuteCommandParams {
    TransformationJobId: string
    WorkspaceId: string
    PlanPath: string
}

export interface AtxUploadPlanResponse {
    VerificationStatus: boolean
    Message: string
    PlanPath?: string
    ReportPath?: string
}
