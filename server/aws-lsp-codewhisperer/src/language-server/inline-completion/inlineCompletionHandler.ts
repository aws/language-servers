import {
    CancellationToken,
    InitializeParams,
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    InlineCompletionTriggerKind,
    InlineCompletionWithReferencesParams,
    LSPErrorCodes,
    Range,
    ResponseError,
    TextDocument,
} from '@aws/language-server-runtimes/protocol'
import { RecentEditTracker } from './tracker/codeEditTracker'
import { CredentialsProvider, Logging, Telemetry, Workspace } from '@aws/language-server-runtimes/server-interface'
import {
    CodeWhispererServiceBase,
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    Suggestion,
} from '../../shared/codeWhispererService'
import { CodeWhispererSession, SessionManager } from './session/sessionManager'
import { CursorTracker } from './tracker/cursorTracker'
import { getSupportedLanguageId } from '../../shared/languageDetection'
import { WorkspaceFolderManager } from '../workspaceContext/workspaceFolderManager'
import { ClassifierAutoTrigger, QAutoTrigger, shouldTriggerCompletions } from './trigger'
import {
    emitServiceInvocationFailure,
    emitServiceInvocationTelemetry,
    emitUserTriggerDecisionTelemetry,
} from './telemetry'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { truncateOverlapWithRightContext } from './mergeRightUtils'
import { textUtils } from '@aws/lsp-core'
import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { CodePercentageTracker } from './codePercentage'
import { UserWrittenCodeTracker } from '../../shared/userWrittenCodeTracker'
import { getIdeCategory } from '../../shared/telemetryUtils'
import { getErrorMessage, hasConnectionExpired } from '../../shared/utils'
import { AmazonQError, AmazonQServiceConnectionExpiredError } from '../../shared/amazonQServiceManager/errors'
import { DocumentChangedListener } from './documentChangedListener'

const EMPTY_RESULT = { sessionId: '', items: [] }

export class InlineCompletionHandler {
    readonly codeWhispererService: CodeWhispererServiceBase
    readonly ideCategory: string

    private isOnInlineCompletionHandlerInProgress = false
    constructor(
        readonly logging: Logging,
        readonly clientMetadata: InitializeParams,
        readonly workspace: Workspace,
        readonly qServiceManager: AmazonQBaseServiceManager,
        readonly sessionManager: SessionManager,
        readonly cursorTracker: CursorTracker,
        readonly recentEditsTracker: RecentEditTracker,
        readonly codePercentageTracker: CodePercentageTracker,
        readonly userWrittenCodeTracker: UserWrittenCodeTracker | undefined,
        readonly documentChangedListener: DocumentChangedListener,
        readonly telemetry: Telemetry,
        readonly telemetryService: TelemetryService,
        readonly credentialsProvider: CredentialsProvider
    ) {
        this.codeWhispererService = qServiceManager.getCodewhispererService()
        this.ideCategory = clientMetadata ? getIdeCategory(clientMetadata) : ''
    }

    async onInlineCompletion(
        params: InlineCompletionWithReferencesParams,
        token: CancellationToken
    ): Promise<InlineCompletionListWithReferences> {
        // this handle should not run concurrently because
        // 1. it would create a high volume of traffic, causing throttling
        // 2. it is not designed to handle concurrent changes to these state variables.
        // when one handler is at the API call stage, it has not yet update the session state
        // but another request can start, causing the state to be incorrect.
        if (this.isOnInlineCompletionHandlerInProgress) {
            this.logging.log(`Detect there is inflight inline completion request`)
            return EMPTY_RESULT
        }
        this.isOnInlineCompletionHandlerInProgress = true

        try {
            return await this._onInlineCompletion(params, token)
        } finally {
            this.isOnInlineCompletionHandlerInProgress = false
        }
    }

