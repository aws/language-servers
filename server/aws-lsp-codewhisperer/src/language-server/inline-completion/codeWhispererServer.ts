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
    Suggestion,
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
import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { getOrThrowBaseTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { hasConnectionExpired } from '../../shared/utils'
import { getOrThrowBaseIAMServiceManager } from '../../shared/amazonQServiceManager/AmazonQIAMServiceManager'
import { WorkspaceFolderManager } from '../workspaceContext/workspaceFolderManager'
import path = require('path')
import { getRelativePath } from '../workspaceContext/util'
import { UserWrittenCodeTracker } from '../../shared/userWrittenCodeTracker'

const EMPTY_RESULT = { sessionId: '', items: [] }
export const FILE_URI_CHARS_LIMIT = 1024
export const FILENAME_CHARS_LIMIT = 1024
export const CONTEXT_CHARACTERS_LIMIT = 10240

// Both clients (token, sigv4) define their own types, this return value needs to match both of them.
const getFileContext = (params: {
    textDocument: TextDocument
    position: Position
    inferredLanguageId: CodewhispererLanguage
    workspaceFolder: WorkspaceFolder | null | undefined
}): {
    fileUri: string
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

    const relativeFilePath = params.workspaceFolder
        ? getRelativePath(params.workspaceFolder, params.textDocument.uri)
        : path.basename(params.textDocument.uri)

    return {
        fileUri: params.textDocument.uri.substring(0, FILE_URI_CHARS_LIMIT),
        filename: relativeFilePath.substring(0, FILENAME_CHARS_LIMIT),
        programmingLanguage: {
            languageName: getRuntimeLanguage(params.inferredLanguageId),
        },
        leftFileContent: left,
        rightFileContent: right,
    }
}

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
        result: 'Succeeded',
        codewhispererImportRecommendationEnabled: session.includeImportsWithSuggestions,
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
        codewhispererSupplementalContextTimeout: session.supplementalMetadata?.isProcessTimeout,
        codewhispererSupplementalContextIsUtg: session.supplementalMetadata?.isUtg,
        codewhispererSupplementalContextLatency: session.supplementalMetadata?.latency,
        codewhispererSupplementalContextLength: session.supplementalMetadata?.contentsLength,
        codewhispererCustomizationArn: session.customizationArn,
        codewhispererImportRecommendationEnabled: session.includeImportsWithSuggestions,
        result: 'Failed',
        traceId: 'notSet',
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
        codewhispererCustomizationArn: session.customizationArn,
        result: 'Succeeded',
        passive: true,
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

    await emitAggregatedUserTriggerDecisionTelemetry(telemetryService, session, timeSinceLastUserModification)

    session.reportedUserDecision = true
}

