import { ExecuteCommandParams } from 'vscode-languageserver'
import { TransformationJob, TransformationPlan } from '../../client/token/codewhispererbearertokenclient'

export interface QNetStartTransformRequest extends ExecuteCommandParams {
    SolutionRootPath: string
    TargetFramework: string
    ProgramLanguage: string
    SelectedProjectPath: string
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

export interface QNetDownloadArtifactsRequest extends ExecuteCommandParams {
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

export interface QNetDownloadArtifactsResponse {
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

interface QNetTransformProjectMetadata {
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
