import {
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { LSPErrorCodes, TabChangeParams, chatRequestType } from '@aws/language-server-runtimes/protocol'
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
import { v4 as uuid } from 'uuid'
import { ChatTelemetryEventName } from '../telemetry/types'
import { Features, LspHandlers, Result } from '../types'
import { ChatEventParser } from './chatEventParser'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatTelemetryController } from './chatTelemetryController'
import { QAPIInputConverter } from './qAPIInputConverter'
import { HELP_MESSAGE, QuickAction } from './quickActions'
import { isAuthErrorMessage } from '../utils'
import { AUTH_FOLLOW_UP_RESULT } from './constants'

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
            this.#log('Request from tab:', params.tabId, 'conversation id:', session.sessionId ?? 'New session')

            response = await session.generateAssistantResponse(requestInput)
            this.#log('Response to tab:', params.tabId, JSON.stringify(response.$metadata))
        } catch (err) {
            if (err instanceof Error && isAuthErrorMessage(err.message)) {
                this.#log(`Q auth error: ${err.message}`)

                return AUTH_FOLLOW_UP_RESULT
            }

            this.#log(`Q api request error ${err instanceof Error ? err.message : 'unknown'}`)
            this.#log(`${err instanceof Error ? JSON.stringify(err) : ''}`)
            return new ResponseError<ChatResult>(
                LSPErrorCodes.RequestFailed,
                err instanceof Error ? err.message : 'Unknown request error'
            )
        }

        if (response.conversationId) {
            this.#telemetryController.setConversationId(params.tabId, response.conversationId)
        }

        try {
            const result = await this.#processAssistantResponse(response, params.partialResultToken)
            return result.success
                ? result.data
                : new ResponseError<ChatResult>(LSPErrorCodes.RequestFailed, result.error, result.data)
        } catch (err) {
            this.#log('Error encountered during response streaming:', err instanceof Error ? err.message : 'unknown')

            return new ResponseError<ChatResult>(
                LSPErrorCodes.RequestFailed,
                err instanceof Error ? err.message : 'Unknown error occured during response stream'
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
            this.#telemetryController.emitConversationMetric({
                name: ChatTelemetryEventName.ExitFocusConversation,
                data: {},
            })
            this.#telemetryController.activeTabId = undefined
        }

        this.#chatSessionManagementService.deleteSession(params.tabId)
        this.#telemetryController.removeConversationId(params.tabId)
    }

    onQuickAction(params: QuickActionParams, _cancellationToken: CancellationToken) {
        switch (params.quickAction) {
            case QuickAction.Clear: {
                const sessionResult = this.#chatSessionManagementService.getSession(params.tabId)

                sessionResult.data?.clear()

                return {}
            }

            case QuickAction.Help:
                return {
                    messageId: uuid(),
                    body: HELP_MESSAGE,
                }
        }

        return {}
    }

    async #processAssistantResponse(
        response: GenerateAssistantResponseCommandOutput,
        partialResultToken?: string | number
    ): Promise<Result<ChatResult, string>> {
        const requestId = response.$metadata.requestId!
        const chatEventParser = new ChatEventParser(requestId)

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

        if (partialResultToken) {
            this.#log(`All events received, requestId=${requestId}: ${JSON.stringify(chatEventParser.totalEvents)}`)
        }

        return chatEventParser.getChatResult()
    }

    #log(...messages: string[]) {
        this.#features.logging.log(messages.join(' '))
    }
}
