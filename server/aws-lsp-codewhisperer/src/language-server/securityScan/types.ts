import { ExecuteCommandParams } from 'vscode-languageserver'
export interface RecommendationDescription {
    text: string
    markdown: string
}

export interface Recommendation {
    text: string
    url: string
}

export interface SuggestedFix {
    description: string
    code: string
}

export interface Remediation {
    recommendation: Recommendation
    suggestedFixes: SuggestedFix[]
}
export interface RawCodeScanIssue {
    filePath: string
    startLine: number
    endLine: number
    title: string
    description: RecommendationDescription
    detectorId: string
    detectorName: string
    findingId: string
    ruleId?: string
    relatedVulnerabilities: string[]
    severity: string
    remediation: Remediation
}
export interface CodeScanIssue {
    startLine: number
    endLine: number
    comment: string
    title: string
    description: RecommendationDescription
    detectorId: string
    detectorName: string
    findingId: string
    ruleId?: string
    relatedVulnerabilities: string[]
    severity: string
    recommendation: Recommendation
    suggestedFixes: SuggestedFix[]
}
export interface AggregatedCodeScanIssue {
    filePath: string
    issues: CodeScanIssue[]
}

export type SecurityScanStatus = 'Succeeded' | 'Failed' | 'InProgress' | 'Cancelled'
export interface SecurityScanRequestParams extends ExecuteCommandParams {
    command: 'aws/codewhisperer/runSecurityScan'
}
export interface SecurityScanResponseParams {
    result: SecurityScanResult
    error?: string
}
export interface SecurityScanResult {
    status: SecurityScanStatus
    scannedFiles?: string
}
