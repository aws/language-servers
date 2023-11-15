import { Server } from '@aws-placeholder/aws-language-server-runtimes'
import { CredentialsProvider, Telemetry } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import {
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    InlineCompletionWithReferencesParams,
    LogInlineCompelitionSessionResultsParams,
} from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/protocolExtensions'
import { AWSError } from 'aws-sdk'
import { CancellationToken, InlineCompletionTriggerKind, Range } from 'vscode-languageserver'
import { Position, TextDocument } from 'vscode-languageserver-textdocument'
import { CodewhispererTriggerType, autoTrigger, triggerType } from './auto-trigger/autoTrigger'
import {
    CodeWhispererServiceBase,
    CodeWhispererServiceIAM,
    CodeWhispererServiceToken,
    Suggestion,
} from './codeWhispererService'
import { CodewhispererLanguage, getSupportedLanguageId } from './languageDetection'
import { getPrefixSuffixOverlap, truncateOverlapWithRightContext } from './mergeRightUtils'
import { CodeWhispererSession, SessionManager } from './session/sessionManager'
import { CodeWhispererServiceInvocationEvent } from './telemetry/types'
import { getCompletionType, isAwsError } from './utils'

const EMPTY_RESULT = { sessionId: '', items: [] }

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
    const duration = new Date().getTime() - session.lastInvocationTime
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
    const errorMessage = error ? String(error) : 'unknown'
    const reason = `CodeWhisperer Invocation Exception: ${errorMessage}`
    const duration = new Date().getTime() - session.lastInvocationTime
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

