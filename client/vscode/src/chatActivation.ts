import { isValidAuthFollowUpType } from '@aws/chat-client-ui-types'
import {
    ChatResult,
    chatRequestType,
    feedbackNotificationType,
    followUpClickNotificationType,
    infoLinkClickNotificationType,
    linkClickNotificationType,
    quickActionRequestType,
    sourceLinkClickNotificationType,
    tabAddNotificationType,
    tabChangeNotificationType,
    tabRemoveNotificationType,
    telemetryNotificationType,
} from '@aws/language-server-runtimes/protocol'
import { v4 as uuidv4 } from 'uuid'
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
            case chatRequestType.method:
                const partialResultToken = uuidv4()

                const chatDisposable = languageClient.onProgress(chatRequestType, partialResultToken, partialResult => {
                    if (partialResult.body) {
                        panel.webview.postMessage({
                            command: chatRequestType.method,
                            params: partialResult,
                            isPartialResult: true,
                            tabId: message.params.tabId,
                        })
                    }
                })

                languageClient
                    .sendRequest(chatRequestType, Object.assign(message.params, { partialResultToken }))
                    .then((chatResult: ChatResult) => {
                        panel.webview.postMessage({
                            command: chatRequestType.method,
                            params: chatResult,
                            tabId: message.params.tabId,
                        })
                        chatDisposable.dispose()
                    })
                break
            case quickActionRequestType.method:
                const quickActionPartialResultToken = uuidv4()

                const quickActionDisposable = languageClient.onProgress(
                    quickActionRequestType,
                    quickActionPartialResultToken,
                    partialResult => {
                        if (partialResult.body) {
                            panel.webview.postMessage({
                                command: chatRequestType.method,
                                params: partialResult,
                                isPartialResult: true,
                                tabId: message.params.tabId,
                            })
                        }
                    }
                )

                languageClient
                    .sendRequest(
                        quickActionRequestType,
                        Object.assign(message.params, { partialResultToken: quickActionPartialResultToken })
                    )
                    .then((chatResult: ChatResult) => {
                        panel.webview.postMessage({
                            command: chatRequestType.method,
                            params: chatResult,
                            tabId: message.params.tabId,
                        })
                        quickActionDisposable.dispose()
                    })
                break
            case feedbackNotificationType.method:
                languageClient.sendNotification(feedbackNotificationType, message.params)
                break
            case followUpClickNotificationType.method:
                if (!isValidAuthFollowUpType(message.params.followUp.type))
                    languageClient.sendNotification(followUpClickNotificationType, message.params)
                break
            case linkClickNotificationType.method:
                languageClient.sendNotification(linkClickNotificationType, message.params)
                break
            case sourceLinkClickNotificationType.method:
                languageClient.sendNotification(sourceLinkClickNotificationType, message.params)
                break
            case infoLinkClickNotificationType.method:
                languageClient.sendNotification(infoLinkClickNotificationType, message.params)
                break
            case tabAddNotificationType.method:
                languageClient.sendNotification(tabAddNotificationType, message.params)
                break
            case tabRemoveNotificationType.method:
                languageClient.sendNotification(tabRemoveNotificationType, message.params)
                break
            case tabChangeNotificationType.method:
                languageClient.sendNotification(tabChangeNotificationType, message.params)
                break
            case telemetryNotificationType.method:
                languageClient.sendNotification(telemetryNotificationType, message.params)
                break
        }
    }, undefined)

    const chatConfig = {
        quickActionCommands:
            languageClient.initializeResult?.awsServerCapabilities?.chatQuickActionsProvider?.quickActionsCommandGroups,
    }
    panel.webview.html = getWebviewContent(panel.webview, extensionUri, chatConfig)

    commands.registerCommand('aws.amazonq.explainCode', data => {
        const triggerType = getCommandTriggerType(data)
        const selection = getSelectedText()

        panel.webview.postMessage({
            command: 'genericCommand',
            params: { genericCommand: 'Explain', selection, triggerType },
        })
    })

    commands.registerCommand('aws.amazonq.refactorCode', data => {
        const triggerType = getCommandTriggerType(data)
        const selection = getSelectedText()

        panel.webview.postMessage({
            command: 'genericCommand',
            params: { genericCommand: 'Refactor', selection, triggerType },
        })
    })

    commands.registerCommand('aws.amazonq.fixCode', data => {
        const triggerType = getCommandTriggerType(data)
        const selection = getSelectedText()

        panel.webview.postMessage({
            command: 'genericCommand',
            params: { genericCommand: 'Fix', selection, triggerType },
        })
    })

    commands.registerCommand('aws.amazonq.optimizeCode', data => {
        const triggerType = getCommandTriggerType(data)
        const selection = getSelectedText()

        panel.webview.postMessage({
            command: 'genericCommand',
            params: { genericCommand: 'Optimize', selection, triggerType },
        })
    })

    commands.registerCommand('aws.amazonq.sendToPrompt', data => {
        const triggerType = getCommandTriggerType(data)
        const selection = getSelectedText()

        panel.webview.postMessage({
            command: 'sendToPrompt',
            params: { selection: selection, triggerType },
        })
    })
}

function getWebviewContent(webView: Webview, extensionUri: Uri, chatClientConfig: object) {
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
        ${generateJS(webView, extensionUri, chatClientConfig)}
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

function generateJS(webView: Webview, extensionUri: Uri, chatClientConfig: object): string {
    const assetsPath = Uri.joinPath(extensionUri)
    const chatUri = Uri.joinPath(assetsPath, 'build', 'amazonq-ui.js')

    const entrypoint = webView.asWebviewUri(chatUri)

    return `
    <script type="text/javascript" src="${entrypoint.toString()}" defer onload="init()"></script>
    <script type="text/javascript">
        const init = () => {
            amazonQChat.createChat(acquireVsCodeApi(), ${JSON.stringify(chatClientConfig)});
        }
    </script>
    `
}

function getSelectedText(): string {
    const editor = window.activeTextEditor
    if (editor) {
        const selection = editor.selection
        const selectedText = editor.document.getText(selection)
        return selectedText
    }

    return ' '
}

function getCommandTriggerType(data: any): string {
    // data is undefined when commands triggered from keybinding or command palette. Currently no
    // way to differentiate keybinding and command palette, so both interactions are recorded as keybinding
    return data === undefined ? 'hotkeys' : 'contextMenu'
}
