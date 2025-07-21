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
    #fsReplaceSessionsByFile: Map<
        string,
        {
            toolUseId: string
            sentDiffPairs: Set<string>
            processedDiffCount: number
            lastSendTime: number
            totalExpectedPairs: number
            completedPairs: number
        }
    > = new Map()

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
     * Create a unique key for a diff pair to track duplicates
     */
    #createDiffPairKey(oldStr: string, newStr: string): string {
        return `${oldStr.length}:${newStr.length}:${oldStr.substring(0, 50)}:${newStr.substring(0, 50)}`
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
                lastSendTime: 0,
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
     * **OPTIMIZED**: Extract only NEW complete diff pairs from streaming JSON
     * Uses incremental parsing to avoid re-processing already sent pairs
     */
    #extractNewCompleteDiffPairs(
        filePath: string,
        accumulatedInput: string
    ): Array<{ oldStr: string; newStr: string; index: number }> {
        const newPairs: Array<{ oldStr: string; newStr: string; index: number }> = []
        const session = this.#getOrCreateFsReplaceSession(filePath, '')
        const processedCount = session.processedDiffCount

        try {
            this.#logging.debug(
                `[AgenticChatEventParser] 🔍 Incremental extraction for ${filePath}: already processed ${processedCount} pairs`
            )

            // **OPTIMIZATION 1**: Try complete JSON parsing first (most efficient)
            try {
                const parsedJson = JSON.parse(accumulatedInput)
                if (parsedJson.diffs && Array.isArray(parsedJson.diffs)) {
                    // **OPTIMIZATION 2**: Only process NEW diff pairs beyond processedCount
                    for (let i = processedCount; i < parsedJson.diffs.length; i++) {
                        const diff = parsedJson.diffs[i]
                        if (diff.oldStr !== undefined && diff.newStr !== undefined) {
                            newPairs.push({
                                oldStr: diff.oldStr,
                                newStr: diff.newStr,
                                index: i,
                            })

                            // **DEBUG**: Print extracted diff pair content
                            this.#logging.info(`[AgenticChatEventParser] 📝 EXTRACTED DIFF PAIR ${i + 1}:`)
                            this.#logging.info(
                                `[AgenticChatEventParser]   oldStr (${diff.oldStr.length} chars): "${diff.oldStr.substring(0, 200)}${diff.oldStr.length > 200 ? '...' : ''}"`
                            )
                            this.#logging.info(
                                `[AgenticChatEventParser]   newStr (${diff.newStr.length} chars): "${diff.newStr.substring(0, 200)}${diff.newStr.length > 200 ? '...' : ''}"`
                            )
                        }
                    }

                    // **OPTIMIZATION 3**: Update processed count to avoid re-parsing
                    session.processedDiffCount = parsedJson.diffs.length

                    this.#logging.info(
                        `[AgenticChatEventParser] ✅ Complete JSON: extracted ${newPairs.length} NEW diff pairs (${processedCount} already processed)`
                    )
                    return newPairs
                }
            } catch (parseError) {
                this.#logging.debug(`[AgenticChatEventParser] JSON incomplete, trying incremental parsing`)
            }

            // **OPTIMIZATION 4**: Incremental parsing - only look for NEW complete objects
            const diffsStartMatch = accumulatedInput.match(/"diffs":\s*\[/)
            if (!diffsStartMatch) {
                return newPairs
            }

            const diffsStartIndex = diffsStartMatch.index! + diffsStartMatch[0].length
            const remainingContent = accumulatedInput.substring(diffsStartIndex)

            // **OPTIMIZATION 5**: Skip already processed objects by counting braces
            let searchIndex = 0
            let foundObjectCount = 0

            // Skip already processed objects
            while (foundObjectCount < processedCount && searchIndex < remainingContent.length) {
                const objectStart = remainingContent.indexOf('{', searchIndex)
                if (objectStart === -1) break

                // Find matching closing brace
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

                if (braceCount !== 0) break // Incomplete object
            }

            // **OPTIMIZATION 6**: Now parse only NEW complete objects
            while (searchIndex < remainingContent.length) {
                const objectStart = remainingContent.indexOf('{', searchIndex)
                if (objectStart === -1) break

                // Find matching closing brace
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

                            // **DEBUG**: Print extracted diff pair content from incremental parsing
                            this.#logging.info(
                                `[AgenticChatEventParser] 📝 INCREMENTAL EXTRACTED DIFF PAIR ${pairIndex + 1}:`
                            )
                            this.#logging.info(
                                `[AgenticChatEventParser]   oldStr (${diffObj.oldStr.length} chars): "${diffObj.oldStr.substring(0, 200)}${diffObj.oldStr.length > 200 ? '...' : ''}"`
                            )
                            this.#logging.info(
                                `[AgenticChatEventParser]   newStr (${diffObj.newStr.length} chars): "${diffObj.newStr.substring(0, 200)}${diffObj.newStr.length > 200 ? '...' : ''}"`
                            )
                        }
                    } catch (parseError) {
                        this.#logging.debug(`[AgenticChatEventParser] Failed to parse diff object: ${parseError}`)
                    }

                    searchIndex = objectEnd
                } else {
                    break // Incomplete object
                }
            }

            // **OPTIMIZATION 7**: Update processed count
            if (newPairs.length > 0) {
                session.processedDiffCount = processedCount + newPairs.length
            }
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] Error in incremental diff extraction: ${error}`)
        }

        this.#logging.info(
            `[AgenticChatEventParser] 🚀 Incremental extraction: ${newPairs.length} NEW pairs (${processedCount} already processed)`
        )
        return newPairs
    }

    /**
     * Send a single diff pair as an animation chunk
     * Similar to Cline's approach of sending individual SEARCH/REPLACE blocks
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
            // **CRITICAL FIX**: Never mark individual diff pairs as complete during streaming
            // Only mark complete when the entire fsReplace JSON is complete AND it's the last pair
            const isLastPairAndComplete = isComplete && pairIndex === totalPairs - 1

            const diffChunkPayload = {
                toolUseId: toolUseId,
                toolName: 'fsReplace',
                filePath: filePath,
                content: newStr, // The new content for this diff
                isComplete: isLastPairAndComplete, // **FIXED**: Only mark complete on the very last pair of a complete JSON
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

            this.#logging.info(
                `[AgenticChatEventParser] 🔄 Sending fsReplace diff pair ${pairIndex + 1}/${totalPairs}: oldStr=${oldStr.length} chars, newStr=${newStr.length} chars`
            )

            // **CRITICAL DEBUG**: Log the exact payload being sent
            this.#logging.info(`[AgenticChatEventParser] 📤 SENDING DIFF CHUNK PAYLOAD:`)
            this.#logging.info(`[AgenticChatEventParser]   toolUseId: ${diffChunkPayload.toolUseId}`)
            this.#logging.info(`[AgenticChatEventParser]   toolName: ${diffChunkPayload.toolName}`)
            this.#logging.info(`[AgenticChatEventParser]   filePath: ${diffChunkPayload.filePath}`)
            this.#logging.info(
                `[AgenticChatEventParser]   content: "${diffChunkPayload.content.substring(0, 100)}${diffChunkPayload.content.length > 100 ? '...' : ''}"`
            )
            this.#logging.info(`[AgenticChatEventParser]   isComplete: ${diffChunkPayload.isComplete}`)
            this.#logging.info(
                `[AgenticChatEventParser]   fsWriteParams.oldStr: "${oldStr.substring(0, 100)}${oldStr.length > 100 ? '...' : ''}"`
            )
            this.#logging.info(
                `[AgenticChatEventParser]   fsWriteParams.newStr: "${newStr.substring(0, 100)}${newStr.length > 100 ? '...' : ''}"`
            )
            this.#logging.info(
                `[AgenticChatEventParser]   fsWriteParams: ${JSON.stringify(diffChunkPayload.fsWriteParams, null, 2)}`
            )

            await this.#features!.chat.sendChatUpdate({
                tabId: '',
                data: {
                    streamingChunk: diffChunkPayload,
                },
            } as any)

            this.#logging.info(`[AgenticChatEventParser] ✅ Successfully sent fsReplace diff chunk via sendChatUpdate`)
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] Failed to send fsReplace diff chunk: ${error}`)
        }
    }

    /**
     * **DEDICATED**: Handle fsReplace streaming with diff pair extraction and animation
     * Completely separate from fsWrite logic to avoid conflicts
     */
    async #sendFsReplaceStreaming(toolUseId: string, accumulatedInput: string, isComplete: boolean): Promise<void> {
        if (!this.#features?.chat) {
            return
        }

        try {
            this.#logging.info(
                `[AgenticChatEventParser] 🔍 fsReplace streaming (${toolUseId}, complete=${isComplete}): ${accumulatedInput.substring(0, 200)}...`
            )

            // **WINDOWS COMPATIBILITY FIX**: Handle escaped backslashes in Windows paths
            // Windows paths like "C:\\Users\\file.txt" are escaped as "C:\\\\Users\\\\file.txt" in JSON
            const pathMatch = accumulatedInput.match(/"path":\s*"((?:[^"\\]|\\.)*)"/)
            const path = pathMatch?.[1]

            if (!path) {
                this.#logging.debug(`[AgenticChatEventParser] 🔍 fsReplace: No path found, waiting for more data`)
                return
            }

            if (isComplete) {
                // **COMPLETE JSON**: Parse all diffs and only send NEW ones that haven't been sent during streaming
                try {
                    const parsed = JSON.parse(accumulatedInput)
                    if (parsed.diffs && Array.isArray(parsed.diffs) && parsed.diffs.length > 0) {
                        this.#logging.info(
                            `[AgenticChatEventParser] ✅ Complete fsReplace with ${parsed.diffs.length} diffs`
                        )

                        // Filter out already-sent diff pairs
                        const newDiffPairs: Array<{ oldStr: string; newStr: string; index: number }> = []
                        for (let i = 0; i < parsed.diffs.length; i++) {
                            const diff = parsed.diffs[i]
                            if (diff.oldStr && diff.newStr) {
                                if (!this.#isDiffPairAlreadySent(path, diff.oldStr, diff.newStr)) {
                                    newDiffPairs.push({ oldStr: diff.oldStr, newStr: diff.newStr, index: i })
                                } else {
                                    this.#logging.debug(
                                        `[AgenticChatEventParser] 🔄 Skipping already-sent diff pair ${i + 1}/${parsed.diffs.length}`
                                    )
                                }
                            }
                        }

                        if (newDiffPairs.length > 0) {
                            this.#logging.info(
                                `[AgenticChatEventParser] 🔄 Sending ${newDiffPairs.length} NEW diff pairs (${parsed.diffs.length - newDiffPairs.length} already sent)`
                            )

                            // Send each NEW diff pair as a separate animation chunk with smart throttling
                            const session = this.#getOrCreateFsReplaceSession(path, toolUseId)
                            for (let i = 0; i < newDiffPairs.length; i++) {
                                const { oldStr, newStr, index } = newDiffPairs[i]

                                // **SMART THROTTLING**: Only add delay if time interval is too short
                                const now = Date.now()
                                const timeSinceLastSend = session.lastSendTime
                                const minInterval = 250 // 250ms minimum interval for session initialization

                                if (timeSinceLastSend > 0 && now - timeSinceLastSend < minInterval) {
                                    const delayNeeded = minInterval - (now - timeSinceLastSend)
                                    this.#logging.info(
                                        `[AgenticChatEventParser] ⏱️ Smart throttling: waiting ${delayNeeded}ms before sending diff pair ${index + 1}/${parsed.diffs.length} (last sent ${now - timeSinceLastSend}ms ago)`
                                    )
                                    await new Promise(resolve => setTimeout(resolve, delayNeeded))
                                }

                                // Update last send time
                                session.lastSendTime = Date.now()

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
                        } else {
                            this.#logging.info(
                                `[AgenticChatEventParser] ✅ All diff pairs already sent during streaming - no duplicates needed`
                            )
                        }

                        // **CRITICAL FIX**: Always send a final completion signal when JSON is complete
                        // This ensures cleanup is triggered even if all diff pairs were sent during streaming
                        this.#logging.info(
                            `[AgenticChatEventParser] 🏁 Sending final completion signal for fsReplace ${toolUseId} (isComplete=true)`
                        )

                        const finalChunkPayload = {
                            toolUseId: toolUseId,
                            toolName: 'fsReplace',
                            filePath: path,
                            content: '', // Empty content for completion signal
                            isComplete: true, // **CRITICAL**: This triggers cleanup
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

                        this.#logging.info(
                            `[AgenticChatEventParser] ✅ Final completion signal sent for fsReplace ${toolUseId}`
                        )
                    }
                } catch (parseError) {
                    this.#logging.error(
                        `[AgenticChatEventParser] ❌ Failed to parse complete fsReplace JSON: ${parseError}`
                    )
                }
            } else {
                // **STREAMING JSON**: Extract and send complete diff pairs as they become available
                this.#logging.debug(
                    `[AgenticChatEventParser] 🔍 Processing streaming fsReplace JSON for complete diff pairs`
                )

                const completeDiffPairs = this.#extractNewCompleteDiffPairs(path, accumulatedInput)

                if (completeDiffPairs.length > 0) {
                    this.#logging.info(
                        `[AgenticChatEventParser] 🔄 Found ${completeDiffPairs.length} complete diff pairs during streaming`
                    )

                    // Filter out already-sent diff pairs and send only new ones
                    const newDiffPairs: Array<{ oldStr: string; newStr: string; index: number }> = []
                    for (let i = 0; i < completeDiffPairs.length; i++) {
                        const { oldStr, newStr } = completeDiffPairs[i]
                        if (!this.#isDiffPairAlreadySent(path, oldStr, newStr)) {
                            newDiffPairs.push({ oldStr, newStr, index: i })
                        } else {
                            this.#logging.debug(
                                `[AgenticChatEventParser] 🔄 Skipping already-sent streaming diff pair ${i + 1}/${completeDiffPairs.length}`
                            )
                        }
                    }

                    if (newDiffPairs.length > 0) {
                        this.#logging.info(
                            `[AgenticChatEventParser] 🔄 Sending ${newDiffPairs.length} NEW streaming diff pairs`
                        )

                        // Send each NEW complete diff pair as a separate animation chunk with smart throttling
                        const session = this.#getOrCreateFsReplaceSession(path, toolUseId)
                        for (let i = 0; i < newDiffPairs.length; i++) {
                            const { oldStr, newStr, index } = newDiffPairs[i]

                            // **SMART THROTTLING**: Only add delay if time interval is too short
                            const now = Date.now()
                            const timeSinceLastSend = session.lastSendTime
                            const minInterval = 250 // 250ms minimum interval for session initialization

                            if (timeSinceLastSend > 0 && now - timeSinceLastSend < minInterval) {
                                const delayNeeded = minInterval - (now - timeSinceLastSend)
                                this.#logging.info(
                                    `[AgenticChatEventParser] ⏱️ Smart throttling (streaming): waiting ${delayNeeded}ms before sending diff pair ${index + 1}/${completeDiffPairs.length} (last sent ${now - timeSinceLastSend}ms ago)`
                                )
                                await new Promise(resolve => setTimeout(resolve, delayNeeded))
                            }

                            // Update last send time
                            session.lastSendTime = Date.now()

                            // Mark as sent before sending to avoid race conditions
                            this.#markDiffPairAsSent(path, oldStr, newStr)

                            // **CRITICAL FIX**: Never mark streaming diff pairs as complete
                            // Only the final complete JSON should trigger cleanup

                            // Send diff pair for immediate animation
                            this.#logging.info(
                                `[AgenticChatEventParser] 🎬 STREAMING ANIMATION: Sending diff pair ${index + 1} for streaming animation (never marked complete during streaming)`
                            )
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
                    } else {
                        this.#logging.debug(
                            `[AgenticChatEventParser] 🔄 All streaming diff pairs already sent - no new ones to send`
                        )
                    }
                } else {
                    // If no complete pairs found, skip this chunk (wait for more data)
                    this.#logging.debug(
                        `[AgenticChatEventParser] 🔍 No complete diff pairs found, waiting for more data`
                    )
                }
            }
        } catch (error) {
            this.#logging.error(`[AgenticChatEventParser] Failed to process fsReplace streaming: ${error}`)
        }
    }

    /**
     * **DEDICATED**: Handle fsWrite streaming with progressive content updates
     * Completely separate from fsReplace logic to avoid conflicts
     * Throttled to ensure at least 40ms between deliveries to prevent race conditions
     */
    async #sendFsWriteStreaming(toolUseId: string, accumulatedInput: string, isComplete: boolean): Promise<void> {
        if (!this.#features?.chat) {
            return
        }

        try {
            // **THROTTLING**: Only for fsWrite to prevent overwhelming the UI
            const now = Date.now()
            const timeSinceLastChunk = now - this.#lastStreamingChunkTime
            const minInterval = 40 // 40ms minimum interval for fsWrite

            if (!isComplete && timeSinceLastChunk < minInterval) {
                const delayNeeded = minInterval - timeSinceLastChunk
                this.#logging.debug(
                    `[AgenticChatEventParser] ⏱️ Throttling fsWrite streaming chunk for ${toolUseId}: waiting ${delayNeeded}ms`
                )
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

            // If we don't have complete JSON or parsing failed, try progressive extraction
            if (!path || content === undefined) {
                if (!path) {
                    // **WINDOWS COMPATIBILITY FIX**: Handle escaped backslashes in Windows paths
                    // Windows paths like "C:\\Users\\file.txt" are escaped as "C:\\\\Users\\\\file.txt" in JSON
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

                // Determine content field based on command type
                if (command === 'create') {
                    contentField = 'fileText'
                } else if (command === 'append') {
                    contentField = 'newStr'
                } else if (command === 'insert') {
                    contentField = 'newStr'
                } else {
                    // Handle cases with no command field - prioritize fileText for file creation
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

                    // Don't send empty content for strReplace/append/insert commands unless complete
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
                        this.#logging.info(
                            `[AgenticChatEventParser] ✅ Sent final cleanup chunk for ${toolUseId} (no path)`
                        )
                    } catch (error) {
                        this.#logging.error(`[AgenticChatEventParser] Failed to send final cleanup chunk: ${error}`)
                    }
                }
                return
            }

            const finalContent = content || ''

            // **DEBUG: Print the streaming chunk before sending**
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

            this.#logging.info(`[AgenticChatEventParser] DEBUG - fsWrite streaming chunk payload:`)
            this.#logging.info(`[AgenticChatEventParser]   toolUseId: ${streamingChunkPayload.toolUseId}`)
            this.#logging.info(`[AgenticChatEventParser]   toolName: ${streamingChunkPayload.toolName}`)
            this.#logging.info(`[AgenticChatEventParser]   filePath: ${streamingChunkPayload.filePath}`)
            this.#logging.info(
                `[AgenticChatEventParser]   content: "${streamingChunkPayload.content?.substring(0, 100)}${streamingChunkPayload.content && streamingChunkPayload.content.length > 100 ? '...' : ''}"`
            )
            this.#logging.info(`[AgenticChatEventParser]   isComplete: ${streamingChunkPayload.isComplete}`)
            this.#logging.info(
                `[AgenticChatEventParser]   fsWriteParams: ${JSON.stringify(streamingChunkPayload.fsWriteParams, null, 2)}`
            )
            this.#logging.info(`[AgenticChatEventParser]   chunkSize: ${streamingChunkPayload.chunkSize}`)

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
     * **DISPATCHER**: Route streaming chunks to appropriate dedicated handlers
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

        this.#logging.info(
            `[AgenticChatEventParser] 🚦 DISPATCHER: Routing ${toolName} streaming chunk for ${toolUseId} (complete: ${isComplete})`
        )

        try {
            if (toolName === 'fsReplace') {
                // **DEDICATED**: Route to fsReplace handler - NO fsWrite logic interference
                await this.#sendFsReplaceStreaming(toolUseId, accumulatedInput, isComplete)
            } else if (toolName === 'fsWrite') {
                // **DEDICATED**: Route to fsWrite handler - NO fsReplace logic interference
                await this.#sendFsWriteStreaming(toolUseId, accumulatedInput, isComplete)
            } else {
                this.#logging.debug(`[AgenticChatEventParser] 🚦 DISPATCHER: Unsupported tool name: ${toolName}`)
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

                // **CRITICAL DEBUG**: Log every toolUseEvent to track when stop becomes true
                this.#logging.info(
                    `[AgenticChatEventParser] 🔧 ToolUseEvent for ${toolUseId}: name=${name}, stop=${!!toolUseEvent.stop}, inputLength=${input?.length || 0}, totalInputLength=${String(this.toolUses[toolUseId].input || '').length}`
                )

                // **ADDITIONAL DEBUG**: Track when stop becomes true for fsReplace
                if (name === 'fsReplace' && toolUseEvent.stop) {
                    this.#logging.info(
                        `[AgenticChatEventParser] 🏁 STOP=TRUE detected for fsReplace ${toolUseId}! This should trigger final cleanup.`
                    )
                }

                // Send streaming chunk for fsWrite and fsReplace tools
                if ((name === 'fsWrite' || name === 'fsReplace') && this.#features?.chat && input) {
                    const isComplete = !!toolUseEvent.stop
                    this.#logging.info(
                        `[AgenticChatEventParser] 🔄 Sending ${name} streaming chunk for ${toolUseId}, isComplete: ${isComplete}, inputLength: ${String(this.toolUses[toolUseId].input || '').length}`
                    )

                    this.#sendStreamingChunk(
                        toolUseId,
                        name,
                        String(this.toolUses[toolUseId].input || ''),
                        isComplete
                    ).catch(error => {
                        this.#logging.error(`[AgenticChatEventParser] Failed to send ${name} streaming chunk: ${error}`)
                    })
                }
                // **CRITICAL DEBUG**: Special handling when toolUseEvent.stop is true
                if (toolUseEvent.stop) {
                    // For fsWrite and fsReplace, ensure we send a final chunk even if no input in this event
                    if ((name === 'fsWrite' || name === 'fsReplace') && this.#features?.chat && !input) {
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

                // NOTE: fsReplace animation is now handled via the new diff pair approach
                // in #sendStreamingChunk method, so no additional processing needed here

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
}
