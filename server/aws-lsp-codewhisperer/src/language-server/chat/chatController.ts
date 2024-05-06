import { EditorState, GenerateAssistantResponseCommandOutput } from '@amzn/codewhisperer-streaming'
import { ChatParams, CursorState } from '@aws/language-server-runtimes-types'
import { chatRequestType } from '@aws/language-server-runtimes/protocol'
import {
    CancellationToken,
    Chat,
    ChatResult,
    EndChatParams,
    ErrorCodes,
    ResponseError,
    TabAddParams,
    TabRemoveParams,
    TextDocumentIdentifier,
} from '@aws/language-server-runtimes/server-interface'
import { Features, LspHandlers, Result } from '../types'
import { ChatEventParser } from './chatEventParser'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { DocumentContextExtractor } from './contexts/documentContext'
import { convertChatParamsToRequestInput } from './utils'

type ChatHandlers = LspHandlers<Chat>

export class ChatController implements ChatHandlers {
    #features: Features
    #chatSessionManagementService: ChatSessionManagementService
    #documentContextExtractor: DocumentContextExtractor

    constructor(chatSessionManagementService: ChatSessionManagementService, features: Features) {
        this.#features = features
        this.#chatSessionManagementService = chatSessionManagementService
        this.#documentContextExtractor = new DocumentContextExtractor()
    }

    async onChatPrompt(params: ChatParams, token: CancellationToken): Promise<ChatResult | ResponseError<ChatResult>> {
        const sessionResult = this.#chatSessionManagementService.getSession(params.tabId)

        const { data: session } = sessionResult

        if (!session) {
            this.#log('Session not found for tabId', params.tabId)
            return new ResponseError<ChatResult>(
                ErrorCodes.InvalidParams,
                'error' in sessionResult ? sessionResult.error : 'Unknown error'
            )
        }

        token.onCancellationRequested(() => {
            this.#log('cancellation requested')
            session.abortRequest()
        })

        const editorState = await this.#extractEditorState(params.textDocument, params.cursorState)
        const requestInput = convertChatParamsToRequestInput(params, editorState)

        if (!requestInput.success) {
            this.#log(requestInput.error)
            return new ResponseError<ChatResult>(ErrorCodes.InvalidParams, requestInput.error)
        }

        let response: GenerateAssistantResponseCommandOutput

        try {
            this.#log('Request from tab:', params.tabId, JSON.stringify(requestInput.data))
            response = await session.generateAssistantResponse(requestInput.data)
            this.#log('Response to tab:', params.tabId, JSON.stringify(response.$metadata))
        } catch (err) {
            this.#log(`Q api request error ${err instanceof Error ? err.message : 'unknown'}`)

            return new ResponseError<ChatResult>(
                ErrorCodes.InternalError,
                err instanceof Error ? err.message : 'Internal Server Error'
            )
        }

        const result = await this.#processAssistantResponse(response, params.partialResultToken)

        return result.success
            ? result.data
            : new ResponseError<ChatResult>(ErrorCodes.InternalError, result.error, result.data)
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

    onSendFeedback() {}

    onQuickAction(): never {
        throw new Error('Method not implemented.')
    }

    onReady() {}
    onSourceLinkClick() {}

    onTabAdd(params: TabAddParams) {
        this.#chatSessionManagementService.createSession(params.tabId)
    }

    onTabChange() {}

    onTabRemove(params: TabRemoveParams) {
        this.#chatSessionManagementService.deleteSession(params.tabId)
    }

    onVote() {}

    async #extractEditorState(
        identifier?: TextDocumentIdentifier,
        cursorState?: CursorState[]
    ): Promise<EditorState | undefined> {
        if (!identifier || !Array.isArray(cursorState) || cursorState.length === 0) {
            return
        }
        const textDocument = await this.#features.workspace.getTextDocument(identifier.uri)

        return textDocument && (await this.#documentContextExtractor.extractEditorState(textDocument, cursorState[0]))
    }

    async #processAssistantResponse(
        response: GenerateAssistantResponseCommandOutput,
        partialResultToken?: string | number
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

    #log(...messages: string[]) {
        this.#features.logging.log(messages.join(' '))
    }
}
