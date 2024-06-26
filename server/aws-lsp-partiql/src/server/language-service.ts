import type { Diagnostic } from '@aws/language-server-runtimes/server-interface'
import {
    DiagnosticSeverity,
    TextDocument,
    SemanticTokenTypes,
    // SemanticTokens,
} from '@aws/language-server-runtimes/server-interface'
import partiQlServerBinary from '../partiql-parser-wasm/partiql-wasm-parser-inline'
import { initSync, parse_as_json } from '../partiql-parser-wasm/partiql_playground'
import { convertObjectToParserError } from './error-parsing/parser-errors'
import { findNodes } from './syntax-highlighting/treesitter'

export const partiqltokensTypes: SemanticTokenTypes[] = [
    SemanticTokenTypes.keyword,
    SemanticTokenTypes.type,
    SemanticTokenTypes.number,
    SemanticTokenTypes.string,
    SemanticTokenTypes.variable,
    SemanticTokenTypes.comment,
    SemanticTokenTypes.operator,
]

export function normalizeQuery(data: string): string {
    return data != null ? data : ''
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

    // public async doSemanticTokens(textDocument: TextDocument): Promise<SemanticTokens | null> {
    //     console.log('doSemanticTokens')
    //     const keywords = await findNodes(textDocument.getText(), SemanticTokenTypes.keyword)
    //     return keywords
    // }

    public async doSemanticTokens(textDocument: TextDocument) {
        const tokens = await findNodes(textDocument.getText(), SemanticTokenTypes.keyword)
        if (tokens) {
            console.log('Returned tokens:', tokens)
        } else {
            console.log('No tokens found.')
        }
    }
}