const mergeSuggestionsWithRightContext = (
    rightFileContext: string,
    suggestions: Suggestion[],
    range?: Range
): InlineCompletionItemWithReferences[] => {
    return suggestions.map(suggestion => ({
        itemId: suggestion.itemId,
        insertText: truncateOverlapWithRightContext(rightFileContext, suggestion.content),
        range,
        references: suggestion.references?.map(r => ({
            licenseName: r.licenseName,
            referenceUrl: r.url,
            referenceName: r.repository,
            position: r.recommendationContentSpan && {
                startCharacter: r.recommendationContentSpan.start,
                endCharacter: r.recommendationContentSpan.end,
            },
        })),
    }))
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
        const sessionManager = SessionManager.getInstance()
        const codeWhispererService = service(credentialsProvider)

        // Mutable state to track whether code with references should be included in
        // the response. No locking or concurrency controls, filtering is done
        // right before returning and is only guaranteed to be consistent within
        // the context of a single response.
        let includeSuggestionsWithCodeReferences = false

        const onInlineCompletionHandler = async (
            params: InlineCompletionWithReferencesParams,
            _token: CancellationToken
        ): Promise<InlineCompletionListWithReferences> => {
            // On every new completion request close last inflight session.
            // On every manual trigger expilictly close previous session.
            const currentSession = sessionManager.getCurrentSession()

            if (
                currentSession?.state == 'REQUESTING' ||
                params.context.triggerKind == InlineCompletionTriggerKind.Invoked
            ) {
                sessionManager.discardCurrentSession()
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
                const char = fileContext.leftFileContent.trim().at(-1) ?? ''
                const codewhispererAutoTriggerType = triggerType(fileContext)

                if (
                    isAutomaticLspTriggerKind &&
                    !autoTrigger({
                        fileContext, // The left/right file context and programming language
                        lineNum: params.position.line, // the line number of the invocation, this is the line of the cursor
                        char, // Add the character just inserted, if any, before the invication position
                        ide: '', // TODO: Fetch the IDE in a platform-agnostic way (from the initialize request?)
                        os: '', // TODO: We should get this in a platform-agnostic way (i.e., compatible with the browser)
                        previousDecision: '', // TODO: Once we implement telemetry integration
                        triggerType: codewhispererAutoTriggerType, // The 2 trigger types currently influencing the Auto-Trigger are SpecialCharacter and Enter
                    })
                ) {
                    return EMPTY_RESULT
                }

                const requestContext = {
                    fileContext,
                    maxResults,
                }
                const codewhispererTriggerType = (
                    isAutomaticLspTriggerKind ? 'AutoTrigger' : 'OnDemand'
                ) as CodewhispererTriggerType
                const autoTriggerType = isAutomaticLspTriggerKind ? codewhispererAutoTriggerType : undefined

                const newSession = sessionManager.createSession({
                    startPosition: params.position,
                    triggerType: codewhispererTriggerType,
                    language: fileContext.programmingLanguage.languageName,
                    requestContext: requestContext,
                    autoTriggerType: autoTriggerType,
                    credentialStartUrl: credentialsProvider.getConnectionMetadata()?.sso?.startUrl ?? undefined,
                })

                return codeWhispererService
                    .generateSuggestions(requestContext)
                    .then(suggestionResponse => {
                        // Populate the session with information from codewhisperer response
                        newSession.suggestions = suggestionResponse.suggestions
                        newSession.responseContext = suggestionResponse.responseContext

                        // Emit service invocation telemetry for every request sent to backend
                        emitServiceInvocationTelemetry(telemetry, newSession)

                        // Exit early and discard API response
                        // session was closed by consequent completion request before API response was received
                        if (newSession.state === 'CLOSED') {
                            return EMPTY_RESULT
                        }

                        // Do not activate inflight session when it received empty list
                        if (suggestionResponse.suggestions.length === 0) {
                            sessionManager.closeSession(newSession)
                            return EMPTY_RESULT
                        }

                        sessionManager.activateSession(newSession)

                        // If session has no suggestions after filtering, it is discarded and empty result is returned
                        if (newSession.getFilteredSuggestions(includeSuggestionsWithCodeReferences).length == 0) {
                            sessionManager.closeSession(newSession)

                            // TODO: report User Decision and User Trigger Decision = EMPTY
                            return EMPTY_RESULT
                        }

                        const items = mergeSuggestionsWithRightContext(
                            fileContext.rightFileContent,
                            newSession.getFilteredSuggestions(includeSuggestionsWithCodeReferences),
                            selectionRange
                        )

                        if (items.every(suggestion => suggestion.insertText === '')) {
                            sessionManager.closeSession(newSession)

                            // TODO: report User Decision Discard for each of them
                            // Check if we need to return empty list in this case
                        }

                        return { items, sessionId: newSession.id }
                    })
                    .catch(err => {
                        // TODO, handle errors properly
                        logging.log('Recommendation failure: ' + err)
                        emitServiceInvocationFailure(telemetry, newSession, err)
                        return EMPTY_RESULT
                    })
            })
        }
        const onLogInlineCompelitionSessionResultsHandler = async (
            params: LogInlineCompelitionSessionResultsParams
        ) => {
            const { sessionId, completionSessionResult, firstCompletionDisplayLatency, totalSessionDisplayTime } =
                params
            const currentSession = sessionManager.getCurrentSession()
            const session = sessionManager.getSessionById(sessionId)

            if (!session) {
                logging.log(`ERROR: Session ID ${sessionId} was not found`)
                return
            }

            session.setClientResultData(completionSessionResult, firstCompletionDisplayLatency, totalSessionDisplayTime)

            if (currentSession?.id == sessionId) {
                sessionManager.discardCurrentSession()
            } else if (session) {
                sessionManager.closeSession(session)
            }
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
        lsp.extensions.onLogInlineCompelitionSessionResults(onLogInlineCompelitionSessionResultsHandler)
        lsp.onInitialized(updateConfiguration)
        lsp.didChangeConfiguration(updateConfiguration)

        logging.log('Codewhisperer server has been initialised')

        return () => {
            /* do nothing */
        }
    }

export const CodeWhispererServerIAM = CodewhispererServerFactory(
    credentialsProvider => new CodeWhispererServiceIAM(credentialsProvider)
)
export const CodeWhispererServerToken = CodewhispererServerFactory(
    credentialsProvider => new CodeWhispererServiceToken(credentialsProvider)
)
