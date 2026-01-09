import { ChildProcessWithoutNullStreams, spawn } from 'child_process'

export interface JsonRpcMessage {
    jsonrpc: string
    id?: number
    method?: string
    params?: any
    result?: any
    error?: any
}

export class LspClient {
    private process: ChildProcessWithoutNullStreams
    private requestId = 100
    private pendingRequests: Map<number, { resolve: (value: any) => void; reject: (reason: any) => void }> = new Map()
    private buffer = ''

    constructor(runtimeFile: string) {
        this.process = spawn('node', [runtimeFile, '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe'],
        })

        this.process.stdout.on('data', (data: Buffer) => {
            this.buffer += data.toString()
            this.processBuffer()
        })

        this.process.stderr.on('data', (data: Buffer) => {
            console.error(`[LSP stderr] ${data.toString()}`)
        })
    }

    private processBuffer(): void {
        while (true) {
            const headerEnd = this.buffer.indexOf('\r\n\r\n')
            if (headerEnd === -1) break

            const header = this.buffer.substring(0, headerEnd)
            const match = header.match(/Content-Length: (\d+)/)
            if (!match) {
                this.buffer = this.buffer.substring(headerEnd + 4)
                continue
            }

            const contentLength = parseInt(match[1], 10)
            const messageStart = headerEnd + 4
            const messageEnd = messageStart + contentLength

            if (this.buffer.length < messageEnd) break

            const content = this.buffer.substring(messageStart, messageEnd)
            this.buffer = this.buffer.substring(messageEnd)

            try {
                const message: JsonRpcMessage = JSON.parse(content)

                if (message.method === 'workspace/configuration' && message.id !== undefined) {
                    this.sendResponse(message.id, [{}])
                    continue
                }

                if (message.id !== undefined && this.pendingRequests.has(message.id)) {
                    const { resolve, reject } = this.pendingRequests.get(message.id)!
                    this.pendingRequests.delete(message.id)
                    if (message.error) {
                        reject(new Error(message.error.message))
                    } else {
                        resolve(message.result)
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    }

    private send(obj: JsonRpcMessage): void {
        const content = JSON.stringify(obj)
        const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`
        this.process.stdin.write(header + content)
    }

    private sendResponse(id: number, result: any): void {
        this.send({ jsonrpc: '2.0', id, result })
    }

    async sendRequest(method: string, params: any): Promise<any> {
        const id = ++this.requestId
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject })
            this.send({ jsonrpc: '2.0', id, method, params })
        })
    }

    sendNotification(method: string, params: any): void {
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
