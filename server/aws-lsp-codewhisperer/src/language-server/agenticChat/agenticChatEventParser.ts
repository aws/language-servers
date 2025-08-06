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
    fsWriteParams?: FsWriteParams
}

export interface FsWriteParams {
    command: string
    path?: string
    fileText?: string
    explanation?: string
    oldStr?: string
    newStr?: string
    insertLine?: number
}

export interface DiffPair {
    oldStr: string
    newStr: string
    index: number
}

export interface FsReplaceSession {
    toolUseId: string
    sentDiffPairs: Set<string>
    processedDiffCount: number
    totalExpectedPairs: number
    completedPairs: number
}

export type ChatResultWithMetadata = {
    chatResult: ChatResult
    conversationId?: string
    toolUses: Record<string, ToolUse & { stop: boolean }>
}

export class AgenticChatEventParser implements ChatResult {
    static readonly FOLLOW_UP_TEXT = 'Suggested follow up questions:'

    // Constants for streaming configuration
    private static readonly STREAMING_CONFIG = {
        FS_WRITE_MIN_INTERVAL: 40, // ms between fsWrite chunks
        DIFF_PAIR_KEY_PREVIEW_LENGTH: 50, // characters to include in diff pair key
    } as const

    // Tool names
    private static readonly TOOL_NAMES = {
        FS_REPLACE: 'fsReplace',
        FS_WRITE: 'fsWrite',
    } as const

