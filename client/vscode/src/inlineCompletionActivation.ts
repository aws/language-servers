import {
    CancellationToken,
    InlineCompletionContext,
    InlineCompletionItem,
    InlineCompletionItemProvider,
    InlineCompletionList,
    Position,
    TextDocument,
    commands,
    languages,
    workspace,
    window,
    Range,
    TextDocumentChangeEvent,
} from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import {
    logInlineCompletionSessionResultsNotificationType,
    LogInlineCompletionSessionResultsParams,
    InlineCompletionListWithReferences,
    inlineCompletionWithReferencesRequestType,
} from '@aws/language-server-runtimes/protocol'
import { applyPatch } from 'diff'

export const CodewhispererInlineCompletionLanguages = [
    { scheme: 'file', language: 'typescript' },
    { scheme: 'file', language: 'javascript' },
    { scheme: 'file', language: 'json' },
    { scheme: 'file', language: 'yaml' },
    { scheme: 'file', language: 'java' },
    { scheme: 'file', language: 'go' },
    { scheme: 'file', language: 'php' },
    { scheme: 'file', language: 'rust' },
    { scheme: 'file', language: 'kotlin' },
    { scheme: 'file', language: 'terraform' },
    { scheme: 'file', language: 'ruby' },
    { scheme: 'file', language: 'shellscript' },
    { scheme: 'file', language: 'dart' },
    { scheme: 'file', language: 'lua' },
    { scheme: 'file', language: 'powershell' },
    { scheme: 'file', language: 'r' },
    { scheme: 'file', language: 'swift' },
    { scheme: 'file', language: 'systemverilog' },
    { scheme: 'file', language: 'scala' },
    { scheme: 'file', language: 'vue' },
    { scheme: 'file', language: 'csharp' },
    { scheme: 'file', language: 'python' },
]

/**
 * Check if the document language is supported for inline completions
 */
function isLanguageSupported(document: TextDocument): boolean {
    return CodewhispererInlineCompletionLanguages.some(
        selector => selector.language === document.languageId && selector.scheme === document.uri.scheme
    )
}

/**
 * Check if the document change should trigger a completion
 */
function shouldTriggerCompletion(e: TextDocumentChangeEvent): boolean {
    // Simple implementation - trigger on special characters
    if (e.contentChanges.length === 0) {
        return false
    }

    const text = e.contentChanges[0].text
    // Trigger on special characters or Enter key
    return text === '.' || text === '(' || text === '{' || text === '[' || text === '\n'
}

/**
 * CodeWhisperer inline completion provider implementation
 */
class CodeWhispererInlineCompletionItemProvider implements InlineCompletionItemProvider {
    private languageClient: LanguageClient

    constructor(languageClient: LanguageClient) {
        this.languageClient = languageClient
    }

    async provideInlineCompletionItems(
        document: TextDocument,
        position: Position,
        context: InlineCompletionContext,
        token: CancellationToken
    ): Promise<InlineCompletionList | null> {
        console.log('DEBUG-NEP: provideInlineCompletionItems called')

        if (!isLanguageSupported(document)) {
            console.log('DEBUG-NEP: Language not supported')
            return null
        }

        try {
            // Request inline completions from the language server
            const result = (await this.languageClient.sendRequest(
                inlineCompletionWithReferencesRequestType,
                {
                    textDocument: { uri: document.uri.toString() },
                    position: position,
                    context: {
                        triggerKind: context.triggerKind,
                        selectedCompletionInfo: context.selectedCompletionInfo,
                    },
                },
                token
            )) as InlineCompletionListWithReferences

            if (!result || !result.items || result.items.length === 0) {
                console.log('DEBUG-NEP: No completions returned')
                return null
            }

            console.log(`DEBUG-NEP: Received ${result.items.length} completions`)

            // Convert server response to VSCode inline completion items
            const items = result.items.map((item: any, index: number) => {
                const inlineItem = new InlineCompletionItem(item.text)

                // Set range if provided
                if (item.range) {
                    inlineItem.range = new Range(
                        item.range.start.line,
                        item.range.start.character,
                        item.range.end.line,
                        item.range.end.character
                    )
                }

                // Set command for acceptance tracking
                inlineItem.command = {
                    title: 'Accept Completion',
                    command: 'aws.sample-vscode-ext-amazonq.accept',
                    arguments: [result.sessionId, item.itemId, Date.now()],
                }

                // Set isInlineEdit flag if this is an edit suggestion
                if (item.isInlineEdit) {
                    console.log('DEBUG-NEP: Setting isInlineEdit=true for item', index)
                    ;(inlineItem as any).isInlineEdit = true
                }

                return inlineItem
            })

            return { items }
        } catch (error) {
            console.error('DEBUG-NEP: Error getting inline completions:', error)
            return null
        }
    }
}

