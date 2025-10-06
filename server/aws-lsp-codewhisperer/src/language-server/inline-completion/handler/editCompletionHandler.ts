import {
    CancellationToken,
    InitializeParams,
    InlineCompletionListWithReferences,
    InlineCompletionTriggerKind,
    InlineCompletionWithReferencesParams,
    LSPErrorCodes,
    Range,
    ResponseError,
    TextDocument,
} from '@aws/language-server-runtimes/protocol'
import { RecentEditTracker } from '../tracker/codeEditTracker'
import { CredentialsProvider, Logging, Telemetry, Workspace } from '@aws/language-server-runtimes/server-interface'
import {
    CodeWhispererServiceToken,
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    getFileContext,
    SuggestionType,
} from '../../../shared/codeWhispererService'
import { CodeWhispererSession, SessionManager } from '../session/sessionManager'
import { CursorTracker } from '../tracker/cursorTracker'
import { CodewhispererLanguage, getSupportedLanguageId } from '../../../shared/languageDetection'
import { WorkspaceFolderManager } from '../../workspaceContext/workspaceFolderManager'
import { shouldTriggerEdits } from '../utils/triggerUtils'
import {
    emitEmptyUserTriggerDecisionTelemetry,
    emitServiceInvocationFailure,
    emitServiceInvocationTelemetry,
    emitUserTriggerDecisionTelemetry,
} from '../telemetry/telemetry'
import { TelemetryService } from '../../../shared/telemetry/telemetryService'
import { textUtils } from '@aws/lsp-core'
import { AmazonQBaseServiceManager } from '../../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { RejectedEditTracker } from '../tracker/rejectedEditTracker'
import { getErrorMessage, hasConnectionExpired } from '../../../shared/utils'
import { AmazonQError, AmazonQServiceConnectionExpiredError } from '../../../shared/amazonQServiceManager/errors'
import { DocumentChangedListener } from '../documentChangedListener'
import { EMPTY_RESULT, EDIT_DEBOUNCE_INTERVAL_MS } from '../contants/constants'
import { StreakTracker } from '../tracker/streakTracker'

export class EditCompletionHandler {
    private readonly editsEnabled: boolean
    private debounceTimeout: NodeJS.Timeout | undefined
    private isWaiting: boolean = false
    private hasDocumentChangedSinceInvocation: boolean = false
    private readonly streakTracker: StreakTracker

    private isInProgress = false

    constructor(
        readonly logging: Logging,
        readonly clientMetadata: InitializeParams,
        readonly workspace: Workspace,
        readonly amazonQServiceManager: AmazonQBaseServiceManager,
        readonly sessionManager: SessionManager,
        readonly cursorTracker: CursorTracker,
        readonly recentEditsTracker: RecentEditTracker,
        readonly rejectedEditTracker: RejectedEditTracker,
        readonly documentChangedListener: DocumentChangedListener,
        readonly telemetry: Telemetry,
        readonly telemetryService: TelemetryService,
        readonly credentialsProvider: CredentialsProvider
    ) {
        this.editsEnabled =
            this.clientMetadata.initializationOptions?.aws?.awsClientCapabilities?.textDocument
                ?.inlineCompletionWithReferences?.inlineEditSupport ?? false
        this.streakTracker = StreakTracker.getInstance()
    }

    get codeWhispererService() {
        return this.amazonQServiceManager.getCodewhispererService()
    }

    /**
     * This is a workaround to refresh the debounce timer when user is typing quickly.
     * Adding debounce at function call doesnt work because server won't process second request until first request is processed.
     * Also as a followup, ideally it should be a message/event publish/subscribe pattern instead of manual invocation like this
     */
    documentChanged() {
        if (this.debounceTimeout) {
            if (this.isWaiting) {
                this.hasDocumentChangedSinceInvocation = true
            } else {
                this.logging.info(`refresh and debounce edits suggestion for another ${EDIT_DEBOUNCE_INTERVAL_MS}`)
                this.debounceTimeout.refresh()
            }
        }
    }

