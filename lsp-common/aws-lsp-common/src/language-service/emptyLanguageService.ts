import { Position, Range, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'
import { AwsLanguageService } from './awsLanguageService'

/**
 * Provides a stock "no-op" language service, which returns
 * the "empty" equivalent for each call.
 */
export class EmptyLanguageService implements AwsLanguageService {
    public isSupported(document: TextDocument): boolean {
        return true
    }

    public doValidation(textDocument: TextDocument): PromiseLike<Diagnostic[]> {
        return Promise.resolve([])
    }

    public doComplete(textDocument: TextDocument, position: Position): PromiseLike<CompletionList | null> {
        return Promise.resolve(null)
    }

    public doHover(textDocument: TextDocument, position: Position): PromiseLike<Hover | null> {
        return Promise.resolve(null)
    }

    public format(textDocument: TextDocument, range: Range, options: FormattingOptions): TextEdit[] {
        return []
    }
}
