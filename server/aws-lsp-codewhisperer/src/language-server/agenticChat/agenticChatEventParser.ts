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

    constructor(messageId: string, metric: Metric<AddMessageEvent>, logging: Features['logging']) {
        this.messageId = messageId
        this.#metric = metric
        this.#logging = logging
    }

    public get totalEvents() {
        return this.#totalEvents
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

    /**
     * Finalizes parsing after the response stream has been fully consumed.
     *
     * A tool use only becomes executable once its terminating `stop` event arrives — that
     * is also the only point at which its streamed input is JSON-parsed. If the stream ends
     * before that event (for example, the response reaches the output-token limit mid
     * tool-input), the tool use is left with `stop === false` and no error is recorded, so
     * `getResult()` reports success. The agentic loop then filters it out (only stopped tool
     * uses are treated as pending) and completes the turn without ever running the tool — a
     * silent no-op with no error and no retry.
     *
     * To avoid that, treat any still-unstopped tool use as incomplete/truncated input:
     * record an error (reusing the malformed-JSON prefix so it is handled by the existing
     * recovery branch) and mark it `stop` so it survives the pending-tool-use filter and the
     * model is re-prompted to split the work into smaller tool uses.
     */
    public finalize(): Result<ChatResultWithMetadata, string> {
        for (const toolUseId of Object.keys(this.toolUses)) {
            const toolUse = this.toolUses[toolUseId]
            if (!toolUse.stop) {
                const received = typeof toolUse.input === 'string' ? toolUse.input.length : 0
                this.#logging.error(
                    `ToolUse ${toolUseId} (${toolUse.name}) stream ended before a stop event after ${received} characters; input was truncated`
                )
                // Reuse the malformed-JSON error prefix so this routes into the same recovery
                // branch in the agentic loop. Keep the message short so the (potentially very
                // large) partial input is not echoed back to the model in the tool result.
                this.error = `ToolUse input is invalid JSON: incomplete tool input, stream ended after ${received} characters before completion.`
                this.toolUses[toolUseId] = {
                    ...toolUse,
                    input: {},
                    stop: true,
                }
            }
        }
        return this.getResult()
    }
}
