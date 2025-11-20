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
