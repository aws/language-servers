import { ChatResponseStream, Reference, SupplementaryWebLink } from '@amzn/codewhisperer-streaming'
import {
    ChatItemAction,
    ChatResult,
    ReferenceTrackerInformation,
    SourceLink,
} from '@aws/language-server-runtimes/protocol'

export class ChatEventParser implements ChatResult {
    messageId?: string
    body?: string
    canBeVoted?: boolean
    relatedContent?: { title?: string; content: SourceLink[] }
    followUp?: { text?: string; options?: ChatItemAction[] }
    codeReference?: ReferenceTrackerInformation[]

    static #mapRelatedData({ title = '', url = '', snippet }: SupplementaryWebLink): SourceLink {
        return {
            title,
            url,
            body: snippet,
        }
    }
    static #mapReferenceData(reference: Reference): ReferenceTrackerInformation {
        return {
            ...reference,
            information: `Reference code under **${reference.licenseName}** license from repository \`${reference.repository}\``,
        }
    }

    constructor(messageId: string) {
        this.messageId = messageId
    }

    public processPartialEvent(chatEvent: ChatResponseStream): ChatResult {
        const { followupPromptEvent, supplementaryWebLinksEvent, codeReferenceEvent, assistantResponseEvent } =
            chatEvent

        if (assistantResponseEvent?.content) {
            this.body = (this.body ?? '') + assistantResponseEvent.content
        }

        if (followupPromptEvent?.followupPrompt) {
            const { content } = followupPromptEvent.followupPrompt

            this.followUp = {
                ...this.followUp,
                options: [
                    ...(this.followUp?.options ?? []),
                    {
                        pillText: content ?? '',
                        prompt: content ?? '',
                    },
                ],
            }
        }

        if (
            supplementaryWebLinksEvent?.supplementaryWebLinks &&
            supplementaryWebLinksEvent.supplementaryWebLinks.length > 0
        ) {
            const sourceLinks = supplementaryWebLinksEvent.supplementaryWebLinks.map(ChatEventParser.#mapRelatedData)

            this.relatedContent = {
                ...this.relatedContent,
                content: [...(this.relatedContent?.content ?? []), ...sourceLinks],
            }
        }

        if (codeReferenceEvent?.references && codeReferenceEvent.references.length > 0) {
            const references = codeReferenceEvent.references.map(ChatEventParser.#mapReferenceData)
            this.codeReference = [...(this.codeReference ?? []), ...references]
        }

        return this.getChatResult()
    }

    public getChatResult(): ChatResult {
        return {
            messageId: this.messageId,
            body: this.body,
            canBeVoted: this.canBeVoted,
            relatedContent: this.relatedContent,
            followUp: this.followUp,
            codeReference: this.codeReference,
        }
    }
}
