import { ExecuteCommandParams } from 'vscode-languageserver'
import { TransformationJob, TransformationPlan } from '../../client/token/codewhispererbearertokenclient'

export interface StartTransformRequest extends ExecuteCommandParams {
    SolutionRootPath: string
    TargetFramework: string
    ProgramLanguage: string
    SelectedProjectPath: string
    ProjectMetadata: TransformProjectMetadata[]
}

export interface StartTransformResponse {
    UploadId: string
    TransformationJobId: string
    Error?: string
}

export interface GetTransformRequest extends ExecuteCommandParams {
    TransformationJobId: string
}

export interface GetTransformResponse {
    TransformationJob: TransformationJob
}

export interface GetTransformPlanRequest extends ExecuteCommandParams {
    TransformationJobId: string
}

export interface GetTransformPlanResponse {
    TransformationPlan: TransformationPlan
}

export interface CancelTransformRequest extends ExecuteCommandParams {
    TransformationJobId: string
}

export interface DownloadArtifactsRequest extends ExecuteCommandParams {
    TransformationJobId: string
}

export enum CancellationJobStatus {
    NOT_STARTED,
    IN_PROGRESS,
    SUCCESSFULLY_CANCELLED,
    FAILED_TO_CANCEL,
    TIMED_OUT,
}

export interface CancelTransformResponse {
    TransformationJobStatus: CancellationJobStatus
}

export interface DownloadArtifactsResponse {
    PathTosave: string
    Error: string
}

export interface RequirementJson {
    EntryPath: string
    Projects: Project[]
}

export interface ExternalReference {
    ProjectPath: string
    RelativePath: string
    AssemblyFullPath: string
    TargetFrameworkId: string
    IncludedInArtifact: boolean
}

interface TransformProjectMetadata {
    Name: string
    ProjectPath: string
    ProjectLanguage: string
    ProjectTargetFramework: string
    ProjectType: string
    SourceCodeFilePaths: string[]
    ExternalReferences: ExternalReference[]
}

interface Project {
    projectFilePath: string
    codeFiles: CodeFile[]
    references: References[]
}

interface CodeFile {
    contentMd5Hash: string
    relativePath: string
}

interface References {
    includedInArtifact: boolean
    relativePath: string
}
