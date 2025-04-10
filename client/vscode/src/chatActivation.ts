import {
    isValidAuthFollowUpType,
    INSERT_TO_CURSOR_POSITION,
    AUTH_FOLLOW_UP_CLICKED,
    CHAT_OPTIONS,
    COPY_TO_CLIPBOARD,
    UiMessageResultParams,
    EXPORT_CONVERSATION_DIALOG,
    EXPORT_CONVERSATION,
    ExportSerializedConversationParams,
    ExportConversationDialogParams,
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
    contextCommandsNotificationType,
    listConversationsRequestType,
    conversationClickRequestType,
    ErrorCodes,
    openTabRequestType,
    ResponseError,
} from '@aws/language-server-runtimes/protocol'
import { v4 as uuidv4 } from 'uuid'
import { Uri, Webview, WebviewView, commands, window } from 'vscode'
import { Disposable, LanguageClient, Position, State, TextDocumentIdentifier } from 'vscode-languageclient/node'
import * as jose from 'jose'
import * as vscode from 'vscode'
import * as fs from 'fs'

export function registerChat(languageClient: LanguageClient, extensionUri: Uri, encryptionKey?: Buffer) {
    const webviewInitialized: Promise<Webview> = new Promise(resolveWebview => {
        const provider = {
            resolveWebviewView(webviewView: WebviewView) {
                webviewView.webview.options = {
                    enableScripts: true,
                    localResourceRoots: [Uri.joinPath(extensionUri, 'build')],
                }

                resolveWebview(webviewView.webview)

                webviewView.webview.onDidReceiveMessage(async message => {
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
                            const chatDisposable = languageClient.onProgress(
                                chatRequestType,
                                partialResultToken,
                                partialResult =>
                                    handlePartialResult<ChatResult>(
                                        partialResult,
                                        encryptionKey,
                                        webviewView.webview,
                                        message.params.tabId
                                    )
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
                            handleCompleteResult<ChatResult>(
                                chatResult,
                                encryptionKey,
                                webviewView.webview,
                                message.params.tabId,
                                chatDisposable
                            )
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
                                        webviewView.webview,
                                        message.params.tabId
                                    )
                            )

                            const quickActionRequest = await encryptRequest<QuickActionParams>(
                                message.params,
                                encryptionKey
                            )
                            const quickActionResult = await languageClient.sendRequest(quickActionRequestType, {
                                ...quickActionRequest,
                                partialResultToken: quickActionPartialResultToken,
                            })
                            handleCompleteResult<ChatResult>(
                                quickActionResult,
                                encryptionKey,
                                webviewView.webview,
                                message.params.tabId,
                                quickActionDisposable
                            )
                            break
                        }
                        case listConversationsRequestType.method:
                            await handleRequest(
                                languageClient,
                                message.params,
                                webviewView,
                                listConversationsRequestType.method
                            )
                            break
                        case conversationClickRequestType.method:
                            await handleRequest(
                                languageClient,
                                message.params,
                                webviewView,
                                conversationClickRequestType.method
                            )
                            break
                        case followUpClickNotificationType.method:
                            if (!isValidAuthFollowUpType(message.params.followUp.type))
                                languageClient.sendNotification(followUpClickNotificationType, message.params)
                            break
                        // Handlers for Export Conversation feature
                        case EXPORT_CONVERSATION_DIALOG:
                            const { defaultFileName, supportedFormats } =
                                message.params as ExportConversationDialogParams

                            // Prompt user for destination to export file
                            const workspaceFolders = vscode.workspace.workspaceFolders
                            let defaultUri

                            if (workspaceFolders && workspaceFolders.length > 0) {
                                defaultUri = vscode.Uri.joinPath(workspaceFolders[0].uri, defaultFileName)
                            } else {
                                defaultUri = vscode.Uri.file(defaultFileName)
                            }

                            const saveUri = await vscode.window.showSaveDialog({
                                filters: {
                                    Markdown: ['md'],
                                    HTML: ['html'],
                                },
                                defaultUri,
                                title: 'Export chat',
                            })

                            // Send message to Chat Client to do Conversation Export
                            if (saveUri) {
                                webviewView.webview.postMessage({
                                    command: EXPORT_CONVERSATION,
                                    params: {
                                        tabId: message.params.tabId,
                                        filepath: saveUri.fsPath,
                                    },
                                })
                            }
                            break
                        case EXPORT_CONVERSATION:
                            // Save conversation content at given. Chat Client send with message in response to `EXPORT_CONVERSATION` notification
                            const { filepath, format, serializedChat } =
                                message.params as ExportSerializedConversationParams

                            try {
                                fs.writeFileSync(filepath, serializedChat)
                            } catch (error) {
                                void vscode.window.showErrorMessage('An error occurred while exporting your chat.')
                            }
                            break
                        default:
                            if (isServerEvent(message.command))
                                languageClient.sendNotification(message.command, message.params)
                            break
                    }
                }, undefined)

                languageClient.onNotification(contextCommandsNotificationType, params => {
                    webviewView.webview.postMessage({
                        command: contextCommandsNotificationType.method,
                        params: params,
                    })
                })

                languageClient.onRequest(openTabRequestType.method, async (params, _) => {
                    const mapErrorType = (type: string | undefined): number => {
                        switch (type) {
                            case 'InvalidRequest':
                                return ErrorCodes.InvalidRequest
                            case 'InternalError':
                                return ErrorCodes.InternalError
                            case 'UnknownError':
                            default:
                                return ErrorCodes.UnknownErrorCode
                        }
                    }
                    const requestId = uuidv4()

                    webviewView.webview.postMessage({
                        requestId: requestId,
                        command: openTabRequestType.method,
                        params: params,
                    })
                    const responsePromise = new Promise<UiMessageResultParams | undefined>((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            disposable.dispose()
                            reject(new Error('Request timed out'))
                        }, 30000)

                        const disposable = webviewView.webview.onDidReceiveMessage((message: any) => {
                            if (message.requestId === requestId) {
                                clearTimeout(timeout)
                                disposable.dispose()
                                resolve(message.params)
                            }
                        })
                    })

                    const result = await responsePromise

                    if (result?.success) {
                        return { tabId: result.result.tabId }
                    } else {
                        return new ResponseError(
                            mapErrorType(result?.error.type),
                            result?.error.message ?? 'No response from client'
                        )
                    }
                })

                webviewView.webview.html = getWebviewContent(webviewView.webview, extensionUri)

                registerGenericCommand('aws.sample-vscode-ext-amazonq.explainCode', 'Explain', webviewView.webview)
                registerGenericCommand('aws.sample-vscode-ext-amazonq.refactorCode', 'Refactor', webviewView.webview)
                registerGenericCommand('aws.sample-vscode-ext-amazonq.fixCode', 'Fix', webviewView.webview)
                registerGenericCommand('aws.sample-vscode-ext-amazonq.optimizeCode', 'Optimize', webviewView.webview)

                commands.registerCommand('aws.sample-vscode-ext-amazonq.sendToPrompt', data => {
                    const triggerType = getCommandTriggerType(data)
                    const selection = getSelectedText()

                    webviewView.webview.postMessage({
                        command: 'sendToPrompt',
                        params: { selection: selection, triggerType },
                    })
                })

                commands.registerCommand('aws.sample-vscode-ext-amazonq.openTab', data => {
                    webviewView.webview.postMessage({
                        command: 'aws/chat/openTab',
                        params: {},
                    })
                })
            },
        }

        // Register the provider for the auxiliary bar
        window.registerWebviewViewProvider('amazonq.chat', provider, {
            webviewOptions: { retainContextWhenHidden: true },
        })
    })

    // Listen for Initialize handshake from LSP server to register quick actions dynamically
    languageClient.onDidChangeState(({ oldState, newState }) => {
        if (oldState === State.Starting && newState === State.Running) {
            languageClient.info(
                'Language client received initializeResult from server:',
                JSON.stringify(languageClient.initializeResult)
            )

            const chatOptions = languageClient.initializeResult?.awsServerCapabilities?.chatOptions

            // We can only initialize the chat once the webview is initialized
            webviewInitialized.then(webview => {
                webview.postMessage({
                    command: CHAT_OPTIONS,
                    params: chatOptions,
                })
            })
        }
    })

    languageClient.onTelemetry(e => {
        languageClient.info(`[VSCode Client] Received telemetry event from server ${JSON.stringify(e)}`)
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
}

async function handleRequest(
    languageClient: LanguageClient,
    params: any,
    webviewView: WebviewView,
    requestMethod: string
) {
    const result = await languageClient.sendRequest(requestMethod, params)
    webviewView.webview.postMessage({
        command: requestMethod,
        params: result,
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
            amazonQChat.createChat(acquireVsCodeApi(), {disclaimerAcknowledged: false, enableConversationExport: true});
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

function registerGenericCommand(commandName: string, genericCommand: string, webview: Webview) {
    commands.registerCommand(commandName, data => {
        const triggerType = getCommandTriggerType(data)
        const selection = getSelectedText()

        webview.postMessage({
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
    webview: Webview,
    tabId: string
) {
    const decryptedMessage =
        typeof partialResult === 'string' && encryptionKey
            ? await decodeRequest<T>(partialResult, encryptionKey)
            : (partialResult as T)

    if (decryptedMessage.body) {
        webview.postMessage({
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
    webview: Webview,
    tabId: string,
    disposable: Disposable
) {
    const decryptedMessage =
        typeof result === 'string' && encryptionKey ? await decodeRequest(result, encryptionKey) : result

    webview.postMessage({
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
