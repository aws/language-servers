import { ExecuteCommandParams } from 'vscode-languageserver'
import { PlanStepStatus } from '@amazon/elastic-gumby-frontend-client'

// Re-export for convenience
export { PlanStepStatus }

/**
 * Represents a step in an ATX transformation plan tree structure.
 * Matches C# AtxPlanStep class.
 */
export interface AtxPlanStep {
    StepId: string
    ParentStepId: string | null
    StepName: string
    Description: string
    Status: PlanStepStatus
    Children: AtxPlanStep[]
}

/**
 * Tree structure for transformation plan.
 * Matches C# AtxTransformationPlan class.
 */
export interface AtxTransformationPlan {
    Root: AtxPlanStep
}

/**
 * Creates an empty root node for the transformation plan tree.
 */
export function createEmptyRootNode(): AtxPlanStep {
    return {
        StepId: 'root',
        ParentStepId: null,
        StepName: 'Root',
        Description: '',
        Status: 'NOT_STARTED',
        Children: [],
    }
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

// ATX Transformation Job
export interface AtxTransformationJob {
    WorkspaceId: string
    JobId: string
    Status: string
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

// ATX Start Transform request/response (orchestration)
export interface AtxStartTransformRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobName?: string
    InteractiveMode?: boolean
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
    TransformationPlan?: AtxTransformationPlan | null
    ArtifactPath?: string | null
    ErrorString?: string | null
    StepInformation?: AtxStepInformation | null
}

/**
 * Information about a step during execution phase HITL.
 */
export interface AtxStepInformation {
    StepId: string
    DiffArtifactPath: string
    RetryInstruction?: string
    IsInvalid?: boolean
    InvalidInstruction?: string
    InvalidReason?: string
    ExpiryTimestampUTC?: string
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

// ATX Set Checkpoints request/response (interactive mode)
export interface AtxSetCheckpointsRequest extends ExecuteCommandParams {
    TransformationJobId: string
    WorkspaceId: string
    SolutionRootPath: string
    Checkpoints: Record<string, boolean>
}

export interface AtxSetCheckpointsResponse {
    Success: boolean
    Error?: string
}

// ATX Checkpoint Action request/response
export interface AtxCheckpointActionRequest extends ExecuteCommandParams {
    Action: string // "APPLY" or "RETRY"
    NewInstruction?: string // Only used when Action is "RETRY"
    StepId: string
    TransformationJobId: string
    WorkspaceId: string
    SolutionRootPath: string
}

export interface AtxCheckpointActionResponse {
    Success: boolean
    Error?: string | null
}
