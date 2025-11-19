import { ExecuteCommandParams } from 'vscode-languageserver'
import { HitlTaskType, HitlTaskStatus, Action } from '@amazon/elastic-gumby-frontend-client'

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

export interface HitlTask {
    TaskId: string
    Status: HitlTaskStatus
    AgentArtifactId: string
    HumanArtifactId: string
}

export interface GetHitlRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
    HitlTaskId: string
}
export interface ListHitlRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
    HitlTaskType: HitlTaskType
    HitlStatusFilter: HitlTaskStatus
}
export interface SubmitHitlRequest extends ExecuteCommandParams {
    WorkspaceId: string
    JobId: string
    TaskId: string
    Action: Action
    HumanArtifactId: string
}
export interface DownloadExtractArtifactRequest extends ExecuteCommandParams {
    DownloadUrl: string
    RequestHeaders: any
    SaveToDir: string
    FileName: string
}

export interface GetHitlResponse {
    HitlTask: HitlTask
}
export interface ListHitlResponse {
    HitlTasks: HitlTask[]
    NextToken: string
}
export interface SubmitHitlResponse {
    HitlTaskStatus: HitlTaskStatus
}
export interface DownloadExtractArtifactResponse {
    PathToExtracted: string
}
