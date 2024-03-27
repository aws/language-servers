import {
    Server,
    CredentialsProvider,
    Telemetry,
    CancellationToken,
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    InlineCompletionWithReferencesParams,
    LogInlineCompletionSessionResultsParams,
    InlineCompletionTriggerKind,
    Position,
    Range,
    TextDocument,
} from '@aws/language-server-runtimes/server-interface'
import { AWSError } from 'aws-sdk'
import { autoTrigger, triggerType } from './auto-trigger/autoTrigger'
import {
    CodeWhispererServiceBase,
    CodeWhispererServiceIAM,
    CodeWhispererServiceToken,
    Suggestion,
} from './codeWhispererService'
import { CodewhispererLanguage, getSupportedLanguageId } from './languageDetection'
import { getPrefixSuffixOverlap, truncateOverlapWithRightContext } from './mergeRightUtils'
import { CodeWhispererSession, SessionManager } from './session/sessionManager'
import { CodePercentageTracker } from './telemetry/codePercentage'
import {
    CodeWhispererPerceivedLatencyEvent,
    CodeWhispererServiceInvocationEvent,
    CodeWhispererUserDecisionEvent,
    CodeWhispererUserTriggerDecisionEvent,
} from './telemetry/types'
import { getCompletionType, isAwsError } from './utils'

const EMPTY_RESULT = { sessionId: '', items: [] }
export const CONTEXT_CHARACTERS_LIMIT = 10240

// Both clients (token, sigv4) define their own types, this return value needs to match both of them.
const getFileContext = (params: {
    textDocument: TextDocument
    position: Position
    inferredLanguageId: CodewhispererLanguage
}): {
    filename: string
    programmingLanguage: {
        languageName: CodewhispererLanguage
    }
    leftFileContent: string
    rightFileContent: string
} => {
    const left = params.textDocument.getText({
        start: { line: 0, character: 0 },
        end: params.position,
    })
    const right = params.textDocument.getText({
        start: params.position,
        end: params.textDocument.positionAt(params.textDocument.getText().length),
    })

    return {
        filename: params.textDocument.uri,
        programmingLanguage: {
            languageName: params.inferredLanguageId,
        },
        leftFileContent: left,
        rightFileContent: right,
    }
}

