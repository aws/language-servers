import {
    CancellationToken,
    CredentialsProvider,
    InitializeParams,
    InlineCompletionListWithReferences,
    InlineCompletionWithReferencesParams,
    Logging,
    LogInlineCompletionSessionResultsParams,
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
import { EditCompletionHandler } from './editCompletionHandler'
import { InlineCompletionHandler } from './inlineCompletionHandler'
import { LogInlineCompletionSessionResultsHandler } from './logInlineCompletionSessionResultsHandler'
import { RejectedEditTracker } from './tracker/rejectedEditTracker'
import { AcceptedInlineSuggestionEntry, CodeDiffTracker } from './codeDiffTracker'

export class CodeWhispererController {
    // API handlers
    editCompletionHandler: EditCompletionHandler | undefined
    private inlineCompletionHandler: InlineCompletionHandler | undefined
    private logInlineCompletionSessionResultsHandler: LogInlineCompletionSessionResultsHandler | undefined

    constructor(
        readonly sessionManager: SessionManager,
        readonly editsSessionManager: SessionManager
    ) {}

    async init(
        logging: Logging,
        clientMetadata: InitializeParams,
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
        // Initialize api handler
        this.editCompletionHandler = new EditCompletionHandler(
            logging,
            clientMetadata,
            workspace,
            qServiceManager,
            this.editsSessionManager,
            cursorTracker,
            recentEditsTracker,
            rejectedEditTracker,
            documentChangedListener,
            telemetry,
            telemetryService,
            credentialsProvider
        )

        this.inlineCompletionHandler = new InlineCompletionHandler(
            logging,
            clientMetadata,
            workspace,
            qServiceManager,
            this.sessionManager,
            cursorTracker,
            recentEditsTracker,
            codePercentageTracker,
            userWrittenCodeTracker,
            documentChangedListener,
            telemetry,
            telemetryService,
            credentialsProvider
        )

        this.logInlineCompletionSessionResultsHandler = new LogInlineCompletionSessionResultsHandler(
            logging,
            clientMetadata,
            this.sessionManager,
            this.editsSessionManager,
            codePercentageTracker,
            codeDiffTracker,
            rejectedEditTracker,
            documentChangedListener,
            telemetry,
            telemetryService
        )
    }

    async onInlineCompletion(
        params: InlineCompletionWithReferencesParams,
        token: CancellationToken
    ): Promise<InlineCompletionListWithReferences> {
        if (!this.inlineCompletionHandler) {
            throw new Error('')
        }

        return this.inlineCompletionHandler.onInlineCompletion(params, token)
    }

    async onEditCompletion(
        params: InlineCompletionWithReferencesParams,
        token: CancellationToken
    ): Promise<InlineCompletionListWithReferences> {
        if (!this.editCompletionHandler) {
            throw new Error('')
        }

        return this.editCompletionHandler.onEditCompletion(params, token)
    }

    async onLogInlineCompletionSessionResultsHandler(params: LogInlineCompletionSessionResultsParams) {
        if (!this.logInlineCompletionSessionResultsHandler) {
            throw new Error('')
        }

        await this.logInlineCompletionSessionResultsHandler.onLogInlineCompletionSessionResultsHandler(params)
    }
}
