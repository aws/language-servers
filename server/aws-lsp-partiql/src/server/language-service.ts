import type { Diagnostic } from '@aws/language-server-runtimes/server-interface'
import { DiagnosticSeverity, TextDocument } from '@aws/language-server-runtimes/server-interface'
// Commented out code is to use the PartiQL Rust parser, should be used again after
// https://github.com/partiql/partiql-lang-rust/issues/472 is resolved.
// import partiQlServerBinary from '../partiql-parser-wasm/partiql-wasm-parser-inline'
// import { initSync, parse_as_json } from '../partiql-parser-wasm/partiql_playground'
// import { convertObjectToParserError } from './error-parsing/parser-errors'
import { CommonTokenStream, Token, ANTLRErrorListener, CharStream, ATNSimulator, Recognizer } from 'antlr4ng'
import { PartiQLParser } from '../antlr-generated/PartiQLParser'
import { PartiQLTokens } from '../antlr-generated/PartiQLTokens'

export function normalizeQuery(data: string): string {
    return data != null ? data : ''
}

export function createPartiQLLanguageService() {
    return new PartiQLLanguageService()
}

// Collector used to give to the ANTLR parser and lexer to store the diagnostics.
class DiagnosticsCollector implements ANTLRErrorListener {
    private _diagnostics: Diagnostic[] = []
    private _document: TextDocument

    constructor(textDocumnt: TextDocument) {
        this._document = textDocumnt
    }

    // We only use the parser for diagnostics, so we're only interested in the syntaxError method for this class.
    syntaxError(recognizer: Recognizer<ATNSimulator>, offendingSymbol: Token | null) {
        this._diagnostics.push({
            message: `Unexpected token: ${offendingSymbol?.text}`,
            range: {
                start: this._document.positionAt(offendingSymbol?.start ?? 0),
                end: this._document.positionAt(offendingSymbol?.stop ?? 0),
            },
            severity: DiagnosticSeverity.Error,
        })
    }

    reportAmbiguity(): void {
        // Unhandled
    }

    reportAttemptingFullContext(): void {
        // Unhandled
    }

    reportContextSensitivity(): void {
        // Unhandled
    }

    get errors() {
        return this._diagnostics
    }
}

export function doAntlrValidation(textDocument: TextDocument): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const collector = new DiagnosticsCollector(textDocument)

    // Set up ANTLR lexer
    const inputStream = CharStream.fromString(normalizeQuery(textDocument.getText()))
    const lexer = new PartiQLTokens(inputStream)
    lexer.removeErrorListeners()
    lexer.addErrorListener(collector)

    // Set up ANTLR parser
    const tokenStream = new CommonTokenStream(lexer)
    const parser = new PartiQLParser(tokenStream)
    parser.removeErrorListeners()
    parser.addErrorListener(collector)

    // Try to create the parser tree, will report errors to collector if not possible.
    parser.root()
    return collector.errors
}

class PartiQLLanguageService {
    constructor() {
        // Commented out code is to use the PartiQL Rust parser, should be used again after
        // https://github.com/partiql/partiql-lang-rust/issues/472 is resolved.
        // initSync(partiQlServerBinary)
    }

    public doValidation(textDocument: TextDocument): Diagnostic[] {
        const diagnostics: Diagnostic[] = []

        diagnostics.push(...doAntlrValidation(textDocument))

        // Commented out code is to use the PartiQL Rust parser, should be used again after
        // https://github.com/partiql/partiql-lang-rust/issues/472 is resolved.
        // const parsedQuery = JSON.parse(parse_as_json(normalizeQuery(textDocument.getText())))

        // for (const error of parsedQuery.errors || []) {
        //     const { message, location } = convertObjectToParserError(error)

        //     diagnostics.push({
        //         severity: DiagnosticSeverity.Error,
        //         range: {
        //             start: textDocument.positionAt(location.start),
        //             end: textDocument.positionAt(location.end),
        //         },
        //         message: message,
        //     })
        // }

        return diagnostics
    }
}
