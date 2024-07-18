import { ExecuteCommandParams } from '@aws/language-server-runtimes/server-interface'
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

export type SecurityScanStatus = 'Succeeded' | 'Failed' | 'Cancelled'
export interface SecurityScanRequestParams extends ExecuteCommandParams {
    command: 'aws/codewhisperer/runSecurityScan'
}

export interface SecurityScanResponse {
    status: SecurityScanStatus
    findings?: SecurityScanFindings
    error?: string
}

export interface SecurityScanFindings {
    totalFindings: number
    findingsWithFixes: number
    scannedFiles: string
}
