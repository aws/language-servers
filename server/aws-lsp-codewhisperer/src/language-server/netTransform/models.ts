import { ExecuteCommandParams } from 'vscode-languageserver'
import { TransformationJob, TransformationPlan } from '../../client/token/codewhispererbearertokenclient'

export interface QNetStartTransformRequest extends ExecuteCommandParams {
    SolutionRootPath: string
    TargetFramework: string
    ProgramLanguage: string
    SourceCodeFilePaths: string[]
    ProjectMetadata: QNetTransformProjectMetadata[]
}

export interface QNetStartTransformResponse {
    UploadId: string
    TransformationJobId: string
    Error?: string
}

export interface QNetGetTransformRequest extends ExecuteCommandParams {
    TransformationJobId: string
}

export interface QNetGetTransformResponse {
    TransformationJob: TransformationJob
}

export interface QNetGetTransformPlanRequest extends ExecuteCommandParams {
    TransformationJobId: string
}

export interface QNetGetTransformPlanResponse {
    TransformationPlan: TransformationPlan
}

export interface QNetCancelTransformRequest extends ExecuteCommandParams {
    TransformationJobId: string
}

export enum CancellationJobStatus {
    NOT_STARTED,
    IN_PROGRESS,
    SUCCESSFULLY_CANCELLED,
    FAILED_TO_CANCEL,
    TIMED_OUT,
}

export interface QNetCancelTransformResponse {
    TransformationJobStatus: CancellationJobStatus
}

export interface RequirementJson {
    ProjectToReference: ProjectToReference[]
}

export interface ExternalReference {
    ProjectPath: string
    RelativePath: string
    AssemblyFullPath: string
    TargetFrameworkId: string
    IncludedInArtifact: string
}

interface QNetTransformProjectMetadata {
    Name: string
    ProjectPath: string
    ProjectLanguage: string
    ProjectTargetFramework: string
    ProjectType: string
    ExternalReferences: ExternalReference[]
}

interface ProjectToReference {
    project: string
    references: ExternalReference[]
}