    // Commands for fsWrite operations
    private static readonly FS_WRITE_COMMANDS = {
        CREATE: 'create',
        APPEND: 'append',
        STR_REPLACE: 'strReplace',
        INSERT: 'insert',
        UNKNOWN: 'unknown',
    } as const

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
    #lastStreamingChunkTime: number = 0
    #features?: Features
    #totalEvents = {
        followupPromptEvent: 0,
        supplementaryWebLinksEvent: 0,
        codeReferenceEvent: 0,
        assistantResponseEvent: 0,
        toolUserEvent: 0,
    }
    // Track fsReplace sessions by file path instead of toolUseId to handle multiple diff pairs correctly
    #fsReplaceSessionsByFile: Map<string, FsReplaceSession> = new Map()

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

    #enableStreamingAnimation: boolean

    constructor(
        messageId: string,
        metric: Metric<AddMessageEvent>,
        logging: Features['logging'],
        features?: Features,
        enableStreamingAnimation: boolean = false
    ) {
        this.messageId = messageId
        this.#metric = metric
        this.#logging = logging
        this.#features = features
        this.#enableStreamingAnimation = enableStreamingAnimation
    }

    public get totalEvents() {
        return this.#totalEvents
    }

    /**
     * Create a unique key for a diff pair to track duplicates
     */
    #createDiffPairKey(oldStr: string, newStr: string): string {
        const previewLength = AgenticChatEventParser.STREAMING_CONFIG.DIFF_PAIR_KEY_PREVIEW_LENGTH
        return `${oldStr.length}:${newStr.length}:${oldStr.substring(0, previewLength)}:${newStr.substring(0, previewLength)}`
    }

    /**
     * Get or create fsReplace session for a file path
     */
    #getOrCreateFsReplaceSession(filePath: string, toolUseId: string) {
        if (!this.#fsReplaceSessionsByFile.has(filePath)) {
            this.#fsReplaceSessionsByFile.set(filePath, {
                toolUseId,
                sentDiffPairs: new Set(),
                processedDiffCount: 0,
                totalExpectedPairs: 0,
                completedPairs: 0,
            })
        }
        return this.#fsReplaceSessionsByFile.get(filePath)!
    }

    /**
     * Check if a diff pair has already been sent for a file
     */
    #isDiffPairAlreadySent(filePath: string, oldStr: string, newStr: string): boolean {
        const session = this.#fsReplaceSessionsByFile.get(filePath)
        if (!session) {
            return false
        }
        const pairKey = this.#createDiffPairKey(oldStr, newStr)
        return session.sentDiffPairs.has(pairKey)
    }

    /**
     * Mark a diff pair as sent for a file
     */
    #markDiffPairAsSent(filePath: string, oldStr: string, newStr: string): void {
        const session = this.#getOrCreateFsReplaceSession(filePath, '')
        const pairKey = this.#createDiffPairKey(oldStr, newStr)
        session.sentDiffPairs.add(pairKey)
        session.completedPairs++
    }

    /**
     * extract new complete diff pairs from the fsReplace streaming chunks
     */
    #extractNewCompleteDiffPairs(
        filePath: string,
        accumulatedInput: string
    ): Array<{ oldStr: string; newStr: string; index: number }> {
        const newPairs: Array<{ oldStr: string; newStr: string; index: number }> = []
        const session = this.#getOrCreateFsReplaceSession(filePath, '')
        const processedCount = session.processedDiffCount

        try {
            try {
                const parsedJson = JSON.parse(accumulatedInput)
                if (parsedJson.diffs && Array.isArray(parsedJson.diffs)) {
                    for (let i = processedCount; i < parsedJson.diffs.length; i++) {
                        const diff = parsedJson.diffs[i]
                        if (diff.oldStr !== undefined && diff.newStr !== undefined) {
                            newPairs.push({
                                oldStr: diff.oldStr,
                                newStr: diff.newStr,
                                index: i,
                            })
                        }
                    }

                    session.processedDiffCount = parsedJson.diffs.length
                    return newPairs
                }
            } catch (parseError) {
                this.#logging.debug(`[AgenticChatEventParser] JSON incomplete, trying incremental parsing`)
            }
            const diffsStartMatch = accumulatedInput.match(/"diffs":\s*\[/)
            if (!diffsStartMatch) {
                return newPairs
            }

            const diffsStartIndex = diffsStartMatch.index! + diffsStartMatch[0].length
            const remainingContent = accumulatedInput.substring(diffsStartIndex)

            let searchIndex = 0
            let foundObjectCount = 0

            while (foundObjectCount < processedCount && searchIndex < remainingContent.length) {
                const objectStart = remainingContent.indexOf('{', searchIndex)
                if (objectStart === -1) break

                let braceCount = 0
                let inString = false
                let escapeNext = false

                for (let i = objectStart; i < remainingContent.length; i++) {
                    const char = remainingContent[i]

                    if (escapeNext) {
                        escapeNext = false
                        continue
                    }
                    if (char === '\\') {
                        escapeNext = true
                        continue
                    }
                    if (char === '"') {
                        inString = !inString
                        continue
                    }
                    if (!inString) {
                        if (char === '{') {
                            braceCount++
                        } else if (char === '}') {
                            braceCount--
                            if (braceCount === 0) {
                                searchIndex = i + 1
                                foundObjectCount++
                                break
                            }
                        }
                    }
                }

                if (braceCount !== 0) break
            }

            while (searchIndex < remainingContent.length) {
                const objectStart = remainingContent.indexOf('{', searchIndex)
                if (objectStart === -1) break

                let braceCount = 0
                let objectEnd = -1
                let inString = false
                let escapeNext = false

                for (let i = objectStart; i < remainingContent.length; i++) {
                    const char = remainingContent[i]

                    if (escapeNext) {
                        escapeNext = false
                        continue
                    }
                    if (char === '\\') {
                        escapeNext = true
                        continue
                    }
                    if (char === '"') {
                        inString = !inString
                        continue
                    }
                    if (!inString) {
                        if (char === '{') {
                            braceCount++
                        } else if (char === '}') {
                            braceCount--
                            if (braceCount === 0) {
                                objectEnd = i + 1
                                break
                            }
                        }
                    }
                }

                if (objectEnd > objectStart) {
                    const objectJson = remainingContent.substring(objectStart, objectEnd)
                    try {
                        const diffObj = JSON.parse(objectJson)
                        if (diffObj.oldStr !== undefined && diffObj.newStr !== undefined) {
                            const pairIndex = processedCount + newPairs.length
                            newPairs.push({
                                oldStr: diffObj.oldStr,
                                newStr: diffObj.newStr,
                                index: pairIndex,
                            })
                        }
                    } catch (parseError) {
                        this.#logging.debug(`[AgenticChatEventParser] Failed to parse diff object: ${parseError}`)
                    }

                    searchIndex = objectEnd
                } else {
                    break // Incomplete object
                }
            }

            if (newPairs.length > 0) {
                session.processedDiffCount = processedCount + newPairs.length
            }
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] Error in incremental diff extraction: ${error}`)
        }
        return newPairs
    }

    /**
     * Send a single diff pair as an animation chunk
     */
    async #sendFsReplaceDiffChunk(
        toolUseId: string,
        filePath: string,
        startLine: number | undefined,
        oldStr: string,
        newStr: string,
        pairIndex: number,
        totalPairs: number,
        isComplete: boolean
    ) {
        if (!this.#features?.chat) {
            return
        }

        try {
            const isLastPairAndComplete = isComplete && pairIndex === totalPairs - 1

            const diffChunkPayload = {
                toolUseId: toolUseId,
                toolName: 'fsReplace',
                filePath: filePath,
                content: newStr,
                isComplete: isLastPairAndComplete,
                fsWriteParams: {
                    command: 'fsReplace_diffPair',
                    path: filePath,
                    startLine: startLine,
                    oldStr: oldStr,
                    newStr: newStr,
                    pairIndex: pairIndex,
                    totalPairs: totalPairs,
                },
                timestamp: Date.now(),
                chunkSize: newStr.length,
            }

            await this.#features!.chat.sendChatUpdate({
                tabId: '',
                data: {
                    streamingChunk: diffChunkPayload,
                },
            } as any)
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] Failed to send fsReplace diff chunk: ${error}`)
        }
    }

    /**
     * Handle fsReplace streaming with diff pair extraction and animation
     */
    async #sendFsReplaceStreaming(toolUseId: string, accumulatedInput: string, isComplete: boolean): Promise<void> {
        if (!this.#features?.chat) {
            return
        }

        try {
            const pathMatch = accumulatedInput.match(/"path":\s*"((?:[^"\\]|\\.)*)"/)
            const path = pathMatch?.[1]

            if (!path) {
                return
            }

            if (isComplete) {
                try {
                    const parsed = JSON.parse(accumulatedInput)
                    if (parsed.diffs && Array.isArray(parsed.diffs) && parsed.diffs.length > 0) {
                        // Filter out already-sent diff pairs
                        const newDiffPairs: Array<{ oldStr: string; newStr: string; index: number }> = []
                        for (let i = 0; i < parsed.diffs.length; i++) {
                            const diff = parsed.diffs[i]
                            if (diff.oldStr && diff.newStr) {
                                if (!this.#isDiffPairAlreadySent(path, diff.oldStr, diff.newStr)) {
                                    newDiffPairs.push({ oldStr: diff.oldStr, newStr: diff.newStr, index: i })
                                }
                            }
                        }

                        if (newDiffPairs.length > 0) {
                            for (let i = 0; i < newDiffPairs.length; i++) {
                                const { oldStr, newStr, index } = newDiffPairs[i]

                                // Mark as sent before sending to avoid race conditions
                                this.#markDiffPairAsSent(path, oldStr, newStr)
                                await this.#sendFsReplaceDiffChunk(
                                    toolUseId,
                                    path,
                                    undefined,
                                    oldStr,
                                    newStr,
                                    index,
                                    parsed.diffs.length,
                                    true
                                )
                            }
                        }
                        const finalChunkPayload = {
                            toolUseId: toolUseId,
                            toolName: 'fsReplace',
                            filePath: path,
                            content: '',
                            isComplete: true,
                            fsWriteParams: {
                                command: 'fsReplace_completion',
                                path: path,
                            },
                            timestamp: Date.now(),
                            chunkSize: 0,
                        }

                        await this.#features!.chat.sendChatUpdate({
                            tabId: '',
                            data: {
                                streamingChunk: finalChunkPayload,
                            },
                        } as any)
                    }
                } catch (parseError) {
                    this.#logging.error(
                        `[AgenticChatEventParser] ❌ Failed to parse complete fsReplace JSON: ${parseError}`
                    )
                }
            } else {
                const completeDiffPairs = this.#extractNewCompleteDiffPairs(path, accumulatedInput)

                if (completeDiffPairs.length > 0) {
                    // Filter out already-sent diff pairs and send only new ones
                    const newDiffPairs: Array<{ oldStr: string; newStr: string; index: number }> = []
                    for (let i = 0; i < completeDiffPairs.length; i++) {
                        const { oldStr, newStr } = completeDiffPairs[i]
                        if (!this.#isDiffPairAlreadySent(path, oldStr, newStr)) {
                            newDiffPairs.push({ oldStr, newStr, index: i })
                        }
                    }

                    if (newDiffPairs.length > 0) {
                        // Send each NEW complete diff pair as a separate animation chunk
                        for (let i = 0; i < newDiffPairs.length; i++) {
                            const { oldStr, newStr, index } = newDiffPairs[i]

                            // Mark as sent before sending to avoid race conditions
                            this.#markDiffPairAsSent(path, oldStr, newStr)

                            await this.#sendFsReplaceDiffChunk(
                                toolUseId,
                                path,
                                undefined,
                                oldStr,
                                newStr,
                                index,
                                completeDiffPairs.length,
                                false
                            ) // **FIXED**: Always false during streaming
                        }
                    }
                }
            }
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] Failed to process fsReplace streaming: ${error}`)
        }
    }

    /**
     * Handle fsWrite streaming with progressive content updates
     * Completely separate from fsReplace logic to avoid conflicts
     * Throttled to ensure at least 40ms between deliveries to prevent race conditions
     */
    async #sendFsWriteStreaming(toolUseId: string, accumulatedInput: string, isComplete: boolean): Promise<void> {
        if (!this.#features?.chat) {
            return
        }

        try {
            // At least 40 ms delay for fsWrite chunks to prevent overwhelming the UI
            const now = Date.now()
            const timeSinceLastChunk = now - this.#lastStreamingChunkTime
            const minInterval = AgenticChatEventParser.STREAMING_CONFIG.FS_WRITE_MIN_INTERVAL

            if (!isComplete && timeSinceLastChunk < minInterval) {
                const delayNeeded = minInterval - timeSinceLastChunk
                await new Promise(resolve => setTimeout(resolve, delayNeeded))
            }

            // Update last chunk time for fsWrite
            this.#lastStreamingChunkTime = Date.now()

            // Try to extract path, content, and operation parameters
            let path: string | undefined
            let content: string | undefined
            let fsWriteParams: any = {}

            // Try to parse as JSON first (for complete JSON)
            if (isComplete) {
                try {
                    const parsed = JSON.parse(accumulatedInput || '{}')
                    path = parsed.path

                    // Extract fsWrite parameters for animation system
                    fsWriteParams = {
                        command: parsed.command,
                        path: parsed.path,
                        fileText: parsed.fileText,
                        oldStr: parsed.oldStr,
                        newStr: parsed.newStr,
                        insertLine: parsed.insertLine,
                        explanation: parsed.explanation,
                    }

                    if (parsed.command === 'create') {
                        content = parsed.fileText
                    } else if (parsed.command === 'append') {
                        content = parsed.newStr
                    }
                } catch (error) {
                    this.#logging.debug(`[AgenticChatEventParser] Failed to parse complete JSON: ${error}`)
                }
            }

            if (!path || content === undefined) {
                if (!path) {
                    const pathMatch = accumulatedInput.match(/"path":\s*"((?:[^"\\]|\\.)*)"/)
                    path = pathMatch?.[1]
                }

                let contentField: string | undefined
                let command: string | undefined

                const commandMatch = accumulatedInput.match(/"command":\s*"([^"]*)"/)
                command = commandMatch?.[1]

                // Extract partial fsWrite parameters for progressive streaming
                if (!isComplete) {
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

                if (command === 'create') {
                    contentField = 'fileText'
                } else if (command === 'append') {
                    contentField = 'newStr'
                } else {
                    if (accumulatedInput.includes('"fileText"')) {
                        contentField = 'fileText'
                        command = 'create'
                    } else if (accumulatedInput.includes('"newStr"')) {
                        contentField = 'newStr'
                        command = 'strReplace'
                    } else if (accumulatedInput.includes('"content"')) {
                        contentField = 'content'
                        command = 'create'
                    } else {
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
                    const shouldSkipContent =
                        !isComplete &&
                        rawContent.trim() === '' &&
                        (command === 'strReplace' || command === 'append' || command === 'insert')

                    if (!shouldSkipContent) {
                        // Unescape basic JSON escapes
                        content = rawContent
                            .replace(/\\"/g, '"')
                            .replace(/\\n/g, '\n')
                            .replace(/\\t/g, '\t')
                            .replace(/\\r/g, '\r')
                            .replace(/\\\\/g, '\\')
                    }
                }
            }

            if (!path) {
                // Send final chunk to trigger cleanup even if path is missing
                if (isComplete) {
                    try {
                        await this.#features!.chat.sendChatUpdate({
                            tabId: '',
                            data: {
                                streamingChunk: {
                                    toolUseId: toolUseId,
                                    toolName: 'fsWrite',
                                    filePath: '',
                                    content: '',
                                    isComplete: true,
                                    fsWriteParams: fsWriteParams,
                                    timestamp: Date.now(),
                                    chunkSize: 0,
                                },
                            },
                        } as any)
                    } catch (error) {
                        this.#logging.error(`[AgenticChatEventParser] Failed to send final cleanup chunk: ${error}`)
                    }
                }
                return
            }

            const finalContent = content || ''

            const streamingChunkPayload = {
                toolUseId: toolUseId,
                toolName: 'fsWrite',
                filePath: path,
                content: finalContent,
                isComplete: isComplete,
                fsWriteParams: fsWriteParams,
                timestamp: Date.now(),
                chunkSize: finalContent.length,
            }

            // Send streaming chunk to client
            try {
                await this.#features!.chat.sendChatUpdate({
                    tabId: '',
                    data: {
                        streamingChunk: streamingChunkPayload,
                    },
                } as any)
            } catch (error) {
                this.#logging.error(`[AgenticChatEventParser] Failed to send fsWrite streaming chunk: ${error}`)
            }
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] ❌ Failed to process fsWrite streaming chunk: ${error}`)
        }
    }

    /**
     * Route streaming chunks to appropriate dedicated handlers
     * Completely separates fsReplace and fsWrite logic to avoid conflicts
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
            if (toolName === AgenticChatEventParser.TOOL_NAMES.FS_REPLACE) {
                await this.#sendFsReplaceStreaming(toolUseId, accumulatedInput, isComplete)
            } else if (toolName === AgenticChatEventParser.TOOL_NAMES.FS_WRITE) {
                await this.#sendFsWriteStreaming(toolUseId, accumulatedInput, isComplete)
            }
        } catch (error: any) {
            this.#logging.error(
                `[AgenticChatEventParser] ❌ DISPATCHER: Failed to route ${toolName} streaming chunk: ${error}`
            )
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
                // Send streaming chunk for fsWrite and fsReplace tools only if streaming animation is enabled
                if (
                    (name === AgenticChatEventParser.TOOL_NAMES.FS_WRITE ||
                        name === AgenticChatEventParser.TOOL_NAMES.FS_REPLACE) &&
                    this.#features?.chat &&
                    input &&
                    this.#enableStreamingAnimation
                ) {
                    const isComplete = !!toolUseEvent.stop
                    this.#sendStreamingChunk(
                        toolUseId,
                        name,
                        String(this.toolUses[toolUseId].input || ''),
                        isComplete
                    ).catch(error => {
                        this.#logging.error(`[AgenticChatEventParser] Failed to send ${name} streaming chunk: ${error}`)
                    })
                }
                if (toolUseEvent.stop) {
                    // Final chunk as a signal for the completion of a animation session
                    if (
                        (name === AgenticChatEventParser.TOOL_NAMES.FS_WRITE ||
                            name === AgenticChatEventParser.TOOL_NAMES.FS_REPLACE) &&
                        this.#features?.chat &&
                        !input &&
                        this.#enableStreamingAnimation
                    ) {
                        this.#sendStreamingChunk(
                            toolUseId,
                            name,
                            String(this.toolUses[toolUseId].input || ''),
                            true // isComplete = true
                        ).catch(error => {
                            this.#logging.error(
                                `[AgenticChatEventParser] Failed to send final streaming chunk: ${error}`
                            )
                        })
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
}
