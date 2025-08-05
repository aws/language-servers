import {
    CancellationToken,
    InitializeParams,
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    InlineCompletionTriggerKind,
    InlineCompletionWithReferencesParams,
    LSPErrorCodes,
    Position,
    Range,
    ResponseError,
    TextDocument,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/protocol'
import { RecentEditTracker } from './tracker/codeEditTracker'
import { CredentialsProvider, Logging, Lsp, Telemetry, Workspace } from '@aws/language-server-runtimes/server-interface'
import {
    CodeWhispererServiceToken,
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    Suggestion,
    SuggestionType,
} from '../../shared/codeWhispererService'
import { CodeWhispererSession, SessionManager } from './session/sessionManager'
import { CursorTracker } from './tracker/cursorTracker'
import { CodewhispererLanguage, getRuntimeLanguage, getSupportedLanguageId } from '../../shared/languageDetection'
import { WorkspaceFolderManager } from '../workspaceContext/workspaceFolderManager'
import {
    emitServiceInvocationFailure,
    emitServiceInvocationTelemetry,
    emitUserTriggerDecisionTelemetry,
} from './telemetry'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { mergeEditSuggestionsWithFileContext, truncateOverlapWithRightContext } from './mergeRightUtils'
import { textUtils } from '@aws/lsp-core'
import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { CodePercentageTracker } from './codePercentage'
import { UserWrittenCodeTracker } from '../../shared/userWrittenCodeTracker'
import { getIdeCategory } from '../../shared/telemetryUtils'
import { getErrorMessage, hasConnectionExpired } from '../../shared/utils'
import { AmazonQError, AmazonQServiceConnectionExpiredError } from '../../shared/amazonQServiceManager/errors'
import { DocumentChangedListener } from './documentChangedListener'
import path = require('path')
import { fetchSupplementalContext } from '../../shared/supplementalContextUtil/supplementalContextUtil'
import { getRelativePath } from '../workspaceContext/util'
import { getAutoTriggerType, triggerType, autoTrigger, getNormalizeOsName } from './auto-trigger/autoTrigger'
import { editPredictionAutoTrigger } from './auto-trigger/editPredictionAutoTrigger'
import { RejectedEditTracker } from './tracker/rejectedEditTracker'

const EMPTY_RESULT = { sessionId: '', items: [] }
const CONTEXT_CHARACTERS_LIMIT = 10240
const FILE_URI_CHARS_LIMIT = 1024
const FILENAME_CHARS_LIMIT = 1024

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

export class InlineCompletionHandler {
    readonly ideCategory: string
    readonly editsEnabled: boolean

    private isOnInlineCompletionHandlerInProgress = false
    constructor(
        readonly logging: Logging,
        readonly lsp: Lsp,
        readonly workspace: Workspace,
        readonly amazonQServiceManager: AmazonQBaseServiceManager,
        readonly sessionManager: SessionManager,
        readonly cursorTracker: CursorTracker,
        readonly recentEditTracker: RecentEditTracker,
        readonly codePercentageTracker: CodePercentageTracker,
        readonly userWrittenCodeTracker: UserWrittenCodeTracker | undefined,
        readonly documentChangedListener: DocumentChangedListener,
        readonly telemetry: Telemetry,
        readonly telemetryService: TelemetryService,
        readonly credentialsProvider: CredentialsProvider,
        readonly rejectedEditTracker: RejectedEditTracker
    ) {
        const clientMetadata = this.lsp.getClientInitializeParams()
        this.ideCategory = clientMetadata ? getIdeCategory(clientMetadata) : ''
        this.editsEnabled =
            this.lsp.getClientInitializeParams()?.initializationOptions?.aws?.awsClientCapabilities?.textDocument
                ?.inlineCompletionWithReferences?.inlineEditSupport ?? false
    }

    get codeWhispererService() {
        return this.amazonQServiceManager.getCodewhispererService()
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
            this.logging.log(`Skip concurrent inline completion`)
            return EMPTY_RESULT
        }
        this.isOnInlineCompletionHandlerInProgress = true

        try {
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

            const codeWhispererService = this.amazonQServiceManager.getCodewhispererService()
            if (params.partialResultToken && currentSession) {
                // subsequent paginated requests for current session
                try {
                    const suggestionResponse = await codeWhispererService.generateSuggestions({
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
                // request for new session
                if (!textDocument) {
                    this.logging.log(`textDocument [${params.textDocument.uri}] not found`)
                    return EMPTY_RESULT
                }

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
                const fileContext = getFileContext({
                    textDocument,
                    inferredLanguageId,
                    position: params.position,
                    workspaceFolder: this.workspace.getWorkspaceFolder(textDocument.uri),
                })

                const workspaceState = WorkspaceFolderManager.getInstance()?.getWorkspaceState()
                const workspaceId = workspaceState?.webSocketClient?.isConnected()
                    ? workspaceState.workspaceId
                    : undefined

                const previousSession = this.sessionManager.getPreviousSession()
                const previousDecision = previousSession?.getAggregatedUserTriggerDecision() ?? ''
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
                            previousDecision, // The last decision by the user on the previous invocation
                            triggerType: codewhispererAutoTriggerType, // The 2 trigger types currently influencing the Auto-Trigger are SpecialCharacter and Enter
                        },
                        this.logging
                    )

                    if (
                        codewhispererAutoTriggerType === 'Classifier' &&
                        !autoTriggerResult.shouldTrigger &&
                        !(this.editsEnabled && codeWhispererService instanceof CodeWhispererServiceToken) // There is still potentially a Edit trigger without Completion if NEP is enabled (current only BearerTokenClient)
                    ) {
                        return EMPTY_RESULT
                    }
                }

                // Get supplemental context from recent edits if available.
                let supplementalContextFromEdits = undefined

                // supplementalContext available only via token authentication
                const supplementalContextPromise =
                    codeWhispererService instanceof CodeWhispererServiceToken
                        ? fetchSupplementalContext(
                              textDocument,
                              params.position,
                              this.workspace,
                              this.logging,
                              token,
                              this.amazonQServiceManager,
                              params.openTabFilepaths
                          )
                        : Promise.resolve(undefined)

                let requestContext: GenerateSuggestionsRequest = {
                    fileContext,
                    maxResults,
                }

                const supplementalContext = await supplementalContextPromise
                // TODO: logging
                if (codeWhispererService instanceof CodeWhispererServiceToken) {
                    const supplementalContextItems = supplementalContext?.supplementalContextItems || []
                    requestContext.supplementalContexts = [
                        ...supplementalContextItems.map(v => ({
                            content: v.content,
                            filePath: v.filePath,
                        })),
                    ]

                    if (this.editsEnabled) {
                        const predictionTypes: string[][] = []

                        /**
                         * Manual trigger - should always have 'Completions'
                         * Auto trigger
                         *  - Classifier - should have 'Completions' when classifier evalualte to true given the editor's states
                         *  - Others - should always have 'Completions'
                         */
                        if (
                            !isAutomaticLspTriggerKind ||
                            (isAutomaticLspTriggerKind && codewhispererAutoTriggerType !== 'Classifier') ||
                            (isAutomaticLspTriggerKind &&
                                codewhispererAutoTriggerType === 'Classifier' &&
                                autoTriggerResult?.shouldTrigger)
                        ) {
                            predictionTypes.push(['COMPLETIONS'])
                        }

                        const editPredictionAutoTriggerResult = editPredictionAutoTrigger({
                            fileContext: fileContext,
                            lineNum: params.position.line,
                            char: triggerCharacters,
                            previousDecision: previousDecision,
                            cursorHistory: this.cursorTracker,
                            recentEdits: this.recentEditTracker,
                        })

                        if (editPredictionAutoTriggerResult.shouldTrigger) {
                            predictionTypes.push(['EDITS'])
                        }

                        if (predictionTypes.length === 0) {
                            return EMPTY_RESULT
                        }

                        // Step 0: Determine if we have "Recent Edit context"
                        if (this.recentEditTracker) {
                            supplementalContextFromEdits =
                                await this.recentEditTracker.generateEditBasedContext(textDocument)
                        }

                        // Step 1: Recent Edits context
                        const supplementalContextItemsForEdits =
                            supplementalContextFromEdits?.supplementalContextItems || []

                        requestContext.supplementalContexts.push(
                            ...supplementalContextItemsForEdits.map(v => ({
                                content: v.content,
                                filePath: v.filePath,
                                type: 'PreviousEditorState',
                                metadata: {
                                    previousEditorStateMetadata: {
                                        timeOffset: 1000,
                                    },
                                },
                            }))
                        )

                        // Step 2: Prediction type COMPLETION, Edits or both
                        requestContext.predictionTypes = predictionTypes.flat()

                        // Step 3: Current Editor/Cursor state
                        requestContext.editorState = {
                            document: {
                                relativeFilePath: textDocument.uri,
                                programmingLanguage: {
                                    languageName: requestContext.fileContext.programmingLanguage.languageName,
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
                }

                // Close ACTIVE session and record Discard trigger decision immediately
                if (currentSession && currentSession.state === 'ACTIVE') {
                    if (this.editsEnabled && currentSession.suggestionType === SuggestionType.EDIT) {
                        const mergedSuggestions = mergeEditSuggestionsWithFileContext(
                            currentSession,
                            textDocument,
                            fileContext
                        )

                        if (mergedSuggestions.length > 0) {
                            return {
                                items: mergedSuggestions,
                                sessionId: currentSession.id,
                            }
                        }
                    }
                    // Emit user trigger decision at session close time for active session
                    this.sessionManager.discardSession(currentSession)
                    const streakLength = this.editsEnabled ? this.sessionManager.getAndUpdateStreakLength(false) : 0
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

                const supplementalMetadata = this.editsEnabled
                    ? {
                          // Merge metadata from edit-based context if available.
                          contentsLength:
                              (supplementalContext?.contentsLength || 0) +
                              (supplementalContextFromEdits?.contentsLength || 0),
                          latency: Math.max(
                              supplementalContext?.latency || 0,
                              supplementalContextFromEdits?.latency || 0
                          ),
                          isUtg: supplementalContext?.isUtg || false,
                          isProcessTimeout: supplementalContext?.isProcessTimeout || false,
                          strategy: supplementalContextFromEdits
                              ? 'recentEdits'
                              : supplementalContext?.strategy || 'Empty',
                          supplementalContextItems: [
                              ...(supplementalContext?.supplementalContextItems || []),
                              ...(supplementalContextFromEdits?.supplementalContextItems || []),
                          ],
                      }
                    : supplementalContext
                const newSession = this.sessionManager.createSession({
                    document: textDocument,
                    startPosition: params.position,
                    triggerType: isAutomaticLspTriggerKind ? 'AutoTrigger' : 'OnDemand',
                    language: fileContext.programmingLanguage.languageName,
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

                const generateCompletionReq = {
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
                }
                try {
                    const suggestionResponse = await codeWhispererService.generateSuggestions(generateCompletionReq)
                    return await this.processSuggestionResponse(suggestionResponse, newSession, true, selectionRange)
                } catch (error) {
                    return this.handleSuggestionsErrors(error as Error, newSession)
                }
            }
        } finally {
            this.isOnInlineCompletionHandlerInProgress = false
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
        session.includeImportsWithSuggestions =
            this.amazonQServiceManager.getConfiguration().includeImportsWithSuggestions

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
            const streakLength = this.editsEnabled ? this.sessionManager.getAndUpdateStreakLength(false) : 0
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

        // session was closed by user already made decisions consequent completion request before new paginated API response was received
        if (
            session.suggestionType !== SuggestionType.EDIT && // TODO: this is a shorterm fix to allow Edits tabtabtab experience, however the real solution is to manage such sessions correctly
            (session.state === 'CLOSED' || session.state === 'DISCARD')
        ) {
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

        if (suggestionResponse.suggestionType === SuggestionType.COMPLETION) {
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
            if (
                session.suggestionsAfterRightContextMerge.length === 0 &&
                !suggestionResponse.responseContext.nextToken
            ) {
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
        } else {
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
