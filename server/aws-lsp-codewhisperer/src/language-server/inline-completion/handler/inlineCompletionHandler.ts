import {
    CancellationToken,
    InlineCompletionListWithReferences,
    InlineCompletionTriggerKind,
    InlineCompletionWithReferencesParams,
    Range,
    TextDocument,
    ResponseError,
    LSPErrorCodes,
    Logging,
    Telemetry,
    Workspace,
    CredentialsProvider,
    Lsp,
} from '@aws/language-server-runtimes/server-interface'
import { autoTrigger, getAutoTriggerType, getNormalizeOsName, triggerType } from '../auto-trigger/autoTrigger'
import {
    FileContext,
    BaseGenerateSuggestionsRequest,
    CodeWhispererServiceToken,
    GenerateIAMSuggestionsRequest,
    GenerateTokenSuggestionsRequest,
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    getFileContext,
    SuggestionType,
} from '../../../shared/codeWhispererService'
import { CodewhispererLanguage, getSupportedLanguageId } from '../../../shared/languageDetection'
import { CodeWhispererSession, SessionManager } from '../session/sessionManager'
import { CodePercentageTracker } from '../tracker/codePercentageTracker'
import { getErrorMessage } from '../../../shared/utils'
import { getIdeCategory } from '../../../shared/telemetryUtils'
import { textUtils } from '@aws/lsp-core'
import { TelemetryService } from '../../../shared/telemetry/telemetryService'
import { UserWrittenCodeTracker } from '../../../shared/userWrittenCodeTracker'
import { RecentEditTracker } from '../tracker/codeEditTracker'
import { CursorTracker } from '../tracker/cursorTracker'
import { StreakTracker } from '../tracker/streakTracker'
import { AmazonQError, AmazonQServiceConnectionExpiredError } from '../../../shared/amazonQServiceManager/errors'
import { AmazonQBaseServiceManager } from '../../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { hasConnectionExpired } from '../../../shared/utils'
import { WorkspaceFolderManager } from '../../workspaceContext/workspaceFolderManager'
import {
    emitServiceInvocationFailure,
    emitServiceInvocationTelemetry,
    emitUserTriggerDecisionTelemetry,
} from '../telemetry/telemetry'
import { EMPTY_RESULT } from '../contants/constants'
import { IdleWorkspaceManager } from '../../workspaceContext/IdleWorkspaceManager'
import { mergeSuggestionsWithRightContext } from '../utils/mergeRightUtils'
import { getTextDocument } from '../utils/textDocumentUtils'

export class InlineCompletionHandler {
    private isOnInlineCompletionHandlerInProgress = false

    constructor(
        private readonly logging: Logging,
        private readonly workspace: Workspace,
        private readonly amazonQServiceManager: AmazonQBaseServiceManager,
        private readonly completionSessionManager: SessionManager,
        private readonly codePercentageTracker: CodePercentageTracker,
        private readonly userWrittenCodeTracker: UserWrittenCodeTracker | undefined,
        private readonly recentEditTracker: RecentEditTracker,
        private readonly cursorTracker: CursorTracker,
        private readonly streakTracker: StreakTracker,
        private readonly telemetry: Telemetry,
        private readonly telemetryService: TelemetryService,
        private readonly credentialsProvider: CredentialsProvider,
        private readonly getEditsEnabled: () => boolean,
        private readonly getTimeSinceLastUserModification: () => number,
        private readonly lsp: Lsp
    ) {}

