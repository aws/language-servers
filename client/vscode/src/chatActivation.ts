import { tabAddNotificationType, tabRemoveNotificationType } from '@aws/language-server-runtimes/protocol'
import { Uri, ViewColumn, Webview, commands, window } from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'

export function registerChat(languageClient: LanguageClient, extensionUri: Uri) {
    const panel = window.createWebviewPanel(
        'testChat', // Identifies the type of the webview. Used internally
        'Chat Test', // Title of the panel displayed to the user
        ViewColumn.Active, // Editor column to show the new webview panel in.
        {
            enableScripts: true,
            localResourceRoots: [Uri.joinPath(extensionUri, 'build')],
        } // Webview options
    )

    panel.webview.onDidReceiveMessage(message => {
        languageClient.info(`vscode client: Received ${JSON.stringify(message)} from chat`)

        // TODO: get server contract types from chat-client
        switch (message.command) {
            case 'new-tab-was-created':
                languageClient.sendNotification(tabAddNotificationType, message.params)
                break
            case 'tab-was-removed':
                languageClient.sendNotification(tabRemoveNotificationType, message.params)
                break
        }
    }, undefined)

    panel.webview.html = getWebviewContent(panel.webview, extensionUri)

    commands.registerCommand('chat.sendCommandsFromUI', () => {
        panel.webview.postMessage({
            command: 'send-to-prompt',
            params: { prompt: 'Hello from vscode!', triggerId: '1' },
        })
    })
}

function getWebviewContent(webView: Webview, extensionUri: Uri) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat UI</title>
    </head>
    <body>
        ${generateJS(webView, extensionUri)}
    </body>
    </html>`
}

function generateJS(webView: Webview, extensionUri: Uri): string {
    const assetsPath = Uri.joinPath(extensionUri)
    const chatUri = Uri.joinPath(assetsPath, 'build', 'amazonq-ui.js')

    const entrypoint = webView.asWebviewUri(chatUri)

    return `
    <script type="text/javascript" src="${entrypoint.toString()}" defer onload="init()"></script>
    <script type="text/javascript">
        const init = () => {
            amazonQChat.createChat(acquireVsCodeApi());
        }
    </script>
    `
}