const emitServiceInvocationTelemetry = (telemetry: Telemetry, session: CodeWhispererSession) => {
    const duration = new Date().getTime() - session.startTime
    const data: CodeWhispererServiceInvocationEvent = {
        codewhispererRequestId: session.responseContext?.requestId,
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
    }
    telemetry.emitMetric({
        name: 'codewhisperer_serviceInvocation',
        result: 'Succeeded',
        data,
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

const emitUserTriggerDecisionTelemetry = (
    telemetry: Telemetry,
    session: CodeWhispererSession,
    timeSinceLastUserModification?: number
) => {
    // Prevent reporting user decision if it was already sent
    if (session.reportedUserDecision) {
        return
    }

    // Can not emit previous trigger decision if it's not available on the session
    if (!session.getAggregatedUserTriggerDecision()) {
        return
    }

    emitAggregatedUserTriggerDecisionTelemetry(telemetry, session, timeSinceLastUserModification)
    emitUserDecisionTelemetry(telemetry, session)

    session.reportedUserDecision = true
}

const emitAggregatedUserTriggerDecisionTelemetry = (
    telemetry: Telemetry,
    session: CodeWhispererSession,
    timeSinceLastUserModification?: number
) => {
    const data: CodeWhispererUserTriggerDecisionEvent = {
        codewhispererSessionId: session.codewhispererSessionId || '',
        codewhispererFirstRequestId: session.responseContext?.requestId || '',
        credentialStartUrl: session.credentialStartUrl,
        codewhispererSuggestionState: session.getAggregatedUserTriggerDecision(),
        codewhispererCompletionType:
            session.suggestions.length > 0 ? getCompletionType(session.suggestions[0]) : undefined,
        codewhispererLanguage: session.language,
        codewhispererTriggerType: session.triggerType,
        codewhispererAutomatedTriggerType: session.autoTriggerType,
        codewhispererTriggerCharacter:
            session.autoTriggerType === 'SpecialCharacters' ? session.triggerCharacter : undefined,
        codewhispererLineNumber: session.startPosition.line,
        codewhispererCursorOffset: session.startPosition.character,
        codewhispererSuggestionCount: session.suggestions.length,
        codewhispererClassifierResult: session.classifierResult,
        codewhispererClassifierThreshold: session.classifierThreshold,
        codewhispererTotalShownTime: session.totalSessionDisplayTime || 0,
        codewhispererTypeaheadLength: session.typeaheadLength || 0,
        // Global time between any 2 document changes
        codewhispererTimeSinceLastDocumentChange: timeSinceLastUserModification,
        codewhispererTimeSinceLastUserDecision: session.previousTriggerDecisionTime
            ? session.startTime - session.previousTriggerDecisionTime
            : undefined,
        codewhispererTimeToFirstRecommendation: session.timeToFirstRecommendation,
        codewhispererPreviousSuggestionState: session.previousTriggerDecision,
    }

    telemetry.emitMetric({
        name: 'codewhisperer_userTriggerDecision',
        data,
    })
}

const emitUserDecisionTelemetry = (telemetry: Telemetry, session: CodeWhispererSession) => {
    session.suggestions.forEach((suggestion, i) => {
        const licenses = suggestion.references?.map(r => r.licenseName).filter((l): l is string => !!l)

        const data: CodeWhispererUserDecisionEvent = {
            codewhispererRequestId: session.responseContext?.requestId,
            codewhispererSessionId: session.responseContext?.codewhispererSessionId,
            codewhispererCompletionType: getCompletionType(suggestion),
            codewhispererTriggerType: session.triggerType,
            codewhispererLanguage: session.language,
            credentialStartUrl: session.credentialStartUrl,
            codewhispererSuggestionIndex: i,
            codewhispererSuggestionState: session.getSuggestionState(suggestion.itemId),
            codewhispererSuggestionReferences: [...new Set(licenses)],
            codewhispererSuggestionReferenceCount: suggestion.references?.length || 0,
        }

        telemetry.emitMetric({
            name: 'codewhisperer_userDecision',
            data,
        })
    })
}

const mergeSuggestionsWithRightContext = (
    rightFileContext: string,
    suggestions: Suggestion[],
    range?: Range
): InlineCompletionItemWithReferences[] => {
    return suggestions.map(suggestion => {
        const insertText = truncateOverlapWithRightContext(rightFileContext, suggestion.content)
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
        }
    })
}

// Checks if any suggestion in list of suggestions matches with left context of the file
const hasLeftContextMatch = (suggestions: Suggestion[], leftFileContent: string): boolean => {
    for (const suggestion of suggestions) {
        const overlap = getPrefixSuffixOverlap(leftFileContent, suggestion.content)

        if (overlap.length > 0 && overlap != suggestion.content) {
            return true
        }
    }
    return false
}

export const CodewhispererServerFactory =
    (service: (credentials: CredentialsProvider) => CodeWhispererServiceBase): Server =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging }) => {
        let lastUserModificationTime: number
        let timeSinceLastUserModification: number = 0

        const sessionManager = SessionManager.getInstance()
        const codeWhispererService = service(credentialsProvider)

        // Mutable state to track whether code with references should be included in
        // the response. No locking or concurrency controls, filtering is done
        // right before returning and is only guaranteed to be consistent within
        // the context of a single response.
        let includeSuggestionsWithCodeReferences = false

        const codePercentageTracker = new CodePercentageTracker(telemetry)

        const onInlineCompletionHandler = async (
            params: InlineCompletionWithReferencesParams,
            _token: CancellationToken
        ): Promise<InlineCompletionListWithReferences> => {
            // On every new completion request close current inflight session.
            const currentSession = sessionManager.getCurrentSession()
            if (currentSession && currentSession.state == 'REQUESTING') {
                // If session was requesting at cancellation time, close it
                // User Trigger Decision will be reported at the time of processing API response in the callback below.
                sessionManager.discardSession(currentSession)
            }

            return workspace.getTextDocument(params.textDocument.uri).then(textDocument => {
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

                // Build request context
                const isAutomaticLspTriggerKind = params.context.triggerKind == InlineCompletionTriggerKind.Automatic
                const maxResults = isAutomaticLspTriggerKind ? 1 : 5
                const selectionRange = params.context.selectedCompletionInfo?.range
                const fileContext = getFileContext({ textDocument, inferredLanguageId, position: params.position })

                // TODO: Can we get this derived from a keyboard event in the future?
                // This picks the last non-whitespace character, if any, before the cursor
                const triggerCharacter = fileContext.leftFileContent.trim().at(-1) ?? ''
                const codewhispererAutoTriggerType = triggerType(fileContext)
                const previousDecision = sessionManager.getPreviousSession()?.getAggregatedUserTriggerDecision() ?? ''
                const autoTriggerResult = autoTrigger({
                    fileContext, // The left/right file context and programming language
                    lineNum: params.position.line, // the line number of the invocation, this is the line of the cursor
                    char: triggerCharacter, // Add the character just inserted, if any, before the invication position
                    ide: '', // TODO: Fetch the IDE in a platform-agnostic way (from the initialize request?)
                    os: '', // TODO: We should get this in a platform-agnostic way (i.e., compatible with the browser)
                    previousDecision, // The last decision by the user on the previous invocation
                    triggerType: codewhispererAutoTriggerType, // The 2 trigger types currently influencing the Auto-Trigger are SpecialCharacter and Enter
                })

                if (isAutomaticLspTriggerKind && !autoTriggerResult.shouldTrigger) {
                    return EMPTY_RESULT
                }

                const requestContext = {
                    fileContext,
                    maxResults,
                }

                // Close ACTIVE session and record Discard trigger decision immediately
                if (currentSession && currentSession.state === 'ACTIVE') {
                    // Emit user trigger decision at session close time for active session
                    sessionManager.discardSession(currentSession)
                    emitUserTriggerDecisionTelemetry(telemetry, currentSession, timeSinceLastUserModification)
                }
                const newSession = sessionManager.createSession({
                    startPosition: params.position,
                    triggerType: isAutomaticLspTriggerKind ? 'AutoTrigger' : 'OnDemand',
                    language: fileContext.programmingLanguage.languageName,
                    requestContext: requestContext,
                    autoTriggerType: isAutomaticLspTriggerKind ? codewhispererAutoTriggerType : undefined,
                    triggerCharacter: triggerCharacter,
                    classifierResult: autoTriggerResult?.classifierResult,
                    classifierThreshold: autoTriggerResult?.classifierThreshold,
                    credentialStartUrl: credentialsProvider.getConnectionMetadata()?.sso?.startUrl ?? undefined,
                })

                codePercentageTracker.countInvocation(inferredLanguageId)

                return codeWhispererService
                    .generateSuggestions({
                        ...requestContext,
                        fileContext: {
                            ...requestContext.fileContext,
                            leftFileContent: requestContext.fileContext.leftFileContent
                                .slice(-CONTEXT_CHARACTERS_LIMIT)
                                .replaceAll('\r\n', '\n'),
                            rightFileContent: requestContext.fileContext.rightFileContent
                                .slice(0, CONTEXT_CHARACTERS_LIMIT)
                                .replaceAll('\r\n', '\n'),
                        },
                    })
                    .then(suggestionResponse => {
                        // Populate the session with information from codewhisperer response
                        newSession.suggestions = suggestionResponse.suggestions
                        newSession.responseContext = suggestionResponse.responseContext
                        newSession.codewhispererSessionId = suggestionResponse.responseContext.codewhispererSessionId
                        newSession.timeToFirstRecommendation = new Date().getTime() - newSession.startTime

                        // Emit service invocation telemetry for every request sent to backend
                        emitServiceInvocationTelemetry(telemetry, newSession)

                        // Exit early and discard API response
                        // session was closed by consequent completion request before API response was received
                        // and session never become ACTIVE.
                        // Emit Discard trigger decision here, because we will have session and requist IDs only at this point.
                        if (newSession.state === 'CLOSED' || newSession.state === 'DISCARD') {
                            // Force Discard user decision on every received suggestion
                            newSession.suggestions.forEach(s => newSession.setSuggestionState(s.itemId, 'Discard'))
                            emitUserTriggerDecisionTelemetry(telemetry, newSession, timeSinceLastUserModification)
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

                        const suggestionsWithRightContext = mergeSuggestionsWithRightContext(
                            fileContext.rightFileContent,
                            filteredSuggestions,
                            selectionRange
                        ).filter(suggestion => {
                            // Discard suggestions that have empty string insertText after right context merge and can't be displayed anymore
                            if (suggestion.insertText === '') {
                                newSession.setSuggestionState(suggestion.itemId, 'Discard')
                                return false
                            }

                            return true
                        })

                        // If after all server-side filtering no suggestions can be displayed, close session and return empty results
                        if (suggestionsWithRightContext.length === 0) {
                            sessionManager.closeSession(newSession)
                            emitUserTriggerDecisionTelemetry(telemetry, newSession, timeSinceLastUserModification)

                            return EMPTY_RESULT
                        }

                        return { items: suggestionsWithRightContext, sessionId: newSession.id }
                    })
                    .catch(err => {
                        // TODO, handle errors properly
                        logging.log('Recommendation failure: ' + err)
                        emitServiceInvocationFailure(telemetry, newSession, err)

                        // TODO: check if we can/should emit UserTriggerDecision
                        sessionManager.closeSession(newSession)

                        return EMPTY_RESULT
                    })
            })
        }

        const onLogInlineCompletionSessionResultsHandler = async (params: LogInlineCompletionSessionResultsParams) => {
            const {
                sessionId,
                completionSessionResult,
                firstCompletionDisplayLatency,
                totalSessionDisplayTime,
                typeaheadLength,
            } = params

            const session = sessionManager.getSessionById(sessionId)

            if (!session) {
                logging.log(`ERROR: Session ID ${sessionId} was not found`)
                return
            }

            if (session.state !== 'ACTIVE') {
                logging.log(`ERROR: Trying to record trigger decision for not-active session ${sessionId}`)
                return
            }

            const acceptedItemId = Object.keys(params.completionSessionResult).find(
                k => params.completionSessionResult[k].accepted
            )
            const acceptedSuggestion = session.suggestions.find(s => s.itemId === acceptedItemId)

            if (acceptedSuggestion !== undefined) {
                if (acceptedSuggestion) {
                    codePercentageTracker.countSuccess(session.language)
                    codePercentageTracker.countAcceptedTokens(session.language, acceptedSuggestion.content)
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
            emitUserTriggerDecisionTelemetry(telemetry, session, timeSinceLastUserModification)
        }

        const updateConfiguration = async () =>
            lsp.workspace
                .getConfiguration('aws.codeWhisperer')
                .then(config => {
                    if (config && config['includeSuggestionsWithCodeReferences'] === true) {
                        includeSuggestionsWithCodeReferences = true
                        logging.log('Configuration updated to include suggestions with code references')
                    } else {
                        includeSuggestionsWithCodeReferences = false
                        logging.log('Configuration updated to exclude suggestions with code references')
                    }
                    if (config && config['shareCodeWhispererContentWithAWS'] === true) {
                        codeWhispererService.shareCodeWhispererContentWithAWS = true
                        logging.log('Configuration updated to share code whisperer content with AWS')
                    } else {
                        codeWhispererService.shareCodeWhispererContentWithAWS = false
                        logging.log('Configuration updated to not share code whisperer content with AWS')
                    }
                })
                .catch(reason => logging.log(`Error in GetConfiguration: ${reason}`))

        lsp.extensions.onInlineCompletionWithReferences(onInlineCompletionHandler)
        lsp.extensions.onLogInlineCompletionSessionResults(onLogInlineCompletionSessionResultsHandler)
        lsp.onInitialized(updateConfiguration)
        lsp.didChangeConfiguration(updateConfiguration)

        lsp.onDidChangeTextDocument(async p => {
            const textDocument = await workspace.getTextDocument(p.textDocument.uri)
            const languageId = getSupportedLanguageId(textDocument)

            if (!textDocument || !languageId) {
                return
            }

            p.contentChanges.forEach(change => {
                codePercentageTracker.countTokens(languageId, change.text)
            })

            // Record last user modification time for any document
            if (lastUserModificationTime) {
                timeSinceLastUserModification = new Date().getTime() - lastUserModificationTime
            }
            lastUserModificationTime = new Date().getTime()
        })

        logging.log('Codewhisperer server has been initialised')

        return () => {
            codePercentageTracker.dispose()
        }
    }

export const CodeWhispererServerIAM = CodewhispererServerFactory(
    credentialsProvider => new CodeWhispererServiceIAM(credentialsProvider)
)
export const CodeWhispererServerToken = CodewhispererServerFactory(
    credentialsProvider => new CodeWhispererServiceToken(credentialsProvider, {})
)
