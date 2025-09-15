import {
    Diagnostic,
    DiagnosticSeverity,
    Logging,
    Lsp,
    Position,
    Range,
    TextDocumentContentChangeEvent,
} from '@aws/language-server-runtimes/server-interface'
import { URI } from 'vscode-uri'
import { AggregatedCodeScanIssue, CodeScanIssue } from './types'

class SecurityScanDiagnosticsProvider {
    private diagnostics: Map<string, Diagnostic[]>
    private lsp: Lsp
    private logging: Logging
    private findings: AggregatedCodeScanIssue[]

    constructor(lsp: Lsp, logging: Logging) {
        this.diagnostics = new Map()
        this.lsp = lsp
        this.logging = logging
        this.findings = []
    }

    async resetDiagnostics() {
        await Promise.all(
            this.findings.map(finding => {
                this.logging.log(`reset diagnostics for: ${finding.filePath}`)
                return this.publishDiagnostics(finding.filePath, [])
            })
        )
        this.diagnostics = new Map()
    }

    async createDiagnostics(findings: AggregatedCodeScanIssue[]) {
        this.findings = findings
        for (const finding of findings) {
            const path = URI.file(finding.filePath).path
            const diagnostics = finding.issues.map(issue => this.mapScanIssueToDiagnostics(issue))
            if (!this.diagnostics.has(path)) {
                this.diagnostics.set(path, diagnostics)
            }
            this.diagnostics.set(path, [...(this.diagnostics.get(finding.filePath) || []), ...diagnostics])
            await this.publishDiagnostics(finding.filePath, diagnostics)
        }
    }

    mapScanIssueToDiagnostics(issue: CodeScanIssue): Diagnostic {
        return Diagnostic.create(
            this.createDiagnosticsRange(issue.startLine, issue.endLine),
            `${issue.detectorName} - ${issue.description.text}`,
            DiagnosticSeverity.Warning,
            issue.relatedVulnerabilities.join(','),
            'Amazon Q'
        )
    }

    async validateDiagnostics(uri: string, e: TextDocumentContentChangeEvent) {
        const path = URI.parse(uri).path
        const currentDiagnostics = this.diagnostics.get(path)
        if (!currentDiagnostics) {
            return
        }
        // range will be omitted if the change is for entire document
        const changeStartLine = (e as any).range?.start?.line
        const changeEndLine = (e as any).range?.end?.line
        const nextDiagnostics: Diagnostic[] = currentDiagnostics.map(diagnostic => {
            if (changeStartLine && changeStartLine > diagnostic.range.end.line) {
                // change has no overlap with diagnostic
                return diagnostic
            } else if (changeEndLine && changeEndLine < diagnostic.range.start.line) {
                // change is before diagnostic range, update diagnostic range
                const lineOffset = this.getLineOffset((e as any).range, e.text)
                return {
                    ...diagnostic,
                    range: this.createDiagnosticsRange(
                        diagnostic.range.start.line + lineOffset,
                        diagnostic.range.end.line + lineOffset
                    ),
                }
            } else {
                // change is within diagnostic range, update range and messaging to re-scan
                const newRange = this.getChangedDiagnosticRange(diagnostic.range, (e as any).range)
                return diagnostic.severity === 2
                    ? {
                          ...diagnostic,
                          severity: 3,
                          message: `Re-scan to validate the fix: ${diagnostic.message}`,
                          range: newRange,
                      }
                    : diagnostic
            }
        })
        this.diagnostics.set(path, nextDiagnostics)
        await this.publishDiagnostics(uri, nextDiagnostics)
    }

    getChangedDiagnosticRange(diagnosticRange: Range, documentChangeRange?: Range): Range {
        if (!documentChangeRange) {
            return diagnosticRange
        }
        const start = Math.max(diagnosticRange.start.line, documentChangeRange.start.line)
        const end = Math.min(diagnosticRange.end.line, documentChangeRange.end.line)
        return this.createDiagnosticsRange(start, end === start ? start + 1 : end)
    }

    isPositionInRange = (position: Position, range: Range) => {
        if (position.line < range.start.line || position.line > range.end.line) {
            return false
        }
        return true
    }

    getLineOffset(range: Range, text: string) {
        const originLines = range.end.line - range.start.line + 1
        const changedLines = text.split('\n').length
        return changedLines - originLines
    }

    createDiagnosticsRange(startLine: number, endLine: number) {
        return {
            start: {
                line: startLine,
                character: 0,
            },
            end: {
                line: endLine,
                character: 0,
            },
        }
    }

    async publishDiagnostics(uri: string, diagnostics: Diagnostic[]) {
        await this.lsp.publishDiagnostics({
            uri,
            diagnostics: diagnostics,
        })
    }
}
export default SecurityScanDiagnosticsProvider
