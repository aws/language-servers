import {
    CancellationToken,
    InitializeParams,
    InlineCompletionListWithReferences,
    InlineCompletionWithReferencesParams,
    LogInlineCompletionSessionResultsParams,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { getSupportedLanguageId } from '../../shared/languageDetection'
import { SessionManager } from './session/sessionManager'
import { CodePercentageTracker } from './codePercentage'
import { safeGet } from '../../shared/utils'
import { makeUserContextObject } from '../../shared/telemetryUtils'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { AcceptedInlineSuggestionEntry, CodeDiffTracker } from './codeDiffTracker'
import { AmazonQServiceInitializationError } from '../../shared/amazonQServiceManager/errors'
import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { getOrThrowBaseTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { AmazonQWorkspaceConfig } from '../../shared/amazonQServiceManager/configurationUtils'
import { getOrThrowBaseIAMServiceManager } from '../../shared/amazonQServiceManager/AmazonQIAMServiceManager'
import path = require('path')

import { UserWrittenCodeTracker } from '../../shared/userWrittenCodeTracker'
import { RecentEditTracker, RecentEditTrackerDefaultConfig } from './tracker/codeEditTracker'
import { CursorTracker } from './tracker/cursorTracker'
import { RejectedEditTracker, DEFAULT_REJECTED_EDIT_TRACKER_CONFIG } from './tracker/rejectedEditTracker'
import { CodeWhispererController } from './codewhispererController'
import { DocumentChangedListener } from './documentChangedListener'

export const FILE_URI_CHARS_LIMIT = 1024
export const FILENAME_CHARS_LIMIT = 1024
export const CONTEXT_CHARACTERS_LIMIT = 10240

export const CodewhispererServerFactory =
    (serviceManager: () => AmazonQBaseServiceManager): Server =>
    ({ credentialsProvider, lsp, workspace, telemetry, logging, runtime, sdkInitializator }) => {
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

        const apiController: CodeWhispererController = new CodeWhispererController()
        const documentChangedListener = new DocumentChangedListener()

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
            // TODO: figure out a better way to intialize this api controller, can't use ctor here simply as some other dependecies issue and will cause crashing
            apiController.init(
                sessionManager,
                logging,
                lsp,
                workspace,
                amazonQServiceManager,
                cursorTracker,
                recentEditTracker,
                codePercentageTracker,
                userWrittenCodeTracker,
                documentChangedListener,
                telemetry,
                telemetryService,
                credentialsProvider,
                rejectedEditTracker,
                codeDiffTracker
            )
        }

        const onInlineCompletionHandler = async (
            params: InlineCompletionWithReferencesParams,
            token: CancellationToken
        ): Promise<InlineCompletionListWithReferences> => {
            return await apiController.onInlineCompletion(params, token)
        }

        const onLogInlineCompletionSessionResultsHandler = async (params: LogInlineCompletionSessionResultsParams) => {
            await apiController.onLogInlineCompletionSessionResultsHandler(params)
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
            documentChangedListener.onDocumentChanged(p)

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
