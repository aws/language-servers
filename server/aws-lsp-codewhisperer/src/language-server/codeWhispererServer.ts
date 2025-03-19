import {
    CancellationToken,
    CredentialsProvider,
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
    Workspace,
    SDKInitializator,
    ResponseError,
    LSPErrorCodes,
} from '@aws/language-server-runtimes/server-interface'
import { AWSError } from 'aws-sdk'
import { autoTrigger, triggerType } from './auto-trigger/autoTrigger'
import {
    CodeWhispererServiceBase,
    CodeWhispererServiceIAM,
    CodeWhispererServiceToken,
    GenerateSuggestionsRequest,
    Suggestion,
} from './codeWhispererService'
import { CodewhispererLanguage, getSupportedLanguageId } from './languageDetection'
import { truncateOverlapWithRightContext } from './mergeRightUtils'
import { CodeWhispererSession, SessionManager } from './session/sessionManager'
import { CodePercentageTracker } from './telemetry/codePercentage'
import { CodeWhispererPerceivedLatencyEvent, CodeWhispererServiceInvocationEvent } from './telemetry/types'
import { getCompletionType, getEndPositionForAcceptedSuggestion, isAwsError } from './utils'
import { getUserAgent, makeUserContextObject } from './utilities/telemetryUtils'
import { Q_CONFIGURATION_SECTION } from './configuration/qConfigurationServer'
import { fetchSupplementalContext } from './utilities/supplementalContextUtil/supplementalContextUtil'
import { textUtils } from '@aws/lsp-core'
import { TelemetryService } from './telemetryService'
import { AcceptedSuggestionEntry, CodeDiffTracker } from './telemetry/codeDiffTracker'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../constants'
import { AmazonQTokenServiceManager } from './amazonQServiceManager/AmazonQTokenServiceManager'
import { AmazonQError } from './amazonQServiceManager/errors'
import { BaseAmazonQServiceManager } from './amazonQServiceManager/BaseAmazonQServiceManager'

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
        codewhispererSupplementalContextTimeout: session.supplementalMetadata?.isProcessTimeout,
        codewhispererSupplementalContextIsUtg: session.supplementalMetadata?.isUtg,
        codewhispererSupplementalContextLatency: session.supplementalMetadata?.latency,
        codewhispererSupplementalContextLength: session.supplementalMetadata?.contentsLength,
        codewhispererCustomizationArn: session.customizationArn,
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
        }
    })
}

interface AcceptedInlineSuggestionEntry extends AcceptedSuggestionEntry {
    sessionId: string
    requestId: string
    languageId: CodewhispererLanguage
    customizationArn?: string
}