export function registerInlineCompletion(languageClient: LanguageClient) {
    const inlineCompletionProvider = new CodeWhispererInlineCompletionItemProvider(languageClient)
    // POC-NEP: The displayName parameter would allow us to show "Amazon Q" in the UI
    // when suggestions are displayed. This is not supported in the current VSCode API
    // but will be added in a future version.
    languages.registerInlineCompletionItemProvider(CodewhispererInlineCompletionLanguages, inlineCompletionProvider)

    // Register manual trigger command for InlineCompletions
    commands.registerCommand('aws.sample-vscode-ext-amazonq.invokeInlineCompletion', async (...args: any) => {
        console.log('DEBUG-NEP: Manual trigger for inline completion invoked')
        try {
            await commands.executeCommand(`editor.action.inlineSuggest.trigger`)
            console.log('DEBUG-NEP: editor.action.inlineSuggest.trigger completed')
        } catch (error) {
            console.error('DEBUG-NEP: Error triggering inline suggest:', error)
        }
    })

    // Register the showEditSuggestion command
    commands.registerCommand('nativeui-poc.showEditSuggestion', async () => {
        console.log('DEBUG-NEP: Show Edit Suggestion command invoked')
        const editor = window.activeTextEditor
        if (!editor) {
            window.showErrorMessage('No active editor')
            return
        }

        // Log document details
        console.log('DEBUG-NEP: Active document details:', {
            uri: editor.document.uri.toString(),
            languageId: editor.document.languageId,
            lineCount: editor.document.lineCount,
            isSupported: isLanguageSupported(editor.document),
        })

        try {
            // Create a simple edit suggestion
            const position = editor.selection.active
            const line = position.line

            // Create a range at the cursor position
            const range = new Range(position, position)

            // Create a simple edit suggestion
            const newText = '// This is a hard-coded edit suggestion'
            console.log('DEBUG-NEP: Creating edit suggestion with text:', newText)

            // Create a custom provider that explicitly sets isInlineEdit
            const provider = new (class implements InlineCompletionItemProvider {
                async provideInlineCompletionItems(
                    document: TextDocument,
                    position: Position,
                    context: InlineCompletionContext,
                    token: CancellationToken
                ): Promise<InlineCompletionList> {
                    console.log('DEBUG-NEP: Provider called, creating item')

                    // Create the item
                    const item = new InlineCompletionItem(newText, range)

                    // Set the isInlineEdit property
                    ;(item as any).isInlineEdit = true

                    console.log('DEBUG-NEP: Created item with isInlineEdit=true')
                    return { items: [item] }
                }
            })()

            // Register the provider
            console.log('DEBUG-NEP: Registering provider')
            const disposable = languages.registerInlineCompletionItemProvider(
                { scheme: 'file', language: editor.document.languageId },
                provider
            )

            // Trigger inline completion
            console.log('DEBUG-NEP: Triggering inline suggestion')
            await commands.executeCommand('editor.action.inlineSuggest.trigger')

            // Keep the provider registered longer
            setTimeout(() => {
                console.log('DEBUG-NEP: Disposing provider')
                disposable.dispose()
            }, 10000)
        } catch (error) {
            console.error('DEBUG-NEP: Error in showEditSuggestion:', error)
        }
    })

    // TODO-NEP: Wire up commands and handlers for accept/reject operations that the suggested edits UI supports

    // Simple implementation of automated triggers
    workspace.onDidChangeTextDocument(async (e: TextDocumentChangeEvent) => {
        const editor = window.activeTextEditor
        if (!editor || e.document !== editor.document || !isLanguageSupported(e.document)) {
            return
        }

        // Only trigger on special characters or Enter key
        if (shouldTriggerCompletion(e)) {
            console.log('Auto-trigger for inline completion')
            await commands.executeCommand('editor.action.inlineSuggest.trigger')
        }
    })

    // Simple implementation of logInlineCompletionSessionResultsNotification
    const onInlineAcceptance = async (
        sessionId: string,
        itemId: string,
        requestStartTime: number,
        firstCompletionDisplayLatency?: number
    ) => {
        console.log('OnInlineAcceptance called with: ', sessionId, itemId)
        const params: LogInlineCompletionSessionResultsParams = {
            sessionId: sessionId,
            completionSessionResult: {
                [itemId]: {
                    seen: true,
                    accepted: true,
                    discarded: false,
                },
            },
            totalSessionDisplayTime: Date.now() - requestStartTime,
            firstCompletionDisplayLatency: firstCompletionDisplayLatency,
        }
        languageClient.sendNotification(logInlineCompletionSessionResultsNotificationType, params)
    }
    commands.registerCommand('aws.sample-vscode-ext-amazonq.accept', onInlineAcceptance)
}
