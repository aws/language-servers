import { ChatResponseStream, Reference, SupplementaryWebLink } from '@amzn/codewhisperer-streaming'
import {
    ChatItemAction,
    ChatResult,
    ReferenceTrackerInformation,
    SourceLink,
} from '@aws/language-server-runtimes/protocol'
import { Result } from '../types'
import { AddMessageEvent } from '../telemetry/types'
import { Metric } from '../telemetry/metric'

export class ChatEventParser implements ChatResult {
    static readonly FOLLOW_UP_TEXT = 'Suggested follow up questions:'

    error?: string
    messageId?: string
    body?: string
    canBeVoted?: boolean
    relatedContent?: { title?: string; content: SourceLink[] }
    followUp?: { text?: string; options?: ChatItemAction[] }
    codeReference?: ReferenceTrackerInformation[]

    #metric: Metric<AddMessageEvent>
    #lastChunkTime: number = 0
    #totalEvents = {
        followupPromptEvent: 0,
        supplementaryWebLinksEvent: 0,
        codeReferenceEvent: 0,
        assistantResponseEvent: 0,
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
            information: ChatEventParser.getReferencedInformation(reference),
        }
    }

    constructor(messageId: string, metric: Metric<AddMessageEvent>) {
        this.messageId = messageId
        this.#metric = metric
    }

    public get totalEvents() {
        return this.#totalEvents
    }

    public processPartialEvent(chatEvent: ChatResponseStream): Result<ChatResult, string> {
        const {
            followupPromptEvent,
            supplementaryWebLinksEvent,
            codeReferenceEvent,
            assistantResponseEvent,
            error,
            invalidStateEvent,
        } = chatEvent

        if (!this.#metric.metric.cwsprTimeToFirstChunk) {
            this.#metric.mergeWith({
                cwsprTimeToFirstChunk: this.#metric.getTimeElapsed(),
                cwsprChatTimeBetweenChunks: [],
            })
        } else {
            this.#metric.mergeWith({
                cwsprChatTimeBetweenChunks: [Date.now() - this.#lastChunkTime],
            })
        }

        this.#lastChunkTime = Date.now()

        if (error) {
            this.error = error.message
        } else if (invalidStateEvent) {
            this.error = invalidStateEvent.message ?? invalidStateEvent.reason ?? 'Invalid state'
        } else if (assistantResponseEvent?.content) {
            this.#totalEvents.assistantResponseEvent += 1
            this.body = (this.body ?? '') + assistantResponseEvent.content
        } else if (followupPromptEvent?.followupPrompt) {
            this.#totalEvents.followupPromptEvent += 1
            const { content } = followupPromptEvent.followupPrompt

            this.followUp = {
                text: ChatEventParser.FOLLOW_UP_TEXT,
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
            const sourceLinks = supplementaryWebLinksEvent.supplementaryWebLinks.map(ChatEventParser.mapRelatedData)

            this.relatedContent = {
                ...this.relatedContent,
                content: [...(this.relatedContent?.content ?? []), ...sourceLinks],
            }
        } else if (codeReferenceEvent?.references && codeReferenceEvent.references.length > 0) {
            this.#totalEvents.codeReferenceEvent += 1
            const references = codeReferenceEvent.references.map(ChatEventParser.mapReferenceData)
            this.codeReference = [...(this.codeReference ?? []), ...references]
        }

        return this.getChatResult()
    }

    public getChatResult(): Result<ChatResult, string> {
        const chatResult: ChatResult = {
            messageId: this.messageId,
            body: this.body,
            canBeVoted: this.canBeVoted ?? true,
            relatedContent: this.relatedContent,
            followUp: this.followUp,
            codeReference: this.codeReference,
        }

        return this.error
            ? {
                  success: false,
                  data: chatResult,
                  error: this.error,
              }
            : {
                  success: true,
                  data: chatResult,
              }
    }
}