    async onEditCompletion(
        params: InlineCompletionWithReferencesParams,
        token: CancellationToken
    ): Promise<InlineCompletionListWithReferences> {
        if (this.isInProgress) {
            this.logging.info(`editCompletionHandler is WIP, skip the request`)
            return EMPTY_RESULT
        }

        // On every new completion request close current inflight session.
        const currentSession = this.sessionManager.getCurrentSession()
        if (currentSession && currentSession.state == 'REQUESTING' && !params.partialResultToken) {
            // this REQUESTING state only happens when the session is initialized, which is rare
            currentSession.discardInflightSessionOnNewInvocation = true
        }

        if (this.cursorTracker) {
            this.cursorTracker.trackPosition(params.textDocument.uri, params.position)
        }
        const textDocument = await this.workspace.getTextDocument(params.textDocument.uri)
        if (!textDocument) {
            this.logging.warn(`textDocument [${params.textDocument.uri}] not found`)
            return EMPTY_RESULT
        }

        if (!(this.codeWhispererService instanceof CodeWhispererServiceToken)) {
            return EMPTY_RESULT
        }

        // request for new session
        const inferredLanguageId = getSupportedLanguageId(textDocument)
        if (!inferredLanguageId) {
            this.logging.log(
                `textDocument [${params.textDocument.uri}] with languageId [${textDocument.languageId}] not supported`
            )
            return EMPTY_RESULT
        }

        // Not ideally to rely on a state, should improve it and simply make it a debounced API
        this.isInProgress = true
        const startPreprocessTimestamp = Date.now()

        if (params.partialResultToken && currentSession) {
            // Close ACTIVE session. We shouldn't record Discard trigger decision for trigger with nextToken.
            if (currentSession && currentSession.state === 'ACTIVE') {
                this.sessionManager.discardSession(currentSession)
            }

            const newSession = this.sessionManager.createSession({
                document: textDocument,
                startPosition: params.position,
                startPreprocessTimestamp: startPreprocessTimestamp,
                triggerType: 'AutoTrigger',
                language: currentSession.language,
                requestContext: currentSession.requestContext,
                autoTriggerType: undefined,
                triggerCharacter: '',
                classifierResult: undefined,
                classifierThreshold: undefined,
                credentialStartUrl: currentSession.credentialStartUrl,
                supplementalMetadata: currentSession.supplementalMetadata,
                customizationArn: currentSession.customizationArn,
            })
            // subsequent paginated requests for current session
            try {
                const suggestionResponse = await this.codeWhispererService.generateSuggestions({
                    ...newSession.requestContext,
                    nextToken: `${params.partialResultToken}`,
                })
                return await this.processSuggestionResponse(
                    suggestionResponse,
                    newSession,
                    true,
                    params.context.selectedCompletionInfo?.range
                )
            } catch (error) {
                return this.handleSuggestionsErrors(error as Error, currentSession)
            } finally {
                this.isInProgress = false
            }
        }

        return new Promise<InlineCompletionListWithReferences>(async resolve => {
            this.debounceTimeout = setTimeout(async () => {
                try {
                    this.isWaiting = true
                    const result = await this._invoke(
                        params,
                        startPreprocessTimestamp,
                        token,
                        textDocument,
                        inferredLanguageId,
                        currentSession
                    ).finally(() => {
                        this.isWaiting = false
                    })
                    if (this.hasDocumentChangedSinceInvocation) {
                        this.logging.info(
                            'EditCompletionHandler - Document changed during execution, resolving empty result'
                        )
                        resolve({
                            sessionId: SessionManager.getInstance('EDITS').getActiveSession()?.id ?? '',
                            items: [],
                        })
                    } else {
                        this.logging.info('EditCompletionHandler - No document changes, resolving result')
                        resolve(result)
                    }
                } finally {
                    this.debounceTimeout = undefined
                    this.hasDocumentChangedSinceInvocation = false
                }
            }, EDIT_DEBOUNCE_INTERVAL_MS)
        }).finally(() => {
            this.isInProgress = false
        })
    }

