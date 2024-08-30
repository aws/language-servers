import { ExtensionContext, commands, window } from 'vscode'

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    RequestType,
    CancellationToken,
    ParameterStructures,
} from 'vscode-languageclient/node'

let client: LanguageClient

export function activate(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand('myTestCommand', MyTestCommand))

    // The server is implemented in node
    const serverModule = process.env.LSP_SERVER!

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: {
            module: serverModule,
            transport: TransportKind.ipc,
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
        },
    }

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'plaintext' }],
    }

    // Create the language client and start the client.
    client = new LanguageClient('lspServerPoc', 'LSP Server POC', serverOptions, clientOptions)

    // Start the client. This will also launch the server
    client.start()
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined
    }
    return client.stop()
}

// In VS Code, bring up the command palette (cmd+shift+P on Mac) and enter "My Test Command" to run
// this function.
async function MyTestCommand(value: object): Promise<void> {
    // This bit demonstrates a direct JSON-RPC call, the server-to-client call wasn't implemented, but
    // would basically look the same as this and what is in identityServer.ts, just in the opposite .ts files.
    const result = await client.sendRequest('/aws/myTestRequest', {
        myParam: 'myTestRequest using Rpc, not EmbeddedRpc',
    })
    window.showInformationMessage(`MyTestRequestResult: ${JSON.stringify(result)}`)

    // This registers the client to receive the EmbeddedRpc calls, see the OnEmbeddedRpc function
    // further down for how these calls are handled
    client.onRequest<EmbeddedRpcCallParams, EmbeddedRpcCallResult, EmbeddedRpcCallError>(
        embeddedRpcCallType,
        OnEmbeddedRpc
    )

    // This packs and sends an embedded RPC call similar to what was demonstrated above for JSON-RPC
    const result2 = await client.sendRequest('/aws/embeddedRpcCall', {
        method: '/aws/myServerProc',
        params: { myParam: 'myServerProc using EmbeddedRpc, not Rpc' },
    })
    window.showInformationMessage(`MyServerProcResult: ${JSON.stringify(result2)}`)
}

// This handler unpacks the embedded RPC call on the client and handles it.  I didn't implement any map/switch
// here as this was a single call, but it would require something like that as more calls are added.
function OnEmbeddedRpc(params: EmbeddedRpcCallParams, token: CancellationToken): EmbeddedRpcCallResult {
    window.showInformationMessage(`Extension: OnEmbeddedRpc called with params: ${JSON.stringify(params)}`)
    return {
        result: {
            myResult2: `Server: OnEmbedded called with params: ${JSON.stringify(params)}`,
        },
    }
}

// Duplicating instead of importing the server-side definitions here to simulate what destinations would do
interface EmbeddedRpcCallParams {
    method: string
    params: any
}

interface EmbeddedRpcCallResult {
    result: any
}

interface EmbeddedRpcCallError {
    error: any
}

const embeddedRpcCallType = new RequestType<EmbeddedRpcCallParams, EmbeddedRpcCallResult, EmbeddedRpcCallError>(
    '/aws/embeddedRpcCall',
    ParameterStructures.auto
)
