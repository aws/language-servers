import {
    CancellationToken,
    CredentialsProvider,
    InlineCompletionListWithReferences,
    InlineCompletionWithReferencesParams,
    Logging,
    LogInlineCompletionSessionResultsParams,
    Lsp,
    Telemetry,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { UserWrittenCodeTracker } from '../../shared/userWrittenCodeTracker'
import { CodePercentageTracker } from './codePercentage'
import { DocumentChangedListener } from './documentChangedListener'
import { SessionManager } from './session/sessionManager'
import { RecentEditTracker } from './tracker/codeEditTracker'
import { CursorTracker } from './tracker/cursorTracker'
import { InlineCompletionHandler } from './inlineCompletionHandler'
import { RejectedEditTracker } from './tracker/rejectedEditTracker'
import { AcceptedInlineSuggestionEntry, CodeDiffTracker } from './codeDiffTracker'
import { LogInlineCompletionSessionResultsHandler } from './logInlineCompletionSessionResultHandler'

export class CodeWhispererController {
    // API handlers
    private inlineCompletionHandler: InlineCompletionHandler | undefined
    private logInlineCompletionSessionResultsHandler: LogInlineCompletionSessionResultsHandler | undefined

    constructor() {}

    init(
        sessionManager: SessionManager,
        logging: Logging,
        lsp: Lsp,
        workspace: Workspace,
        qServiceManager: AmazonQBaseServiceManager,
        cursorTracker: CursorTracker,
        recentEditsTracker: RecentEditTracker,
        codePercentageTracker: CodePercentageTracker,
        userWrittenCodeTracker: UserWrittenCodeTracker | undefined,
        documentChangedListener: DocumentChangedListener,
        telemetry: Telemetry,
        telemetryService: TelemetryService,
        credentialsProvider: CredentialsProvider,
        rejectedEditTracker: RejectedEditTracker,
        codeDiffTracker: CodeDiffTracker<AcceptedInlineSuggestionEntry>
    ) {
        this.inlineCompletionHandler = new InlineCompletionHandler(
            logging,
            lsp,
            workspace,
            qServiceManager,
            sessionManager,
            cursorTracker,
            recentEditsTracker,
            codePercentageTracker,
            userWrittenCodeTracker,
            documentChangedListener,
            telemetry,
            telemetryService,
            credentialsProvider,
            rejectedEditTracker
        )
    }

    async onInlineCompletion(
        params: InlineCompletionWithReferencesParams,
        token: CancellationToken
    ): Promise<InlineCompletionListWithReferences> {
        if (!this.inlineCompletionHandler) {
            throw new Error('inlineCompletionHandler is not initialized yet')
        }

        return this.inlineCompletionHandler.onInlineCompletion(params, token)
    }

    async onLogInlineCompletionSessionResultsHandler(params: LogInlineCompletionSessionResultsParams) {
        if (!this.logInlineCompletionSessionResultsHandler) {
            throw new Error('logInlineCompletionSessionResultsHandler is not intialized yet')
        }

        await this.logInlineCompletionSessionResultsHandler.onLogInlineCompletionSessionResultsHandler(params)
    }
}
