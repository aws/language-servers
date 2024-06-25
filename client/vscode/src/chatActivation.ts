import {
    isValidAuthFollowUpType,
    INSERT_TO_CURSOR_POSITION,
    AUTH_FOLLOW_UP_CLICKED,
    CHAT_OPTIONS,
} from '@aws/chat-client-ui-types'
import {
    ChatResult,
    chatRequestType,
    followUpClickNotificationType,
    quickActionRequestType,
    QuickActionResult,
} from '@aws/language-server-runtimes/protocol'
import { v4 as uuidv4 } from 'uuid'
import { Uri, ViewColumn, Webview, WebviewPanel, commands, window } from 'vscode'
import { LanguageClient, State } from 'vscode-languageclient/node'
import * as jose from 'jose'

export function registerChat(languageClient: LanguageClient, extensionUri: Uri, encryptionKey: Buffer) {
    const panel = window.createWebviewPanel(
        'testChat', // Identifies the type of the webview. Used internally
        'Chat Test', // Title of the panel displayed to the user
        ViewColumn.Active, // Editor column to show the new webview panel in.
        {
            enableScripts: true,
            localResourceRoots: [Uri.joinPath(extensionUri, 'build')],
        } // Webview options
    )

    // Listen for Initialize handshake from LSP server to register quick actions dynamically
    languageClient.onDidChangeState(({ oldState, newState }) => {
        if (oldState === State.Starting && newState === State.Running) {
            languageClient.info(
                'Language client received initializeResult from server:',
                JSON.stringify(languageClient.initializeResult)
            )

            const chatOptions = languageClient.initializeResult?.awsServerCapabilities?.chatOptions

            panel.webview.postMessage({
                command: CHAT_OPTIONS,
                params: chatOptions,
            })
        }
    })

    languageClient.onTelemetry(e => {
        languageClient.info(`vscode client: Received telemetry event from server ${JSON.stringify(e)}`)
    })

    panel.webview.onDidReceiveMessage(message => {
        languageClient.info(`vscode client: Received ${JSON.stringify(message)} from chat`)

        switch (message.command) {
            case INSERT_TO_CURSOR_POSITION:
                insertTextAtCursorPosition(message.params.code)
                break
            case AUTH_FOLLOW_UP_CLICKED:
                languageClient.info('AuthFollowUp clicked')
                break
            case chatRequestType.method:
                const partialResultToken = uuidv4()

                const chatDisposable = languageClient.onProgress(
                    chatRequestType,
                    partialResultToken,
                    async partialResult => {
                        languageClient.info(
                            `received partial result, is encrypted? ${isEncryptedMessage(partialResult as any, 'dir', 'A256GCM')}`
                        )

                        const decryptedMessage = (await decodeRequest(
                            partialResult as string,
                            encryptionKey
                        )) as ChatResult
                        if (decryptedMessage.body) {
                            panel.webview.postMessage({
                                command: chatRequestType.method,
                                params: decryptedMessage,
                                isPartialResult: true,
                                tabId: message.params.tabId,
                            })
                        }
                    }
                )

                const payload = new TextEncoder().encode(JSON.stringify(message.params))

                const encryptedMessagePromise = new jose.CompactEncrypt(payload)
                    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
                    .encrypt(encryptionKey)

                encryptedMessagePromise.then((encryptedMessage: string) => {
                    languageClient
                        .sendRequest(chatRequestType, { message: encryptedMessage, partialResultToken })
                        .then(async (chatResult: ChatResult | string) => {
                            const decryptedMessage = (await decodeRequest(
                                chatResult as string,
                                encryptionKey
                            )) as ChatResult

                            panel.webview.postMessage({
                                command: chatRequestType.method,
                                params: decryptedMessage,
                                tabId: message.params.tabId,
                            })
                            chatDisposable.dispose()
                        })
                })
                break
            case quickActionRequestType.method:
                const quickActionPartialResultToken = uuidv4()

                const quickActionDisposable = languageClient.onProgress(
                    quickActionRequestType,
                    quickActionPartialResultToken,
                    async partialResult => {
                        const decryptedMessage = (await decodeRequest(
                            partialResult as string,
                            encryptionKey
                        )) as QuickActionResult
                        if (decryptedMessage.body) {
                            panel.webview.postMessage({
                                command: chatRequestType.method,
                                params: decryptedMessage,
                                isPartialResult: true,
                                tabId: message.params.tabId,
                            })
                        }
                    }
                )

                const quickActionPayload = new TextEncoder().encode(JSON.stringify(message.params))

                const encryptedQuickActionPromise = new jose.CompactEncrypt(quickActionPayload)
                    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
                    .encrypt(encryptionKey)

                encryptedQuickActionPromise.then((encryptedQuickAction: string) => {
                    languageClient
                        .sendRequest(quickActionRequestType, {
                            message: encryptedQuickAction,
                            partialResultToken: quickActionPartialResultToken,
                        })
                        .then(async (quickActionResult: QuickActionResult | string) => {
                            const decryptedResult = (await decodeRequest(
                                quickActionResult as string,
                                encryptionKey
                            )) as QuickActionResult

                            panel.webview.postMessage({
                                command: chatRequestType.method,
                                params: decryptedResult,
                                tabId: message.params.tabId,
                            })
                            quickActionDisposable.dispose()
                        })
                })
                break
            case followUpClickNotificationType.method:
                if (!isValidAuthFollowUpType(message.params.followUp.type))
                    languageClient.sendNotification(followUpClickNotificationType, message.params)
                break
            default:
                if (isServerEvent(message.command)) languageClient.sendNotification(message.command, message.params)
                break
        }
    }, undefined)

    panel.webview.html = getWebviewContent(panel.webview, extensionUri)

    registerGenericCommand('aws.amazonq.explainCode', 'Explain', panel)
    registerGenericCommand('aws.amazonq.refactorCode', 'Refactor', panel)
    registerGenericCommand('aws.amazonq.fixCode', 'Fix', panel)
    registerGenericCommand('aws.amazonq.optimizeCode', 'Optimize', panel)

    commands.registerCommand('aws.amazonq.sendToPrompt', data => {
        const triggerType = getCommandTriggerType(data)
        const selection = getSelectedText()

        panel.webview.postMessage({
            command: 'sendToPrompt',
            params: { selection: selection, triggerType },
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

function registerGenericCommand(commandName: string, genericCommand: string, panel: WebviewPanel) {
    commands.registerCommand(commandName, data => {
        const triggerType = getCommandTriggerType(data)
        const selection = getSelectedText()

        panel.webview.postMessage({
            command: 'genericCommand',
            params: { genericCommand, selection, triggerType },
        })
    })
}

function insertTextAtCursorPosition(text: string) {
    const editor = window.activeTextEditor
    console.log({ editor })
    if (editor) {
        const cursorStart = editor.selection.active
        editor.edit(editBuilder => {
            editBuilder.insert(cursorStart, text)
        })
    }
}

function isServerEvent(command: string) {
    return command.startsWith('aws/chat/') || command === 'telemetry/event'
}

async function decodeRequest<T>(request: string, key: Buffer): Promise<T> {
    const result = await jose.jwtDecrypt(request, key, {
        clockTolerance: 60, // Allow up to 60 seconds to account for clock differences
        contentEncryptionAlgorithms: ['A256GCM'],
        keyManagementAlgorithms: ['dir'],
    })

    if (!result.payload) {
        throw new Error('JWT payload not found')
    }
    return result.payload as T
}

function isEncryptedMessage(message: string, algorithm: string, encoding: string) {
    // Check if the message has five parts separated by periods
    const parts = message.split('.')
    if (parts.length !== 5) {
        return false
    }

    try {
        // Decode the protected header (first part of the message)
        const protectedHeader = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'))

        console.log(JSON.stringify(protectedHeader))
        // Check if the header contains the expected fields
        if (
            protectedHeader.alg &&
            protectedHeader.enc &&
            protectedHeader.alg == algorithm &&
            protectedHeader.enc == encoding
        ) {
            return true
        }
    } catch (e) {
        // If there's an error during decoding, the message is not a valid JWE
        return false
    }

    return false
}
