import { GenerateAssistantResponseCommandOutput } from '@amzn/codewhisperer-streaming'
import { TabRemoveParams, chatRequestType } from '@aws/language-server-runtimes/protocol'
import {
    CancellationToken,
    Chat,
    ChatParams,
    ChatResult,
    EndChatParams,
    ErrorCodes,
    ResponseError,
    TabAddParams,
} from '@aws/language-server-runtimes/server-interface'
import { EnsurePromise, Features, HandlerReturnType, LspHandlers, Result } from '../types'
import { ChatEventParser } from './chatEventParser'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { convertChatParamsToRequestInput } from './utils'

type ChatHandlers = LspHandlers<Pick<Chat, 'onTabAdd' | 'onTabRemove' | 'onChatPrompt' | 'onEndChat'>>

export class ChatController implements ChatHandlers {
    #features: Features
    #chatSessionManagementService: ChatSessionManagementService

    constructor(chatSessionManagementService: ChatSessionManagementService, features: Features) {
        this.#features = features
        this.#chatSessionManagementService = chatSessionManagementService
    }

    #log(message: string) {
        this.#features.logging.log(message)
    }

    onTabAdd(params: TabAddParams) {
        this.#chatSessionManagementService.createSession(params.tabId)
    }

    onTabRemove(params: TabRemoveParams) {
        this.#chatSessionManagementService.deleteSession(params.tabId)
    }

    onEndChat(params: EndChatParams, _token: CancellationToken): HandlerReturnType<ChatHandlers, 'onEndChat'> {
        const { success } = this.#chatSessionManagementService.deleteSession(params.tabId)

        return success
    }

    async onChatPrompt(
        params: ChatParams,
        token: CancellationToken
    ): EnsurePromise<HandlerReturnType<ChatHandlers, 'onChatPrompt'>> {
        const sessionResult = this.#chatSessionManagementService.getSession(params.tabId)

        const { data: session } = sessionResult

        if (!session) {
            this.#log(`Session not found for tabId: ${params.tabId}`)
            return new ResponseError<ChatResult>(
                ErrorCodes.InvalidParams,
                'error' in sessionResult ? sessionResult.error : 'Unknown error'
            )
        }

        token.onCancellationRequested(() => {
            this.#log('cancellation requested')
            session.abortRequest()
        })

        const requestInput = convertChatParamsToRequestInput(params)

        if (!requestInput.success) {
            this.#log(requestInput.error)
            return new ResponseError<ChatResult>(ErrorCodes.InvalidParams, requestInput.error)
        }

        let response: GenerateAssistantResponseCommandOutput

        try {
            response = await session.generateAssistantResponse(requestInput.data)
        } catch (err) {
            this.#log(`Q api request error ${err instanceof Error ? err.message : 'unknown'}`)

            return new ResponseError<ChatResult>(
                ErrorCodes.InternalError,
                err instanceof Error ? err.message : 'Internal Server Error'
            )
        }

        const result = await this.#processAssistantResponse(response, (params as any).partialResultToken)

        return result.success
            ? result.data
            : new ResponseError<ChatResult>(ErrorCodes.InternalError, result.error, result.data)
    }

    async #processAssistantResponse(
        response: GenerateAssistantResponseCommandOutput,
        partialResultToken?: string
    ): Promise<Result<ChatResult, string>> {
        const chatEventParser = new ChatEventParser(response.$metadata.requestId!)

        for await (const chatEvent of response.generateAssistantResponseResponse!) {
            this.#log('Streaming partial chat event')

            const chatResult = chatEventParser.processPartialEvent(chatEvent)

            // terminate early when there is an error
            if (!chatResult.success) {
                return chatResult
            }

            if (partialResultToken) {
                this.#features.lsp.sendProgress(chatRequestType, partialResultToken, chatResult.data)
            }
        }

        return chatEventParser.getChatResult()
    }
}
