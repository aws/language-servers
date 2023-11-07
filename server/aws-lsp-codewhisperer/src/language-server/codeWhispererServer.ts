import { Server } from '@aws-placeholder/aws-language-server-runtimes'
import { CredentialsProvider, Telemetry } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import {
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    InlineCompletionWithReferencesParams,
} from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/protocolExtensions'
import { AWSError } from 'aws-sdk'
import { CancellationToken, InlineCompletionTriggerKind, Range } from 'vscode-languageserver'
import { Position, TextDocument } from 'vscode-languageserver-textdocument'
import {
    CodewhispererAutomatedTriggerType,
    CodewhispererTriggerType,
    autoTrigger,
    triggerType,
} from './auto-trigger/autoTrigger'
import {
    CodeWhispererServiceBase,
    CodeWhispererServiceIAM,
    CodeWhispererServiceToken,
    FileContext,
    GenerateSuggestionsRequest,
    ResponseContext,
    Suggestion,
} from './codeWhispererService'
import { CodewhispererLanguage, getSupportedLanguageId } from './languageDetection'
import { truncateOverlapWithRightContext } from './mergeRightUtils'
import { CodeWhispererSession, SessionManager } from './session/sessionManager'
import { CodeWhispererServiceInvocationEvent } from './telemetry/types'
import { getCompletionType, isAwsError } from './utils'

interface InvocationContext {
    startTime: number
    startPosition: Position
    triggerType: CodewhispererTriggerType
    autoTriggerType?: CodewhispererAutomatedTriggerType
    language: CodewhispererLanguage
}

const EMPTY_RESULT = { items: [] }

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

const emitServiceInvocationTelemetry =
    ({ telemetry, invocationContext }: { telemetry: Telemetry; invocationContext: InvocationContext }) =>
    (suggestions: Suggestion[], responseContext: ResponseContext): Suggestion[] => {
        const duration = invocationContext.startTime ? new Date().getTime() - invocationContext.startTime : 0
        const data: CodeWhispererServiceInvocationEvent = {
            codewhispererRequestId: responseContext.requestId,
            codewhispererSessionId: responseContext.codewhispererSessionId,
            codewhispererLastSuggestionIndex: suggestions.length - 1,
            codewhispererCompletionType: suggestions.length > 0 ? getCompletionType(suggestions[0]) : undefined,
            codewhispererTriggerType: invocationContext.triggerType,
            codewhispererAutomatedTriggerType: invocationContext.autoTriggerType,
            result: 'Succeeded',
            duration,
            codewhispererLineNumber: invocationContext.startPosition.line,
            codewhispererCursorOffset: invocationContext.startPosition.character,
            codewhispererLanguage: invocationContext.language,
            credentialStartUrl: '',
        }
        telemetry.emitMetric({
            name: 'ServiceInvocation',
            data,
        })

        return suggestions
    }

const emitServiceInvocationFailure =
    ({ telemetry, invocationContext }: { telemetry: Telemetry; invocationContext: InvocationContext }) =>
    (error: Error | AWSError) => {
        const errorMessage = error ? String(error) : 'unknown'
        const reason = `CodeWhisperer Invocation Exception: ${errorMessage}`
        const duration = invocationContext.startTime ? new Date().getTime() - invocationContext.startTime : 0
        const codewhispererRequestId = isAwsError(error) ? error.requestId : undefined

        const data: CodeWhispererServiceInvocationEvent = {
            codewhispererRequestId: codewhispererRequestId,
            codewhispererSessionId: undefined,
            codewhispererLastSuggestionIndex: -1,
            codewhispererTriggerType: invocationContext.triggerType,
            codewhispererAutomatedTriggerType: invocationContext.autoTriggerType,
            result: 'Failed',
            reason,
            duration,
            codewhispererLineNumber: invocationContext.startPosition.line,
            codewhispererCursorOffset: invocationContext.startPosition.character,
            codewhispererLanguage: invocationContext.language,
            credentialStartUrl: '',
        }

        telemetry.emitMetric({
            name: 'ServiceInvocation',
            data,
        })
    }

