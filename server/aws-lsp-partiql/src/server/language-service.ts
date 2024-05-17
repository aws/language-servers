import type { Diagnostic } from 'vscode-languageserver-protocol'
import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import { TextDocument } from 'vscode-json-languageservice'
import { parse_as_json, initSync } from '../partiql-parser-wasm/partiql_playground'
import partiQlServerBinary from '../partiql-parser-wasm/partiql-wasm-parser-inline'
import { convertObjectToParserError } from './error-parsing/parser-errors'

export function normalizeQuery(data: string): string {
    return data != null ? data.replace(/\"/g, '\\"') : ''
}

export function createPartiQLLanguageService() {
    return new PartiQLLanguageService()
}

class PartiQLLanguageService {
    constructor() {
        initSync(partiQlServerBinary)
    }

    public doValidation(textDocument: TextDocument): Diagnostic[] {
        const parsedQuery = JSON.parse(parse_as_json(normalizeQuery(textDocument.getText())))

        const diagnostics: Diagnostic[] = []
        for (const error of parsedQuery.errors || []) {
            const { message, location } = convertObjectToParserError(error)

            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                    start: textDocument.positionAt(location.start),
                    end: textDocument.positionAt(location.end),
                },
                message: message,
            })
        }
        return diagnostics
    }
}
