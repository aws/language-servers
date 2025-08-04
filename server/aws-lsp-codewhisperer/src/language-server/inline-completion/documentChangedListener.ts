import { DidChangeTextDocumentParams } from '@aws/language-server-runtimes/protocol'

export class DocumentChangedListener {
    private _lastUserModificationTime: number = 0
    private _timeSinceLastUserModification: number = 0
    get timeSinceLastUserModification(): number {
        return this._timeSinceLastUserModification
    }

    constructor() {}

    onDocumentChanged(e: DidChangeTextDocumentParams) {
        // Record last user modification time for any document
        if (this._lastUserModificationTime) {
            this._timeSinceLastUserModification = new Date().getTime() - this._lastUserModificationTime
        }
        this._lastUserModificationTime = new Date().getTime()
    }
}