const emitAggregatedUserTriggerDecisionTelemetry = (
    telemetryService: TelemetryService,
    session: CodeWhispererSession,
    timeSinceLastUserModification?: number
) => {
    return telemetryService.emitUserTriggerDecision(session, timeSinceLastUserModification)
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
    (serviceManager: () => AmazonQBaseServiceManager): Server =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging, runtime, sdkInitializator }) => {
        let lastUserModificationTime: number
        let timeSinceLastUserModification: number = 0

        const sessionManager = SessionManager.getInstance()

        // AmazonQTokenServiceManager and TelemetryService are initialized in `onInitialized` handler to make sure Language Server connection is started
        let amazonQServiceManager: AmazonQBaseServiceManager
        let telemetryService: TelemetryService

        lsp.addInitializer((params: InitializeParams) => {
            return {
                capabilities: {},
            }
        })

        // CodePercentage and codeDiff tracker have a dependency on TelemetryService, so initialization is also delayed to `onInitialized` handler
        let codePercentageTracker: CodePercentageTracker
        let userWrittenCodeTracker: UserWrittenCodeTracker | undefined
        let codeDiffTracker: CodeDiffTracker<AcceptedInlineSuggestionEntry>

        const onInlineCompletionHandler = async (
            params: InlineCompletionWithReferencesParams,
            token: CancellationToken
        ): Promise<InlineCompletionListWithReferences> => {
            // On every new completion request close current inflight session.
            const currentSession = sessionManager.getCurrentSession()
            if (currentSession && currentSession.state == 'REQUESTING' && !params.partialResultToken) {
                currentSession.discardInflightSessionOnNewInvocation = true
            }

            return workspace.getTextDocument(params.textDocument.uri).then(async textDocument => {
                const codeWhispererService = amazonQServiceManager.getCodewhispererService()
                if (params.partialResultToken && currentSession) {
                    // subsequent paginated requests for current session
                    return codeWhispererService
                        .generateSuggestions({
                            ...currentSession.requestContext,
                            fileContext: {
                                ...currentSession.requestContext.fileContext,
                                leftFileContent: currentSession.requestContext.fileContext.leftFileContent
                                    .slice(-CONTEXT_CHARACTERS_LIMIT)
                                    .replaceAll('\r\n', '\n'),
                                rightFileContent: currentSession.requestContext.fileContext.rightFileContent
                                    .slice(0, CONTEXT_CHARACTERS_LIMIT)
                                    .replaceAll('\r\n', '\n'),
                            },
                            nextToken: `${params.partialResultToken}`,
                        })
                        .then(async suggestionResponse => {
                            return await processSuggestionResponse(
                                suggestionResponse,
                                currentSession,
                                false,
                                params.context.selectedCompletionInfo?.range
                            )
                        })
                        .catch(error => {
                            return handleSuggestionsErrors(error, currentSession)
                        })
                } else {
                    // request for new session
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
                    const isAutomaticLspTriggerKind =
                        params.context.triggerKind == InlineCompletionTriggerKind.Automatic
                    const maxResults = isAutomaticLspTriggerKind ? 1 : 5
                    const selectionRange = params.context.selectedCompletionInfo?.range
                    const fileContext = getFileContext({
                        textDocument,
                        inferredLanguageId,
                        position: params.position,
                        workspaceFolder: workspace.getWorkspaceFolder(textDocument.uri),
                    })
                    const workspaceState = WorkspaceFolderManager.getInstance()?.getWorkspaceState()
                    const workspaceId = workspaceState?.webSocketClient?.isConnected()
                        ? workspaceState.workspaceId
                        : undefined
                    // TODO: Can we get this derived from a keyboard event in the future?
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
                        ide: ideCategory ?? '',
                        os: '', // TODO: We should get this in a platform-agnostic way (i.e., compatible with the browser)
                        previousDecision, // The last decision by the user on the previous invocation
                        triggerType: codewhispererAutoTriggerType, // The 2 trigger types currently influencing the Auto-Trigger are SpecialCharacter and Enter
                    })

                    if (
                        isAutomaticLspTriggerKind &&
                        codewhispererAutoTriggerType === 'Classifier' &&
                        !autoTriggerResult.shouldTrigger
                    ) {
                        return EMPTY_RESULT
                    }

                    // supplementalContext available only via token authentication
                    const supplementalContextPromise =
                        codeWhispererService instanceof CodeWhispererServiceToken
                            ? fetchSupplementalContext(
                                  textDocument,
                                  params.position,
                                  workspace,
                                  logging,
                                  token,
                                  amazonQServiceManager
                              )
                            : Promise.resolve(undefined)

                    let requestContext: GenerateSuggestionsRequest = {
                        fileContext,
                        maxResults,
                    }

                    const supplementalContext = await supplementalContextPromise
                    // TODO: logging
                    if (codeWhispererService instanceof CodeWhispererServiceToken) {
                        requestContext.supplementalContexts = supplementalContext?.supplementalContextItems
                            ? supplementalContext.supplementalContextItems.map(v => ({
                                  content: v.content,
                                  filePath: v.filePath,
                              }))
                            : []
                    }

                    // Close ACTIVE session and record Discard trigger decision immediately
                    if (currentSession && currentSession.state === 'ACTIVE') {
                        // Emit user trigger decision at session close time for active session
                        sessionManager.discardSession(currentSession)
                        await emitUserTriggerDecisionTelemetry(
                            telemetry,
                            telemetryService,
                            currentSession,
                            timeSinceLastUserModification
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
                        supplementalMetadata: supplementalContext,
                        customizationArn: textUtils.undefinedIfEmpty(codeWhispererService.customizationArn),
                    })

                    // Add extra context to request context
                    const { extraContext } = amazonQServiceManager.getConfiguration().inlineSuggestions
                    if (extraContext) {
                        requestContext.fileContext.leftFileContent =
                            extraContext + '\n' + requestContext.fileContext.leftFileContent
                    }

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
                            ...(workspaceId ? { workspaceId: workspaceId } : {}),
                        })
                        .then(async suggestionResponse => {
                            return processSuggestionResponse(suggestionResponse, newSession, true, selectionRange)
                        })
                        .catch(err => {
                            return handleSuggestionsErrors(err, newSession)
                        })
                }
            })
        }

        const processSuggestionResponse = async (
            suggestionResponse: GenerateSuggestionsResponse,
            session: CodeWhispererSession,
            isNewSession: boolean,
            selectionRange?: Range
        ): Promise<InlineCompletionListWithReferences> => {
            codePercentageTracker.countInvocation(session.language)

            userWrittenCodeTracker?.recordUsageCount(session.language)
            session.includeImportsWithSuggestions =
                amazonQServiceManager.getConfiguration().includeImportsWithSuggestions

            if (isNewSession) {
                // Populate the session with information from codewhisperer response
                session.suggestions = suggestionResponse.suggestions
                session.responseContext = suggestionResponse.responseContext
                session.codewhispererSessionId = suggestionResponse.responseContext.codewhispererSessionId
                session.timeToFirstRecommendation = new Date().getTime() - session.startTime
            } else {
                session.suggestions = [...session.suggestions, ...suggestionResponse.suggestions]
            }

            // Emit service invocation telemetry for every request sent to backend
            emitServiceInvocationTelemetry(telemetry, session, suggestionResponse.responseContext.requestId)

            // Discard previous inflight API response due to new trigger
            if (session.discardInflightSessionOnNewInvocation) {
                session.discardInflightSessionOnNewInvocation = false
                sessionManager.discardSession(session)
                await emitUserTriggerDecisionTelemetry(
                    telemetry,
                    telemetryService,
                    session,
                    timeSinceLastUserModification
                )
            }

            // session was closed by user already made decisions consequent completion request before new paginated API response was received
            if (session.state === 'CLOSED' || session.state === 'DISCARD') {
                return EMPTY_RESULT
            }

            // API response was recieved, we can activate session now
            sessionManager.activateSession(session)

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
                    const { includeSuggestionsWithCodeReferences } = amazonQServiceManager.getConfiguration()
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

            const { includeImportsWithSuggestions } = amazonQServiceManager.getConfiguration()
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
            if (
                session.suggestionsAfterRightContextMerge.length === 0 &&
                !suggestionResponse.responseContext.nextToken
            ) {
                sessionManager.closeSession(session)
                await emitUserTriggerDecisionTelemetry(
                    telemetry,
                    telemetryService,
                    session,
                    timeSinceLastUserModification
                )

                return EMPTY_RESULT
            }

            return {
                items: suggestionsWithRightContext,
                sessionId: session.id,
                partialResultToken: suggestionResponse.responseContext.nextToken,
            }
        }

        const handleSuggestionsErrors = (
            error: Error,
            session: CodeWhispererSession
        ): InlineCompletionListWithReferences => {
            logging.log('Recommendation failure: ' + error)
            emitServiceInvocationFailure(telemetry, session, error)

            sessionManager.closeSession(session)

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
            if (acceptedSuggestion !== undefined && acceptedSuggestion.insertText) {
                if (acceptedSuggestion) {
                    codePercentageTracker.countSuccess(session.language)
                    codePercentageTracker.countAcceptedTokens(session.language, acceptedSuggestion.insertText)
                    codePercentageTracker.countTotalTokens(session.language, acceptedSuggestion.insertText, true)

                    enqueueCodeDiffEntry(session, acceptedSuggestion)
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
            await emitUserTriggerDecisionTelemetry(telemetry, telemetryService, session, timeSinceLastUserModification)
        }

        const updateConfiguration = (updatedConfig: AmazonQWorkspaceConfig) => {
            logging.debug('Updating configuration of inline complete server.')

            const { customizationArn, optOutTelemetryPreference, sendUserWrittenCodeMetrics } = updatedConfig

            codePercentageTracker.customizationArn = customizationArn
            if (sendUserWrittenCodeMetrics) {
                userWrittenCodeTracker = UserWrittenCodeTracker.getInstance(telemetryService)
            }
            if (userWrittenCodeTracker) {
                userWrittenCodeTracker.customizationArn = customizationArn
            }
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
            amazonQServiceManager = serviceManager()

            const clientParams = safeGet(
                lsp.getClientInitializeParams(),
                new AmazonQServiceInitializationError(
                    'TelemetryService initialized before LSP connection was initialized.'
                )
            )

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
                            completionType: entry.completionType,
                            triggerType: entry.triggerType,
                            credentialStartUrl: entry.credentialStartUrl,
                        }
                    )
                }
            )

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

            p.contentChanges.forEach(change => {
                codePercentageTracker.countTotalTokens(languageId, change.text, false)

                const { sendUserWrittenCodeMetrics } = amazonQServiceManager.getConfiguration()
                if (!sendUserWrittenCodeMetrics) {
                    return
                }
                // exclude cases that the document change is from Q suggestions
                const currentSession = sessionManager.getCurrentSession()
                if (
                    !currentSession?.suggestions.some(
                        suggestion => suggestion?.insertText && suggestion.insertText === change.text
                    )
                ) {
                    userWrittenCodeTracker?.countUserWrittenTokens(languageId, change.text)
                }
            })

            // Record last user modification time for any document
            if (lastUserModificationTime) {
                timeSinceLastUserModification = new Date().getTime() - lastUserModificationTime
            }
            lastUserModificationTime = new Date().getTime()
        })

        logging.log('Amazon Q Inline Suggestion server has been initialised')

        return async () => {
            codePercentageTracker?.dispose()
            userWrittenCodeTracker?.dispose()
            await codeDiffTracker?.shutdown()
        }
    }

export const CodeWhispererServerIAM = CodewhispererServerFactory(getOrThrowBaseIAMServiceManager)
export const CodeWhispererServerToken = CodewhispererServerFactory(getOrThrowBaseTokenServiceManager)
