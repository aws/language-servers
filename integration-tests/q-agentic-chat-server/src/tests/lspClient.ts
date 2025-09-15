import { JSONRPCClient } from 'json-rpc-2.0'
import { EventEmitter } from 'events'
import { Readable, Writable } from 'stream'
import {
    ButtonClickParams,
    ButtonClickResult,
    EncryptedChatParams,
    InitializeParams,
    InitializeResult,
} from '@aws/language-server-runtimes/protocol'

/**
 * JSON-RPC endpoint for communicating with Language Server Protocol (LSP) servers.
 *
 * Acts as a JSON-RPC client that sends requests/notifications to a server process
 * and receives responses/notifications back. Uses LSP-style message framing with
 * Content-Length headers.
 *
 * @example
 * ```typescript
 * const endpoint = new JSONRPCEndpoint(process.stdin, process.stdout);
 *
 * // Send request and wait for response
 * const result = await endpoint.send('initialize', { capabilities: {} });
 *
 * // Send notification (no response expected)
 * endpoint.notify('initialized', {});
 *
 * // Listen for server notifications
 * endpoint.on('window/logMessage', (params) => {
 *   console.log('Server log:', params.message);
 * });
 * ```
 */
export class JSONRPCEndpoint extends EventEmitter {
    private client: JSONRPCClient
    private nextId = 0

    constructor(writable: Writable, readable: Readable) {
        super()

        this.client = new JSONRPCClient(
            async request => {
                const message = JSON.stringify(request)
                const contentLength = Buffer.byteLength(message, 'utf-8')
                writable.write(`Content-Length: ${contentLength}\r\n\r\n${message}`)
            },
            () => this.nextId++
        )

        let buffer = ''
        readable.on('data', (chunk: Buffer) => {
            buffer += chunk.toString()

            while (true) {
                const headerEnd = buffer.indexOf('\r\n\r\n')
                if (headerEnd === -1) break

                const header = buffer.substring(0, headerEnd)
                const contentLengthMatch = header.match(/Content-Length: (\d+)/)
                if (!contentLengthMatch) break

                const contentLength = parseInt(contentLengthMatch[1])
                const messageStart = headerEnd + 4

                if (buffer.length < messageStart + contentLength) break

                const message = buffer.substring(messageStart, messageStart + contentLength)
                buffer = buffer.substring(messageStart + contentLength)

                try {
                    const jsonrpc = JSON.parse(message)
                    if ('method' in jsonrpc) {
                        this.emit(jsonrpc.method, jsonrpc.params)
                    } else {
                        this.client.receive(jsonrpc)
                    }
                } catch (err) {
                    console.error('Failed to parse JSON-RPC message:', err)
                }
            }
        })
    }

    send<T = any, R = any>(method: string, params?: T): PromiseLike<R> {
        return this.client.request(method, params)
    }

    notify<T>(method: string, params?: T) {
        this.client.notify(method, params)
    }
}

/**
 * LSP client wrapper that provides typed methods for common Language Server Protocol operations.
 *
 * Wraps a JSONRPCEndpoint to provide convenient methods for LSP initialization, chat operations,
 * and other server interactions with proper TypeScript typing.
 */
export class LspClient {
    private endpoint: JSONRPCEndpoint

    constructor(endpoint: JSONRPCEndpoint) {
        this.endpoint = endpoint
    }

    public initialize(params: InitializeParams): PromiseLike<InitializeResult> {
        return this.endpoint.send('initialize', params)
    }

    public initialized() {
        this.endpoint.notify('initialized')
    }

    public exit() {
        this.endpoint.notify('exit')
    }

    public sendChatPrompt(params: EncryptedChatParams): PromiseLike<string> {
        return this.endpoint.send('aws/chat/sendChatPrompt', params)
    }

    public buttonClick(params: ButtonClickParams): PromiseLike<ButtonClickResult> {
        return this.endpoint.send('aws/chat/buttonClick', params)
    }
}
