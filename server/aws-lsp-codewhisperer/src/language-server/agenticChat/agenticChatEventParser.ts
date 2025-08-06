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
     * Try to parse complete JSON and extract diff pairs
     */
    #tryParseCompleteDiffPairs(
        accumulatedInput: string,
        processedCount: number
    ): Array<{ oldStr: string; newStr: string; index: number }> | null {
        try {
            const parsedJson = JSON.parse(accumulatedInput)
            if (!parsedJson.diffs || !Array.isArray(parsedJson.diffs)) {
                return null
            }

            const newPairs: Array<{ oldStr: string; newStr: string; index: number }> = []
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
            return newPairs
        } catch (parseError) {
            this.#logging.debug(`[AgenticChatEventParser] JSON incomplete, trying incremental parsing`)
            return null
        }
    }

    /**
     * Find the end of a JSON object by tracking braces and string states
     */
    #findJsonObjectEnd(content: string, startIndex: number): number {
        let braceCount = 0
        let inString = false
        let escapeNext = false

        for (let i = startIndex; i < content.length; i++) {
            const char = content[i]

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
                        return i + 1
                    }
                }
            }
        }
        return -1 // Incomplete object
    }

    /**
     * Skip already processed objects in the diffs array
     */
    #skipProcessedObjects(remainingContent: string, processedCount: number): number {
        let searchIndex = 0
        let foundObjectCount = 0

        while (foundObjectCount < processedCount && searchIndex < remainingContent.length) {
            const objectStart = remainingContent.indexOf('{', searchIndex)
            if (objectStart === -1) break

            const objectEnd = this.#findJsonObjectEnd(remainingContent, objectStart)
            if (objectEnd === -1) break

            searchIndex = objectEnd
            foundObjectCount++
        }

        return searchIndex
    }

    /**
     * Parse new diff objects from remaining content
     */
    #parseNewDiffObjects(
        remainingContent: string,
        startIndex: number,
        processedCount: number
    ): Array<{ oldStr: string; newStr: string; index: number }> {
        const newPairs: Array<{ oldStr: string; newStr: string; index: number }> = []
        let searchIndex = startIndex

        while (searchIndex < remainingContent.length) {
            const objectStart = remainingContent.indexOf('{', searchIndex)
            if (objectStart === -1) break

            const objectEnd = this.#findJsonObjectEnd(remainingContent, objectStart)
            if (objectEnd === -1) break // Incomplete object

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
        }

        return newPairs
    }

    /**
     * Extract new complete diff pairs from the fsReplace streaming chunks
     * Optimized with helper methods to reduce nesting
     */
    #extractNewCompleteDiffPairs(
        filePath: string,
        accumulatedInput: string
    ): Array<{ oldStr: string; newStr: string; index: number }> {
        const session = this.#getOrCreateFsReplaceSession(filePath, '')
        const processedCount = session.processedDiffCount

        try {
            // Try to parse complete JSON first
            const completePairs = this.#tryParseCompleteDiffPairs(accumulatedInput, processedCount)
            if (completePairs !== null) {
                session.processedDiffCount = processedCount + completePairs.length
                return completePairs
            }

            // Fall back to incremental parsing
            const diffsStartMatch = accumulatedInput.match(/"diffs":\s*\[/)
            if (!diffsStartMatch) {
                return []
            }

            const diffsStartIndex = diffsStartMatch.index! + diffsStartMatch[0].length
            const remainingContent = accumulatedInput.substring(diffsStartIndex)

            // Skip already processed objects
            const searchStartIndex = this.#skipProcessedObjects(remainingContent, processedCount)

            // Parse new diff objects
            const newPairs = this.#parseNewDiffObjects(remainingContent, searchStartIndex, processedCount)

            if (newPairs.length > 0) {
                session.processedDiffCount = processedCount + newPairs.length
            }

            return newPairs
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] Error in incremental diff extraction: ${error}`)
            return []
        }
    }

    /**
     * Create fsReplace diff chunk payload
     */
    #createFsReplaceDiffPayload(
        toolUseId: string,
        filePath: string,
        startLine: number | undefined,
        oldStr: string,
        newStr: string,
        pairIndex: number,
        totalPairs: number,
        isComplete: boolean
    ) {
        const isLastPairAndComplete = isComplete && pairIndex === totalPairs - 1

        return {
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
    }

    /**
     * Send fsReplace diff chunk to client
     */
    async #sendDiffChunkToClient(diffChunkPayload: any): Promise<void> {
        try {
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
     * Send a single diff pair as an animation chunk
     * Optimized with helper methods to reduce nesting
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
    ): Promise<void> {
        // Early return if chat feature is not available
        if (!this.#features?.chat) {
            return
        }

        // Create the diff chunk payload
        const diffChunkPayload = this.#createFsReplaceDiffPayload(
            toolUseId,
            filePath,
            startLine,
            oldStr,
            newStr,
            pairIndex,
            totalPairs,
            isComplete
        )

        // Send the chunk to client
        await this.#sendDiffChunkToClient(diffChunkPayload)
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
     * Apply throttling delay for fsWrite chunks to prevent overwhelming the UI
     */
    async #applyFsWriteThrottling(isComplete: boolean): Promise<void> {
        if (isComplete) {
            return
        }

        const now = Date.now()
        const timeSinceLastChunk = now - this.#lastStreamingChunkTime
        const minInterval = AgenticChatEventParser.STREAMING_CONFIG.FS_WRITE_MIN_INTERVAL

        if (timeSinceLastChunk < minInterval) {
            const delayNeeded = minInterval - timeSinceLastChunk
            await new Promise(resolve => setTimeout(resolve, delayNeeded))
        }

        this.#lastStreamingChunkTime = Date.now()
    }

    /**
     * Parse complete JSON for fsWrite parameters
     */
    #parseCompleteFsWriteJson(accumulatedInput: string): {
        path?: string
        content?: string
        fsWriteParams: Partial<FsWriteParams>
    } {
        try {
            const parsed = JSON.parse(accumulatedInput || '{}')
            const fsWriteParams: Partial<FsWriteParams> = {
                command: parsed.command,
                path: parsed.path,
                fileText: parsed.fileText,
                oldStr: parsed.oldStr,
                newStr: parsed.newStr,
                insertLine: parsed.insertLine,
                explanation: parsed.explanation,
            }

            let content: string | undefined
            if (parsed.command === 'create') {
                content = parsed.fileText
            } else if (parsed.command === 'append') {
                content = parsed.newStr
            }

            return {
                path: parsed.path,
                content,
                fsWriteParams,
            }
        } catch (error) {
            this.#logging.debug(`[AgenticChatEventParser] Failed to parse complete JSON: ${error}`)
            return { fsWriteParams: {} }
        }
    }

    /**
     * Determine content field name based on fsWrite command
     */
    #determineContentField(
        command: string | undefined,
        accumulatedInput: string
    ): {
        contentField: string
        finalCommand: string
    } {
        if (command === 'create') {
            return { contentField: 'fileText', finalCommand: command }
        }
        if (command === 'append') {
            return { contentField: 'newStr', finalCommand: command }
        }

        // Fallback logic for unknown commands
        if (accumulatedInput.includes('"fileText"')) {
            return { contentField: 'fileText', finalCommand: 'create' }
        }
        if (accumulatedInput.includes('"newStr"')) {
            return { contentField: 'newStr', finalCommand: 'strReplace' }
        }
        if (accumulatedInput.includes('"content"')) {
            return { contentField: 'content', finalCommand: 'create' }
        }

        return {
            contentField: 'fileText|content|text|newStr|new_str',
            finalCommand: 'unknown',
        }
    }

    /**
     * Find the closing quote index for content extraction
     */
    #findClosingQuoteIndex(remainingInput: string): number {
        let i = remainingInput.length - 1

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
                    return i
                }
            }
            i--
        }
        return -1
    }

    /**
     * Extract content from accumulated input for progressive parsing
     */
    #extractContentFromInput(
        accumulatedInput: string,
        contentField: string,
        command: string,
        isComplete: boolean
    ): string | undefined {
        const contentStartMatch = accumulatedInput.match(new RegExp(`"(?:${contentField})":\\s*"`))
        if (!contentStartMatch) {
            return undefined
        }

        const contentStart = contentStartMatch.index! + contentStartMatch[0].length
        let contentEnd = accumulatedInput.length

        // If we have complete JSON, find the closing quote
        if (isComplete) {
            const remainingInput = accumulatedInput.substring(contentStart)
            const lastQuoteIndex = this.#findClosingQuoteIndex(remainingInput)
            if (lastQuoteIndex > 0) {
                contentEnd = contentStart + lastQuoteIndex
            }
        }

        const rawContent = accumulatedInput.substring(contentStart, contentEnd)
        const shouldSkipContent =
            !isComplete &&
            rawContent.trim() === '' &&
            (command === 'strReplace' || command === 'append' || command === 'insert')

        if (shouldSkipContent) {
            return undefined
        }

        // Unescape basic JSON escapes
        return rawContent
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r')
            .replace(/\\\\/g, '\\')
    }

    /**
     * Parse fsWrite parameters for progressive streaming
     */
    #parseProgressiveFsWriteParams(
        accumulatedInput: string,
        path: string | undefined,
        command: string | undefined,
        isComplete: boolean
    ): {
        content?: string
        fsWriteParams: Partial<FsWriteParams>
    } {
        // Extract partial fsWrite parameters for progressive streaming
        const fsWriteParams: Partial<FsWriteParams> = {
            command: command,
            path: path,
        }

        if (!isComplete) {
            const insertLineMatch = accumulatedInput.match(/"insertLine":\s*(\d+)/)
            const oldStrMatch = accumulatedInput.match(/"oldStr":\s*"([^"]*)"/)
            const explanationMatch = accumulatedInput.match(/"explanation":\s*"([^"]*)"/)

            fsWriteParams.insertLine = insertLineMatch ? parseInt(insertLineMatch[1]) : undefined
            fsWriteParams.oldStr = oldStrMatch?.[1]
            fsWriteParams.explanation = explanationMatch?.[1]
        }

        const { contentField, finalCommand } = this.#determineContentField(command, accumulatedInput)
        const content = this.#extractContentFromInput(accumulatedInput, contentField, finalCommand, isComplete)

        return { content, fsWriteParams }
    }

    /**
     * Send cleanup chunk when path is missing
     */
    async #sendFsWriteCleanupChunk(toolUseId: string, fsWriteParams: Partial<FsWriteParams>): Promise<void> {
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

    /**
     * Send fsWrite streaming chunk to client
     */
    async #sendFsWriteChunk(
        toolUseId: string,
        path: string,
        content: string,
        isComplete: boolean,
        fsWriteParams: Partial<FsWriteParams>
    ): Promise<void> {
        const streamingChunkPayload = {
            toolUseId: toolUseId,
            toolName: 'fsWrite',
            filePath: path,
            content: content,
            isComplete: isComplete,
            fsWriteParams: fsWriteParams,
            timestamp: Date.now(),
            chunkSize: content.length,
        }

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
    }

    /**
     * Handle fsWrite streaming with progressive content updates
     * Optimized with helper methods to reduce nesting and improve readability
     */
    async #sendFsWriteStreaming(toolUseId: string, accumulatedInput: string, isComplete: boolean): Promise<void> {
        // Early return if chat feature is not available
        if (!this.#features?.chat) {
            return
        }

        try {
            // Apply throttling delay
            await this.#applyFsWriteThrottling(isComplete)

            let path: string | undefined
            let content: string | undefined
            let fsWriteParams: Partial<FsWriteParams> = {}

            // Try to parse complete JSON first
            if (isComplete) {
                const parsed = this.#parseCompleteFsWriteJson(accumulatedInput)
                path = parsed.path
                content = parsed.content
                fsWriteParams = parsed.fsWriteParams
            }

            // Fall back to progressive parsing if needed
            if (!path || content === undefined) {
                // Extract path if not already found
                if (!path) {
                    const pathMatch = accumulatedInput.match(/"path":\s*"((?:[^"\\]|\\.)*)"/)
                    path = pathMatch?.[1]
                }

                // Extract command
                const commandMatch = accumulatedInput.match(/"command":\s*"([^"]*)"/)
                const command = commandMatch?.[1]

                // Parse progressive parameters and content
                const progressive = this.#parseProgressiveFsWriteParams(accumulatedInput, path, command, isComplete)
                content = progressive.content
                fsWriteParams = progressive.fsWriteParams
            }

            // Handle missing path case
            if (!path) {
                if (isComplete) {
                    await this.#sendFsWriteCleanupChunk(toolUseId, fsWriteParams)
                }
                return
            }

            // Send the streaming chunk
            const finalContent = content || ''
            await this.#sendFsWriteChunk(toolUseId, path, finalContent, isComplete, fsWriteParams)
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] ❌ Failed to process fsWrite streaming chunk: ${error}`)
        }
    }

    #handleStreamingChunk(
        toolUseId: string,
        name: string | undefined,
        input: string | undefined,
        isStop: boolean | undefined
    ): void {
        // Early return if streaming animation is disabled
        if (!this.#enableStreamingAnimation) {
            return
        }

        // Early return if name is undefined
        if (!name) {
            return
        }

        // Early return if not a supported tool
        if (
            name !== AgenticChatEventParser.TOOL_NAMES.FS_WRITE &&
            name !== AgenticChatEventParser.TOOL_NAMES.FS_REPLACE
        ) {
            return
        }

        // Early return if chat feature is not available
        if (!this.#features?.chat) {
            return
        }

        const accumulatedInput = String(this.toolUses[toolUseId].input || '')
        const stopFlag = !!isStop

        // Handle streaming chunk with input
        if (input) {
            const isComplete = stopFlag
            this.#sendStreamingChunk(toolUseId, name, accumulatedInput, isComplete).catch(error => {
                this.#logging.error(`[AgenticChatEventParser] Failed to send ${name} streaming chunk: ${error}`)
            })
            return
        }

        // Handle final chunk when stopped but no input (completion signal)
        if (stopFlag) {
            this.#sendStreamingChunk(toolUseId, name, accumulatedInput, true).catch(error => {
                this.#logging.error(`[AgenticChatEventParser] Failed to send final streaming chunk: ${error}`)
            })
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
                // Handle streaming chunks for fsWrite and fsReplace tools
                this.#handleStreamingChunk(toolUseId, name, input, toolUseEvent.stop)
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
