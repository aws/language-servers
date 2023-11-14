import { Server } from '@aws-placeholder/aws-language-server-runtimes'
import { CredentialsProvider, Telemetry } from '@aws-placeholder/aws-language-server-runtimes/out/features'
import {
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    InlineCompletionWithReferencesParams,
    LogInlineCompelitionSessionResultsParams,
} from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/protocolExtensions'
import { AWSError } from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
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
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    Suggestion,
} from './codeWhispererService'
import { CodewhispererLanguage, getSupportedLanguageId } from './languageDetection'
import { FileContext, truncateOverlapWithRightContext } from './mergeRightUtils'
import { CodeWhispererServiceInvocationEvent } from './telemetry/types'
import { getCompletionType, isAwsError } from './utils'

interface InvocationContext {
    startTime: number
    startPosition: Position
    triggerType: CodewhispererTriggerType
    autoTriggerType?: CodewhispererAutomatedTriggerType
    language: CodewhispererLanguage
    requestContext: GenerateSuggestionsRequest
    credentialStartUrl?: string
}

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

const emitServiceInvocationTelemetry =
    ({ telemetry, invocationContext }: { telemetry: Telemetry; invocationContext: InvocationContext }) =>
    (response: GenerateSuggestionsResponse): Suggestion[] => {
        const { suggestions, responseContext } = response

        const duration = invocationContext.startTime ? new Date().getTime() - invocationContext.startTime : 0
        const data: CodeWhispererServiceInvocationEvent = {
            codewhispererRequestId: responseContext.requestId,
            codewhispererSessionId: responseContext.codewhispererSessionId,
            codewhispererLastSuggestionIndex: suggestions.length - 1,
            codewhispererCompletionType: suggestions.length > 0 ? getCompletionType(suggestions[0]) : undefined,
            codewhispererTriggerType: invocationContext.triggerType,
            codewhispererAutomatedTriggerType: invocationContext.autoTriggerType,
            duration,
            codewhispererLineNumber: invocationContext.startPosition.line,
            codewhispererCursorOffset: invocationContext.startPosition.character,
            codewhispererLanguage: invocationContext.language,
            credentialStartUrl: invocationContext.credentialStartUrl,
        }
        telemetry.emitMetric({
            name: 'codewhisperer_serviceInvocation',
            result: 'Succeeded',
            data,
        })

        return suggestions
    }

const emitServiceInvocationFailure =
    ({ telemetry, invocationContext }: { telemetry: Telemetry; invocationContext: InvocationContext }) =>
    (error: Error | AWSError) => {
        const duration = invocationContext.startTime ? new Date().getTime() - invocationContext.startTime : 0
        const codewhispererRequestId = isAwsError(error) ? error.requestId : undefined

        const data: CodeWhispererServiceInvocationEvent = {
            codewhispererRequestId: codewhispererRequestId,
            codewhispererSessionId: undefined,
            codewhispererLastSuggestionIndex: -1,
            codewhispererTriggerType: invocationContext.triggerType,
            codewhispererAutomatedTriggerType: invocationContext.autoTriggerType,
            reason: `CodeWhisperer Invocation Exception: ${error.name || 'UnknownError'}`,
            duration,
            codewhispererLineNumber: invocationContext.startPosition.line,
            codewhispererCursorOffset: invocationContext.startPosition.character,
            codewhispererLanguage: invocationContext.language,
            credentialStartUrl: invocationContext.credentialStartUrl,
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

        // Re-throw an error to handle in the default catch all handler.
        throw error
    }

// Merge right context. Provided as partially applied function for easy map/flatmap-ing.
const mergeSuggestionsWithContext =
    ({ fileContext, range }: { fileContext: FileContext; range?: Range }) =>
    (suggestions: Suggestion[]): InlineCompletionItemWithReferences[] =>
        suggestions.map(suggestion => ({
            itemId: suggestion.itemId,
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

export const createSessionId = () => uuidv4()

export const CodewhispererServerFactory =
    (service: (credentials: CredentialsProvider) => CodeWhispererServiceBase): Server =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging }) => {
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
            const sessionId = createSessionId()
            Object.assign(EMPTY_RESULT, { sessionId })

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
                const invocationContext: InvocationContext = {
                    startTime: new Date().getTime(),
                    startPosition: params.position,
                    triggerType: (isAutomaticLspTriggerKind ? 'AutoTrigger' : 'OnDemand') as CodewhispererTriggerType,
                    language: fileContext.programmingLanguage.languageName,
                    requestContext: requestContext,
                    autoTriggerType: isAutomaticLspTriggerKind ? codewhispererAutoTriggerType : undefined,
                    credentialStartUrl: credentialsProvider.getConnectionMetadata()?.sso?.startUrl ?? undefined,
                }

                return codeWhispererService
                    .generateSuggestions({
                        ...requestContext,
                        fileContext: {
                            ...requestContext.fileContext,
                            leftFileContent: requestContext.fileContext.leftFileContent.replaceAll('\r\n', '\n'),
                            rightFileContent: requestContext.fileContext.rightFileContent.replaceAll('\r\n', '\n'),
                        },
                    })
                    .catch(emitServiceInvocationFailure({ telemetry, invocationContext }))
                    .then(emitServiceInvocationTelemetry({ telemetry, invocationContext }))
                    .then(mergeSuggestionsWithContext({ fileContext, range: selectionRange }))
                    .then(suggestions => filterReferences(suggestions, includeSuggestionsWithCodeReferences))
                    .then(items => ({ items, sessionId }))
                    .catch(err => {
                        logging.log(`onInlineCompletion failure: ${err}`)
                        return EMPTY_RESULT
                    })
            })
        }

        const onLogInlineCompelitionSessionResultsHandler = async (
            params: LogInlineCompelitionSessionResultsParams
        ) => {
            // TODO: end current active session from session manager
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
