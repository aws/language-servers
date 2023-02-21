import type { ExtensionContext } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import { activateDocumentsLanguageServer } from './activation'

let client: LanguageClient

export async function activate(context: ExtensionContext) {
    client = await activateDocumentsLanguageServer(context)
    return
}

export async function deactivate() {
    client.stop()
}
