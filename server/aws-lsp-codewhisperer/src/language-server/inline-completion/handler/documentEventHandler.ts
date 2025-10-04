import {
    DidChangeTextDocumentParams,
    DidOpenTextDocumentParams,
    DidCloseTextDocumentParams,
} from '@aws/language-server-runtimes/protocol'
import { getSupportedLanguageId } from '../../../shared/languageDetection'
import { CodePercentageTracker } from '../tracker/codePercentageTracker'
import { UserWrittenCodeTracker } from '../../../shared/userWrittenCodeTracker'
import { RecentEditTracker } from '../tracker/codeEditTracker'
import { CursorTracker } from '../tracker/cursorTracker'
import { SessionManager } from '../session/sessionManager'
import { AmazonQBaseServiceManager } from '../../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { Logging, Workspace } from '@aws/language-server-runtimes/server-interface'

export class DocumentEventHandler {
    private _lastUserModificationTime: number = 0
    private _timeSinceLastUserModification: number = 0
    private editCompletionHandler: any

    get timeSinceLastUserModification(): number {
        return this._timeSinceLastUserModification
    }

    constructor(
        private readonly workspace: Workspace,
        private readonly logging: Logging,
        private readonly codePercentageTracker: CodePercentageTracker,
        private readonly userWrittenCodeTracker: UserWrittenCodeTracker | undefined,
        private readonly recentEditTracker: RecentEditTracker,
        private readonly cursorTracker: CursorTracker,
        private readonly completionSessionManager: SessionManager,
        private readonly amazonQServiceManager: AmazonQBaseServiceManager,
        private readonly getEditsEnabled: () => boolean
    ) {}

    setEditCompletionHandler(handler: any) {
        this.editCompletionHandler = handler
    }

    async onDidChangeTextDocument(p: DidChangeTextDocumentParams) {
        const textDocument = await this.workspace.getTextDocument(p.textDocument.uri)
        const languageId = getSupportedLanguageId(textDocument)

        if (!textDocument || !languageId) {
            return
        }

        p.contentChanges.forEach(change => {
            this.codePercentageTracker.countTotalTokens(languageId, change.text, false)

            const { sendUserWrittenCodeMetrics } = this.amazonQServiceManager.getConfiguration()
            if (!sendUserWrittenCodeMetrics) {
                return
            }
            // exclude cases that the document change is from Q suggestions
            const currentSession = this.completionSessionManager.getCurrentSession()
            if (
                !currentSession?.suggestions.some(
                    suggestion => suggestion?.insertText && suggestion.insertText === change.text
                )
            ) {
                this.userWrittenCodeTracker?.countUserWrittenTokens(languageId, change.text)
            }
        })

        // Record last user modification time for any document
        if (this._lastUserModificationTime) {
            this._timeSinceLastUserModification = Date.now() - this._lastUserModificationTime
        }
        this._lastUserModificationTime = Date.now()

        if (this.editCompletionHandler) {
            this.editCompletionHandler.documentChanged()
        }

        // Process document changes with RecentEditTracker.
        if (this.getEditsEnabled() && this.recentEditTracker) {
            await this.recentEditTracker.handleDocumentChange({
                uri: p.textDocument.uri,
                languageId: textDocument.languageId,
                version: textDocument.version,
                text: textDocument.getText(),
            })
        }
    }

    onDidOpenTextDocument(p: DidOpenTextDocumentParams) {
        this.logging.log(`Document opened: ${p.textDocument.uri}`)

        // Track document opening with RecentEditTracker
        if (this.recentEditTracker) {
            this.logging.log(`[SERVER] Tracking document open with RecentEditTracker: ${p.textDocument.uri}`)
            this.recentEditTracker.handleDocumentOpen({
                uri: p.textDocument.uri,
                languageId: p.textDocument.languageId,
                version: p.textDocument.version,
                text: p.textDocument.text,
            })
        }
    }

    onDidCloseTextDocument(p: DidCloseTextDocumentParams) {
        this.logging.log(`Document closed: ${p.textDocument.uri}`)

        // Track document closing with RecentEditTracker
        if (this.recentEditTracker) {
            this.logging.log(`[SERVER] Tracking document close with RecentEditTracker: ${p.textDocument.uri}`)
            this.recentEditTracker.handleDocumentClose(p.textDocument.uri)
        }

        if (this.cursorTracker) {
            this.cursorTracker.clearHistory(p.textDocument.uri)
        }
    }
}
