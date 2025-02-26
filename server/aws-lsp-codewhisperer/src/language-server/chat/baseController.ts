import {
    ApplyWorkspaceEditParams,
    FeedbackParams,
    InsertToCursorPositionParams,
    TextDocumentEdit,
    TextEdit,
} from '@aws/language-server-runtimes/protocol'
import {
    CancellationToken,
    Chat,
    ChatParams,
    ChatResult,
    EndChatParams,
    QuickActionParams,
    ResponseError,
    TabAddParams,
    TabRemoveParams,
    TabChangeParams,
} from '@aws/language-server-runtimes/server-interface'
import { ChatTelemetryEventName } from '../telemetry/types'
import { Features, LspHandlers } from '../types'
import { ChatSessionManagementService } from './chatSessionManagementService'
import { ChatTelemetryController } from './telemetry/chatTelemetryController'
import { QChatTriggerContext } from './contexts/triggerContext'
import { Q_CONFIGURATION_SECTION } from '../configuration/qConfigurationServer'
import { undefinedIfEmpty } from '../utilities/textUtils'
import { TelemetryService } from '../telemetryService'

type ChatHandlers = LspHandlers<Chat>

export abstract class BaseController implements ChatHandlers {
    features: Features
    chatSessionManagementService: ChatSessionManagementService
    telemetryController: ChatTelemetryController
    triggerContext: QChatTriggerContext
    customizationArn?: string
    telemetryService: TelemetryService

    constructor(
        chatSessionManagementService: ChatSessionManagementService,
        features: Features,
        telemetryService: TelemetryService
    ) {
        this.features = features
        this.chatSessionManagementService = chatSessionManagementService
        this.triggerContext = new QChatTriggerContext(features.workspace, features.logging)
        this.telemetryController = new ChatTelemetryController(features, telemetryService)
        this.telemetryService = telemetryService
    }

    dispose() {
        this.chatSessionManagementService.dispose()
        this.telemetryController.dispose()
    }

    async onChatPrompt(params: ChatParams, token: CancellationToken): Promise<ChatResult | ResponseError<ChatResult>> {
        return {} as ChatResult
    }

    async onCodeInsertToCursorPosition(params: InsertToCursorPositionParams) {
        // Implementation based on https://github.com/aws/aws-toolkit-vscode/blob/1814cc84228d4bf20270574c5980b91b227f31cf/packages/core/src/amazonq/commons/controllers/contentController.ts#L38
        if (!params.textDocument || !params.cursorPosition || !params.code) {
            const missingParams = []

            if (!params.textDocument) missingParams.push('textDocument')
            if (!params.cursorPosition) missingParams.push('cursorPosition')
            if (!params.code) missingParams.push('code')

            this.log(
                `Q Chat server failed to insert code. Missing required parameters for insert code: ${missingParams.join(', ')}`
            )

            return
        }

        let cursorPosition = params.cursorPosition

        const indentRange = {
            start: { line: cursorPosition.line, character: 0 },
            end: cursorPosition,
        }
        const documentContent = await this.features.workspace.getTextDocument(params.textDocument.uri)
        // linePrefix is the raw text that is between the start of the line and the current cursor position
        let linePrefix = documentContent?.getText(indentRange)
        // calculatedIndent is the indent we calculate inside this function and apply to the text to be inserted
        let calculatedIndent = ''
        let hasVirtualSpace = false

        if (linePrefix) {
            // If linePrefix object is not empty, there are two possibilities:
            // Case 1: If linePrefix contains only whitespace: Use the entire linePrefix as is for the indent
            // Case 2: If linePrefix contains non-whitespace characters: Extract leading whitespace from linePrefix (if any), ignore rest of text
            calculatedIndent =
                linePrefix.trim().length == 0
                    ? linePrefix
                    : ' '.repeat(linePrefix.length - linePrefix.trimStart().length)
        } else if (documentContent && cursorPosition.character > 0) {
            // When the cursor is not at the start of the line (position > 0) but there's no actual text at the indentation range
            // It means there are virtual spaces that is being rendered by the IDE
            // In this case, the indentation is determined by the cursorPosition
            this.log('Indent is nullish and the cursor position is greater than zero while inserting code')
            calculatedIndent = ' '.repeat(cursorPosition.character)
            hasVirtualSpace = true
            cursorPosition.character = 0
        }

        const textWithIndent = params.code
            .split('\n')
            .map((line, index) => {
                if (index === 0) {
                    return hasVirtualSpace && line ? calculatedIndent + line : line
                }
                // Only indent non-empty lines
                return line ? calculatedIndent + line : ''
            })
            .join('\n')

        const workspaceEdit: ApplyWorkspaceEditParams = {
            edit: {
                documentChanges: [
                    TextDocumentEdit.create({ uri: params.textDocument.uri, version: 0 }, [
                        TextEdit.insert(cursorPosition, textWithIndent),
                    ]),
                ],
            },
        }
        const applyResult = await this.features.lsp.workspace.applyWorkspaceEdit(workspaceEdit)

        if (applyResult.applied) {
            this.log(`Q Chat server inserted code successfully`)
            this.telemetryController.enqueueCodeDiffEntry({ ...params, code: textWithIndent })
        } else {
            this.log(
                `Q Chat server failed to insert code: ${applyResult.failureReason ?? 'No failure reason provided'}`
            )
        }
    }

