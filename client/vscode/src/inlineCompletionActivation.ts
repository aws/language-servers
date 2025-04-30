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
    TextDocumentChangeEvent,
    TextEditor,
} from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import {
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    InlineCompletionWithReferencesParams,
    inlineCompletionWithReferencesRequestType,
    logInlineCompletionSessionResultsNotificationType,
    LogInlineCompletionSessionResultsParams,
} from '@aws/language-server-runtimes/protocol'

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

export function registerInlineCompletion(languageClient: LanguageClient) {
    const inlineCompletionProvider = new CodeWhispererInlineCompletionItemProvider(languageClient)
    // POC-NEP: The displayName parameter would allow us to show "Amazon Q" in the UI
    // when suggestions are displayed. This is not supported in the current VSCode API
    // but will be added in a future version.
    languages.registerInlineCompletionItemProvider(CodewhispererInlineCompletionLanguages, inlineCompletionProvider)

    // Register manual trigger command for InlineCompletions
    commands.registerCommand('aws.sample-vscode-ext-amazonq.invokeInlineCompletion', async (...args: any) => {
        console.log('Manual trigger for inline completion invoked')
        await commands.executeCommand(`editor.action.inlineSuggest.trigger`)
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

// Helper function to check if a document's language is supported
function isLanguageSupported(document: TextDocument): boolean {
    return CodewhispererInlineCompletionLanguages.some(
        lang => lang.language === document.languageId && lang.scheme === document.uri.scheme
    )
}

// Helper function to determine if we should trigger a completion
function shouldTriggerCompletion(e: TextDocumentChangeEvent): boolean {
    if (e.contentChanges.length === 0) {
        return false
    }

    const change = e.contentChanges[0]
    const text = change.text

    // Trigger on special characters
    if (['{', '}', '(', ')', '[', ']', ':', ';', '.'].includes(text)) {
        return true
    }

    // Trigger on Enter key (newline)
    if (text === '\n' || text === '\r\n') {
        return true
    }

    return false
}

export class CodeWhispererInlineCompletionItemProvider implements InlineCompletionItemProvider {
    constructor(private readonly languageClient: LanguageClient) {}

    async provideInlineCompletionItems(
        document: TextDocument,
        position: Position,
        context: InlineCompletionContext,
        token: CancellationToken
    ): Promise<InlineCompletionItem[] | InlineCompletionList> {
        const requestStartTime = Date.now()

        try {
            console.log('Sending inline completion request with context:', {
                uri: document.uri.toString(),
                position: { line: position.line, character: position.character },
                triggerKind: context.triggerKind,
            })

            // Create a request object that matches the protocol's expected structure
            const request = {
                textDocument: {
                    uri: document.uri.toString(),
                },
                position: {
                    line: position.line,
                    character: position.character,
                },
                context: {
                    triggerKind: context.triggerKind,
                },
            }

            // Use the raw sendRequest method to avoid type checking issues
            const response = await this.languageClient.sendRequest(
                'aws/textDocument/inlineCompletionWithReferences',
                request,
                token
            )

            const list: InlineCompletionListWithReferences = response as InlineCompletionListWithReferences
            this.languageClient.info(`Client: Received ${list.items.length} suggestions`)

            console.log('Got inlineCompletionsWithReferences from server', list)

            const firstCompletionDisplayLatency = Date.now() - requestStartTime
            // Add completion session tracking and attach onAcceptance command to each item to record used decision
            list.items.forEach((item: InlineCompletionItemWithReferences) => {
                // POC-NEP: Set VSCode UI properties for edit suggestions
                // The isInlineEdit property comes from our type definition and needs to be
                // applied to the VSCode-specific property with the same name
                if ((item as any).isInlineEdit) {
                    ;(item as any).showInlineEditMenu = true
                    console.log('Setting isInlineEdit=true for item', item.itemId)
                }

                item.command = {
                    command: 'aws.sample-vscode-ext-amazonq.accept',
                    title: 'On acceptance',
                    arguments: [list.sessionId, item.itemId, requestStartTime, firstCompletionDisplayLatency],
                }
            })

            return list as InlineCompletionList
        } catch (error) {
            console.error('Error in provideInlineCompletionItems:', error)
            return { items: [] }
        }
    }
}
