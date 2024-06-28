import type { Diagnostic } from '@aws/language-server-runtimes/server-interface'
import {
    DiagnosticSeverity,
    TextDocument,
    SemanticTokenTypes,
    SemanticTokens,
    SemanticTokensLegend,
} from '@aws/language-server-runtimes/server-interface'
import partiQlServerBinary from '../partiql-parser-wasm/partiql-wasm-parser-inline'
import { initSync, parse_as_json } from '../partiql-parser-wasm/partiql_playground'
import { convertObjectToParserError } from './error-parsing/parser-errors'
import { findNodes, encodeSemanticTokens } from './syntax-highlighting/parser-tokens'
import { SemanticToken, string2TokenTypes } from './syntax-highlighting/parser-tokens'

// This is a constant that is used to determine if the language server supports multi-line tokens.
const MULTILINETOKENSUPPORT = true

export const semanticTokensLegend = {
    tokenTypes: [
        SemanticTokenTypes.keyword,
        SemanticTokenTypes.type,
        SemanticTokenTypes.number,
        SemanticTokenTypes.string,
        SemanticTokenTypes.function,
        SemanticTokenTypes.variable,
        SemanticTokenTypes.comment,
        SemanticTokenTypes.operator,
    ],
    tokenModifiers: [],
} as SemanticTokensLegend

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

    public async doSemanticTokens(textDocument: TextDocument): Promise<SemanticTokens | null> {
        const text = textDocument.getText()
        // console.log('Text:', text)
        const data: SemanticToken[] = []
        for (const nodeType of semanticTokensLegend.tokenTypes) {
            const tokens = await findNodes(text, nodeType as SemanticTokenTypes)
            data.push(...tokens)
        }
        for (const nodeType in string2TokenTypes) {
            const tokens = await findNodes(text, nodeType)
            data.push(...tokens)
        }
        // console.log('Found tokens:', data)
        console.log('Encoding tokens...')
        const encodedTokens = encodeSemanticTokens(data, MULTILINETOKENSUPPORT)
        if (encodedTokens) {
            console.log('Returned tokens:', encodedTokens)
        } else {
            console.log('No tokens found.')
        }
        return encodedTokens
    }
}
