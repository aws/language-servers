import {
    CancellationToken,
    InlineCompletionContext,
    InlineCompletionItem,
    InlineCompletionItemProvider,
    InlineCompletionList,
    Position,
    TextDocument,
    languages,
} from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import { InlineCompletionParams, inlineCompletionWithReferencesRequestType } from './futureTypes'

export function registerInlineCompletion(languageClient: LanguageClient) {
    const inlineCompletionProvider = new CodeWhispererInlineCompletionItemProvider(languageClient)
    languages.registerInlineCompletionItemProvider({ scheme: 'file', language: 'typescript' }, inlineCompletionProvider)
}

class CodeWhispererInlineCompletionItemProvider implements InlineCompletionItemProvider {
    constructor(private readonly languageClient: LanguageClient) {}

    async provideInlineCompletionItems(
        document: TextDocument,
        position: Position,
        context: InlineCompletionContext,
        token: CancellationToken
    ): Promise<InlineCompletionItem[] | InlineCompletionList> {
        const request: InlineCompletionParams = {
            textDocument: {
                uri: document.uri.toString(),
            },
            position,
            context,
        }

        const response = await this.languageClient.sendRequest(
            inlineCompletionWithReferencesRequestType,
            request,
            token
        )

        const list: InlineCompletionList = response as InlineCompletionList
        this.languageClient.info(`Client: Received ${list.items.length} suggestions`)

        return list
    }
}