    async _invoke(
        params: InlineCompletionWithReferencesParams,
        startPreprocessTimestamp: number,
        token: CancellationToken,
        textDocument: TextDocument,
        inferredLanguageId: CodewhispererLanguage,
        currentSession: CodeWhispererSession | undefined
    ): Promise<InlineCompletionListWithReferences> {
        // Build request context
        const isAutomaticLspTriggerKind = params.context.triggerKind == InlineCompletionTriggerKind.Automatic
        const maxResults = isAutomaticLspTriggerKind ? 1 : 5
        const fileContext = getFileContext({
            textDocument,
            inferredLanguageId,
            position: params.position,
            workspaceFolder: this.workspace.getWorkspaceFolder(textDocument.uri),
        })

        const workspaceState = WorkspaceFolderManager.getInstance()?.getWorkspaceState()
        const workspaceId = workspaceState?.webSocketClient?.isConnected() ? workspaceState.workspaceId : undefined

        const qEditsTrigger = shouldTriggerEdits(
            this.codeWhispererService,
            fileContext,
            params,
            this.cursorTracker,
            this.recentEditsTracker,
            this.sessionManager,
            true
        )

        if (!qEditsTrigger) {
            return EMPTY_RESULT
        }

        const generateCompletionReq: GenerateSuggestionsRequest = {
            fileContext: fileContext,
            maxResults: maxResults,
            predictionTypes: ['EDITS'],
            workspaceId: workspaceId,
        }

        if (qEditsTrigger) {
            generateCompletionReq.editorState = {
                document: {
                    relativeFilePath: textDocument.uri,
                    programmingLanguage: {
                        languageName: generateCompletionReq.fileContext.programmingLanguage.languageName,
                    },
                    text: textDocument.getText(),
                },
                cursorState: {
                    position: {
                        line: params.position.line,
                        character: params.position.character,
                    },
                },
            }
        }

        const supplementalContext = await this.codeWhispererService.constructSupplementalContext(
            textDocument,
            params.position,
            this.workspace,
            this.recentEditsTracker,
            this.logging,
            token,
            params.openTabFilepaths,
            {
                includeRecentEdits: true,
            }
        )
        if (supplementalContext) {
            generateCompletionReq.supplementalContexts = supplementalContext.items
        }

        // Close ACTIVE session and record Discard trigger decision immediately
        if (currentSession && currentSession.state === 'ACTIVE') {
            // Emit user trigger decision at session close time for active session
            this.sessionManager.discardSession(currentSession)
            const streakLength = this.editsEnabled ? this.streakTracker.getAndUpdateStreakLength(false) : 0
            await emitUserTriggerDecisionTelemetry(
                this.telemetry,
                this.telemetryService,
                currentSession,
                this.documentChangedListener.timeSinceLastUserModification,
                0,
                0,
                [],
                [],
                streakLength
            )
        }

        const newSession = this.sessionManager.createSession({
            document: textDocument,
            startPreprocessTimestamp: startPreprocessTimestamp,
            startPosition: params.position,
            triggerType: isAutomaticLspTriggerKind ? 'AutoTrigger' : 'OnDemand',
            language: fileContext.programmingLanguage.languageName,
            requestContext: generateCompletionReq,
            autoTriggerType: undefined,
            triggerCharacter: '',
            classifierResult: undefined,
            classifierThreshold: undefined,
            credentialStartUrl: this.credentialsProvider.getConnectionMetadata?.()?.sso?.startUrl ?? undefined,
            supplementalMetadata: supplementalContext?.supContextData,
            customizationArn: textUtils.undefinedIfEmpty(this.codeWhispererService.customizationArn),
        })

        try {
            const suggestionResponse = await this.codeWhispererService.generateSuggestions(generateCompletionReq)
            return await this.processSuggestionResponse(
                suggestionResponse,
                newSession,
                true,
                params.context.selectedCompletionInfo?.range
            )
        } catch (error) {
            return this.handleSuggestionsErrors(error as Error, newSession)
        }
    }

