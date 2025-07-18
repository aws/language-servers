export type FileArtifacts = Array<{ path: string }>
export type FolderArtifacts = Array<{ path: string }>
export type RuleArtifacts = Array<{ path: string }>
export type ArtifactType = 'FILE' | 'FOLDER'
export enum FailedMetricName {
    MissingFileOrFolder = 'missingFileOrFolder',
    CreateUploadUrlFailed = 'createUploadUrlFailed',
    CodeScanTimeout = 'codeScanTimeout',
    CodeScanFailed = 'codeScanFailed',
}
export enum SuccessMetricName {
    CodeScanSuccess = 'codeScanSuccess',
}

export type ValidateInputAndSetupResult = {
    fileArtifacts: FileArtifacts
    folderArtifacts: FolderArtifacts
    isFullReviewRequest: boolean
    artifactType: ArtifactType
    programmingLanguage: string
    scanName: string
    ruleArtifacts: RuleArtifacts
}

export type PrepareAndUploadArtifactsResult = {
    uploadId: string
    isCodeDiffPresent: boolean
    artifactSize: number
}

export type StartCodeAnalysisResult = {
    jobId: string
    status: string
}

export type CodeReviewResult = {
    codeReviewId: string
    message: string
    findingsByFile: string
}

export type CodeReviewFinding = {
    filePath: string
    startLine: number
    endLine: number
    comment: string
    title: string
    description: { markdown: string; text: string }
    detectorId?: string
    detectorName?: string
    findingId: string
    ruleId?: string
    relatedVulnerabilities: (string | undefined)[]
    severity: string
    suggestedFixes?: (string | undefined)[]
    recommendation: { text: string; url?: string | null }
    scanJobId: string
    language: string
    autoDetected: false
    findingContext: string | null | undefined
}

export type CodeReviewMetric =
    | {
          reason: SuccessMetricName
          result: 'Succeeded'
          metadata?: object
      }
    | {
          reason: FailedMetricName
          result: 'Failed'
          reasonDesc: string
          metadata?: object
      }
