import {
    CancellationToken,
    InitializeParams,
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    InlineCompletionTriggerKind,
    InlineCompletionWithReferencesParams,
    LogInlineCompletionSessionResultsParams,
    Position,
    Range,
    Server,
    Telemetry,
    TextDocument,
    ResponseError,
    LSPErrorCodes,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import { AWSError } from 'aws-sdk'
import { autoTrigger, triggerType } from './auto-trigger/autoTrigger'
import {
    CodeWhispererServiceToken,
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    getFileContext,
    Suggestion,
    SuggestionType,
} from '../../shared/codeWhispererService'
import { CodewhispererLanguage, getRuntimeLanguage, getSupportedLanguageId } from '../../shared/languageDetection'
import { truncateOverlapWithRightContext } from './mergeRightUtils'
import { CodeWhispererSession, SessionManager } from './session/sessionManager'
import { CodePercentageTracker } from './codePercentage'
import { CodeWhispererPerceivedLatencyEvent, CodeWhispererServiceInvocationEvent } from '../../shared/telemetry/types'
import {
    getCompletionType,
    getEndPositionForAcceptedSuggestion,
    getErrorMessage,
    isAwsError,
    safeGet,
} from '../../shared/utils'
import { getIdeCategory, makeUserContextObject } from '../../shared/telemetryUtils'
import { fetchSupplementalContext } from '../../shared/supplementalContextUtil/supplementalContextUtil'
import { textUtils } from '@aws/lsp-core'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { AcceptedSuggestionEntry, CodeDiffTracker } from './codeDiffTracker'
import {
    AmazonQError,
    AmazonQServiceConnectionExpiredError,
    AmazonQServiceInitializationError,
} from '../../shared/amazonQServiceManager/errors'
import {
    AmazonQBaseServiceManager,
    QServiceManagerFeatures,
} from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { initBaseTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { initBaseIAMServiceManager } from '../../shared/amazonQServiceManager/AmazonQIAMServiceManager'
import { hasConnectionExpired } from '../../shared/utils'
import { RecentEditTracker, RecentEditTrackerDefaultConfig } from './tracker/codeEditTracker'
import { CursorTracker } from './tracker/cursorTracker'
import { RejectedEditTracker, DEFAULT_REJECTED_EDIT_TRACKER_CONFIG } from './tracker/rejectedEditTracker'
import { DebugLogger } from '../../shared/simpleLogger'
const { editPredictionAutoTrigger } = require('./auto-trigger/editPredictionAutoTrigger')

const EMPTY_RESULT = { sessionId: '', items: [] }
export const CONTEXT_CHARACTERS_LIMIT = 10240

const emitServiceInvocationTelemetry = (telemetry: Telemetry, session: CodeWhispererSession, requestId: string) => {
    const duration = new Date().getTime() - session.startTime
    const data: CodeWhispererServiceInvocationEvent = {
        codewhispererRequestId: requestId,
        codewhispererSessionId: session.responseContext?.codewhispererSessionId,
        codewhispererLastSuggestionIndex: session.suggestions.length - 1,
        codewhispererCompletionType:
            session.suggestions.length > 0 ? getCompletionType(session.suggestions[0]) : undefined,
        codewhispererTriggerType: session.triggerType,
        codewhispererAutomatedTriggerType: session.autoTriggerType,
        duration,
        codewhispererLineNumber: session.startPosition.line,
        codewhispererCursorOffset: session.startPosition.character,
        codewhispererLanguage: session.language,
        credentialStartUrl: session.credentialStartUrl,
        codewhispererSupplementalContextTimeout: session.supplementalMetadata?.isProcessTimeout,
        codewhispererSupplementalContextIsUtg: session.supplementalMetadata?.isUtg,
        codewhispererSupplementalContextLatency: session.supplementalMetadata?.latency,
        codewhispererSupplementalContextLength: session.supplementalMetadata?.contentsLength,
        codewhispererCustomizationArn: session.customizationArn,
    }
    telemetry.emitMetric({
        name: 'codewhisperer_serviceInvocation',
        result: 'Succeeded',
        data: {
            ...data,
            codewhispererImportRecommendationEnabled: session.includeImportsWithSuggestions,
        },
    })
}

const emitServiceInvocationFailure = (telemetry: Telemetry, session: CodeWhispererSession, error: Error | AWSError) => {
    const duration = new Date().getTime() - session.startTime
    const codewhispererRequestId = isAwsError(error) ? error.requestId : undefined

    const data: CodeWhispererServiceInvocationEvent = {
        codewhispererRequestId: codewhispererRequestId,
        codewhispererSessionId: undefined,
        codewhispererLastSuggestionIndex: -1,
        codewhispererTriggerType: session.triggerType,
        codewhispererAutomatedTriggerType: session.autoTriggerType,
        reason: `CodeWhisperer Invocation Exception: ${error.name || 'UnknownError'}`,
        duration,
        codewhispererLineNumber: session.startPosition.line,
        codewhispererCursorOffset: session.startPosition.character,
        codewhispererLanguage: session.language,
        credentialStartUrl: session.credentialStartUrl,
        codewhispererSupplementalContextTimeout: session.supplementalMetadata?.isProcessTimeout,
        codewhispererSupplementalContextIsUtg: session.supplementalMetadata?.isUtg,
        codewhispererSupplementalContextLatency: session.supplementalMetadata?.latency,
        codewhispererSupplementalContextLength: session.supplementalMetadata?.contentsLength,
        codewhispererCustomizationArn: session.customizationArn,
    }

    telemetry.emitMetric({
        name: 'codewhisperer_serviceInvocation',
        result: 'Failed',
        data,
        errorData: {
            reason: error.name || 'UnknownError',
            errorCode: isAwsError(error) ? error.code : undefined,
            httpStatusCode: isAwsError(error) ? error.statusCode : undefined,
        },
    })
}

const emitPerceivedLatencyTelemetry = (telemetry: Telemetry, session: CodeWhispererSession) => {
    const data: CodeWhispererPerceivedLatencyEvent = {
        codewhispererRequestId: session.responseContext?.requestId,
        codewhispererSessionId: session.responseContext?.codewhispererSessionId,
        codewhispererCompletionType:
            session.suggestions.length > 0 ? getCompletionType(session.suggestions[0]) : undefined,
        codewhispererTriggerType: session.triggerType,
        duration: session.firstCompletionDisplayLatency,
        codewhispererLanguage: session.language,
        credentialStartUrl: session.credentialStartUrl,
    }

    telemetry.emitMetric({
        name: 'codewhisperer_perceivedLatency',
        data,
    })
}

const emitUserTriggerDecisionTelemetry = async (
    telemetry: Telemetry,
    telemetryService: TelemetryService,
    session: CodeWhispererSession,
    timeSinceLastUserModification?: number,
    addedCharacterCount?: number,
    deletedCharacterCount?: number,
    streakLength?: number
) => {
    // Prevent reporting user decision if it was already sent
    if (session.reportedUserDecision) {
        return
    }

    // Can not emit previous trigger decision if it's not available on the session
    if (!session.getAggregatedUserTriggerDecision()) {
        return
    }

    await emitAggregatedUserTriggerDecisionTelemetry(
        telemetryService,
        session,
        timeSinceLastUserModification,
        addedCharacterCount,
        deletedCharacterCount,
        streakLength
    )

    session.reportedUserDecision = true
}

const emitAggregatedUserTriggerDecisionTelemetry = (
    telemetryService: TelemetryService,
    session: CodeWhispererSession,
    timeSinceLastUserModification?: number,
    addedCharacterCount?: number,
    deletedCharacterCount?: number,
    streakLength?: number
) => {
    return telemetryService.emitUserTriggerDecision(
        session,
        timeSinceLastUserModification,
        addedCharacterCount,
        deletedCharacterCount,
        streakLength
    )
}

const mergeSuggestionsWithRightContext = (
    rightFileContext: string,
    suggestions: Suggestion[],
    includeImportsWithSuggestions?: boolean,
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

interface AcceptedInlineSuggestionEntry extends AcceptedSuggestionEntry {
    sessionId: string
    requestId: string
    languageId: CodewhispererLanguage
    customizationArn?: string
    completionType: string
    triggerType: string
    credentialStartUrl?: string | undefined
}

export const CodewhispererServerFactory =
    (serviceManager: (features: QServiceManagerFeatures) => AmazonQBaseServiceManager): Server =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging, runtime, sdkInitializator }) => {
        let lastUserModificationTime: number
        let timeSinceLastUserModification: number = 0

        const sessionManager = SessionManager.getInstance()

        // AmazonQTokenServiceManager and TelemetryService are initialized in `onInitialized` handler to make sure Language Server connection is started
        let amazonQServiceManager: AmazonQBaseServiceManager
        let telemetryService: TelemetryService

        // Trackers for monitoring edits and cursor position
        const recentEditTracker = RecentEditTracker.getInstance(logging, RecentEditTrackerDefaultConfig)
        const cursorTracker = CursorTracker.getInstance()
        const rejectedEditTracker = RejectedEditTracker.getInstance(logging, DEFAULT_REJECTED_EDIT_TRACKER_CONFIG)
        let editsEnabled = false

        lsp.addInitializer((params: InitializeParams) => {
            return {
                capabilities: {},
            }
        })

        // CodePercentage and codeDiff tracker have a dependency on TelemetryService, so initialization is also delayed to `onInitialized` handler
        let codePercentageTracker: CodePercentageTracker
        let codeDiffTracker: CodeDiffTracker<AcceptedInlineSuggestionEntry>

        // TODO: come up with a more structure way to do this
        let previousPosition: Position | undefined
        let previousFileContent: string | undefined

        const onInlineCompletionHandler = async (
            params: InlineCompletionWithReferencesParams,
            token: CancellationToken
        ): Promise<InlineCompletionListWithReferences> => {
            // Generate a unique request ID for this completion request
            const flareRequestId = DebugLogger.getInstance().generateflareRequestId()

            // Log the start of the request with structured data
            DebugLogger.getInstance().log(
                flareRequestId,
                'Starting inline completion request',
                { params },
                'info',
                'onInlineCompletionHandler'
            )

            // On every new completion request close current inflight session.
            const currentSession = sessionManager.getCurrentSession()
            if (currentSession && currentSession.state == 'REQUESTING') {
                // If session was requesting at cancellation time, close it
                // User Trigger Decision will be reported at the time of processing API response in the callback below.
                DebugLogger.getInstance().log(
                    flareRequestId,
                    'Discarding in-flight session',
                    { sessionId: currentSession.id, state: currentSession.state },
                    'debug',
                    'onInlineCompletionHandler'
                )
                sessionManager.discardSession(currentSession)
                // Also set this flag for compatibility with main branch
                currentSession.discardInflightSessionOnNewInvocation = true
            }

            if (cursorTracker) {
                cursorTracker.trackPosition(params.textDocument.uri, params.position)
            }

            // prettier-ignore
            return workspace.getTextDocument(params.textDocument.uri).then(async textDocument => {
                    if (!textDocument) {
                        logging.log(`textDocument [${params.textDocument.uri}] not found`)
                        return EMPTY_RESULT
                    }

                    const inferredLanguageId = getSupportedLanguageId(textDocument)
                    if (!inferredLanguageId) {
                        logging.log(
                            `textDocument [${params.textDocument.uri}] with languageId [${textDocument.languageId}] not supported`
                        )
                        return EMPTY_RESULT
                    }

                    if (params.position.character === previousPosition?.character && 
                        params.position.line === previousPosition?.line && 
                        textDocument.getText() === previousFileContent) {
                        return EMPTY_RESULT
                    }

                    previousPosition = params.position
                    previousFileContent = textDocument.getText()

                    // Build request context
                    const isAutomaticLspTriggerKind =
                        params.context.triggerKind == InlineCompletionTriggerKind.Automatic
                    const maxResults = isAutomaticLspTriggerKind ? 1 : 5
                    const selectionRange = params.context.selectedCompletionInfo?.range
                    const fileContext = getFileContext({
                        textDocument,
                        inferredLanguageId,
                        position: params.position,
                    })

                    // Get supplemental context from recent edits if available
                    let supplementalContextFromEdits = undefined
                    if (recentEditTracker) {
                        supplementalContextFromEdits = await recentEditTracker.generateEditBasedContext(textDocument)
                    }
                    
                    const workspaceState = undefined
                    const workspaceId = undefined

                    // This picks the last non-whitespace character, if any, before the cursor
                    const triggerCharacter = fileContext.leftFileContent.trim().at(-1) ?? ''
                    const codewhispererAutoTriggerType = triggerType(fileContext)
                    const previousDecision =
                        sessionManager.getPreviousSession()?.getAggregatedUserTriggerDecision() ?? ''
                    let ideCategory: string | undefined = ''
                    const initializeParams = lsp.getClientInitializeParams()
                    if (initializeParams !== undefined) {
                        ideCategory = getIdeCategory(initializeParams)
                    }
                    const autoTriggerResult = autoTrigger({
                        fileContext, // The left/right file context and programming language
                        lineNum: params.position.line, // the line number of the invocation, this is the line of the cursor
                        char: triggerCharacter, // Add the character just inserted, if any, before the invication position
                        ide: ideCategory ?? '', // TODO: Fetch the IDE in a platform-agnostic way (from the initialize request?)
                        os: '', // TODO: We should get this in a platform-agnostic way (i.e., compatible with the browser)
                        previousDecision, // The last decision by the user on the previous invocation
                        triggerType: codewhispererAutoTriggerType, // The 2 trigger types currently influencing the Auto-Trigger are SpecialCharacter and Enter
                    });

                    // Call editPredictionAutoTrigger and log the result
                    const editPredictionAutoTriggerResult = editPredictionAutoTrigger({
                        fileContext: fileContext,
                        lineNum: params.position.line,
                        char: triggerCharacter,
                        previousDecision: previousDecision,
                        cursorHistory: cursorTracker,
                        recentEdits: recentEditTracker,
                        flareRequestId: flareRequestId // Pass the request UUID for tracking
                    });

                    DebugLogger.getInstance().log(
                        flareRequestId,
                        'EditPredictionAutoTrigger result',
                        {
                            shouldTrigger: editPredictionAutoTriggerResult.shouldTrigger,
                            fileContext: {
                                filename: fileContext.filename,
                                language: fileContext.programmingLanguage.languageName
                            },
                            position: params.position
                        },
                        'debug',
                        'onInlineCompletionHandler'
                    );

                    if (
                        isAutomaticLspTriggerKind &&
                        codewhispererAutoTriggerType === 'Classifier' &&
                        !(autoTriggerResult.shouldTrigger || editPredictionAutoTriggerResult.shouldTrigger)
                    ) {
                        return EMPTY_RESULT
                    }

                    const predictionTypes = [
                        ...(autoTriggerResult.shouldTrigger ? [['COMPLETIONS']] : []),
                        ...(editPredictionAutoTriggerResult.shouldTrigger && editsEnabled ? [['EDITS']] : [])
                    ]

                     console.log('[PredictionTypes] Result:' + predictionTypes);


                    const codeWhispererService = amazonQServiceManager.getCodewhispererService()
                    // supplementalContext available only via token authentication
                    const supplementalContextPromise =
                        codeWhispererService instanceof CodeWhispererServiceToken
                            ? fetchSupplementalContext(textDocument, params.position, workspace, logging, token)
                            : Promise.resolve(undefined)

                    let requestContext: GenerateSuggestionsRequest = {
                        fileContext,
                        maxResults,
                    }

                    const supplementalContext = await supplementalContextPromise
                    // TODO: logging
                    if (codeWhispererService instanceof CodeWhispererServiceToken) {
                        // Combine supplemental contexts from both sources if available
                        const supplementalContextItems = [
                            ...(supplementalContext?.supplementalContextItems || []),
                        ]
                        const supplementalContextItemsForEdits = [
                            ...(supplementalContextFromEdits?.supplementalContextItems || [])
                        ]

                        requestContext.supplementalContexts = [
                            ...supplementalContextItems.map(v => ({
                                content: v.content,
                                filePath: v.filePath,
                            })),
                            ...supplementalContextItemsForEdits.map(v => ({
                                content: v.content,
                                filePath: v.filePath,
                                type: 'PreviousEditorState',
                                metadata: {
                                    previousEditorStateMetadata : {
                                        timeOffset: 1000
                                    }
                                }
                            }))
                        ]

                        // NOTE : Has been turned off to get this working
                        // requestContext.predictionTypes = ['EDITS']
                        requestContext.editorState = {
                            document:  {
                                relativeFilePath: textDocument.uri,
                                programmingLanguage: {
                                    languageName: textDocument.languageId
                                  },
                                text : textDocument.getText()
                              },
                            cursorState: {
                                position : {
                                        line: params.position.line,
                                        character: params.position.character
                                      }
                                }
                            }
                    }

                    // Close ACTIVE session and record Discard trigger decision immediately
                    if (currentSession && currentSession.state === 'ACTIVE') {
                        // Emit user trigger decision at session close time for active session
                        sessionManager.discardSession(currentSession)
                        const streakLength = sessionManager.getAndUpdateStreakLength(false)
                        await emitUserTriggerDecisionTelemetry(
                            telemetry,
                            telemetryService,
                            currentSession,
                            timeSinceLastUserModification,
                            0,
                            0,
                            streakLength
                        )
                    }
                    const newSession = sessionManager.createSession({
                        document: textDocument,
                        startPosition: params.position,
                        triggerType: isAutomaticLspTriggerKind ? 'AutoTrigger' : 'OnDemand',
                        language: fileContext.programmingLanguage.languageName,
                        requestContext: requestContext,
                        autoTriggerType: isAutomaticLspTriggerKind ? codewhispererAutoTriggerType : undefined,
                        triggerCharacter: triggerCharacter,
                        classifierResult: autoTriggerResult?.classifierResult,
                        classifierThreshold: autoTriggerResult?.classifierThreshold,
                        credentialStartUrl: credentialsProvider.getConnectionMetadata?.()?.sso?.startUrl ?? undefined,
                        supplementalMetadata: {
                            // Merge metadata from edit-based context if available
                            contentsLength: (supplementalContext?.contentsLength || 0) +
                                           (supplementalContextFromEdits?.contentsLength || 0),
                            latency: Math.max(supplementalContext?.latency || 0,
                                             supplementalContextFromEdits?.latency || 0),
                            isUtg: supplementalContext?.isUtg || false,
                            isProcessTimeout: supplementalContext?.isProcessTimeout || false,
                            strategy: supplementalContextFromEdits ? 'recentEdits' : (supplementalContext?.strategy || 'Empty'),
                            supplementalContextItems: [
                                ...(supplementalContext?.supplementalContextItems || []),
                                ...(supplementalContextFromEdits?.supplementalContextItems || [])
                            ]
                        },
                        customizationArn: textUtils.undefinedIfEmpty(codeWhispererService.customizationArn),
                        flareRequestId: flareRequestId // Store the request UUID in the session
                    })

                    // Add extra context to request context
                    const { extraContext } = amazonQServiceManager.getConfiguration().inlineSuggestions
                    if (extraContext) {
                        requestContext.fileContext.leftFileContent = extraContext + '\n' + requestContext.fileContext.leftFileContent
                    }
                    
                    // TODO: generateSuggestionsAndPrefetch should only apply to vscode but not other IDEs
                    return codeWhispererService.generateCompletionsAndEdits(textDocument, {
                        ...requestContext,
                        predictionTypes : predictionTypes.flat(),
                        fileContext: {
                            ...requestContext.fileContext,
                            leftFileContent: requestContext.fileContext.leftFileContent
                                .slice(-CONTEXT_CHARACTERS_LIMIT)
                                .replaceAll('\r\n', '\n'),
                            rightFileContent: requestContext.fileContext.rightFileContent
                                .slice(0, CONTEXT_CHARACTERS_LIMIT)
                                .replaceAll('\r\n', '\n'),
                        },
                    }, { enablePrefetch: editsEnabled })
                        .then(async suggestionResponse => {
                            DebugLogger.getInstance().log(
                                flareRequestId,
                                'Received suggestion response',
                                {
                                    suggestionCount: suggestionResponse.suggestions.length,
                                    suggestionType: suggestionResponse.suggestionType,
                                    responseContext: suggestionResponse.responseContext
                                },
                                'info',
                                'onInlineCompletionHandler'
                            );

                            codePercentageTracker.countInvocation(inferredLanguageId)

                            // Populate the session with information from codewhisperer response
                            newSession.suggestions = suggestionResponse.suggestions
                            newSession.responseContext = suggestionResponse.responseContext
                            newSession.codewhispererSessionId = suggestionResponse.responseContext.codewhispererSessionId
                            newSession.timeToFirstRecommendation = new Date().getTime() - newSession.startTime

                            // Emit service invocation telemetry for every request sent to backend
                            emitServiceInvocationTelemetry(telemetry, newSession, flareRequestId)

                            // Exit early and discard API response
                            // session was closed by consequent completion request before API response was received
                            // and session never become ACTIVE.
                            // Emit Discard trigger decision here, because we will have session and requist IDs only at this point.
                            if (newSession.state === 'CLOSED' || newSession.state === 'DISCARD') {
                                // Force Discard user decision on every received suggestion
                                newSession.suggestions.forEach(s => newSession.setSuggestionState(s.itemId, 'Discard'))
                                const streakLength = sessionManager.getAndUpdateStreakLength(false)
                                await emitUserTriggerDecisionTelemetry(
                                    telemetry,
                                    telemetryService,
                                    newSession,
                                    timeSinceLastUserModification,
                                    0,
                                    0,
                                    streakLength
                                )
                                return EMPTY_RESULT
                            }

                            // API response was recieved, we can activate session now
                            sessionManager.activateSession(newSession)

                            // Process suggestions to apply Empty or Filter filters
                            const filteredSuggestions = newSession.suggestions
                                // Empty suggestion filter
                                .filter(suggestion => {
                                    if (suggestion.content === '') {
                                        newSession.setSuggestionState(suggestion.itemId, 'Empty')
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
                                    const { includeSuggestionsWithCodeReferences } = amazonQServiceManager.getConfiguration()
                                    if (includeSuggestionsWithCodeReferences) {
                                        return true
                                    }

                                    if (suggestion.references == null || suggestion.references.length === 0) {
                                        return true
                                    }

                                    // Filter out suggestions that have references when includeSuggestionsWithCodeReferences setting is true
                                    newSession.setSuggestionState(suggestion.itemId, 'Filter')
                                    return false
                                })


                                if(suggestionResponse.suggestionType === SuggestionType.COMPLETION){

                                    const suggestionsWithRightContext = mergeSuggestionsWithRightContext(
                                        fileContext.rightFileContent,
                                        filteredSuggestions,
                                        newSession.includeImportsWithSuggestions,
                                        selectionRange
                                    ).filter(suggestion => {
                                        // Discard suggestions that have empty string insertText after right context merge and can't be displayed anymore
                                        if (suggestion.insertText === '') {
                                            newSession.setSuggestionState(suggestion.itemId, 'Discard')
                                            return false
                                        }


                                        return true
                                    })

                                    suggestionsWithRightContext.forEach(suggestion => {
                                        const cachedSuggestion = newSession.suggestions.find(s => s.itemId === suggestion.itemId)
                                        if (cachedSuggestion) cachedSuggestion.insertText = suggestion.insertText.toString()
                                    })

                                    // If after all server-side filtering no suggestions can be displayed, close session and return empty results
                                    if (suggestionsWithRightContext.length === 0) {
                                        sessionManager.closeSession(newSession)
                                        const streakLength = sessionManager.getAndUpdateStreakLength(false)
                                        await emitUserTriggerDecisionTelemetry(
                                            telemetry,
                                            telemetryService,
                                            newSession,
                                            timeSinceLastUserModification,
                                            0,
                                            0,
                                            streakLength
                                        )

                                        return EMPTY_RESULT
                                    }

                                    return { items: suggestionsWithRightContext, sessionId: newSession.id }

                                } else {

                                    return { items: suggestionResponse.suggestions.map(suggestion => {
                                        // Check if this suggestion is similar to a previously rejected edit
                                        const isSimilarToRejected = rejectedEditTracker.isSimilarToRejected(
                                            suggestion.content,
                                            textDocument.uri
                                        )

                                        if (isSimilarToRejected) {
                                            // Mark as rejected in the session
                                            newSession.setSuggestionState(suggestion.itemId, 'Reject')
                                            logging.debug(`[EDIT_PREDICTION] Filtered out suggestion similar to previously rejected edit`)
                                            // Return empty item that will be filtered out
                                            return {
                                                insertText: '',
                                                isInlineEdit: true,
                                                itemId: suggestion.itemId
                                            }
                                        }

                                        const cachedSuggestion = newSession.suggestions.find(s => s.itemId === suggestion.itemId)
                                        if (cachedSuggestion) cachedSuggestion.insertText = suggestion.content

                                        return {
                                            insertText: suggestion.content,
                                            isInlineEdit: true,
                                            itemId: suggestion.itemId
                                        }
                                    }).filter(item => item.insertText !== ''), sessionId: newSession.id }

                                }
                        })
                        .catch(error => {
                            // TODO, handle errors properly
                            logging.log('Recommendation failure: ' + error + '\n' + error.stack)
                            // TODO: check if we can/should emit UserTriggerDecision
                            sessionManager.closeSession(newSession)

                            DebugLogger.getInstance().log(
                                flareRequestId,
                                'Error generating suggestions',
                                {
                                    error: error.toString(),
                                    stack: error.stack,
                                    sessionId: newSession.id
                                },
                                'error',
                                'onInlineCompletionHandler'
                            );

                            if (error instanceof AmazonQError) {
                                throw error
                            }

                            if (hasConnectionExpired(error)) {
                                throw new AmazonQServiceConnectionExpiredError(getErrorMessage(error))
                            }
                            return EMPTY_RESULT
                        })
                })
                    .catch(error => {
                        logging.log('onInlineCompletionHandler error:' + error)

                        if (error instanceof AmazonQError) {
                            throw new ResponseError(
                                LSPErrorCodes.RequestFailed,
                                error.message || 'Error processing suggestion requests',
                                {
                                    awsErrorCode: error.code,
                                }
                            )
                        }

                        return EMPTY_RESULT
                    })
        }

        // Schedule tracker for UserModification Telemetry event
        const enqueueCodeDiffEntry = (session: CodeWhispererSession, acceptedSuggestion: Suggestion) => {
            const endPosition = getEndPositionForAcceptedSuggestion(acceptedSuggestion.content, session.startPosition)

            codeDiffTracker.enqueue({
                sessionId: session.codewhispererSessionId || '',
                requestId: session.responseContext?.requestId || '',
                fileUrl: session.document.uri,
                languageId: session.language,
                time: Date.now(),
                originalString: acceptedSuggestion.content,
                startPosition: session.startPosition,
                endPosition: endPosition,
                customizationArn: session.customizationArn,
                completionType: getCompletionType(acceptedSuggestion),
                triggerType: session.triggerType,
                credentialStartUrl: session.credentialStartUrl,
            })
        }

        const onLogInlineCompletionSessionResultsHandler = async (params: LogInlineCompletionSessionResultsParams) => {
            const {
                sessionId,
                completionSessionResult,
                firstCompletionDisplayLatency,
                totalSessionDisplayTime,
                typeaheadLength,
                addedCharacterCount,
                deletedCharacterCount,
                isInlineEdit,
            } = params

            const session = sessionManager.getSessionById(sessionId)

            if (!session) {
                logging.log(`ERROR: Session ID ${sessionId} was not found`)
                return
            }

            // Get the flareRequestId from the session if available
            const flareRequestId = (session as any).flareRequestId

            if (flareRequestId) {
                DebugLogger.getInstance().log(
                    flareRequestId,
                    'Processing inline completion session results',
                    {
                        sessionId,
                        completionSessionResult: JSON.stringify(completionSessionResult),
                        firstCompletionDisplayLatency,
                        totalSessionDisplayTime,
                        typeaheadLength,
                        addedCharacterCount,
                        deletedCharacterCount,
                    },
                    'info',
                    'onLogInlineCompletionSessionResultsHandler'
                )
            }

            if (session.state !== 'ACTIVE') {
                logging.log(`ERROR: Trying to record trigger decision for not-active session ${sessionId}`)
                return
            }

            const acceptedItemId = Object.keys(params.completionSessionResult).find(
                k => params.completionSessionResult[k].accepted
            )
            const isAccepted = acceptedItemId ? true : false
            const acceptedSuggestion = session.suggestions.find(s => s.itemId === acceptedItemId)
            if (acceptedSuggestion !== undefined && acceptedSuggestion.insertText) {
                if (acceptedSuggestion) {
                    codePercentageTracker.countSuccess(session.language)
                    codePercentageTracker.countAcceptedTokens(session.language, acceptedSuggestion.insertText)
                    codePercentageTracker.countTotalTokens(session.language, acceptedSuggestion.insertText, true)

                    enqueueCodeDiffEntry(session, acceptedSuggestion)
                }
            }

            if (acceptedSuggestion === undefined) {
                // Clear if it's a reject
                logging.info(`user reject suggestion, clearning prefetched suggestion`)
                // TODO: move to somewhere like session.close()
                // acceptedSuggestion.insertText will be undefined if its' NEP
                amazonQServiceManager.getCodewhispererService().clearCachedSuggestions()
            }

            // Handle rejected edit predictions
            if (isInlineEdit && !isAccepted) {
                // Find all rejected suggestions in this session
                const rejectedSuggestions = session.suggestions.filter(suggestion => {
                    const result = completionSessionResult[suggestion.itemId]
                    return result && result.seen && !result.accepted
                })

                // Record each rejected edit
                for (const rejectedSuggestion of rejectedSuggestions) {
                    if (rejectedSuggestion.content) {
                        rejectedEditTracker.recordRejectedEdit({
                            content: rejectedSuggestion.content,
                            timestamp: Date.now(),
                            documentUri: session.document.uri,
                            position: session.startPosition,
                        })

                        logging.debug(
                            `[EDIT_PREDICTION] Recorded rejected edit: ${rejectedSuggestion.content.substring(0, 20)}...`
                        )
                    }
                }
            }

            session.setClientResultData(
                completionSessionResult,
                firstCompletionDisplayLatency,
                totalSessionDisplayTime,
                typeaheadLength
            )

            if (firstCompletionDisplayLatency) emitPerceivedLatencyTelemetry(telemetry, session)

            // Always emit user trigger decision at session close
            sessionManager.closeSession(session)
            const streakLength = sessionManager.getAndUpdateStreakLength(isAccepted)
            await emitUserTriggerDecisionTelemetry(
                telemetry,
                telemetryService,
                session,
                timeSinceLastUserModification,
                addedCharacterCount,
                deletedCharacterCount,
                streakLength
            )
        }

        const updateConfiguration = (updatedConfig: AmazonQWorkspaceConfig) => {
            logging.debug('Updating configuration of inline complete server.')

            const { customizationArn, optOutTelemetryPreference } = updatedConfig

            codePercentageTracker.customizationArn = customizationArn
            logging.debug(`CodePercentageTracker customizationArn updated to ${customizationArn}`)
            /*
                            The flag enableTelemetryEventsToDestination is set to true temporarily. It's value will be determined through destination
                            configuration post all events migration to STE. It'll be replaced by qConfig['enableTelemetryEventsToDestination'] === true
                        */
            // const enableTelemetryEventsToDestination = true
            // telemetryService.updateEnableTelemetryEventsToDestination(enableTelemetryEventsToDestination)
            telemetryService.updateOptOutPreference(optOutTelemetryPreference)
            logging.debug(`TelemetryService OptOutPreference updated to ${optOutTelemetryPreference}`)
        }

        const onInitializedHandler = async () => {
            amazonQServiceManager = serviceManager({
                credentialsProvider,
                lsp,
                logging,
                runtime,
                sdkInitializator,
                workspace,
            })

            const clientParams = safeGet(
                lsp.getClientInitializeParams(),
                new AmazonQServiceInitializationError(
                    'TelemetryService initialized before LSP connection was initialized.'
                )
            )

            logging.log(`Client initialization params: ${JSON.stringify(clientParams)}`)
            editsEnabled =
                clientParams?.initializationOptions?.aws?.awsClientCapabilities?.textDocument
                    ?.inlineCompletionWithReferences?.inlineEditSupport ?? false
            console.log('[EDITS] Edits enabled: ' + editsEnabled)
            console.log('Initializing DebugLogger with GraphQL server')
            DebugLogger.getInstance() // This will initialize the singleton and start the server

            telemetryService = new TelemetryService(amazonQServiceManager, credentialsProvider, telemetry, logging)
            telemetryService.updateUserContext(makeUserContextObject(clientParams, runtime.platform, 'INLINE'))

            codePercentageTracker = new CodePercentageTracker(telemetryService)
            codeDiffTracker = new CodeDiffTracker(
                workspace,
                logging,
                async (entry: AcceptedInlineSuggestionEntry, percentage, unmodifiedAcceptedCharacterCount) => {
                    await telemetryService.emitUserModificationEvent(
                        {
                            sessionId: entry.sessionId,
                            requestId: entry.requestId,
                            languageId: entry.languageId,
                            customizationArn: entry.customizationArn,
                            timestamp: new Date(),
                            acceptedCharacterCount: entry.originalString.length,
                            modificationPercentage: percentage,
                            unmodifiedAcceptedCharacterCount: unmodifiedAcceptedCharacterCount,
                        },
                        {
                            completionType: entry.completionType || 'LINE',
                            triggerType: entry.triggerType || 'OnDemand',
                            credentialStartUrl: entry.credentialStartUrl,
                        }
                    )
                }
            )

            const periodicLoggingEnabled = process.env.LOG_EDIT_TRACKING === 'true'
            logging.log(
                `[SERVER] Initialized telemetry-dependent components: CodePercentageTracker, CodeDiffTracker, periodicLogging=${periodicLoggingEnabled}`
            )

            await amazonQServiceManager.handleDidChangeConfiguration()
            await amazonQServiceManager.addDidChangeConfigurationListener(updateConfiguration)
        }

        lsp.extensions.onInlineCompletionWithReferences(onInlineCompletionHandler)
        lsp.extensions.onLogInlineCompletionSessionResults(onLogInlineCompletionSessionResultsHandler)
        lsp.onInitialized(onInitializedHandler)

        lsp.onDidChangeTextDocument(async p => {
            const textDocument = await workspace.getTextDocument(p.textDocument.uri)
            const languageId = getSupportedLanguageId(textDocument)

            if (!textDocument || !languageId) {
                return
            }

            logging.log(`Document changed: ${p.textDocument.uri}`)

            // Track token counts for code percentage metrics
            if (codePercentageTracker) {
                p.contentChanges.forEach(change => {
                    codePercentageTracker.countTotalTokens(languageId, change.text, false)
                })
            }

            // Record last user modification time for any document
            if (lastUserModificationTime) {
                timeSinceLastUserModification = new Date().getTime() - lastUserModificationTime
            }
            lastUserModificationTime = new Date().getTime()

            // Process document changes with RecentEditTracker
            if (recentEditTracker) {
                logging.log(
                    `[SERVER] Processing document change with RecentEditTracker: ${p.textDocument.uri}, version: ${textDocument.version}`
                )
                logging.log(`[SERVER] Change details: ${p.contentChanges.length} changes`)

                await recentEditTracker.handleDocumentChange({
                    uri: p.textDocument.uri,
                    languageId: textDocument.languageId,
                    version: textDocument.version,
                    text: textDocument.getText(),
                })
            }
        })

        lsp.onDidOpenTextDocument(p => {
            logging.log(`Document opened: ${p.textDocument.uri}`)

            // Track document opening with RecentEditTracker
            if (recentEditTracker) {
                logging.log(`[SERVER] Tracking document open with RecentEditTracker: ${p.textDocument.uri}`)
                recentEditTracker.handleDocumentOpen({
                    uri: p.textDocument.uri,
                    languageId: p.textDocument.languageId,
                    version: p.textDocument.version,
                    text: p.textDocument.text,
                })
            }
        })

        lsp.onDidCloseTextDocument(p => {
            logging.log(`Document closed: ${p.textDocument.uri}`)

            // Track document closing with RecentEditTracker
            if (recentEditTracker) {
                logging.log(`[SERVER] Tracking document close with RecentEditTracker: ${p.textDocument.uri}`)
                recentEditTracker.handleDocumentClose(p.textDocument.uri)
            }

            if (cursorTracker) {
                cursorTracker.clearHistory(p.textDocument.uri)
            }
        })

        logging.log('Amazon Q Inline Suggestion server has been initialised')

        return async () => {
            // Dispose all trackers in reverse order of initialization
            if (codePercentageTracker) codePercentageTracker.dispose()
            if (codeDiffTracker) await codeDiffTracker.shutdown()
            if (recentEditTracker) recentEditTracker.dispose()
            if (cursorTracker) cursorTracker.dispose()
            if (rejectedEditTracker) rejectedEditTracker.dispose()

            logging.log('Amazon Q Inline Suggestion server has been shut down')
        }
    }

export const CodeWhispererServerIAM = CodewhispererServerFactory(initBaseIAMServiceManager)
export const CodeWhispererServerToken = CodewhispererServerFactory(initBaseTokenServiceManager)
