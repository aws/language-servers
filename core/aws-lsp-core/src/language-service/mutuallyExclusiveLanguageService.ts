import { Position, Range, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'
import { AwsLanguageService } from './awsLanguageService'
import { EmptyLanguageService } from './emptyLanguageService'

/**
 * This is a language service composed of other services provided through the constructor.
 * It is expected that no more than one of the services will support a given document.
 * In cases where no service supports a document, the "empty" service will be used.
 */
export class MutuallyExclusiveLanguageService implements AwsLanguageService {
    private readonly services: AwsLanguageService[]

    constructor(services: AwsLanguageService[]) {
        // Empty language service assures that we will *always* have a default handler (which does nothing)
        this.services = [...services, new EmptyLanguageService()]
    }

    public isSupported(document: TextDocument): boolean {
        return this.services.some(service => service.isSupported(document))
    }

    public doValidation(textDocument: TextDocument): PromiseLike<Diagnostic[]> {
        return this.services.find(service => service.isSupported(textDocument))!.doValidation(textDocument)
    }

    public doComplete(textDocument: TextDocument, position: Position): PromiseLike<CompletionList | null> {
        return this.services.find(service => service.isSupported(textDocument))!.doComplete(textDocument, position)
    }

    public doHover(textDocument: TextDocument, position: Position): PromiseLike<Hover | null> {
        return this.services.find(service => service.isSupported(textDocument))!.doHover(textDocument, position)
    }

    public format(textDocument: TextDocument, range: Range, options: FormattingOptions): TextEdit[] {
        return this.services.find(service => service.isSupported(textDocument))!.format(textDocument, range, options)
    }
}
