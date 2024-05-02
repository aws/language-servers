import { GenerateAssistantResponseCommandOutput } from '@amzn/codewhisperer-streaming'
import { chatRequestType } from '@aws/language-server-runtimes/protocol'
import {
    CancellationToken,
    Chat,
    ChatParams,
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

    onEndChat(params: EndChatParams, _token: CancellationToken): boolean {
        const { success } = this.#chatSessionManagementService.deleteSession(params.tabId)

        return success
    }

    async onChatPrompt(params: ChatParams, token: CancellationToken): Promise<ResponseError<ChatResult> | ChatResult> {
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

        const documentIdentifier = (params as any)?.textDocument as TextDocumentIdentifier | undefined

        const textDocument =
            documentIdentifier && (await this.#features.workspace.getTextDocument(documentIdentifier.uri))
        const editorState =
            textDocument &&
            (params as any).cursorState &&
            (await extractEditorState(textDocument, (params as any).cursorState))

        this.#log(`Editor context ${editorState ? JSON.stringify(editorState, null, 4) : undefined}`)

        const requestInput = convertChatParamsToRequestInput(params, editorState)

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

        const result = await this.#processAssistantResponse(response)

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
