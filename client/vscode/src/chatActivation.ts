import {
    isValidAuthFollowUpType,
    INSERT_TO_CURSOR_POSITION,
    AUTH_FOLLOW_UP_CLICKED,
    CHAT_OPTIONS,
    COPY_TO_CLIPBOARD,
} from '@aws/chat-client-ui-types'
import {
    ChatResult,
    chatRequestType,
    ChatParams,
    followUpClickNotificationType,
    quickActionRequestType,
    QuickActionResult,
    QuickActionParams,
    insertToCursorPositionNotificationType,
    InlineChatParams,
    InlineChatResult,
    inlineChatRequestType,
} from '@aws/language-server-runtimes/protocol'
import { v4 as uuidv4 } from 'uuid'
import { Uri, ViewColumn, Webview, WebviewPanel, commands, window } from 'vscode'
import { Disposable, LanguageClient, Position, State, TextDocumentIdentifier } from 'vscode-languageclient/node'
import * as jose from 'jose'
import * as vscode from 'vscode'

export function registerChat(languageClient: LanguageClient, extensionUri: Uri, encryptionKey?: Buffer) {
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
        languageClient.info(`[VSCode Client] Received telemetry event from server ${JSON.stringify(e)}`)
    })

    panel.webview.onDidReceiveMessage(async message => {
        languageClient.info(`[VSCode Client]  Received ${JSON.stringify(message)} from chat`)

        switch (message.command) {
            case COPY_TO_CLIPBOARD:
                languageClient.info('[VSCode Client] Copy to clipboard event received')
                break
            case INSERT_TO_CURSOR_POSITION: {
                const editor = window.activeTextEditor
                let textDocument: TextDocumentIdentifier | undefined = undefined
                let cursorPosition: Position | undefined = undefined
                if (editor) {
                    cursorPosition = editor.selection.active
                    textDocument = { uri: editor.document.uri.toString() }
                }

                languageClient.sendNotification(insertToCursorPositionNotificationType, {
                    ...message.params,
                    cursorPosition,
                    textDocument,
                })
                break
            }
            case AUTH_FOLLOW_UP_CLICKED:
                languageClient.info('[VSCode Client] AuthFollowUp clicked')
                break
            case chatRequestType.method: {
                const partialResultToken = uuidv4()
                const chatDisposable = languageClient.onProgress(chatRequestType, partialResultToken, partialResult =>
                    handlePartialResult<ChatResult>(partialResult, encryptionKey, panel, message.params.tabId)
                )

                const editor =
                    window.activeTextEditor ||
                    window.visibleTextEditors.find(editor => editor.document.languageId != 'Log')
                if (editor) {
                    message.params.cursorPosition = [editor.selection.active]
                    message.params.textDocument = { uri: editor.document.uri.toString() }
                }

                const chatRequest = await encryptRequest<ChatParams>(message.params, encryptionKey)
                const chatResult = await languageClient.sendRequest(chatRequestType, {
                    ...chatRequest,
                    partialResultToken,
                })
                handleCompleteResult<ChatResult>(chatResult, encryptionKey, panel, message.params.tabId, chatDisposable)
                break
            }
            case quickActionRequestType.method: {
                const quickActionPartialResultToken = uuidv4()
                const quickActionDisposable = languageClient.onProgress(
                    quickActionRequestType,
                    quickActionPartialResultToken,
                    partialResult =>
                        handlePartialResult<QuickActionResult>(
                            partialResult,
                            encryptionKey,
                            panel,
                            message.params.tabId
                        )
                )

                const quickActionRequest = await encryptRequest<QuickActionParams>(message.params, encryptionKey)
                const quickActionResult = await languageClient.sendRequest(quickActionRequestType, {
                    ...quickActionRequest,
                    partialResultToken: quickActionPartialResultToken,
                })
                handleCompleteResult<ChatResult>(
                    quickActionResult,
                    encryptionKey,
                    panel,
                    message.params.tabId,
                    quickActionDisposable
                )
                break
            }
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

    registerGenericCommand('aws.sample-vscode-ext-amazonq.explainCode', 'Explain', panel)
    registerGenericCommand('aws.sample-vscode-ext-amazonq.refactorCode', 'Refactor', panel)
    registerGenericCommand('aws.sample-vscode-ext-amazonq.fixCode', 'Fix', panel)
    registerGenericCommand('aws.sample-vscode-ext-amazonq.optimizeCode', 'Optimize', panel)

    commands.registerCommand('aws.sample-vscode-ext-amazonq.sendToPrompt', data => {
        const triggerType = getCommandTriggerType(data)
        const selection = getSelectedText()

        panel.webview.postMessage({
            command: 'sendToPrompt',
            params: { selection: selection, triggerType },
        })
    })

    commands.registerCommand('aws.sample-vscode-ext-amazonq.sendInlineChat', async () => {
        const params = getCurrentEditorParams()
        languageClient.info(`Logging request for inline chat ${JSON.stringify(params)}`)
        if (!params) {
            languageClient.warn(`Invalid request params for inline chat`)
            return
        }
        try {
            const inlineChatRequest = await encryptRequest<InlineChatParams>(params, encryptionKey)
            const response = await languageClient.sendRequest(inlineChatRequestType, inlineChatRequest)
            const result: InlineChatResult = response as InlineChatResult
            const decryptedMessage =
                typeof result === 'string' && encryptionKey ? await decodeRequest(result, encryptionKey) : result
            languageClient.info(`Logging response for inline chat ${JSON.stringify(decryptedMessage)}`)
        } catch (e) {
            languageClient.info(`Logging error for inline chat ${JSON.stringify(e)}`)
        }
    })

    commands.registerCommand('aws.sample-vscode-ext-amazonq.openTab', data => {
        panel.webview.postMessage({
            command: 'aws/chat/openTab',
            params: {},
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
            amazonQChat.createChat(acquireVsCodeApi(), {disclaimerAcknowledged: false});
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

function isServerEvent(command: string) {
    return command.startsWith('aws/chat/') || command === 'telemetry/event'
}

// Encrypt the provided request if encryption key exists otherwise do nothing
async function encryptRequest<T>(params: T, encryptionKey: Buffer | undefined): Promise<{ message: string } | T> {
    if (!encryptionKey) {
        return params
    }

    const payload = new TextEncoder().encode(JSON.stringify(params))

    const encryptedMessage = await new jose.CompactEncrypt(payload)
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .encrypt(encryptionKey)

    return { message: encryptedMessage }
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

async function handlePartialResult<T extends ChatResult>(
    partialResult: string | T,
    encryptionKey: Buffer | undefined,
    panel: WebviewPanel,
    tabId: string
) {
    const decryptedMessage =
        typeof partialResult === 'string' && encryptionKey
            ? await decodeRequest<T>(partialResult, encryptionKey)
            : (partialResult as T)

    if (decryptedMessage.body) {
        panel.webview.postMessage({
            command: chatRequestType.method,
            params: decryptedMessage,
            isPartialResult: true,
            tabId: tabId,
        })
    }
}

async function handleCompleteResult<T>(
    result: string | T,
    encryptionKey: Buffer | undefined,
    panel: WebviewPanel,
    tabId: string,
    disposable: Disposable
) {
    const decryptedMessage =
        typeof result === 'string' && encryptionKey ? await decodeRequest(result, encryptionKey) : result

    panel.webview.postMessage({
        command: chatRequestType.method,
        params: decryptedMessage,
        tabId: tabId,
    })
    disposable.dispose()
}

function getCurrentEditorParams(): InlineChatParams | undefined {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor
    if (!editor) {
        return undefined
    }

    // Get cursor position
    const position = editor.selection.active

    // Get document URI
    const documentUri = editor.document.uri.toString()

    const params: InlineChatParams = {
        prompt: {
            prompt: 'Add a function to print Hello World',
        },
        cursorState: [
            {
                position: {
                    line: position.line,
                    character: position.character,
                },
            },
        ],
        textDocument: {
            uri: documentUri,
        },
    }

    return params
}
