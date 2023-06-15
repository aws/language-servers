import { Position, Range, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'

// Where possible, this interface should follow the (VS Code) JSON Language Server's interface,
// (https://github.com/microsoft/vscode-json-languageservice/blob/v5.3.5/src/jsonLanguageService.ts#L38)
// which closely resembles the core (VS Code) language server implementations.
// We would prefer to leverage truly core types (like those from vscode-languageserver-textdocument),
// since the JSON Language Service is a specific product and not a generalized interface type,
// we have an explicit interface here for use in language services (and consumers).
export interface AwsLanguageService {
    isSupported(document: TextDocument): boolean
    doValidation(textDocument: TextDocument): PromiseLike<Diagnostic[]>
    doComplete(textDocument: TextDocument, position: Position): PromiseLike<CompletionList | null>
    doHover(textDocument: TextDocument, position: Position): PromiseLike<Hover | null>
    format(textDocument: TextDocument, range: Range, options: FormattingOptions): TextEdit[]
}