    onCopyCodeToClipboard() {}

    onEndChat(params: EndChatParams, _token: CancellationToken): boolean {
        const { success } = this.chatSessionManagementService.deleteSession(params.tabId)

        return success
    }

    onFollowUpClicked() {}

    onInfoLinkClick() {}

    onLinkClick() {}

    onReady() {}

    onSendFeedback({ tabId, feedbackPayload }: FeedbackParams) {}

    onSourceLinkClick() {}

    onTabAdd(params: TabAddParams) {
        this.telemetryController.activeTabId = params.tabId

        this.chatSessionManagementService.createSession(params.tabId)
    }

    onTabChange(params: TabChangeParams) {
        this.telemetryController.emitConversationMetric({
            name: ChatTelemetryEventName.ExitFocusConversation,
            data: {},
        })

        this.telemetryController.activeTabId = params.tabId

        this.telemetryController.emitConversationMetric({
            name: ChatTelemetryEventName.EnterFocusConversation,
            data: {},
        })
    }

    onTabRemove(params: TabRemoveParams) {
        if (this.telemetryController.activeTabId === params.tabId) {
            this.telemetryController.emitConversationMetric({
                name: ChatTelemetryEventName.ExitFocusConversation,
                data: {},
            })
            this.telemetryController.activeTabId = undefined
        }

        this.chatSessionManagementService.deleteSession(params.tabId)
        this.telemetryController.removeConversation(params.tabId)
    }

    onQuickAction(params: QuickActionParams, _cancellationToken: CancellationToken) {
        return {}
    }

    updateConfiguration = async () => {
        try {
            const qConfig = await this.features.lsp.workspace.getConfiguration(Q_CONFIGURATION_SECTION)
            if (qConfig) {
                this.customizationArn = undefinedIfEmpty(qConfig.customization)
                this.log(`Chat configuration updated to use ${this.customizationArn}`)
                /*
                    The flag enableTelemetryEventsToDestination is set to true temporarily. It's value will be determined through destination
                    configuration post all events migration to STE. It'll be replaced by qConfig['enableTelemetryEventsToDestination'] === true
                */
                // const enableTelemetryEventsToDestination = true
                // this.telemetryService.updateEnableTelemetryEventsToDestination(enableTelemetryEventsToDestination)
                const optOutTelemetryPreference = qConfig['optOutTelemetry'] === true ? 'OPTOUT' : 'OPTIN'
                this.telemetryService.updateOptOutPreference(optOutTelemetryPreference)
            }
        } catch (error) {
            this.log(`Error in GetConfiguration: ${error}`)
        }
    }

    log(...messages: string[]) {
        this.features.logging.log(messages.join(' '))
    }
}
