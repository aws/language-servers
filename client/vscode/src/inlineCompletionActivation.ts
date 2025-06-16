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
import * as DiffMatchPatch from 'diff-match-patch'

/**
 * Apply a unified diff to a document text
 * This function uses diff-match-patch for more robust patch application
 */
function applyUnifiedDiff(docText: string, unifiedDiff: string): string {
    try {
        // First try the standard diff package
        try {
            const result = applyPatch(docText, unifiedDiff)
            if (result !== false) {
                return result
            }
            console.log('DEBUG-NEP: Standard diff package returned false, trying diff-match-patch')
        } catch (error) {
            console.log('DEBUG-NEP: Standard diff package failed, trying diff-match-patch')
        }

        // If that fails, use diff-match-patch which is more robust
        const dmp = new DiffMatchPatch.diff_match_patch()

        // Parse the unified diff to extract the changes
        const diffLines = unifiedDiff.split('\n')
        let result = docText

        // Find all hunks in the diff
        const hunkStarts = diffLines
            .map((line, index) => (line.startsWith('@@ ') ? index : -1))
            .filter(index => index !== -1)

        // Process each hunk
        for (const hunkStart of hunkStarts) {
            // Parse the hunk header
            const hunkHeader = diffLines[hunkStart]
            const match = hunkHeader.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/)

            if (!match) {
                console.error('DEBUG-NEP: Invalid hunk header:', hunkHeader)
                continue
            }

            const oldStart = parseInt(match[1])
            const oldLines = parseInt(match[2])
            const newStart = parseInt(match[3])
            const newLines = parseInt(match[4])

            // Extract the content lines for this hunk
            let i = hunkStart + 1
            const contentLines = []
            while (i < diffLines.length && !diffLines[i].startsWith('@@')) {
                contentLines.push(diffLines[i])
                i++
            }

            // Build the old and new text
            let oldText = ''
            let newText = ''

            for (const line of contentLines) {
                if (line.startsWith('-')) {
                    oldText += line.substring(1) + '\n'
                } else if (line.startsWith('+')) {
                    newText += line.substring(1) + '\n'
                } else if (line.startsWith(' ')) {
                    oldText += line.substring(1) + '\n'
                    newText += line.substring(1) + '\n'
                }
            }

            // Remove trailing newline if it was added
            oldText = oldText.replace(/\n$/, '')
            newText = newText.replace(/\n$/, '')

            // Find the text to replace in the document
            const docLines = docText.split('\n')
            const startLine = oldStart - 1 // Convert to 0-based
            const endLine = startLine + oldLines

            // Extract the text that should be replaced
            const textToReplace = docLines.slice(startLine, endLine).join('\n')

            // Replace the text
            result = result.replace(textToReplace, newText)
        }

        return result
    } catch (error) {
        console.error('DEBUG-NEP: Error applying unified diff:', error)
        return docText // Return original text if all methods fail
    }
}

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
    { scheme: 'file', language: 'c' },
    { scheme: 'file', language: 'cpp' },
    { scheme: 'file', language: 'python' },
    { scheme: 'file', language: 'sql' },
    { scheme: 'file', language: 'jsx' },
    { scheme: 'file', language: 'tsx' },
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
            return null
        }

        try {
            // Request inline completions from the language server
            const result = (await this.languageClient.sendRequest(
                inlineCompletionWithReferencesRequestType.method,
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
                return null
            }

            console.log(`DEBUG-NEP: Received ${result.items.length} completions`)

            // Convert server response to VSCode inline completion items
            const items = result.items
                .map((item: any, index: number) => {
                    // TODO-NEP: The server response structure is inconsistent. We need to handle multiple property names:
                    // 1. text - Standard property for inline completions
                    // 2. edit.content - Used for edit suggestions in udiff format
                    // 3. insertText - Used by some server implementations (unexpected but observed in logs)
                    // This should be standardized in the server implementation to use consistent property names.

                    // Handle all possible text content properties
                    let text = item.text || ''

                    // Check for edit.content (used for udiff format)
                    if (!text && item.edit && item.edit.content) {
                        text = item.edit.content
                    }

                    // Check for insertText (unexpected but observed in logs)
                    if (!text && item.insertText) {
                        text = item.insertText
                    }

                    if (!text) {
                        console.error(`DEBUG-NEP: No text content found for item ${index}`)
                        return null // Skip items with no text
                    }

                    let range = item.range

                    // Check if the content is in udiff format or contains a udiff
                    const containsUdiff =
                        text.includes('--- file:///') && text.includes('+++ file:///') && text.includes('@@ ')

                    if (containsUdiff) {
                        try {
                            // Extract just the diff part if the text contains both original content and diff
                            const diffStartIndex = text.indexOf('--- file:///')
                            if (diffStartIndex > 0) {
                                // Extract just the diff part
                                text = text.substring(diffStartIndex)
                            }

                            // Apply the patch using our robust function
                            const documentText = document.getText()
                            const patchedText = applyUnifiedDiff(documentText, text)

                            // Calculate the range for the entire document
                            const fullDocRange = new Range(
                                0,
                                0,
                                document.lineCount - 1,
                                document.lineAt(document.lineCount - 1).text.length
                            )

                            // Use the patched text and full document range
                            text = patchedText
                            range = fullDocRange
                        } catch (error) {
                            console.error('DEBUG-NEP: Error applying udiff patch:', error)
                            // Fall back to using the original text if patch application fails
                        }
                    }

                    if (!text) {
                        return null // Skip items with no text after processing
                    }

                    const inlineItem = new InlineCompletionItem(text)

                    // Set range if provided
                    if (range) {
                        inlineItem.range = new Range(
                            range.start.line,
                            range.start.character,
                            range.end.line,
                            range.end.character
                        )
                    }

                    // Set command for acceptance tracking
                    inlineItem.command = {
                        title: 'Accept Completion',
                        command: 'aws.sample-vscode-ext-amazonq.accept',
                        arguments: [result.sessionId, item.itemId, Date.now()],
                    }

                    // Set isInlineEdit flag if this is an edit suggestion
                    const isEditSuggestion = item.isInlineEdit || (item.edit && item.edit.content)
                    if (isEditSuggestion) {
                        console.log(`DEBUG-NEP: Setting isInlineEdit=true for item ${index}`)
                        ;(inlineItem as any).isInlineEdit = true
                    }

                    return inlineItem
                })
                .filter(item => item !== null) // Filter out null items

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

        try {
            // Use our existing provider instead of creating a new one
            await commands.executeCommand('editor.action.inlineSuggest.trigger')
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
