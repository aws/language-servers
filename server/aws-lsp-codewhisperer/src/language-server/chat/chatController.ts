import {
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { TabChangeParams, chatRequestType } from '@aws/language-server-runtimes/protocol'
import {
    CancellationToken,
    Chat,
    ChatParams,
    ChatResult,
    EndChatParams,
    ErrorCodes,
    QuickActionParams,
    ResponseError,
    TabAddParams,
    TabRemoveParams,
} from '@aws/language-server-runtimes/server-interface'
import { ChatTelemetryEventName } from '../telemetry/types'
import { Features, LspHandlers, Result } from '../types'
import { ChatEventParser } from './chatEventParser'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatTelemetryController } from './chatTelemetryController'
import { QAPIInputConverter } from './qAPIInputConverter'

type ChatHandlers = LspHandlers<Chat>

export class ChatController implements ChatHandlers {
    #features: Features
    #chatSessionManagementService: ChatSessionManagementService
    #qAPIInputConverter: QAPIInputConverter
    #telemetryController: ChatTelemetryController

    constructor(chatSessionManagementService: ChatSessionManagementService, features: Features) {
        this.#features = features
        this.#chatSessionManagementService = chatSessionManagementService
        this.#qAPIInputConverter = new QAPIInputConverter(features.workspace, features.logging)
        this.#telemetryController = new ChatTelemetryController(features.telemetry)
    }

    dispose() {
        this.#chatSessionManagementService.dispose()
        this.#qAPIInputConverter.dispose()
    }

    async onChatPrompt(params: ChatParams, token: CancellationToken): Promise<ChatResult | ResponseError<ChatResult>> {
        const sessionResult = this.#chatSessionManagementService.getSession(params.tabId)

        const { data: session } = sessionResult

        if (!session) {
            this.#log('Get session error', params.tabId)
            return new ResponseError<ChatResult>(
                ErrorCodes.InvalidParams,
                'error' in sessionResult ? sessionResult.error : 'Unknown error'
            )
        }

        let requestInput: GenerateAssistantResponseCommandInput

        try {
            const inputResult = await this.#qAPIInputConverter.convertChatParamsToInput(params)

            if (!inputResult.success) {
                throw new Error(inputResult.error)
            }

            requestInput = inputResult.data
        } catch (e) {
            const error = e instanceof Error ? e.message : 'Failed to convert params to request input'
            this.#log(error)
            return new ResponseError<ChatResult>(ErrorCodes.InvalidParams, error)
        }

        token.onCancellationRequested(() => {
            this.#log('cancellation requested')
            session.abortRequest()
        })

        let response: GenerateAssistantResponseCommandOutput

        try {
            this.#log(
                'Request from tab:',
                params.tabId,
                'conversation id:',
                requestInput.conversationState?.conversationId ?? 'undefined'
            )

            response = await session.generateAssistantResponse(requestInput)
            this.#log('Response to tab:', params.tabId, JSON.stringify(response.$metadata))
        } catch (err) {
            this.#log(`Q api request error ${err instanceof Error ? err.message : 'unknown'}`)

            return new ResponseError<ChatResult>(
                ErrorCodes.InternalError,
                err instanceof Error ? err.message : 'Internal Server Error'
            )
        }

        if (response.conversationId) {
            this.#telemetryController.setConversationId(params.tabId, response.conversationId)
        }

        try {
            const result = await this.#processAssistantResponse(response, params.partialResultToken)
            return result.success
                ? result.data
                : new ResponseError<ChatResult>(ErrorCodes.InternalError, result.error, result.data)
        } catch (err) {
            this.#log('Error encountered during response streaming:', err instanceof Error ? err.message : 'unknown')

            return new ResponseError<ChatResult>(
                ErrorCodes.InternalError,
                err instanceof Error ? err.message : 'Internal Server Error'
            )
        }
    }

    onCodeInsertToCursorPosition() {}
    onCopyCodeToClipboard() {}

    onEndChat(params: EndChatParams, _token: CancellationToken): boolean {
        const { success } = this.#chatSessionManagementService.deleteSession(params.tabId)

        return success
    }

    onFollowUpClicked() {}

    onInfoLinkClick() {}

    onLinkClick() {}

    onReady() {}

    onSendFeedback() {}

    onSourceLinkClick() {}

    onTabAdd(params: TabAddParams) {
        this.#telemetryController.activeTabId = params.tabId

        this.#chatSessionManagementService.createSession(params.tabId)
    }

    onTabChange(params: TabChangeParams) {
        this.#telemetryController.emitConversationMetric({
            name: ChatTelemetryEventName.ExitFocusConversation,
            data: {},
        })

        this.#telemetryController.activeTabId = params.tabId

        this.#telemetryController.emitConversationMetric({
            name: ChatTelemetryEventName.EnterFocusConversation,
            data: {},
        })
    }

    onTabRemove(params: TabRemoveParams) {
        if (this.#telemetryController.activeTabId === params.tabId) {
            this.#telemetryController.activeTabId = undefined
            this.#telemetryController.emitConversationMetric({
                name: ChatTelemetryEventName.ExitFocusConversation,
                data: {},
            })
        }

        this.#chatSessionManagementService.deleteSession(params.tabId)
        this.#telemetryController.removeConversationId(params.tabId)
    }

    onQuickAction(_params: QuickActionParams, _cancellationToken: CancellationToken): never {
        throw new Error('Not implemented')
    }

    async #processAssistantResponse(
        response: GenerateAssistantResponseCommandOutput,
        partialResultToken?: string | number
    ): Promise<Result<ChatResult, string>> {
        const chatEventParser = new ChatEventParser(response.$metadata.requestId!)

        for await (const chatEvent of response.generateAssistantResponseResponse!) {
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

    #log(...messages: string[]) {
        this.#features.logging.log(messages.join(' '))
    }
}