    async processSuggestionResponse(
        suggestionResponse: GenerateSuggestionsResponse,
        session: CodeWhispererSession,
        isNewSession: boolean,
        selectionRange?: Range,
        textDocument?: TextDocument
    ) {
        // TODO: we haven't decided how to do these telemetry for Edits suggestions
        // codePercentageTracker.countInvocation(session.language)
        // userWrittenCodeTracker?.recordUsageCount(session.language)

        if (isNewSession) {
            // Populate the session with information from codewhisperer response
            session.suggestions = suggestionResponse.suggestions
            session.responseContext = suggestionResponse.responseContext
            session.codewhispererSessionId = suggestionResponse.responseContext.codewhispererSessionId
            session.setTimeToFirstRecommendation()
            session.predictionType = SuggestionType.EDIT
        } else {
            session.suggestions = [...session.suggestions, ...suggestionResponse.suggestions]
        }

        // Emit service invocation telemetry for every request sent to backend
        emitServiceInvocationTelemetry(this.telemetry, session, suggestionResponse.responseContext.requestId)

        // Discard previous inflight API response due to new trigger
        if (session.discardInflightSessionOnNewInvocation) {
            session.discardInflightSessionOnNewInvocation = false
            this.sessionManager.discardSession(session)
            const streakLength = this.editsEnabled ? this.streakTracker.getAndUpdateStreakLength(false) : 0
            await emitUserTriggerDecisionTelemetry(
                this.telemetry,
                this.telemetryService,
                session,
                this.documentChangedListener.timeSinceLastUserModification,
                0,
                0,
                [],
                [],
                streakLength
            )
        }

        // API response was recieved, we can activate session now
        this.sessionManager.activateSession(session)

        // Process suggestions to apply Empty or Filter filters
        if (suggestionResponse.suggestions.length === 0) {
            this.sessionManager.closeSession(session)
            await emitEmptyUserTriggerDecisionTelemetry(
                this.telemetryService,
                session,
                this.documentChangedListener.timeSinceLastUserModification,
                this.editsEnabled ? this.streakTracker.getAndUpdateStreakLength(false) : 0
            )
            return EMPTY_RESULT
        }

        return {
            items: suggestionResponse.suggestions
                .map(suggestion => {
                    // Check if this suggestion is similar to a previously rejected edit
                    const isSimilarToRejected = this.rejectedEditTracker.isSimilarToRejected(
                        suggestion.content,
                        textDocument?.uri || ''
                    )

                    if (isSimilarToRejected) {
                        // Mark as rejected in the session
                        session.setSuggestionState(suggestion.itemId, 'Reject')
                        this.logging.debug(
                            `[EDIT_PREDICTION] Filtered out suggestion similar to previously rejected edit`
                        )
                        // Return empty item that will be filtered out
                        return {
                            insertText: '',
                            isInlineEdit: true,
                            itemId: suggestion.itemId,
                        }
                    }

                    return {
                        insertText: suggestion.content,
                        isInlineEdit: true,
                        itemId: suggestion.itemId,
                    }
                })
                .filter(item => item.insertText !== ''),
            sessionId: session.id,
            partialResultToken: suggestionResponse.responseContext.nextToken,
        }
    }

    handleSuggestionsErrors(error: Error, session: CodeWhispererSession): InlineCompletionListWithReferences {
        this.logging.log('Recommendation failure: ' + error)
        emitServiceInvocationFailure(this.telemetry, session, error)

        // UTDE telemetry is not needed here because in error cases we don't care about UTDE for errored out sessions
        this.sessionManager.closeSession(session)

        let translatedError = error

        if (hasConnectionExpired(error)) {
            translatedError = new AmazonQServiceConnectionExpiredError(getErrorMessage(error))
        }

        if (translatedError instanceof AmazonQError) {
            throw new ResponseError(
                LSPErrorCodes.RequestFailed,
                translatedError.message || 'Error processing suggestion requests',
                {
                    awsErrorCode: translatedError.code,
                }
            )
        }

        return EMPTY_RESULT
    }
}
