export type DisplayFinding = {
    filePath: string
    startLine: string
    endLine: string
    comment: string
    title: string
    description: string
    severity: string
    suggestedFixes: (string | undefined)[] | undefined
    language: string
}
