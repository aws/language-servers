import type { ExtensionContext } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import { activateDocumentsLanguageServer } from './activation'

let client: LanguageClient

export async function activate(context: ExtensionContext) {
    client = await activateDocumentsLanguageServer(context)
    await client.start()
}

export async function deactivate() {
    await client.stop()
}
