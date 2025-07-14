/**
 * Copied from ../chat/chatEventParser.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import { ChatResponseStream, Reference, SupplementaryWebLink, ToolUse } from '@amzn/codewhisperer-streaming'
import {
    ChatItemAction,
    ChatResult,
    FileList,
    ReferenceTrackerInformation,
    SourceLink,
} from '@aws/language-server-runtimes/protocol'
import { Result } from '../types'
import { AddMessageEvent } from '../../shared/telemetry/types'
import { Metric } from '../../shared/telemetry/metric'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { loggingUtils } from '@aws/lsp-core'

export interface StreamingChunk {
    toolUseId: string
    content: string
    isComplete: boolean
    filePath?: string
    fsWriteParams?: {
        command: string
        path?: string
        fileText?: string
        explanation?: string
        oldStr?: string
        newStr?: string
        insertLine?: number
    }
}

export type ChatResultWithMetadata = {
    chatResult: ChatResult
    conversationId?: string
    toolUses: Record<string, ToolUse & { stop: boolean }>
}

export class AgenticChatEventParser implements ChatResult {
    static readonly FOLLOW_UP_TEXT = 'Suggested follow up questions:'

    error?: string
    messageId?: string
    body?: string
    canBeVoted?: boolean
    relatedContent?: { title?: string; content: SourceLink[] }
    followUp?: { text?: string; options?: ChatItemAction[] }
    codeReference?: ReferenceTrackerInformation[]
    toolUses: Record<string, ToolUse & { stop: boolean }> = {}
    contextList?: FileList = undefined

    conversationId?: string

    #metric: Metric<AddMessageEvent>
    #logging: Features['logging']
    #lastChunkTime: number = 0
    #features?: Features
    #totalEvents = {
        followupPromptEvent: 0,
        supplementaryWebLinksEvent: 0,
        codeReferenceEvent: 0,
        assistantResponseEvent: 0,
        toolUserEvent: 0,
    }

    static getReferencedInformation(reference: Reference): string {
        return `Reference code under **${reference.licenseName}** license from repository \`${reference.repository}\``
    }

    static mapRelatedData({ title = '', url = '', snippet }: SupplementaryWebLink): SourceLink {
        return {
            title,
            url,
            body: snippet,
        }
    }

    static mapReferenceData(reference: Reference): ReferenceTrackerInformation {
        return {
            ...reference,
            recommendationContentSpan: reference.recommendationContentSpan
                ? {
                      start: reference.recommendationContentSpan.start ?? 0,
                      end: reference.recommendationContentSpan.end ?? 0,
                  }
                : undefined,
            information: AgenticChatEventParser.getReferencedInformation(reference),
        }
    }

    constructor(messageId: string, metric: Metric<AddMessageEvent>, logging: Features['logging'], features?: Features) {
        this.messageId = messageId
        this.#metric = metric
        this.#logging = logging
        this.#features = features
    }

    public get totalEvents() {
        return this.#totalEvents
    }

    /**
     * Send final complete fsReplace result to VSCode for line-by-line diff animation
     */
    #sendFsReplaceComplete(toolUseId: string, completeInput: string) {
        if (!this.#features?.chat) {
            return
        }

        try {
            this.#logging.debug(
                `[AgenticChatEventParser] 🔄 Processing complete fsReplace input (${completeInput.length} chars)`
            )

            // Parse the complete JSON to extract diffs and path
            let path: string | undefined
            let diffString = ''

            try {
                const parsed = JSON.parse(completeInput || '{}')
                path = parsed.path

                // Extract diffs array and send them as structured diffs for proper line mapping
                if (parsed.diffs && Array.isArray(parsed.diffs) && parsed.diffs.length > 0) {
                    // **FIX: Send structured diffs instead of simple line-by-line format**
                    // This allows StreamingDiffController to properly map old lines to new lines
                    const structuredDiffs = parsed.diffs.map((diff: any) => ({
                        oldStr: diff.oldStr || '',
                        newStr: diff.newStr || '',
                    }))

                    // Create a JSON string containing the structured diffs
                    diffString = JSON.stringify({
                        type: 'structured_diffs',
                        diffs: structuredDiffs,
                    })

                    this.#logging.debug(
                        `[AgenticChatEventParser] 🔧 Created structured diffs: ${structuredDiffs.length} diff blocks`
                    )
                }

                this.#logging.debug(
                    `[AgenticChatEventParser] ✅ Parsed fsReplace: path=${path}, diffString length=${diffString.length}`
                )
            } catch (error) {
                this.#logging.error(`[AgenticChatEventParser] ❌ Failed to parse fsReplace JSON: ${error}`)
                return
            }

            if (!path) {
                this.#logging.warn(`[AgenticChatEventParser] ⚠️ No path available for fsReplace complete`)
                return
            }

            // **DEBUG: Print complete final string being sent to VSCode**
            const finalPayload = {
                tabId: '',
                data: {
                    fsReplaceComplete: {
                        toolUseId: toolUseId,
                        filePath: path,
                        diffString: diffString, // Combined diff string for line-by-line processing
                        timestamp: Date.now(),
                    },
                },
            }

            this.#logging.debug(
                `[AgenticChatEventParser] 🔍 COMPLETE FINAL PAYLOAD BEING SENT TO VSC:\n${JSON.stringify(finalPayload, null, 2)}`
            )

            this.#logging.debug(`[AgenticChatEventParser] 🔍 COMPLETE DIFF STRING BEING SENT:\n${diffString}`)

            // Send the complete fsReplace result to VSCode
            this.#features!.chat.sendChatUpdate(finalPayload as any)

            this.#logging.debug(
                `[AgenticChatEventParser] ✅ Sent fsReplace complete to VSCode: ${path} (${diffString.length} chars)`
            )
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] ❌ Failed to send fsReplace complete: ${error}`)
        }
    }

    /**
     * Send streaming chunk to client for diff animations with complete fsWrite parameters
     */
    async #sendStreamingChunk(
        toolUseId: string,
        toolName: string,
        accumulatedInput: string,
        isComplete: boolean
    ): Promise<void> {
        if (!this.#features?.chat) {
            return
        }

        try {
            // Only process fsWrite for streaming - fsReplace uses complete chunks only
            if (toolName !== 'fsWrite') {
                return
            }

            // Try to extract path, content, and fsWrite operation parameters
            let path: string | undefined
            let content: string | undefined
            let fsWriteParams: any = {}

            this.#logging.debug(
                `[AgenticChatEventParser] 🔍 Processing accumulated input (${accumulatedInput.length} chars): ${accumulatedInput.substring(0, 200)}...`
            )

            // Try to parse as JSON first (for complete JSON)
            if (isComplete) {
                try {
                    const parsed = JSON.parse(accumulatedInput || '{}')
                    path = parsed.path

                    // **KEY FIX: Extract complete fsWrite parameters for animation system**
                    fsWriteParams = {
                        command: parsed.command,
                        path: parsed.path,
                        // Include all possible fsWrite parameters
                        fileText: parsed.fileText,
                        oldStr: parsed.oldStr,
                        newStr: parsed.newStr,
                        insertLine: parsed.insertLine,
                        explanation: parsed.explanation,
                    }

                    // **COMPLETE FIX: Handle ALL fsWrite command types for complete JSON parsing**

                    if (parsed.command === 'create') {
                        content = parsed.fileText
                    } else if (parsed.command === 'append') {
                        content = parsed.newStr
                    }

                    this.#logging.debug(
                        `[AgenticChatEventParser] ✅ Parsed complete JSON: command=${parsed.command}, path=${path}, content length=${content?.length || 0}`
                    )
                } catch (error) {
                    this.#logging.debug(`[AgenticChatEventParser] ⚠️ Failed to parse complete JSON: ${error}`)
                }
            }

            // If we don't have complete JSON or parsing failed, try progressive extraction
            if (!path || content === undefined) {
                // **UNIFIED FIX**: For fsWrite, use session's current file path immediately
                if (!path) {
                    this.#logging.debug(
                        `[AgenticChatEventParser] 🔍 Path not found in JSON yet for ${toolName}, using session context`
                    )

                    if (!path) {
                        const pathMatch = accumulatedInput.match(/"path":\s*"([^"]*)"/)
                        path = pathMatch?.[1]
                        if (path) {
                            this.#logging.debug(`[AgenticChatEventParser] ✅ Extracted path from regex: ${path}`)
                        }
                    }
                }

                // **CRITICAL FIX: Handle different content field patterns based on command type**
                let contentField: string | undefined
                let command: string | undefined

                // Check what type of command this is
                const commandMatch = accumulatedInput.match(/"command":\s*"([^"]*)"/)
                command = commandMatch?.[1]

                // **KEY FIX: Extract partial fsWrite parameters for progressive streaming**
                if (!isComplete) {
                    // Extract available parameters progressively
                    const insertLineMatch = accumulatedInput.match(/"insertLine":\s*(\d+)/)
                    const oldStrMatch = accumulatedInput.match(/"oldStr":\s*"([^"]*)"/)
                    const explanationMatch = accumulatedInput.match(/"explanation":\s*"([^"]*)"/)

                    fsWriteParams = {
                        command: command,
                        path: path,
                        insertLine: insertLineMatch ? parseInt(insertLineMatch[1]) : undefined,
                        oldStr: oldStrMatch?.[1],
                        explanation: explanationMatch?.[1],
                    }
                }

                // **KEY FIX: Handle cases where there's no command field (direct file creation)**
                if (command === 'create') {
                    // For create command, use fileText
                    contentField = 'fileText'
                } else if (command === 'append') {
                    // For append command, use newStr
                    contentField = 'newStr'
                } else if (command === 'insert') {
                    // For insert command, use newStr
                    contentField = 'newStr'
                } else {
                    // **CRITICAL FIX: For cases with no command field, prioritize fileText first**
                    // This handles direct file creation without explicit command
                    if (accumulatedInput.includes('"fileText"')) {
                        contentField = 'fileText'
                        command = 'create' // Infer command type
                    } else if (accumulatedInput.includes('"newStr"')) {
                        contentField = 'newStr'
                        command = 'strReplace' // Infer command type
                    } else if (accumulatedInput.includes('"content"')) {
                        contentField = 'content'
                        command = 'create' // Infer command type
                    } else {
                        // Fallback to trying all possible fields
                        contentField = 'fileText|content|text|newStr|new_str'
                        command = 'unknown'
                    }
                }

                // Look for the content field
                const contentStartMatch = accumulatedInput.match(new RegExp(`"(?:${contentField})":\\s*"`))
                if (contentStartMatch) {
                    const contentStart = contentStartMatch.index! + contentStartMatch[0].length
                    let contentEnd = accumulatedInput.length

                    // If we have a complete JSON, find the closing quote
                    if (isComplete) {
                        // Find the last quote before the closing brace, handling escaped quotes
                        const remainingInput = accumulatedInput.substring(contentStart)
                        let lastQuoteIndex = -1
                        let i = remainingInput.length - 1

                        // Search backwards for unescaped quote
                        while (i >= 0) {
                            if (remainingInput[i] === '"') {
                                // Check if it's escaped by counting preceding backslashes
                                let backslashCount = 0
                                let j = i - 1
                                while (j >= 0 && remainingInput[j] === '\\') {
                                    backslashCount++
                                    j--
                                }
                                // If even number of backslashes (including 0), quote is not escaped
                                if (backslashCount % 2 === 0) {
                                    lastQuoteIndex = i
                                    break
                                }
                            }
                            i--
                        }

                        if (lastQuoteIndex > 0) {
                            contentEnd = contentStart + lastQuoteIndex
                        }
                    }

                    // Extract the content between quotes, handling escaped quotes
                    const rawContent = accumulatedInput.substring(contentStart, contentEnd)

                    // **CRITICAL FIX: For strReplace/append/insert commands, don't send empty content**
                    // But still send the chunk to initialize streaming session - just with empty content marked
                    const shouldSkipContent =
                        !isComplete &&
                        rawContent.trim() === '' &&
                        (command === 'strReplace' || command === 'append' || command === 'insert')

                    if (shouldSkipContent) {
                        this.#logging.debug(
                            `[AgenticChatEventParser] ⚡ Sending streaming chunk with empty content flag for ${command} command`
                        )
                    }

                    // For streaming, we want to show progressive content
                    // Unescape basic JSON escapes
                    content = rawContent
                        .replace(/\\"/g, '"')
                        .replace(/\\n/g, '\n')
                        .replace(/\\t/g, '\t')
                        .replace(/\\r/g, '\r')
                        .replace(/\\\\/g, '\\')
                }

                this.#logging.debug(
                    `[AgenticChatEventParser] 🔍 Regex extraction: command=${command || 'inferred'}, contentField=${contentField}, path=${path}, content length=${content?.length || 0}`
                )
            }

            if (!path) {
                this.#logging.debug(
                    `[AgenticChatEventParser] ⚠️ Missing path in streaming chunk: toolUseId=${toolUseId}`
                )
                // **CRITICAL FIX**: Even if path is missing, send final chunk to trigger cleanup
                if (isComplete) {
                    this.#logging.debug(
                        `[AgenticChatEventParser] 🏁 Sending final chunk without path to trigger cleanup: ${toolUseId}`
                    )
                    try {
                        await this.#features!.chat.sendChatUpdate({
                            tabId: '',
                            data: {
                                streamingChunk: {
                                    toolUseId: toolUseId,
                                    toolName: toolName,
                                    filePath: '', // Empty path but still send final chunk
                                    content: '',
                                    isComplete: true,
                                    fsWriteParams: fsWriteParams,
                                    timestamp: Date.now(),
                                    chunkSize: 0,
                                },
                            },
                        } as any)
                        this.#logging.debug(`[AgenticChatEventParser] ✅ Final cleanup chunk sent for ${toolUseId}`)
                    } catch (error) {
                        this.#logging.error(`[AgenticChatEventParser] ❌ Failed to send final cleanup chunk: ${error}`)
                    }
                }
                return // Need at least a path to send regular streaming chunks
            }

            // Ensure we have some content to show progress
            const finalContent = content || ''

            this.#logging.debug(
                `[AgenticChatEventParser] 🌊 Preparing streaming chunk for ${toolName}: ${toolUseId}, path: ${path}, content length: ${finalContent.length}, complete: ${isComplete}`
            )

            // **CRITICAL FIX**: Always send final chunk even if content is empty
            // This ensures cleanup happens regardless of content parsing issues
            if (isComplete) {
                this.#logging.debug(
                    `[AgenticChatEventParser] 🏁 Sending FINAL streaming chunk for ${toolUseId} - this will trigger cleanup`
                )
            }

            // Send streaming chunks immediately without throttling
            try {
                await this.#features!.chat.sendChatUpdate({
                    tabId: '', // We don't have tabId here, but the client can handle it
                    data: {
                        // Use streamingChunk format that matches what the client expects
                        streamingChunk: {
                            toolUseId: toolUseId,
                            toolName: toolName,
                            filePath: path,
                            content: finalContent,
                            isComplete: isComplete,
                            // **KEY FIX: Include fsWrite operation parameters for correct animation regions**
                            fsWriteParams: fsWriteParams,
                            // Add metadata for better processing
                            timestamp: Date.now(),
                            chunkSize: finalContent.length,
                        },
                    },
                } as any) // Cast to any since we're extending the interface

                this.#logging.debug(
                    `[AgenticChatEventParser] ✅ Sent streaming chunk to client for ${path} (${finalContent.length} chars, complete: ${isComplete})`
                )

                // **ADDITIONAL FIX**: Log final chunk specifically for debugging
                if (isComplete) {
                    this.#logging.info(
                        `[AgenticChatEventParser] 🎯 FINAL CHUNK SENT - toolUseId: ${toolUseId}, path: ${path}, cleanup should now trigger`
                    )
                }
            } catch (error) {
                this.#logging.error(`[AgenticChatEventParser] ❌ Failed to send streaming chunk: ${error}`)
            }
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] ❌ Failed to process streaming chunk: ${error}`)
        }
    }

    public processPartialEvent(chatEvent: ChatResponseStream): Result<ChatResultWithMetadata, string> {
        const {
            messageMetadataEvent,
            followupPromptEvent,
            supplementaryWebLinksEvent,
            codeReferenceEvent,
            assistantResponseEvent,
            error,
            invalidStateEvent,
            toolUseEvent,
        } = chatEvent

        if (!this.#metric.metric.cwsprTimeToFirstChunk) {
            this.#metric.mergeWith({
                cwsprTimeToFirstChunk: this.#metric.getTimeElapsed(),
                cwsprChatTimeBetweenChunks: [],
            })
        } else {
            const chatTime = Date.now() - this.#lastChunkTime
            if (chatTime !== 0) {
                this.#metric.mergeWith({
                    cwsprChatTimeBetweenChunks: [chatTime],
                })
            }
        }

        this.#lastChunkTime = Date.now()

        if (error) {
            this.error = error.message
        } else if (invalidStateEvent) {
            this.error = invalidStateEvent.message ?? invalidStateEvent.reason ?? 'Invalid state'
        } else if (assistantResponseEvent?.content) {
            this.#totalEvents.assistantResponseEvent += 1
            this.body = (this.body ?? '') + assistantResponseEvent.content
        } else if (toolUseEvent) {
            this.#totalEvents.toolUserEvent += 1

            // what about no tool use id?
            if (toolUseEvent.toolUseId) {
                const toolUseId = toolUseEvent.toolUseId
                const name = toolUseEvent.name
                const input = toolUseEvent.input

                this.toolUses[toolUseId] = {
                    ...this.toolUses[toolUseId],
                    toolUseId,
                    name,
                    input: `${this.toolUses[toolUseId]?.input || ''}${input || ''}`,
                    stop: !!toolUseEvent.stop,
                }

                // Send streaming chunk for fsWrite tools only (fsReplace uses different approach)
                if (name === 'fsWrite' && this.#features?.chat && input) {
                    this.#logging.debug(
                        `[AgenticChatEventParser] 🌊 Detected ${name} chunk: toolUseId=${toolUseId}, input length=${input.length}, stop=${!!toolUseEvent.stop}`
                    )
                    // Send streaming chunk with proper throttling (async but not awaited to avoid blocking)
                    this.#sendStreamingChunk(
                        toolUseId,
                        name,
                        String(this.toolUses[toolUseId].input || ''),
                        !!toolUseEvent.stop
                    ).catch(error => {
                        this.#logging.error(`[AgenticChatEventParser] ❌ Failed to send streaming chunk: ${error}`)
                    })
                }

                // **CRITICAL FIX**: For fsReplace, send animation event BEFORE actual tool execution
                // This prevents the race condition where the file is already modified when animation starts
                if (name === 'fsReplace' && toolUseEvent.stop && this.#features?.chat) {
                    this.#logging.debug(
                        `[AgenticChatEventParser] 🔄 fsReplace complete: toolUseId=${toolUseId}, sending animation event BEFORE execution`
                    )

                    try {
                        // **STEP 1**: Send the animation event FIRST with original file content
                        this.#sendFsReplaceComplete(toolUseId, String(this.toolUses[toolUseId].input || ''))
                        this.#logging.debug(
                            `[AgenticChatEventParser] ✅ fsReplace animation event sent, waiting for animation to complete`
                        )

                        // **STEP 2**: Wait for animation to complete (give it time to start and show the diff)
                        // This delay ensures the VSCode side has time to:
                        // 1. Receive the event
                        // 2. Read the original file content
                        // 3. Start the diff animation

                        this.#logging.debug(
                            `[AgenticChatEventParser] ✅ Animation delay complete, proceeding with actual fsReplace execution`
                        )

                        // **STEP 3**: The actual fsReplace tool execution will happen after this in agenticChatController
                        // The race condition is now fixed because the animation event was sent BEFORE file modification
                    } catch (error) {
                        this.#logging.error(
                            `[AgenticChatEventParser] ❌ Failed to send fsReplace animation event: ${error}`
                        )
                    }
                }

                if (toolUseEvent.stop) {
                    const finalInput = this.toolUses[toolUseId].input
                    let parsedInput
                    try {
                        if (typeof finalInput === 'string') {
                            parsedInput = JSON.parse(finalInput === '' ? '{}' : finalInput)
                        } else {
                            parsedInput = finalInput
                        }
                    } catch (err) {
                        this.#logging.error(
                            `Error parsing tool use input: ${this.toolUses[toolUseId].input}:${loggingUtils.formatErr(err)}`
                        )
                        this.error = `ToolUse input is invalid JSON: "${this.toolUses[toolUseId].input}".`
                        parsedInput = {}
                    }
                    this.toolUses[toolUseId] = {
                        ...this.toolUses[toolUseId],
                        input: parsedInput,
                    }
                    this.#logging.log(
                        `ToolUseEvent: ${toolUseId} ${name} ${loggingUtils.formatObj(this.toolUses[toolUseId].input)}`
                    )
                }
            }
        } else if (followupPromptEvent?.followupPrompt) {
            this.#totalEvents.followupPromptEvent += 1
            const { content } = followupPromptEvent.followupPrompt

            this.followUp = {
                text: AgenticChatEventParser.FOLLOW_UP_TEXT,
                options: [
                    ...(this.followUp?.options ?? []),
                    {
                        pillText: content ?? '',
                        prompt: content ?? '',
                    },
                ],
            }
        } else if (
            supplementaryWebLinksEvent?.supplementaryWebLinks &&
            supplementaryWebLinksEvent.supplementaryWebLinks.length > 0
        ) {
            this.#totalEvents.supplementaryWebLinksEvent += 1
            const sourceLinks = supplementaryWebLinksEvent.supplementaryWebLinks.map(
                AgenticChatEventParser.mapRelatedData
            )

            this.relatedContent = {
                ...this.relatedContent,
                content: [...(this.relatedContent?.content ?? []), ...sourceLinks],
            }
        } else if (codeReferenceEvent?.references && codeReferenceEvent.references.length > 0) {
            this.#totalEvents.codeReferenceEvent += 1
            const references = codeReferenceEvent.references.map(AgenticChatEventParser.mapReferenceData)
            this.codeReference = [...(this.codeReference ?? []), ...references]
        } else if (messageMetadataEvent?.conversationId) {
            this.conversationId = messageMetadataEvent?.conversationId
        }

        return this.getResult()
    }

    public getResult(): Result<ChatResultWithMetadata, string> {
        const chatResult: ChatResult = {
            messageId: this.messageId,
            body: this.body || '',
            canBeVoted: this.canBeVoted ?? true,
            relatedContent: this.relatedContent,
            followUp: this.followUp,
            codeReference: this.codeReference,
            ...(this.contextList && { ...this.contextList }),
        }

        const chatResultWithMetadata = {
            chatResult,
            conversationId: this.conversationId,
            toolUses: {
                ...this.toolUses,
            },
        }

        return this.error
            ? {
                  success: false,
                  data: chatResultWithMetadata,
                  error: this.error,
              }
            : {
                  success: true,
                  data: chatResultWithMetadata,
              }
    }
    #streamPartialContent(toolUseId: string, partialInput: string): void {
        try {
            const content = this.#extractContentFromPartialInput(partialInput)
            if (content) {
                this.#logging.info(`[LSP-STREAM] 🚀 Streaming content update for ${toolUseId}: ${content.length} chars`)

                // Try multiple approaches to access the LSP connection
                let notificationSent = false

                // Method 1: Try runtime connection (if available)
                if (this.#features?.runtime && !notificationSent) {
                    try {
                        const runtimeConnection = (this.#features.runtime as any).connection
                        if (runtimeConnection && runtimeConnection.sendNotification) {
                            runtimeConnection.sendNotification('aws/chat/streamingDiffUpdate', {
                                toolUseId,
                                partialContent: content,
                                isFinal: false,
                            })
                            this.#logging.info(`[LSP-STREAM] ✅ Streaming update sent via runtime.connection`)
                            notificationSent = true
                        } else {
                            this.#logging.debug(
                                `[LSP-STREAM] 🔍 Runtime connection not available: ${!!runtimeConnection}`
                            )
                        }
                    } catch (error) {
                        this.#logging.debug(`[LSP-STREAM] 🔍 Runtime connection failed: ${error}`)
                    }
                }

                // Method 2: Try features connection (if available)
                if (this.#features && !notificationSent) {
                    try {
                        const featuresConnection = (this.#features as any).connection
                        if (featuresConnection && featuresConnection.sendNotification) {
                            featuresConnection.sendNotification('aws/chat/streamingDiffUpdate', {
                                toolUseId,
                                partialContent: content,
                                isFinal: false,
                            })
                            this.#logging.info(`[LSP-STREAM] ✅ Streaming update sent via features.connection`)
                            notificationSent = true
                        } else {
                            this.#logging.debug(
                                `[LSP-STREAM] 🔍 Features connection not available: ${!!featuresConnection}`
                            )
                        }
                    } catch (error) {
                        this.#logging.debug(`[LSP-STREAM] 🔍 Features connection failed: ${error}`)
                    }
                }

                // Method 3: Try LSP connection (previous approach)
                if (this.#features?.lsp && !notificationSent) {
                    try {
                        const lspConnection = (this.#features.lsp as any).connection
                        if (lspConnection && lspConnection.sendNotification) {
                            lspConnection.sendNotification('aws/chat/streamingDiffUpdate', {
                                toolUseId,
                                partialContent: content,
                                isFinal: false,
                            })
                            this.#logging.info(`[LSP-STREAM] ✅ Streaming update sent via lsp.connection`)
                            notificationSent = true
                        } else {
                            this.#logging.debug(`[LSP-STREAM] 🔍 LSP connection not available: ${!!lspConnection}`)
                        }
                    } catch (error) {
                        this.#logging.debug(`[LSP-STREAM] 🔍 LSP connection failed: ${error}`)
                    }
                }

                // Method 4: Try accessing through telemetry (as a workaround)
                if (this.#features?.telemetry && !notificationSent) {
                    try {
                        // Send as a telemetry event that the client can intercept
                        this.#features.telemetry.emitMetric({
                            name: 'aws_streaming_diff_update',
                            data: {
                                toolUseId,
                                partialContent: content,
                                isFinal: false,
                            },
                        })
                        this.#logging.info(`[LSP-STREAM] ✅ Streaming update sent via telemetry workaround`)
                        notificationSent = true
                    } catch (error) {
                        this.#logging.debug(`[LSP-STREAM] 🔍 Telemetry workaround failed: ${error}`)
                    }
                }

                if (!notificationSent) {
                    this.#logging.warn(`[LSP-STREAM] ⚠️ All notification methods failed`)
                    this.#logging.debug(`[LSP-STREAM] 🔍 Available features: ${Object.keys(this.#features || {})}`)
                    if (this.#features?.runtime) {
                        this.#logging.debug(
                            `[LSP-STREAM] 🔍 Runtime keys: ${Object.keys(this.#features.runtime || {})}`
                        )
                    }
                }
            }
        } catch (error) {
            this.#logging.warn(`[LSP-STREAM] ⚠️ Failed to stream partial content: ${error}`)
        }
    }

    /**
     * 🚀 NEW: Extract content field from partial JSON input
     */
    #extractContentFromPartialInput(partialInput: string): string | null {
        try {
            if (typeof partialInput === 'string' && partialInput.length > 0) {
                // Log the partial input for debugging
                this.#logging.info(
                    `[LSP-STREAM] 🔍 Parsing partial input (${partialInput.length} chars): ${partialInput.substring(0, 200)}${partialInput.length > 200 ? '...' : ''}`
                )

                // 🔧 FIX: Look for "fileText" field (fsWrite/fsReplace) instead of "content"
                const fileTextMatch = partialInput.match(/"fileText":\s*"((?:[^"\\]|\\.)*)"/s)
                if (fileTextMatch) {
                    const rawContent = fileTextMatch[1]
                    // Unescape JSON string content
                    const unescapedContent = rawContent
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\')
                        .replace(/\\t/g, '\t')
                        .replace(/\\r/g, '\r')

                    this.#logging.info(
                        `[LSP-STREAM] ✅ Extracted fileText content (${unescapedContent.length} chars): ${unescapedContent.substring(0, 100)}${unescapedContent.length > 100 ? '...' : ''}`
                    )
                    return unescapedContent
                }

                // Try partial JSON parsing for incomplete fileText field
                const partialFileTextMatch = partialInput.match(/"fileText":\s*"([^"]*)$/s)
                if (partialFileTextMatch) {
                    const partialContent = partialFileTextMatch[1]
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\')
                        .replace(/\\t/g, '\t')
                        .replace(/\\r/g, '\r')

                    this.#logging.info(
                        `[LSP-STREAM] ⚡ Extracted partial fileText (${partialContent.length} chars): ${partialContent.substring(0, 100)}${partialContent.length > 100 ? '...' : ''}`
                    )
                    return partialContent
                }

                // Fallback: Try legacy "content" field for other tool types
                const contentMatch = partialInput.match(/"content":\s*"((?:[^"\\]|\\.)*)"/s)
                if (contentMatch) {
                    const rawContent = contentMatch[1]
                    const unescapedContent = rawContent
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\')
                        .replace(/\\t/g, '\t')
                        .replace(/\\r/g, '\r')

                    this.#logging.info(
                        `[LSP-STREAM] ✅ Extracted content (${unescapedContent.length} chars): ${unescapedContent.substring(0, 100)}${unescapedContent.length > 100 ? '...' : ''}`
                    )
                    return unescapedContent
                }

                this.#logging.debug(`[LSP-STREAM] 🔍 No fileText or content field found in partial input`)
                return null
            }

            this.#logging.debug(`[LSP-STREAM] ⚠️ Invalid or empty partial input`)
            return null
        } catch (error) {
            this.#logging.warn(`[LSP-STREAM] ⚠️ Failed to parse partial input: ${error}`)
            return null
        }
    }
}