export const CodewhispererServerFactory =
    (
        service: (
            credentials: CredentialsProvider,
            workspace: Workspace,
            awsQRegion: string,
            awsQEndpointUrl: string,
            sdkInitializator: SDKInitializator
        ) => CodeWhispererServiceBase
    ): Server =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging, runtime, sdkInitializator }) => {
        let lastUserModificationTime: number
        let timeSinceLastUserModification: number = 0

        const sessionManager = SessionManager.getInstance()

        const awsQRegion = runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION
        const awsQEndpointUrl = runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL
        const fallbackCodeWhispererService = service(
            credentialsProvider,
            workspace,
            awsQRegion,
            awsQEndpointUrl,
            sdkInitializator
        )

        // AmazonQTokenServiceManager is initialized in `onInitialized` handler to make sure Language Server connection is started
        let amazonQServiceManager: BaseAmazonQServiceManager
        const serviceType = fallbackCodeWhispererService.constructor.name

        const telemetryService = new TelemetryService(
            credentialsProvider,
            fallbackCodeWhispererService.getCredentialsType(),
            telemetry,
            logging,
            workspace,
            awsQRegion,
            awsQEndpointUrl,
            sdkInitializator
        )

        lsp.addInitializer((params: InitializeParams) => {
            // TODO: Review configuration options expected in other features
            fallbackCodeWhispererService.updateClientConfig({
                customUserAgent: getUserAgent(params, runtime.serverInfo),
            })
            telemetryService.updateClientConfig({
                customUserAgent: getUserAgent(params, runtime.serverInfo),
            })
            telemetryService.updateUserContext(makeUserContextObject(params, runtime.platform, 'INLINE'))
            return {
                capabilities: {},
            }
        })

        // Mutable state to track whether code with references should be included in
        // the response. No locking or concurrency controls, filtering is done
        // right before returning and is only guaranteed to be consistent within
        // the context of a single response.
        let includeSuggestionsWithCodeReferences = false

        const codePercentageTracker = new CodePercentageTracker(telemetryService)

        const codeDiffTracker: CodeDiffTracker<AcceptedInlineSuggestionEntry> = new CodeDiffTracker(
            workspace,
            logging,
            async (entry: AcceptedInlineSuggestionEntry, percentage, unmodifiedAcceptedCharacterCount) => {
                await telemetryService.emitUserModificationEvent({
                    sessionId: entry.sessionId,
                    requestId: entry.requestId,
                    languageId: entry.languageId,
                    customizationArn: entry.customizationArn,
                    timestamp: new Date(),
                    acceptedCharacterCount: entry.originalString.length,
                    modificationPercentage: percentage,
                    unmodifiedAcceptedCharacterCount: unmodifiedAcceptedCharacterCount,
                })
            }
        )

        const onInlineCompletionHandler = async (
            params: InlineCompletionWithReferencesParams,
            token: CancellationToken
        ): Promise<InlineCompletionListWithReferences> => {
            // On every new completion request close current inflight session.
            const currentSession = sessionManager.getCurrentSession()
            if (currentSession && currentSession.state == 'REQUESTING') {
                // If session was requesting at cancellation time, close it
                // User Trigger Decision will be reported at the time of processing API response in the callback below.
                sessionManager.discardSession(currentSession)
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

                // Build request context
                const isAutomaticLspTriggerKind =
                    params.context.triggerKind == InlineCompletionTriggerKind.Automatic
                const maxResults = isAutomaticLspTriggerKind ? 1 : 5
                const selectionRange = params.context.selectedCompletionInfo?.range
                const fileContext = getFileContext({ textDocument, inferredLanguageId, position: params.position })

                // TODO: Can we get this derived from a keyboard event in the future?
                // This picks the last non-whitespace character, if any, before the cursor
                const triggerCharacter = fileContext.leftFileContent.trim().at(-1) ?? ''
                const codewhispererAutoTriggerType = triggerType(fileContext)
                const previousDecision =
                    sessionManager.getPreviousSession()?.getAggregatedUserTriggerDecision() ?? ''
                const autoTriggerResult = autoTrigger({
                    fileContext, // The left/right file context and programming language
                    lineNum: params.position.line, // the line number of the invocation, this is the line of the cursor
                    char: triggerCharacter, // Add the character just inserted, if any, before the invication position
                    ide: '', // TODO: Fetch the IDE in a platform-agnostic way (from the initialize request?)
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

                return codeWhispererService.generateSuggestions({
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
                    .then(async suggestionResponse => {
                        codePercentageTracker.countInvocation(inferredLanguageId)

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
                            await emitUserTriggerDecisionTelemetry(
                                telemetry,
                                telemetryService,
                                newSession,
                                timeSinceLastUserModification
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

                        suggestionsWithRightContext.forEach(suggestion => {
                            const cachedSuggestion = newSession.suggestions.find(s => s.itemId === suggestion.itemId)
                            if (cachedSuggestion) cachedSuggestion.insertText = suggestion.insertText.toString()
                        })

                        // If after all server-side filtering no suggestions can be displayed, close session and return empty results
                        if (suggestionsWithRightContext.length === 0) {
                            sessionManager.closeSession(newSession)
                            await emitUserTriggerDecisionTelemetry(
                                telemetry,
                                telemetryService,
                                newSession,
                                timeSinceLastUserModification
                            )

                            return EMPTY_RESULT
                        }

                        return { items: suggestionsWithRightContext, sessionId: newSession.id }
                    })
                    .catch(error => {
                        // TODO, handle errors properly
                        logging.log('Recommendation failure: ' + error)
                        emitServiceInvocationFailure(telemetry, newSession, error)

                        // TODO: check if we can/should emit UserTriggerDecision
                        sessionManager.closeSession(newSession)

                        if (error instanceof AmazonQError) {
                            throw error
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

        const updateConfiguration = async () => {
            try {
                // Currently can't hook AmazonQTokenServiceManager.handleDidChangeConfiguration to lsp listenre directly
                // as it will override listeners from each consuming Server.
                // TODO: refactor configuration listener in Server and AmazonQTokenServiceManager in runtimes.
                await amazonQServiceManager.handleDidChangeConfiguration()

                const qConfig = await lsp.workspace.getConfiguration(Q_CONFIGURATION_SECTION)
                if (qConfig) {
                    fallbackCodeWhispererService.customizationArn = textUtils.undefinedIfEmpty(qConfig.customization)
                    codePercentageTracker.customizationArn = textUtils.undefinedIfEmpty(qConfig.customization)
                    logging.log(
                        `Inline completion configuration updated to use ${fallbackCodeWhispererService.customizationArn}`
                    )
                    /*
                        The flag enableTelemetryEventsToDestination is set to true temporarily. It's value will be determined through destination
                        configuration post all events migration to STE. It'll be replaced by qConfig['enableTelemetryEventsToDestination'] === true
                    */
                    // const enableTelemetryEventsToDestination = true
                    // telemetryService.updateEnableTelemetryEventsToDestination(enableTelemetryEventsToDestination)
                    const optOutTelemetryPreference = qConfig['optOutTelemetry'] === true ? 'OPTOUT' : 'OPTIN'
                    telemetryService.updateOptOutPreference(optOutTelemetryPreference)
                }

                const config = await lsp.workspace.getConfiguration('aws.codeWhisperer')
                if (!config) return

                includeSuggestionsWithCodeReferences = config['includeSuggestionsWithCodeReferences'] === true
                logging.log(
                    `Configuration updated to ${includeSuggestionsWithCodeReferences ? 'include' : 'exclude'} suggestions with code references`
                )

                fallbackCodeWhispererService.shareCodeWhispererContentWithAWS =
                    config['shareCodeWhispererContentWithAWS'] === true
                logging.log(
                    `Configuration updated to ${fallbackCodeWhispererService.shareCodeWhispererContentWithAWS ? 'share' : 'not share'} Amazon Q content with AWS`
                )
            } catch (error) {
                logging.log(`Error in GetConfiguration: ${error}`)
            }
        }

        const onInitializedHandler = async () => {
            if (serviceType === 'CodeWhispererServiceToken') {
                amazonQServiceManager = AmazonQTokenServiceManager.getInstance({
                    lsp,
                    logging,
                    credentialsProvider,
                    sdkInitializator,
                    workspace,
                    runtime,
                })
            } else {
                // Fallback to default passed service factory for IAM credentials type
                amazonQServiceManager = {
                    handleDidChangeConfiguration: async () => {},
                    getCodewhispererService: () => {
                        return fallbackCodeWhispererService
                    },
                }
            }

            await updateConfiguration()
        }

        lsp.extensions.onInlineCompletionWithReferences(onInlineCompletionHandler)
        lsp.extensions.onLogInlineCompletionSessionResults(onLogInlineCompletionSessionResultsHandler)
        lsp.onInitialized(onInitializedHandler)
        lsp.didChangeConfiguration(updateConfiguration)

        lsp.onDidChangeTextDocument(async p => {
            const textDocument = await workspace.getTextDocument(p.textDocument.uri)
            const languageId = getSupportedLanguageId(textDocument)

            if (!textDocument || !languageId) {
                return
            }

            p.contentChanges.forEach(change => {
                codePercentageTracker.countTotalTokens(languageId, change.text, false)
            })

            // Record last user modification time for any document
            if (lastUserModificationTime) {
                timeSinceLastUserModification = new Date().getTime() - lastUserModificationTime
            }
            lastUserModificationTime = new Date().getTime()
        })

        logging.log('Amazon Q Inline Suggestion server has been initialised')

        return async () => {
            codePercentageTracker.dispose()
            await codeDiffTracker.shutdown()
        }
    }

export const CodeWhispererServerIAM = CodewhispererServerFactory(
    (credentialsProvider, workspace, awsQRegion, awsQEndpointUrl, sdkInitializator) =>
        new CodeWhispererServiceIAM(credentialsProvider, workspace, awsQRegion, awsQEndpointUrl, sdkInitializator)
)
export const CodeWhispererServerToken = CodewhispererServerFactory(
    (credentialsProvider, workspace, awsQRegion, awsQEndpointUrl, sdkInitializator) =>
        new CodeWhispererServiceToken(credentialsProvider, workspace, awsQRegion, awsQEndpointUrl, sdkInitializator)
)
