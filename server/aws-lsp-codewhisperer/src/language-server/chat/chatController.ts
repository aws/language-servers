import {
    GenerateAssistantResponseCommandInput,
    GenerateAssistantResponseCommandOutput,
} from '@amzn/codewhisperer-streaming'
import { chatRequestType } from '@aws/language-server-runtimes/protocol'
import {
    CancellationToken,
    Chat,
    ChatParams,
    ChatResult,
    EndChatParams,
    ErrorCodes,
    LSPErrorCodes,
    QuickActionParams,
    ResponseError,
    TabAddParams,
    TabRemoveParams,
    TabChangeParams,
} from '@aws/language-server-runtimes/server-interface'
import { v4 as uuid } from 'uuid'
import { AddMessageEvent, ChatTelemetryEventName, StartConversationEvent } from '../telemetry/types'
import { Features, LspHandlers, Result } from '../types'
import { ChatEventParser } from './chatEventParser'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatTelemetryController } from './chatTelemetryController'
import { QAPIInputConverter } from './qAPIInputConverter'
import { HELP_MESSAGE, QuickAction } from './quickActions'
import { createAuthFollowUpResult, getAuthFollowUpType, getErrorMessage } from '../utils'
import { Metric } from '../telemetry/metric'

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
        const metric = new Metric<AddMessageEvent>()

        const sessionResult = this.#chatSessionManagementService.getSession(params.tabId)

        const { data: session } = sessionResult

        if (!session) {
            this.#log('Get session error', params.tabId)
            return new ResponseError<ChatResult>(
                ErrorCodes.InvalidParams,
                'error' in sessionResult ? sessionResult.error : 'Unknown error'
            )
        }

        let aborted = false

        token.onCancellationRequested(() => {
            this.#log('cancellation requested')
            session.abortRequest()
            aborted = true
        })

        let requestInput: GenerateAssistantResponseCommandInput

        let newConversationMetric = !this.#telemetryController.getConversationId(params.tabId)
            ? new Metric<StartConversationEvent>()
            : undefined

        try {
            const inputResult = await this.#qAPIInputConverter.convertChatParamsToInput(params, newConversationMetric)

            if (!inputResult.success) {
                throw new Error(inputResult.error)
            }

            metric.setDimension(
                'cwsprChatRequestLength',
                inputResult.data.conversationState?.currentMessage?.userInputMessage?.content?.length ?? 0
            )

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
            metric.recordStart()

            response = await session.generateAssistantResponse(requestInput)
            this.#log('Response to tab:', params.tabId, JSON.stringify(response.$metadata))
        } catch (err) {
            const authFollowType = getAuthFollowUpType(err)

            if (authFollowType) {
                this.#log(`Q auth error: ${getErrorMessage(err)}`)

                return createAuthFollowUpResult(authFollowType)
            }

            this.#log(`Q api request error ${err instanceof Error ? err.message : 'unknown'}`)
            return new ResponseError<ChatResult>(
                LSPErrorCodes.RequestFailed,
                err instanceof Error ? err.message : 'Unknown request error'
            )
        }

        if (response.conversationId) {
            this.#telemetryController.setConversationId(params.tabId, response.conversationId)
        }

        if (newConversationMetric) {
            this.#telemetryController.emitConversationMetric({
                name: ChatTelemetryEventName.StartConversation,
                data: metric.metric,
            })
        }

        if (aborted) {
            return new ResponseError<ChatResult>(LSPErrorCodes.RequestCancelled, 'Request cancelled')
        }

        try {
            const result = await this.#processAssistantResponse(response, metric, params.partialResultToken)

            this.#telemetryController.emitConversationMetric({
                name: ChatTelemetryEventName.AddMessage,
                data: metric.metric,
            })

            if (aborted) {
                return new ResponseError<ChatResult>(LSPErrorCodes.RequestCancelled, 'Request cancelled')
            }

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

                this.#telemetryController.removeConversationId(params.tabId)

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
        metric: Metric<AddMessageEvent>,
        partialResultToken?: string | number
    ): Promise<Result<ChatResult, string>> {
        const requestId = response.$metadata.requestId!
        const chatEventParser = new ChatEventParser(requestId, metric)

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

        metric.setDimension('cwsprChatFullResponseLatency', metric.getTimeElapsed())

        return chatEventParser.getChatResult()
    }

    #log(...messages: string[]) {
        this.#features.logging.log(messages.join(' '))
    }
}
