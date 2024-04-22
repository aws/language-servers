import {
    FollowupPrompt,
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
    Reference,
    SupplementaryWebLink,
} from '@amzn/codewhisperer-streaming'
import { ChatParams, ChatPrompt, EndChatParams } from '@aws/language-server-runtimes/protocol'
import { CancellationToken, CredentialsProvider, Server } from '@aws/language-server-runtimes/server-interface'
import { ChatSessionManagementService } from './chat/chatSessionManagementService'

const ClearChatCommand = 'aws/chat/clearChat'
const CancelChatRequestCommand = 'aws/chat/clearChatRequest'
const ASSISTANT_RESPONSE_PROGRESS = 'aws/chat/assistantResponseProgress'

function normalizeReferenceData(reference: Reference): Reference {
    return {
        ...reference,
        recommendationContentSpan: {
            start: reference.recommendationContentSpan?.start ?? 0,
            end: reference.recommendationContentSpan?.end ?? 0,
        },
        // information: `Reference code under **${reference.licenseName}** license from repository \`${reference.repository}\``,
    }
}

export const ChatServerToken =
    (service: (credentialsProvider: CredentialsProvider) => ChatSessionManagementService): Server =>
    ({ chat, credentialsProvider, workspace, logging, lsp, telemetry }) => {
        const codewhispererclient = service(credentialsProvider)

        // const onExecuteCommandHandler = async (
        //     params: ExecuteCommandParams,
        //     _token: CancellationToken
        // ): Promise<any> => {
        //     return void 0
        // }
        // const onInitializeHandler = () => {
        //     return {
        //         capabilities: {
        //             executeCommandProvider: {
        //                 commands: [],
        //             },
        //         },
        //     }
        // }

        // lsp.onExecuteCommand(onExecuteCommandHandler)
        // lsp.addInitializer(onInitializeHandler)

        chat.onEndChat((params: EndChatParams, _token: CancellationToken) => {
            codewhispererclient.deleteSession(params.tabId)

            return true
        })

        chat.onChatPrompt(async (params: ChatParams, _token: CancellationToken) => {
            logging.log('received chat prompt')
            console.log(params)
            await new Promise(resolve => setTimeout(resolve, 2000))
            const session = codewhispererclient.getSession(params.tabId)

            let response: GenerateAssistantResponseCommandOutput

            try {
                response = await session.generateAssistantResponse(transformChatPromptToRequest(params.prompt))
            } catch (e) {
                logging.log('generate assistant response error')
                console.log(e)

                return {}
            }

            let message = ''
            const codeReference: Reference[] = []
            let followupPrompt: FollowupPrompt | undefined = undefined
            const supplementaryWebLinks: SupplementaryWebLink[] = []

            for await (const chatEvent of response.generateAssistantResponseResponse!) {
                logging.log('recevied partial chat event')

                const { followupPromptEvent, supplementaryWebLinksEvent, codeReferenceEvent, assistantResponseEvent } =
                    chatEvent

                if (assistantResponseEvent?.content) {
                    message += assistantResponseEvent.content

                    console.log('partial message', assistantResponseEvent)

                    // what are these parameters?
                    // lsp.sendProgress(ASSISTANT_RESPONSE_PROGRESS, 0, message);
                }

                if (followupPromptEvent?.followupPrompt) {
                    const { content, userIntent } = followupPromptEvent.followupPrompt

                    console.log('partial follow up prompt', content)
                    if (!followupPrompt) {
                        followupPrompt = {
                            content,
                            userIntent,
                        }
                    } else {
                        followupPrompt.content = content
                        followupPrompt.userIntent = userIntent
                    }
                }

                if (
                    supplementaryWebLinksEvent?.supplementaryWebLinks &&
                    supplementaryWebLinksEvent.supplementaryWebLinks.length > 0
                ) {
                    console.log('partial supplementary web links', supplementaryWebLinksEvent.supplementaryWebLinks)
                    supplementaryWebLinks.push(...supplementaryWebLinksEvent.supplementaryWebLinks)
                }

                if (codeReferenceEvent?.references && codeReferenceEvent.references.length > 0) {
                    console.log('partial code reference', codeReferenceEvent.references)
                    codeReference.push(
                        ...codeReferenceEvent.references.map(reference => normalizeReferenceData(reference))
                    )
                }
            }

            return {
                body: message,
                messageId: response.$metadata.requestId,
            }
        })

        logging.log('Chat server has been initialized')

        return () => {
            codewhispererclient.dispose()
        }
    }

function transformChatPromptToRequest(prompt: ChatPrompt): GenerateAssistantResponseCommandInput {
    if (prompt.command) {
        throw new Error('Not implemented')
    } else if (prompt.prompt) {
        return {
            conversationState: {
                chatTriggerType: 'MANUAL',
                currentMessage: {
                    userInputMessage: {
                        content: prompt.prompt,
                        // editorState and diagnostic as well
                    },
                },
            },
        }
    }

    throw new Error('Invalid prompt')
}
