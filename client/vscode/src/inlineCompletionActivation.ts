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

    /**
     * Generates a unified diff format string for text modifications
     * @param text - The input text to generate diff for
     * @param startLine - The starting line number for the diff
     * @returns A string containing the diff in unified diff format showing:
     *          - Original and modified line numbers
     *          - First line with added suffix
     *          - Second line removed
     *          - Third line added as new
     */
    private getTestDiff(text: string, startLine: number) {
        const lines = text.split('\n')
        const diff = [
            `@@ -${startLine},3 +${startLine},3 @@`,
            '-' + lines[0],
            '-' + lines[1],
            '-' + lines[2],
            '+' + lines[0] + ' // Added suffix in line 0;',
            '+' + lines[1] + ' // Added suffix in line 1;',
            '+' + lines[2] + ' // Added suffix in line 2;',
        ].join('\n')
        console.log('Generated diff:', diff)
        return diff
    }

    /**
     * Calculates the original file range from a unified diff with line and column pairs
     * @param diffText The unified diff text
     * @returns The range for the original file with line and column pairs
     */
    private calculateOriginalDiffRange(diffText: string, document: TextDocument): Range {
        // Extract the range information from the header
        const headerMatch = diffText.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/)

        if (!headerMatch) {
            throw new Error('Invalid diff format')
        }

        const startLine = parseInt(headerMatch[1], 10)
        const lineCount = parseInt(headerMatch[2], 10)
        const endLine = startLine + lineCount - 1

        // Use VSCode's Position.CHARACTER_LIMIT for the end column
        return new Range(new Position(startLine - 1, 0), new Position(endLine, 0))
    }

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

            const lspRequest = {
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

            const response = (await Promise.race([
                this.languageClient.sendRequest('aws/textDocument/inlineCompletionWithReferences', lspRequest, token),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('LSP Server did not response in 5s')), 5000)
                ),
            ])) as InlineCompletionListWithReferences

            console.debug('LSP Response:', JSON.stringify(response, null, 2))

            if (response.items.length == 0) {
                console.log('Returning early')
                return []
            }
            const diff: string = response.items[0].insertText.toString()
            console.log()
            const diffRange: Range = this.calculateOriginalDiffRange(diff, document)

            if (!document.validateRange(diffRange)) {
                // throw error and raise exception
                throw new Error('Invalid range')
            }

            const updatedText = applyPatch(document.getText(diffRange), diff)

            if (!updatedText) {
                console.log('No updated content')
                this.languageClient.info(`Client: Received empty suggestions`)
                return []
            }

            const completionsList = [new InlineCompletionItem(updatedText, diffRange)]
            completionsList.forEach((item: InlineCompletionItem) => {
                // eslint-disable-next-line no-extra-semi
                ;(item as any).isInlineEdit = true
                ;(item as any).showInlineEditMenu = true
            })

            console.log('Completions list' + completionsList)

            return { items: completionsList } as InlineCompletionList
        } catch (error) {
            console.error('Stack trace:', (error as Error).stack)
            return { items: [] }
        }
    }
}
