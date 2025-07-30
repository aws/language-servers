import {
    CancellationToken,
    InitializeParams,
    InlineCompletionItemWithReferences,
    InlineCompletionListWithReferences,
    InlineCompletionTriggerKind,
    InlineCompletionWithReferencesParams,
    LogInlineCompletionSessionResultsParams,
    Range,
    Server,
    TextDocument,
    ResponseError,
    LSPErrorCodes,
} from '@aws/language-server-runtimes/server-interface'
import {
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    Suggestion,
    SuggestionType,
} from '../../shared/codeWhispererService'
import { CodewhispererLanguage, getSupportedLanguageId } from '../../shared/languageDetection'
import { mergeEditSuggestionsWithFileContext, truncateOverlapWithRightContext } from './mergeRightUtils'
import { CodeWhispererSession, SessionManager } from './session/sessionManager'
import { CodePercentageTracker } from './codePercentage'
import { getCompletionType, getEndPositionForAcceptedSuggestion, getErrorMessage, safeGet } from '../../shared/utils'
import { getIdeCategory, makeUserContextObject } from '../../shared/telemetryUtils'
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
import { ClassifierAutoTrigger, QAutoTrigger, shouldTriggerCompletions, shouldTriggerSuggestion } from './trigger'
import { EditCompletionHandler } from './editCompletionHandler'
import { InlineCompletionHandler } from './inlineCompletionHandler'

export const CONTEXT_CHARACTERS_LIMIT = 10240

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
        const clientMetadata = lsp.getClientInitializeParams()
        const ideCategory: string | undefined = clientMetadata ? getIdeCategory(clientMetadata) : ''
        const editCompletionHandler = new EditCompletionHandler()
        const inlineCompletionHandler = new InlineCompletionHandler()

        // Trackers for monitoring edits and cursor position.
        const recentEditTracker = RecentEditTracker.getInstance(logging, RecentEditTrackerDefaultConfig)
        const cursorTracker = CursorTracker.getInstance()
        const rejectedEditTracker = RejectedEditTracker.getInstance(logging, DEFAULT_REJECTED_EDIT_TRACKER_CONFIG)

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

        let lastUserModificationTime: number
        // TODO:
        let timeSinceLastUserModification: number = 0

        let editsEnabled = false
        let isOnInlineCompletionHandlerInProgress = false

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
                    if (isInlineEdit && acceptedSuggestion.content) {
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

        lsp.extensions.onEditCompletion(editCompletionHandler.onEditCompletion.bind(editCompletionHandler))
        lsp.extensions.onInlineCompletionWithReferences(
            inlineCompletionHandler.onInlineCompletion.bind(inlineCompletionHandler)
        )
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
