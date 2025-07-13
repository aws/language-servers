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
    #totalEvents = {
        followupPromptEvent: 0,
        supplementaryWebLinksEvent: 0,
        codeReferenceEvent: 0,
        assistantResponseEvent: 0,
        toolUserEvent: 0,
    }
    #features?: Features

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
                    if (parsed.command === 'strReplace') {
                        content = parsed.newStr
                    } else if (parsed.command === 'str_replace_editor') {
                        content = parsed.new_str
                    } else if (parsed.command === 'create') {
                        content = parsed.fileText
                    } else if (parsed.command === 'append') {
                        content = parsed.newStr
                    } else if (parsed.command === 'insert') {
                        content = parsed.newStr
                    } else {
                        // For direct file creation without command field or unknown commands
                        content = parsed.fileText || parsed.content || parsed.text || parsed.newStr || parsed.new_str
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
                // Extract path using regex
                const pathMatch = accumulatedInput.match(/"path":\s*"([^"]*)"/)
                path = pathMatch?.[1]

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
                if (command === 'strReplace') {
                    // For strReplace, use newStr as the content to show
                    contentField = 'newStr'
                } else if (command === 'str_replace_editor') {
                    // For str_replace_editor, use new_str as the content
                    contentField = 'new_str'
                } else if (command === 'create') {
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
                return // Need at least a path to send streaming chunk
            }

            // Ensure we have some content to show progress
            const finalContent = content || ''

            this.#logging.debug(
                `[AgenticChatEventParser] 🌊 Preparing streaming chunk for ${toolName}: ${toolUseId}, path: ${path}, content length: ${finalContent.length}, complete: ${isComplete}`
            )

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

                // Send streaming chunk for fsWrite tools (before final parsing)
                if (name === 'fsWrite' && this.#features?.chat && input) {
                    this.#logging.debug(
                        `[AgenticChatEventParser] 🌊 Detected fsWrite chunk: toolUseId=${toolUseId}, input length=${input.length}, stop=${!!toolUseEvent.stop}`
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
            ...(this.contextList && { contextList: { ...this.contextList } }),
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
}
