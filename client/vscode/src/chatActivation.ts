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

        switch (message.command) {
            case tabAddNotificationType.method:
                languageClient.sendNotification(tabAddNotificationType, message.params)
                break
            case tabRemoveNotificationType.method:
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
        ${generateCss()}
    </head>
    <body>
        ${generateJS(webView, extensionUri)}
    </body>
    </html>`
}

function generateCss() {
    return `
    <style>
        body,
        html {
            background-color: var(--mynah-color-bg);
            color: var(--mynah-color-text-default);
            height: 100%;
            width: 100%;
            overflow: hidden;
            margin: 0;
            padding: 0;
        }
    </style>`
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
