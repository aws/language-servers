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
    TextDocument,
    ResponseError,
    LSPErrorCodes,
    WorkspaceFolder,
} from '@aws/language-server-runtimes/server-interface'
import { autoTrigger, getAutoTriggerType, getNormalizeOsName, triggerType } from './auto-trigger/autoTrigger'
import {
    CodeWhispererServiceToken,
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    Suggestion,
    SuggestionType,
} from '../../shared/codeWhispererService'
import { CodewhispererLanguage, getRuntimeLanguage, getSupportedLanguageId } from '../../shared/languageDetection'
import { mergeEditSuggestionsWithFileContext, truncateOverlapWithRightContext } from './mergeRightUtils'
import { CodeWhispererSession, SessionManager } from './session/sessionManager'
import { CodePercentageTracker } from './codePercentage'
import { getCompletionType, getEndPositionForAcceptedSuggestion, getErrorMessage, safeGet } from '../../shared/utils'
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
import { RecentEditTracker, RecentEditTrackerDefaultConfig } from './tracker/codeEditTracker'
import { CursorTracker } from './tracker/cursorTracker'
import { RejectedEditTracker, DEFAULT_REJECTED_EDIT_TRACKER_CONFIG } from './tracker/rejectedEditTracker'
import { getAddedAndDeletedChars } from './diffUtils'
import {
    emitPerceivedLatencyTelemetry,
    emitServiceInvocationFailure,
    emitServiceInvocationTelemetry,
    emitUserTriggerDecisionTelemetry,
} from './telemetry'
const { editPredictionAutoTrigger } = require('./auto-trigger/editPredictionAutoTrigger')

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

        // Trackers for monitoring edits and cursor position.
        const recentEditTracker = RecentEditTracker.getInstance(logging, RecentEditTrackerDefaultConfig)
        const cursorTracker = CursorTracker.getInstance()
        const rejectedEditTracker = RejectedEditTracker.getInstance(logging, DEFAULT_REJECTED_EDIT_TRACKER_CONFIG)
        let editsEnabled = false
        let isOnInlineCompletionHandlerInProgress = false

        const onInlineCompletionHandler = async (
            params: InlineCompletionWithReferencesParams,
            token: CancellationToken
        ): Promise<InlineCompletionListWithReferences> => {
            // this handle should not run concurrently because
            // 1. it would create a high volume of traffic, causing throttling
            // 2. it is not designed to handle concurrent changes to these state variables.
            // when one handler is at the API call stage, it has not yet update the session state
            // but another request can start, causing the state to be incorrect.
            if (isOnInlineCompletionHandlerInProgress) {
                logging.log(`Skip concurrent inline completion`)
                return EMPTY_RESULT
            }
            isOnInlineCompletionHandlerInProgress = true

            try {
                // On every new completion request close current inflight session.
                const currentSession = sessionManager.getCurrentSession()
                if (currentSession && currentSession.state == 'REQUESTING' && !params.partialResultToken) {
                    // this REQUESTING state only happens when the session is initialized, which is rare
                    currentSession.discardInflightSessionOnNewInvocation = true
                }

                if (cursorTracker) {
                    cursorTracker.trackPosition(params.textDocument.uri, params.position)
                }
                const textDocument = await workspace.getTextDocument(params.textDocument.uri)

                const codeWhispererService = amazonQServiceManager.getCodewhispererService()
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
                        return await processSuggestionResponse(
                            suggestionResponse,
                            currentSession,
                            false,
                            params.context.selectedCompletionInfo?.range
                        )
                    } catch (error) {
                        return handleSuggestionsErrors(error as Error, currentSession)
                    }
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

                    const previousSession = sessionManager.getPreviousSession()
                    const previousDecision = previousSession?.getAggregatedUserTriggerDecision() ?? ''
                    let ideCategory: string | undefined = ''
                    const initializeParams = lsp.getClientInitializeParams()
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
                            codewhispererAutoTriggerType = getAutoTriggerType(
                                params.documentChangeParams.contentChanges
                            )
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
                            logging
                        )

                        if (
                            codewhispererAutoTriggerType === 'Classifier' &&
                            !autoTriggerResult.shouldTrigger &&
                            !(editsEnabled && codeWhispererService instanceof CodeWhispererServiceToken) // There is still potentially a Edit trigger without Completion if NEP is enabled (current only BearerTokenClient)
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
                        const supplementalContextItems = supplementalContext?.supplementalContextItems || []
                        requestContext.supplementalContexts = [
                            ...supplementalContextItems.map(v => ({
                                content: v.content,
                                filePath: v.filePath,
                            })),
                        ]

                        if (editsEnabled) {
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
                                cursorHistory: cursorTracker,
                                recentEdits: recentEditTracker,
                            })

                            if (editPredictionAutoTriggerResult.shouldTrigger) {
                                predictionTypes.push(['EDITS'])
                            }

                            if (predictionTypes.length === 0) {
                                return EMPTY_RESULT
                            }

                            // Step 0: Determine if we have "Recent Edit context"
                            if (recentEditTracker) {
                                supplementalContextFromEdits =
                                    await recentEditTracker.generateEditBasedContext(textDocument)
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
                        if (editsEnabled && currentSession.suggestionType === SuggestionType.EDIT) {
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
                        sessionManager.discardSession(currentSession)
                        const streakLength = editsEnabled ? sessionManager.getAndUpdateStreakLength(false) : 0
                        await emitUserTriggerDecisionTelemetry(
                            telemetry,
                            telemetryService,
                            currentSession,
                            timeSinceLastUserModification,
                            0,
                            0,
                            [],
                            [],
                            streakLength
                        )
                    }

                    const supplementalMetadata = editsEnabled
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
                    const newSession = sessionManager.createSession({
                        document: textDocument,
                        startPosition: params.position,
                        triggerType: isAutomaticLspTriggerKind ? 'AutoTrigger' : 'OnDemand',
                        language: fileContext.programmingLanguage.languageName,
                        requestContext: requestContext,
                        autoTriggerType: isAutomaticLspTriggerKind ? codewhispererAutoTriggerType : undefined,
                        triggerCharacter: triggerCharacters,
                        classifierResult: autoTriggerResult?.classifierResult,
                        classifierThreshold: autoTriggerResult?.classifierThreshold,
                        credentialStartUrl: credentialsProvider.getConnectionMetadata?.()?.sso?.startUrl ?? undefined,
                        supplementalMetadata: supplementalMetadata,
                        customizationArn: textUtils.undefinedIfEmpty(codeWhispererService.customizationArn),
                    })

                    // Add extra context to request context
                    const { extraContext } = amazonQServiceManager.getConfiguration().inlineSuggestions
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
                        return await processSuggestionResponse(suggestionResponse, newSession, true, selectionRange)
                    } catch (error) {
                        return handleSuggestionsErrors(error as Error, newSession)
                    }
                }
            } finally {
                isOnInlineCompletionHandlerInProgress = false
            }
        }

        const processSuggestionResponse = async (
            suggestionResponse: GenerateSuggestionsResponse,
            session: CodeWhispererSession,
            isNewSession: boolean,
            selectionRange?: Range,
            textDocument?: TextDocument
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
                session.suggestionType = suggestionResponse.suggestionType
            } else {
                session.suggestions = [...session.suggestions, ...suggestionResponse.suggestions]
            }

            // Emit service invocation telemetry for every request sent to backend
            emitServiceInvocationTelemetry(telemetry, session, suggestionResponse.responseContext.requestId)

            // Discard previous inflight API response due to new trigger
            if (session.discardInflightSessionOnNewInvocation) {
                session.discardInflightSessionOnNewInvocation = false
                sessionManager.discardSession(session)
                const streakLength = editsEnabled ? sessionManager.getAndUpdateStreakLength(false) : 0
                await emitUserTriggerDecisionTelemetry(
                    telemetry,
                    telemetryService,
                    session,
                    timeSinceLastUserModification,
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

            if (suggestionResponse.suggestionType === SuggestionType.COMPLETION) {
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
            } else {
                return {
                    items: suggestionResponse.suggestions
                        .map(suggestion => {
                            // Check if this suggestion is similar to a previously rejected edit
                            const isSimilarToRejected = rejectedEditTracker.isSimilarToRejected(
                                suggestion.content,
                                textDocument?.uri || ''
                            )

                            if (isSimilarToRejected) {
                                // Mark as rejected in the session
                                session.setSuggestionState(suggestion.itemId, 'Reject')
                                logging.debug(
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
        const enqueueCodeDiffEntry = (
            session: CodeWhispererSession,
            acceptedSuggestion: Suggestion,
            addedCharactersForEdit?: string
        ) => {
            const endPosition = getEndPositionForAcceptedSuggestion(acceptedSuggestion.content, session.startPosition)
            // use the addedCharactersForEdit if it is EDIT suggestion type
            const originalString = addedCharactersForEdit ? addedCharactersForEdit : acceptedSuggestion.content

            codeDiffTracker.enqueue({
                sessionId: session.codewhispererSessionId || '',
                requestId: session.responseContext?.requestId || '',
                fileUrl: session.document.uri,
                languageId: session.language,
                time: Date.now(),
                originalString: originalString,
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
                isInlineEdit,
                addedDiagnostics,
                removedDiagnostics,
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
            const isAccepted = acceptedItemId ? true : false
            const acceptedSuggestion = session.suggestions.find(s => s.itemId === acceptedItemId)
            let addedCharactersForEditSuggestion = ''
            let deletedCharactersForEditSuggestion = ''
            if (acceptedSuggestion !== undefined) {
                if (acceptedSuggestion) {
                    codePercentageTracker.countSuccess(session.language)
                    if (session.suggestionType === SuggestionType.EDIT && acceptedSuggestion.content) {
                        // [acceptedSuggestion.insertText] will be undefined for NEP suggestion. Use [acceptedSuggestion.content] instead.
                        // Since [acceptedSuggestion.content] is in the form of a diff, transform the content into addedCharacters and deletedCharacters.
                        const addedAndDeletedChars = getAddedAndDeletedChars(acceptedSuggestion.content)
                        if (addedAndDeletedChars) {
                            addedCharactersForEditSuggestion = addedAndDeletedChars.addedCharacters
                            deletedCharactersForEditSuggestion = addedAndDeletedChars.deletedCharacters

                            codePercentageTracker.countAcceptedTokens(
                                session.language,
                                addedCharactersForEditSuggestion
                            )
                            codePercentageTracker.countTotalTokens(
                                session.language,
                                addedCharactersForEditSuggestion,
                                true
                            )
                            enqueueCodeDiffEntry(session, acceptedSuggestion, addedCharactersForEditSuggestion)
                        }
                    } else if (acceptedSuggestion.insertText) {
                        codePercentageTracker.countAcceptedTokens(session.language, acceptedSuggestion.insertText)
                        codePercentageTracker.countTotalTokens(session.language, acceptedSuggestion.insertText, true)

                        enqueueCodeDiffEntry(session, acceptedSuggestion)
                    }
                }
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
            const streakLength = editsEnabled ? sessionManager.getAndUpdateStreakLength(isAccepted) : 0
            await emitUserTriggerDecisionTelemetry(
                telemetry,
                telemetryService,
                session,
                timeSinceLastUserModification,
                addedCharactersForEditSuggestion.length,
                deletedCharactersForEditSuggestion.length,
                addedDiagnostics,
                removedDiagnostics,
                streakLength
            )
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

            logging.log(`Client initialization params: ${JSON.stringify(clientParams)}`)
            editsEnabled =
                clientParams?.initializationOptions?.aws?.awsClientCapabilities?.textDocument
                    ?.inlineCompletionWithReferences?.inlineEditSupport ?? false

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

            // Process document changes with RecentEditTracker.
            if (editsEnabled && recentEditTracker) {
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
            if (userWrittenCodeTracker) userWrittenCodeTracker?.dispose()
            if (codeDiffTracker) await codeDiffTracker.shutdown()
            if (recentEditTracker) recentEditTracker.dispose()
            if (cursorTracker) cursorTracker.dispose()
            if (rejectedEditTracker) rejectedEditTracker.dispose()

            logging.log('Amazon Q Inline Suggestion server has been shut down')
        }
    }

export const CodeWhispererServerIAM = CodewhispererServerFactory(getOrThrowBaseIAMServiceManager)
export const CodeWhispererServerToken = CodewhispererServerFactory(getOrThrowBaseTokenServiceManager)
