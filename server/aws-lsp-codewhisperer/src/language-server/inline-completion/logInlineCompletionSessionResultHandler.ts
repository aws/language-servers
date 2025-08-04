import { InitializeParams, LogInlineCompletionSessionResultsParams } from '@aws/language-server-runtimes/protocol'
import { SessionManager } from './session/sessionManager'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { CodePercentageTracker } from './codePercentage'
import { AcceptedInlineSuggestionEntry, CodeDiffTracker } from './codeDiffTracker'
import { RejectedEditTracker } from './tracker/rejectedEditTracker'
import { TelemetryService } from '../../shared/telemetry/telemetryService'
import { DocumentChangedListener } from './documentChangedListener'

export class LogInlineCompletionSessionResultsHandler {
    constructor(
        readonly logging: Logging,
        readonly clientMetadata: InitializeParams,
        readonly completionSessionManager: SessionManager,
        readonly editsSessionManager: SessionManager,
        readonly codePercentageTracker: CodePercentageTracker,
        readonly codeDiffTracker: CodeDiffTracker<AcceptedInlineSuggestionEntry>,
        readonly rejectedEditTracker: RejectedEditTracker,
        readonly documentChangedListener: DocumentChangedListener,
        readonly telemetry: Telemetry,
        readonly telemetryService: TelemetryService
    ) {}
    async onLogInlineCompletionSessionResultsHandler(params: LogInlineCompletionSessionResultsParams) {}
}
