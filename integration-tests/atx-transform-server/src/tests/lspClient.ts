import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { EventEmitter } from 'events'

export class LspClient extends EventEmitter {
    private process: ChildProcessWithoutNullStreams
    private requestId = 100
    private pendingRequests: Map<number, { resolve: (value: any) => void; reject: (reason: any) => void }> = new Map()
    private buffer = ''

    constructor(runtimeFile: string) {
        super()
        this.process = spawn('node', [runtimeFile, '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe'],
        })

        this.process.stdout.on('data', (chunk: Buffer) => {
            this.buffer += chunk.toString()
            this.processBuffer()
        })

        this.process.stderr.on('data', (data: Buffer) => {
            if (process.env.DEBUG) {
                console.error('LSP stderr:', data.toString())
            }
        })
    }

    private processBuffer(): void {
        while (true) {
            // Find Content-Length header
            const headerMatch = this.buffer.match(/Content-Length: (\d+)\r\n/)
            if (!headerMatch) break

            const contentLength = parseInt(headerMatch[1])
            const headerEnd = this.buffer.indexOf('\r\n\r\n')
            if (headerEnd === -1) break

            const messageStart = headerEnd + 4
            const messageEnd = messageStart + contentLength

            if (this.buffer.length < messageEnd) break

            const message = this.buffer.substring(messageStart, messageEnd)
            this.buffer = this.buffer.substring(messageEnd)

            try {
                const jsonrpc = JSON.parse(message)
                this.handleMessage(jsonrpc)
            } catch (err) {
                if (process.env.DEBUG) {
                    console.error('Failed to parse JSON-RPC message:', err)
                    console.error('Message was:', message.substring(0, 200))
                }
            }
        }
    }

    private handleMessage(jsonrpc: any): void {
        // Handle server requests (like workspace/configuration)
        if (jsonrpc.method === 'workspace/configuration' && jsonrpc.id !== undefined) {
            this.sendResponse(jsonrpc.id, [{}])
            return
        }

        // Handle responses to our requests
        if (jsonrpc.id !== undefined && this.pendingRequests.has(jsonrpc.id)) {
            const { resolve, reject } = this.pendingRequests.get(jsonrpc.id)!
            this.pendingRequests.delete(jsonrpc.id)
            if (jsonrpc.error) {
                reject(new Error(jsonrpc.error.message))
            } else {
                resolve(jsonrpc.result)
            }
            return
        }

        // Emit notifications
        if (jsonrpc.method) {
            this.emit(jsonrpc.method, jsonrpc.params)
        }
    }

    private send(obj: any): void {
        const content = JSON.stringify(obj)
        const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`
        this.process.stdin.write(header + content)
    }

    private sendResponse(id: number, result: any): void {
        this.send({ jsonrpc: '2.0', id, result })
    }

    sendRequest(method: string, params: any): Promise<any> {
        const id = ++this.requestId
        console.log(`>> Request[${id}]: ${method}`)

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject })
            this.send({ jsonrpc: '2.0', id, method, params })
        })
    }

    sendNotification(method: string, params?: any): void {
        console.log(`>> Notification: ${method}`)
        this.send({ jsonrpc: '2.0', method, params })
    }

    async initialize(): Promise<any> {
        return this.sendRequest('initialize', {
            processId: process.pid,
            capabilities: {},
            rootUri: null,
            initializationOptions: { aws: { awsConfigSectionName: 'aws' } },
        })
    }

    close(): void {
        this.process.kill()
    }
}