// Merge right context. Provided as partially applied function for easy map/flatmap-ing.
const mergeSuggestionsWithContext =
    ({ fileContext, range }: { fileContext: FileContext; range?: Range }) =>
    (suggestions: Suggestion[]): InlineCompletionItemWithReferences[] =>
        suggestions.map(suggestion => ({
            insertText: truncateOverlapWithRightContext(fileContext, suggestion.content),
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

const filterReferences = (
    suggestions: InlineCompletionItemWithReferences[],
    includeSuggestionsWithCodeReferences: boolean
): InlineCompletionItemWithReferences[] => {
    if (includeSuggestionsWithCodeReferences) {
        return suggestions
    } else {
        return suggestions.filter(suggestion => suggestion.references == null || suggestion.references.length === 0)
    }
}

const getOrCreateActiveSession = (
    codeWhispererService: CodeWhispererServiceBase,
    sessionManager: SessionManager,
    requestContext: GenerateSuggestionsRequest,
    startPosition: Position,
    codewhispererTriggerType: CodewhispererTriggerType,
    autoTriggerType?: CodewhispererAutomatedTriggerType
): CodeWhispererSession => {
    let activeSession = sessionManager.getActiveSession()

    if (!activeSession || !hasLeftContextMatch(activeSession.suggestions, requestContext.fileContext.leftFileContent)) {
        activeSession = sessionManager.createSession({
            codeWhispererService: codeWhispererService,
            startPosition: startPosition,
            triggerType: codewhispererTriggerType,
            language: requestContext.fileContext.programmingLanguage.languageName,
            requestContext: requestContext,
            autoTriggerType: autoTriggerType,
        })
    }

    return activeSession
}
// Checks if any suggestion in list of suggestions matches with left context
const hasLeftContextMatch = (suggestions: Suggestion[], leftFileContent: string): boolean => {
    for (const suggestion of suggestions) {
        if (suggestion.content.startsWith(leftFileContent)) {
            return true
        }
    }
    return false
}

function waitForSessionActivation(activeSession: CodeWhispererSession, timeoutMs = 15000) {
    return Promise.race([
        new Promise(resolve => {
            activeSession.on('ACTIVE', () => {
                resolve('Success') // Resolve the Promise when the 'ACTIVE' event occurs
            })
        }),
        new Promise((_resolve, reject) => {
            activeSession.on('ERROR', err => {
                reject(err) // Reject the Promise on ERROR
            })
        }),
        new Promise((_resolve, reject) => {
            setTimeout(() => {
                reject(Error('Timeout')) // Reject the Promise if a timeout occurs
            }, timeoutMs)
        }),
    ])
}

export const CodewhispererServerFactory =
    (service: (credentials: CredentialsProvider) => CodeWhispererServiceBase): Server =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging }) => {
        const sessionManager = new SessionManager()
        const codeWhispererService = service(credentialsProvider)

        // Mutable state to track whether code with references should be included in
        // the response. No locking or concurrency controls, filtering is done
        // right before returning and is only guaranteed to be consistent within
        // the context of a single response.
        let includeSuggestionsWithCodeReferences = true

        const onInlineCompletionHandler = async (
            params: InlineCompletionWithReferencesParams,
            _token: CancellationToken
        ): Promise<InlineCompletionListWithReferences> => {
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
                const invocationContext = {
                    startTime: new Date().getTime(),
                    startPosition: params.position,
                    triggerType: (isAutomaticLspTriggerKind ? 'AutoTrigger' : 'OnDemand') as CodewhispererTriggerType,
                    language: fileContext.programmingLanguage.languageName,
                    requestContext: requestContext,
                    autoTriggerType: isAutomaticLspTriggerKind ? codewhispererAutoTriggerType : undefined,
                }

                const activeSession = getOrCreateActiveSession(
                    codeWhispererService,
                    sessionManager,
                    requestContext,
                    params.position,
                    invocationContext.triggerType,
                    invocationContext.autoTriggerType
                )
                // Add timers to the call
                activeSession.lastInvocationTime = new Date().getTime()

                // Wait for session to turn active (receive first suggestion)
                return waitForSessionActivation(activeSession)
                    .then(() => {
                        const emitFunction = emitServiceInvocationTelemetry({ telemetry, invocationContext })
                        if (activeSession.responseContext) {
                            emitFunction(activeSession.suggestions, activeSession.responseContext)
                        } else {
                            logging.log('WARNING: Active session does not have response context for telemetry')
                        }

                        const mergeSuggestionsWithContextFunction = mergeSuggestionsWithContext({
                            fileContext,
                            range: selectionRange,
                        })

                        const rightContextMergedSuggestions = mergeSuggestionsWithContextFunction(
                            activeSession.suggestions
                        )
                        const filteredSuggestions = filterReferences(
                            rightContextMergedSuggestions,
                            includeSuggestionsWithCodeReferences
                        )

                        return { items: filteredSuggestions }
                    })
                    .catch(err => {
                        // TODO, handle errors properly
                        const emitFunction = emitServiceInvocationFailure({ telemetry, invocationContext })
                        emitFunction(err)
                        return EMPTY_RESULT
                    })
            })
        }

        const updateConfiguration = async () =>
            lsp.workspace
                .getConfiguration('aws.codeWhisperer')
                .then(config => {
                    if (config && config['includeSuggestionsWithCodeReferences'] === false) {
                        includeSuggestionsWithCodeReferences = false
                        logging.log('Configuration updated to exclude suggestions with code references')
                    } else {
                        includeSuggestionsWithCodeReferences = true
                        logging.log('Configuration updated to include suggestions with code references')
                    }
                    if (config && config['shareCodeWhispererContentWithAWS'] === false) {
                        codeWhispererService.shareCodeWhispererContentWithAWS = false
                        logging.log('Configuration updated to not share code whisperer content with AWS')
                    } else {
                        codeWhispererService.shareCodeWhispererContentWithAWS = true
                        logging.log('Configuration updated to share code whisperer content with AWS')
                    }
                })
                .catch(reason => logging.log(`Error in GetConfiguration: ${reason}`))

        lsp.extensions.onInlineCompletionWithReferences(onInlineCompletionHandler)
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
