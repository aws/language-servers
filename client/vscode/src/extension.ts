import type { ExtensionContext } from 'vscode'
import { activateDocumentsLanguageServer } from './activation'
import { LanguageClient } from 'vscode-languageclient/node'
import * as vscode from 'vscode'

let client: LanguageClient

export async function activate(context: ExtensionContext) {
    client = await activateDocumentsLanguageServer(context)
    // now client is _really_ a LanguageClient, so:
    await client.start()
}

export async function deactivate() {
    if (client) {
        await client.stop()
    }
}
