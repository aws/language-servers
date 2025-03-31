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
    contextCommandsNotificationType,
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

    languageClient.onNotification(contextCommandsNotificationType, params => {
        panel.webview.postMessage({
            command: contextCommandsNotificationType.method,
            params: params,
        })
    })

    panel.webview.onDidReceiveMessage(async message => {
        languageClient.info(`[VSCode Client]  Received ${JSON.stringify(message)} from chat`)

        if (tryHandleFeatureEvent(message, panel)) {
            return
        }

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
    const chatUri = Uri.joinPath(assetsPath, 'build', 'amazonq-chat-client.js')

    const chatEntrypoint = webView.asWebviewUri(chatUri)

    return `
    <script type="text/javascript" src="${chatEntrypoint.toString()}" defer onload="init()"></script>
    <script type="text/javascript">
        const init = () => {
            // Will be part of Extension and not chat client
            const vscodeApi = acquireVsCodeApi()
            const connector = amazonQChat.createConnectorAdapter(vscodeApi.postMessage)
            amazonQChat.createChat(vscodeApi,
                {
                    disclaimerAcknowledged: false,
                    // Registering all commands supported in chat-client/src/ui/quickActions/handler.ts
                    // TODO: should we register and pass /help and /clear to connector as well?
                    quickActionCommands: [
                        {
                            groupName: 'Legacy Commands Handlers',
                            commands: [
                                { command: '/dev' },
                                { command: '/transform' },
                                { command: '/review' },
                                { command: '/test' },
                                { command: '/doc' },
                                { command: '/help' },
                                { command: '/clear' },
                            ]
                        }
                    ]
                },
                // connectorsConfig,
                connector);
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

// Routing for integration with legacy connectors
function tryHandleFeatureEvent(msg: any, panel: WebviewPanel): boolean {
    if (!msg.tabType) {
        return false
    }

    switch (msg.tabType) {
        case 'gumby':
            handleGumbyEvent(msg, panel)
            break
        default:
            break
    }

    return true
}

function handleGumbyEvent(msg: any, panel: WebviewPanel) {
    const sender = 'gumbyChat'
    switch (msg.command) {
        case 'transform':
            handleGumbyTransform(msg, sender, panel)
            break
        case 'form-action-click':
            handleGumbyActionClick(msg, sender, panel)
            break
        case 'new-tab-was-created':
        case 'tab-was-removed':
        case 'auth-follow-up-was-clicked':
        case 'chat-prompt':
        case 'response-body-link-click':
            break
    }
}

function handleGumbyActionClick(msg: any, sender: string, panel: WebviewPanel) {
    if (msg.action === 'gumbyStartTransformation') {
        handleGumbyClear(msg, sender, panel)
        handleGumbyTransform(msg, sender, panel)
    }
}

function handleGumbyClear(msg: any, sender: string, panel: WebviewPanel) {
    panel.webview.postMessage({
        command: 'aws.awsq.clearchat',
        sender: sender,
        tabID: msg.tabID,
        type: 'sendCommandMessage',
    })
}

function handleGumbyTransform(msg: any, sender: string, panel: WebviewPanel) {
    panel.webview.postMessage({
        buttons: [],
        inProgress: true,
        messageType: 'answer-part',
        status: 'info',
        sender: sender,
        tabID: msg.tabID,
        type: 'asyncEventProgressMessage',
    })
    panel.webview.postMessage({
        buttons: [],
        inProgress: true,
        messageType: 'answer-part',
        message: 'I am checking for open projects that are eligible for transformation...',
        status: 'info',
        sender: sender,
        tabID: msg.tabID,
        type: 'asyncEventProgressMessage',
    })
    panel.webview.postMessage({
        buttons: [
            {
                id: 'gumbyStartTransformation',
                keepCardAfterClick: false,
                text: 'Start a new transformation',
            },
        ],
        messageType: 'ai-prompt',
        message: "Sorry, I couldn't find a project that I can upgrade...",
        status: 'info',
        sender: sender,
        tabID: msg.tabID,
        type: 'chatMessage',
    })
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