    async onInlineCompletion(
        params: InlineCompletionWithReferencesParams,
        token: CancellationToken
    ): Promise<InlineCompletionListWithReferences> {
        // this handle should not run concurrently because
        // 1. it would create a high volume of traffic, causing throttling
        // 2. it is not designed to handle concurrent changes to these state variables.
        // when one handler is at the API call stage, it has not yet update the session state
        // but another request can start, causing the state to be incorrect.
        IdleWorkspaceManager.recordActivityTimestamp()

        if (this.isOnInlineCompletionHandlerInProgress) {
            this.logging.log(`Skip concurrent inline completion`)
            return EMPTY_RESULT
        }

        // Add this check to ensure service manager is initialized
        if (!this.amazonQServiceManager) {
            this.logging.log('Amazon Q Service Manager not initialized yet')
            return EMPTY_RESULT
        }

        this.isOnInlineCompletionHandlerInProgress = true

        try {
            // On every new completion request close current inflight session.
            const currentSession = this.completionSessionManager.getCurrentSession()
            if (currentSession && currentSession.state == 'REQUESTING' && !params.partialResultToken) {
                // this REQUESTING state only happens when the session is initialized, which is rare
                currentSession.discardInflightSessionOnNewInvocation = true
            }

            if (this.cursorTracker) {
                this.cursorTracker.trackPosition(params.textDocument.uri, params.position)
            }
            const textDocument = await getTextDocument(params.textDocument.uri, this.workspace, this.logging)

            const codeWhispererService = this.amazonQServiceManager.getCodewhispererService()
            const authType = codeWhispererService instanceof CodeWhispererServiceToken ? 'token' : 'iam'
            this.logging.debug(
                `[INLINE_COMPLETION] Service ready - auth: ${authType}, partial token: ${!!params.partialResultToken}`
            )

            if (params.partialResultToken && currentSession) {
                // subsequent paginated requests for current session
                try {
                    const suggestionResponse = await codeWhispererService.generateSuggestions({
                        ...currentSession.requestContext,
                        fileContext: {
                            ...currentSession.requestContext.fileContext,
                        },
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
            } else {
                return await this.processNewCompletionRequest(params, textDocument, token)
            }
        } finally {
            this.isOnInlineCompletionHandlerInProgress = false
        }
    }

    private async processNewCompletionRequest(
        params: InlineCompletionWithReferencesParams,
        textDocument: TextDocument | undefined,
        token: CancellationToken
    ): Promise<InlineCompletionListWithReferences> {
        // request for new session
        if (!textDocument) {
            this.logging.log(`textDocument [${params.textDocument.uri}] not found`)
            return EMPTY_RESULT
        }

        let inferredLanguageId = getSupportedLanguageId(textDocument)
        if (params.fileContextOverride?.programmingLanguage) {
            inferredLanguageId = params.fileContextOverride?.programmingLanguage as CodewhispererLanguage
        }
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

        const startPreprocessTimestamp = Date.now()

        // For Jupyter Notebook in VSC, the language server does not have access to
        // its internal states including current active cell index, etc
        // we rely on VSC to calculate file context
        let fileContext: FileContext | undefined = undefined
        if (params.fileContextOverride) {
            fileContext = {
                leftFileContent: params.fileContextOverride.leftFileContent,
                rightFileContent: params.fileContextOverride.rightFileContent,
                filename: params.fileContextOverride.filename,
                fileUri: params.fileContextOverride.fileUri,
                programmingLanguage: {
                    languageName: inferredLanguageId,
                },
            }
        } else {
            fileContext = getFileContext({
                textDocument,
                inferredLanguageId,
                position: params.position,
                workspaceFolder: this.workspace.getWorkspaceFolder(textDocument.uri),
            })
        }

        const workspaceState = WorkspaceFolderManager.getInstance()?.getWorkspaceState()
        const workspaceId = workspaceState?.webSocketClient?.isConnected() ? workspaceState.workspaceId : undefined

        const previousSession = this.completionSessionManager.getPreviousSession()
        // Only refer to decisions in the past 2 mins
        const previousDecisionForClassifier =
            previousSession && Date.now() - previousSession.decisionMadeTimestamp <= 2 * 60 * 1000
                ? previousSession.getAggregatedUserTriggerDecision()
                : undefined
        let ideCategory: string | undefined = ''
        const initializeParams = this.lsp.getClientInitializeParams()
        if (initializeParams !== undefined) {
            ideCategory = getIdeCategory(initializeParams)
        }

        // auto trigger code path
        let codewhispererAutoTriggerType = undefined
        let triggerCharacters = ''
        let autoTriggerResult = undefined

        if (isAutomaticLspTriggerKind) {
            // Reference: https://github.com/aws/aws-toolkit-vscode/blob/amazonq/v1.74.0/packages/core/src/codewhisperer/service/classifierTrigger.ts#L477
            if (
                params.documentChangeParams?.contentChanges &&
                params.documentChangeParams.contentChanges.length > 0 &&
                params.documentChangeParams.contentChanges[0].text !== undefined
            ) {
                triggerCharacters = params.documentChangeParams.contentChanges[0].text
                codewhispererAutoTriggerType = getAutoTriggerType(params.documentChangeParams.contentChanges)
            } else {
                // if the client does not emit document change for the trigger, use left most character.
                triggerCharacters = fileContext.leftFileContent.trim().at(-1) ?? ''
                codewhispererAutoTriggerType = triggerType(fileContext)
            }
            // See: https://github.com/aws/aws-toolkit-vscode/blob/amazonq/v1.74.0/packages/core/src/codewhisperer/service/keyStrokeHandler.ts#L132
            // In such cases, do not auto trigger.
            if (codewhispererAutoTriggerType === undefined) {
                return EMPTY_RESULT
            }

            autoTriggerResult = autoTrigger(
                {
                    fileContext, // The left/right file context and programming language
                    lineNum: params.position.line, // the line number of the invocation, this is the line of the cursor
                    char: triggerCharacters, // Add the character just inserted, if any, before the invication position
                    ide: ideCategory ?? '',
                    os: getNormalizeOsName(),
                    previousDecision: previousDecisionForClassifier, // The last decision by the user on the previous invocation
                    triggerType: codewhispererAutoTriggerType, // The 2 trigger types currently influencing the Auto-Trigger are SpecialCharacter and Enter
                },
                this.logging
            )

            if (codewhispererAutoTriggerType === 'Classifier' && !autoTriggerResult.shouldTrigger) {
                return EMPTY_RESULT
            }
        }

        let requestContext: GenerateSuggestionsRequest = {
            fileContext,
            maxResults,
        }

        const codeWhispererService = this.amazonQServiceManager.getCodewhispererService()
        const supplementalContext = await codeWhispererService.constructSupplementalContext(
            textDocument,
            params.position,
            this.workspace,
            this.recentEditTracker,
            this.logging,
            token,
            params.openTabFilepaths,
            { includeRecentEdits: false }
        )

        if (supplementalContext?.items) {
            requestContext.supplementalContexts = supplementalContext.items
        }

        // Close ACTIVE session and record Discard trigger decision immediately
        const currentSession = this.completionSessionManager.getCurrentSession()
        if (currentSession && currentSession.state === 'ACTIVE') {
            // Emit user trigger decision at session close time for active session
            // TODO: yuxqiang workaround to exclude JB from this logic because JB and VSC handle a
            // bit differently in the case when there's a new trigger while a reject/discard event is sent
            // for the previous trigger
            if (ideCategory !== 'JETBRAINS') {
                this.completionSessionManager.discardSession(currentSession)
                const streakLength = this.getEditsEnabled() ? this.streakTracker.getAndUpdateStreakLength(false) : 0
                await emitUserTriggerDecisionTelemetry(
                    this.telemetry,
                    this.telemetryService,
                    currentSession,
                    this.getTimeSinceLastUserModification(),
                    0,
                    0,
                    [],
                    [],
                    streakLength
                )
            }
        }

        const supplementalMetadata = supplementalContext?.supContextData

        const newSession = this.completionSessionManager.createSession({
            document: textDocument,
            startPreprocessTimestamp: startPreprocessTimestamp,
            startPosition: params.position,
            triggerType: isAutomaticLspTriggerKind ? 'AutoTrigger' : 'OnDemand',
            language: fileContext.programmingLanguage.languageName as CodewhispererLanguage,
            requestContext: requestContext,
            autoTriggerType: isAutomaticLspTriggerKind ? codewhispererAutoTriggerType : undefined,
            triggerCharacter: triggerCharacters,
            classifierResult: autoTriggerResult?.classifierResult,
            classifierThreshold: autoTriggerResult?.classifierThreshold,
            credentialStartUrl: this.credentialsProvider.getConnectionMetadata?.()?.sso?.startUrl ?? undefined,
            supplementalMetadata: supplementalMetadata,
            customizationArn: textUtils.undefinedIfEmpty(codeWhispererService.customizationArn),
        })

        // Add extra context to request context
        const { extraContext } = this.amazonQServiceManager.getConfiguration().inlineSuggestions
        if (extraContext) {
            requestContext.fileContext.leftFileContent =
                extraContext + '\n' + requestContext.fileContext.leftFileContent
        }

        // Create the appropriate request based on service type
        let generateCompletionReq: BaseGenerateSuggestionsRequest

        if (codeWhispererService instanceof CodeWhispererServiceToken) {
            const tokenRequest = requestContext as GenerateTokenSuggestionsRequest
            generateCompletionReq = {
                ...tokenRequest,
                ...(workspaceId ? { workspaceId } : {}),
            }
        } else {
            const iamRequest = requestContext as GenerateIAMSuggestionsRequest
            generateCompletionReq = {
                ...iamRequest,
            }
        }

        try {
            const authType = codeWhispererService instanceof CodeWhispererServiceToken ? 'token' : 'iam'
            this.logging.debug(`[INLINE_COMPLETION] API call - generateSuggestions (new session, ${authType})`)
            const suggestionResponse = await codeWhispererService.generateSuggestions(generateCompletionReq)
            return await this.processSuggestionResponse(suggestionResponse, newSession, true, selectionRange)
        } catch (error) {
            return this.handleSuggestionsErrors(error as Error, newSession)
        }
    }

    private async processSuggestionResponse(
        suggestionResponse: GenerateSuggestionsResponse,
        session: CodeWhispererSession,
        isNewSession: boolean,
        selectionRange?: Range
    ): Promise<InlineCompletionListWithReferences> {
        this.codePercentageTracker.countInvocation(session.language)

        this.userWrittenCodeTracker?.recordUsageCount(session.language)
        session.includeImportsWithSuggestions =
            this.amazonQServiceManager.getConfiguration().includeImportsWithSuggestions

        if (isNewSession) {
            // Populate the session with information from codewhisperer response
            session.suggestions = suggestionResponse.suggestions
            session.responseContext = suggestionResponse.responseContext
            session.codewhispererSessionId = suggestionResponse.responseContext.codewhispererSessionId
            session.setTimeToFirstRecommendation()
            session.predictionType = SuggestionType.COMPLETION
        } else {
            session.suggestions = [...session.suggestions, ...suggestionResponse.suggestions]
        }

        // Emit service invocation telemetry for every request sent to backend
        emitServiceInvocationTelemetry(this.telemetry, session, suggestionResponse.responseContext.requestId)

        // Discard previous inflight API response due to new trigger
        if (session.discardInflightSessionOnNewInvocation) {
            session.discardInflightSessionOnNewInvocation = false
            this.completionSessionManager.discardSession(session)
            const streakLength = this.getEditsEnabled() ? this.streakTracker.getAndUpdateStreakLength(false) : 0
            await emitUserTriggerDecisionTelemetry(
                this.telemetry,
                this.telemetryService,
                session,
                this.getTimeSinceLastUserModification(),
                0,
                0,
                [],
                [],
                streakLength
            )
        }

        // session was closed by user already made decisions consequent completion request before new paginated API response was received
        if (
            session.predictionType !== SuggestionType.EDIT && // TODO: this is a shorterm fix to allow Edits tabtabtab experience, however the real solution is to manage such sessions correctly
            (session.state === 'CLOSED' || session.state === 'DISCARD')
        ) {
            return EMPTY_RESULT
        }

        // API response was recieved, we can activate session now
        this.completionSessionManager.activateSession(session)

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
                const { includeSuggestionsWithCodeReferences } = this.amazonQServiceManager.getConfiguration()
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

        const { includeImportsWithSuggestions } = this.amazonQServiceManager.getConfiguration()
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
            this.completionSessionManager.closeSession(session)
            await emitUserTriggerDecisionTelemetry(
                this.telemetry,
                this.telemetryService,
                session,
                this.getTimeSinceLastUserModification()
            )
            return EMPTY_RESULT
        }

        return {
            items: suggestionsWithRightContext,
            sessionId: session.id,
            partialResultToken: suggestionResponse.responseContext.nextToken,
        }
    }

    private handleSuggestionsErrors(error: Error, session: CodeWhispererSession): InlineCompletionListWithReferences {
        this.logging.log('Recommendation failure: ' + error)

        emitServiceInvocationFailure(this.telemetry, session, error)

        // UTDE telemetry is not needed here because in error cases we don't care about UTDE for errored out sessions
        this.completionSessionManager.closeSession(session)

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
