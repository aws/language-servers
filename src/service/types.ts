import {
    CompletionItem,
    CompletionList,
    Diagnostic,
    Hover,
    HoverParams,
    TextDocumentPositionParams
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export class BaseLanguageService implements LanguageService{
    completion(document: TextDocument, textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList | CompletionItem[]> {
        throw new Error(`completion() not implemented for this Service.`)
    }
    diagnostic(document: TextDocument): Promise<Diagnostic[]> {
        throw new Error(`diagnostic() not implemented for this Service.`)
    }
    hover(document: TextDocument, params: HoverParams): Promise<Hover | null> {
        throw new Error(`hover() not implemented for this Service.`)
    }
}


/**
 * This is the core interface of the Language Service.
 * It defines all the functionalities that a Language Service
 * can support.
 * 
 * These will closely map to the [Language Features defined
 * by the LSP](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#languageFeatures),
 * though the parameters may vary.
 */
export interface LanguageService {

    /**
     * Given a position in a text document, provide a suggestion(s)
     * which the user can eventually select to be autocompleted in their
     * document.
     * 
     * In some IDEs this functionality can be triggered by
     * doing Ctrl + Space
     */
    completion: (
        document: TextDocument,
        textDocumentPosition: TextDocumentPositionParams
    ) => Promise<CompletionItem[] | CompletionList>

    /** Given a text document, provide diagnostic information (errors, warnings, ...) about it. */
    diagnostic: (document: TextDocument) => Promise<Diagnostic[]>

    /** When a user hovers their mouse over text, provide them with information. */
    hover: (document: TextDocument, params: HoverParams) => Promise<Hover | null>
}