    private async _onInlineCompletion(
        params: InlineCompletionWithReferencesParams,
        token: CancellationToken
    ): Promise<InlineCompletionListWithReferences> {
        // On every new completion request close current inflight session.
        const currentSession = this.sessionManager.getCurrentSession()
        if (currentSession && currentSession.state == 'REQUESTING' && !params.partialResultToken) {
            // this REQUESTING state only happens when the session is initialized, which is rare
            currentSession.discardInflightSessionOnNewInvocation = true
        }

        // if (cursorTracker) {
        //     cursorTracker.trackPosition(params.textDocument.uri, params.position)
        // }
        const textDocument = await this.workspace.getTextDocument(params.textDocument.uri)

        if (!textDocument) {
            this.logging.warn(`textDocument [${params.textDocument.uri}] not found`)
            return EMPTY_RESULT
        }

        if (params.partialResultToken && currentSession) {
            // subsequent paginated requests for current session
            try {
                const suggestionResponse = await this.codeWhispererService.generateSuggestions({
                    ...currentSession.requestContext,
                    nextToken: `${params.partialResultToken}`,
                })
                return await this.processSuggestionResponse(
                    suggestionResponse,
                    currentSession,
                    false,
                    params.context.selectedCompletionInfo?.range
                )
            } catch (error) {
                return this.handleSuggestionsErrors(error as Error, currentSession)
            }
        }

        // request for new session
        const inferredLanguageId = getSupportedLanguageId(textDocument)
        if (!inferredLanguageId) {
            this.logging.log(
                `textDocument [${params.textDocument.uri}] with languageId [${textDocument.languageId}] not supported`
            )
            return EMPTY_RESULT
        }

        // Build request context
        const isAutomaticLspTriggerKind = params.context.triggerKind == InlineCompletionTriggerKind.Automatic
        const maxResults = isAutomaticLspTriggerKind ? 1 : 5
        const selectionRange = params.context.selectedCompletionInfo?.range
        const fileContext = this.codeWhispererService.getFileContext({
            textDocument,
            inferredLanguageId,
            position: params.position,
            workspaceFolder: this.workspace.getWorkspaceFolder(textDocument.uri),
        })

        const workspaceState = WorkspaceFolderManager.getInstance()?.getWorkspaceState()
        const workspaceId = workspaceState?.webSocketClient?.isConnected() ? workspaceState.workspaceId : undefined

        const qInlineTrigger = shouldTriggerCompletions(
            fileContext,
            params,
            this.sessionManager,
            this.ideCategory,
            this.logging
        )

        if (!qInlineTrigger) {
            return EMPTY_RESULT
        }

        const generateCompletionReq: GenerateSuggestionsRequest = {
            fileContext: fileContext,
            maxResults: maxResults,
            predictionTypes: ['COMPLETIONS'],
            workspaceId: workspaceId,
        }

        const supplementalContext = await this.codeWhispererService.constructSupplementalContext(
            textDocument,
            params.position,
            this.workspace,
            this.recentEditsTracker,
            this.logging,
            token,
            {
                includeRecentEdits: false,
            }
        )
        if (supplementalContext) {
            generateCompletionReq.supplementalContexts = supplementalContext.items
        }

        // Close ACTIVE session and record Discard trigger decision immediately
        if (currentSession && currentSession.state === 'ACTIVE') {
            // Emit user trigger decision at session close time for active session
            this.sessionManager.discardSession(currentSession)
            await emitUserTriggerDecisionTelemetry(
                this.telemetry,
                this.telemetryService,
                currentSession,
                this.documentChangedListener.timeSinceLastUserModification,
                0,
                0,
                [],
                [],
                0
            )
        }

        const newSession = this.sessionManager.createSession({
            document: textDocument,
            startPosition: params.position,
            triggerType: isAutomaticLspTriggerKind ? 'AutoTrigger' : 'OnDemand',
            language: fileContext.programmingLanguage.languageName,
            requestContext: generateCompletionReq,
            autoTriggerType: qInlineTrigger instanceof QAutoTrigger ? qInlineTrigger.triggerType : undefined,
            triggerCharacter: qInlineTrigger?.triggerCharacters,
            classifierResult:
                qInlineTrigger instanceof ClassifierAutoTrigger ? qInlineTrigger.classifierScore : undefined,
            classifierThreshold:
                qInlineTrigger instanceof ClassifierAutoTrigger ? qInlineTrigger.classifierThreshold : undefined,
            credentialStartUrl: this.credentialsProvider.getConnectionMetadata?.()?.sso?.startUrl ?? undefined,
            supplementalMetadata: supplementalContext?.supContextData,
            customizationArn: textUtils.undefinedIfEmpty(this.codeWhispererService.customizationArn),
        })

        // TODO: What's this???
        // Add extra context to request context
        const { extraContext } = this.qServiceManager.getConfiguration().inlineSuggestions
        if (extraContext) {
            generateCompletionReq.fileContext.leftFileContent =
                extraContext + '\n' + generateCompletionReq.fileContext.leftFileContent
        }

        try {
            const suggestionResponse = await this.codeWhispererService.generateSuggestions(generateCompletionReq)
            return await this.processSuggestionResponse(suggestionResponse, newSession, true, selectionRange)
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
        this.codePercentageTracker.countInvocation(session.language)
        this.userWrittenCodeTracker?.recordUsageCount(session.language)

        if (isNewSession) {
            // Populate the session with information from codewhisperer response
            session.suggestions = suggestionResponse.suggestions
            session.responseContext = suggestionResponse.responseContext
            session.codewhispererSessionId = suggestionResponse.responseContext.codewhispererSessionId
            session.timeToFirstRecommendation = new Date().getTime() - session.startTime
            session.suggestionType = suggestionResponse.suggestionType
        } else {
            session.suggestions = [...session.suggestions, ...suggestionResponse.suggestions]
        }

        // Emit service invocation telemetry for every request sent to backend
        emitServiceInvocationTelemetry(this.telemetry, session, suggestionResponse.responseContext.requestId)

        // Discard previous inflight API response due to new trigger
        if (session.discardInflightSessionOnNewInvocation) {
            session.discardInflightSessionOnNewInvocation = false
            this.sessionManager.discardSession(session)

            await emitUserTriggerDecisionTelemetry(
                this.telemetry,
                this.telemetryService,
                session,
                this.documentChangedListener.timeSinceLastUserModification,
                0,
                0,
                [],
                [],
                0
            )
        }

        // session was closed by user already made decisions consequent completion request before new paginated API response was received
        if (session.state === 'CLOSED' || session.state === 'DISCARD') {
            return EMPTY_RESULT
        }

        // API response was recieved, we can activate session now
        this.sessionManager.activateSession(session)

        // Process suggestions to apply Empty or Filter filters
        const filteredSuggestions = suggestionResponse.suggestions
            // Empty suggestion filter
            .filter(suggestion => {
                if (suggestion.content === '') {
                    session.setSuggestionState(suggestion.itemId, 'Empty')
                    return false
                }

                return true
            })
            // References setting filter
            .filter(suggestion => {
                // State to track whether code with references should be included in
                // the response. No locking or concurrency controls, filtering is done
                // right before returning and is only guaranteed to be consistent within
                // the context of a single response.
                const { includeSuggestionsWithCodeReferences } = this.qServiceManager.getConfiguration()
                if (includeSuggestionsWithCodeReferences) {
                    return true
                }

                if (suggestion.references == null || suggestion.references.length === 0) {
                    return true
                }

                // Filter out suggestions that have references when includeSuggestionsWithCodeReferences setting is true
                session.setSuggestionState(suggestion.itemId, 'Filter')
                return false
            })

        const { includeImportsWithSuggestions } = this.qServiceManager.getConfiguration()
        const suggestionsWithRightContext = mergeSuggestionsWithRightContext(
            session.requestContext.fileContext.rightFileContent,
            filteredSuggestions,
            includeImportsWithSuggestions,
            selectionRange
        ).filter(suggestion => {
            // Discard suggestions that have empty string insertText after right context merge and can't be displayed anymore
            if (suggestion.insertText === '') {
                session.setSuggestionState(suggestion.itemId, 'Discard')
                return false
            }

            return true
        })

        suggestionsWithRightContext.forEach(suggestion => {
            const cachedSuggestion = session.suggestions.find(s => s.itemId === suggestion.itemId)
            if (cachedSuggestion) cachedSuggestion.insertText = suggestion.insertText.toString()
        })

        // TODO: need dedupe after right context merging but I don't see one
        session.suggestionsAfterRightContextMerge.push(...suggestionsWithRightContext)

        session.codewhispererSuggestionImportCount =
            session.codewhispererSuggestionImportCount +
            suggestionsWithRightContext.reduce((total, suggestion) => {
                return total + (suggestion.mostRelevantMissingImports?.length || 0)
            }, 0)

        // If after all server-side filtering no suggestions can be displayed, and there is no nextToken
        // close session and return empty results
        if (session.suggestionsAfterRightContextMerge.length === 0 && !suggestionResponse.responseContext.nextToken) {
            this.sessionManager.closeSession(session)
            await emitUserTriggerDecisionTelemetry(
                this.telemetry,
                this.telemetryService,
                session,
                this.documentChangedListener.timeSinceLastUserModification
            )

            return EMPTY_RESULT
        }

        return {
            items: suggestionsWithRightContext,
            sessionId: session.id,
            partialResultToken: suggestionResponse.responseContext.nextToken,
        }
    }

    handleSuggestionsErrors(error: Error, session: CodeWhispererSession): InlineCompletionListWithReferences {
        this.logging.log('Recommendation failure: ' + error)
        emitServiceInvocationFailure(this.telemetry, session, error)

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

const mergeSuggestionsWithRightContext = (
    rightFileContext: string,
    suggestions: Suggestion[],
    includeImportsWithSuggestions: boolean,
    range?: Range
): InlineCompletionItemWithReferences[] => {
    return suggestions.map(suggestion => {
        const insertText: string = truncateOverlapWithRightContext(rightFileContext, suggestion.content)
        let references = suggestion.references
            ?.filter(
                ref =>
                    !(
                        ref.recommendationContentSpan?.start && insertText.length <= ref.recommendationContentSpan.start
                    ) && insertText.length
            )
            .map(r => {
                return {
                    licenseName: r.licenseName,
                    referenceUrl: r.url,
                    referenceName: r.repository,
                    position: r.recommendationContentSpan && {
                        startCharacter: r.recommendationContentSpan.start,
                        endCharacter: r.recommendationContentSpan.end
                            ? Math.min(r.recommendationContentSpan.end, insertText.length - 1)
                            : r.recommendationContentSpan.end,
                    },
                }
            })

        return {
            itemId: suggestion.itemId,
            insertText: insertText,
            range,
            references: references?.length ? references : undefined,
            mostRelevantMissingImports: includeImportsWithSuggestions
                ? suggestion.mostRelevantMissingImports
                : undefined,
        }
    })
}
