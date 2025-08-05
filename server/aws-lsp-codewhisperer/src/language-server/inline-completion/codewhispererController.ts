import {
    CancellationToken,
    CredentialsProvider,
    InitializeParams,
    InlineCompletionListWithReferences,
    InlineCompletionWithReferencesParams,
    Logging,
    Telemetry,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { DocumentChangedListener } from './documentChangedListener'
import { SessionManager } from './session/sessionManager'
import { RecentEditTracker } from './tracker/codeEditTracker'
import { CursorTracker } from './tracker/cursorTracker'
import { EditCompletionHandler } from './editCompletionHandler'
import { RejectedEditTracker } from './tracker/rejectedEditTracker'

export class CodeWhispererController {
    // API handlers
    editCompletionHandler: EditCompletionHandler | undefined

    constructor() {}

    init(
        editsSessionManager: SessionManager,
        logging: Logging,
        clientMetadata: InitializeParams,
        workspace: Workspace,
        qServiceManager: AmazonQBaseServiceManager,
        cursorTracker: CursorTracker,
        recentEditsTracker: RecentEditTracker,
        documentChangedListener: DocumentChangedListener,
        telemetry: Telemetry,
        telemetryService: TelemetryService,
        credentialsProvider: CredentialsProvider,
        rejectedEditTracker: RejectedEditTracker
    ) {
        // Initialize api handler
        this.editCompletionHandler = new EditCompletionHandler(
            logging,
            clientMetadata,
            workspace,
            qServiceManager,
            editsSessionManager,
            cursorTracker,
            recentEditsTracker,
            rejectedEditTracker,
            documentChangedListener,
            telemetry,
            telemetryService,
            credentialsProvider
        )
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
}
