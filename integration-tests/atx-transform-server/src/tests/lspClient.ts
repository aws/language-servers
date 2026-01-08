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
        console.log(`[ATX-DEBUG] ========== LSP CLIENT STARTING ==========`)
        console.log(`[ATX-DEBUG] Runtime file: ${runtimeFile}`)
        console.log(`[ATX-DEBUG] Node version: ${process.version}`)
        console.log(`[ATX-DEBUG] Platform: ${process.platform}`)
        console.log(`[ATX-DEBUG] CWD: ${process.cwd()}`)
        console.log(`[ATX-DEBUG] Spawning: node ${runtimeFile} --stdio`)

        this.process = spawn('node', [runtimeFile, '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe'],
        })

        console.log(`[ATX-DEBUG] Process spawned, PID: ${this.process.pid}`)

        this.process.on('error', err => {
            console.error(`[ATX-DEBUG] Process ERROR:`, err)
        })

        this.process.on('exit', (code, signal) => {
            console.log(`[ATX-DEBUG] Process EXITED - code: ${code}, signal: ${signal}`)
        })

        this.process.on('close', (code, signal) => {
            console.log(`[ATX-DEBUG] Process CLOSED - code: ${code}, signal: ${signal}`)
        })

        this.process.stdin.on('error', err => {
            console.error(`[ATX-DEBUG] stdin ERROR:`, err)
        })

        this.process.stdout.on('data', (data: Buffer) => {
            const str = data.toString()
            console.log(`[ATX-DEBUG] stdout RECEIVED (${str.length} bytes)`)
            console.log(`[ATX-DEBUG] stdout DATA: ${str.substring(0, 1000)}`)
            this.buffer += str
            this.processBuffer()
        })

        this.process.stderr.on('data', (data: Buffer) => {
            console.error(`[ATX-DEBUG] stderr: ${data.toString()}`)
        })

        console.log(`[ATX-DEBUG] All event handlers attached`)
    }

    private processBuffer(): void {
        console.log(`[ATX-DEBUG] processBuffer called, buffer length: ${this.buffer.length}`)

        while (true) {
            // Find Content-Length header
            const headerEnd = this.buffer.indexOf('\r\n\r\n')
            if (headerEnd === -1) break

            const header = this.buffer.substring(0, headerEnd)
            const match = header.match(/Content-Length: (\d+)/)
            if (!match) {
                // Skip malformed header
                this.buffer = this.buffer.substring(headerEnd + 4)
                continue
            }

            const contentLength = parseInt(match[1], 10)
            const messageStart = headerEnd + 4
            const messageEnd = messageStart + contentLength

            if (this.buffer.length < messageEnd) break // Wait for more data

            const content = this.buffer.substring(messageStart, messageEnd)
            this.buffer = this.buffer.substring(messageEnd)

            try {
                const message: JsonRpcMessage = JSON.parse(content)
                console.log(`[ATX-DEBUG] Parsed message id=${message.id} method=${message.method}`)

                if (message.method === 'workspace/configuration' && message.id !== undefined) {
                    console.log(`[ATX-DEBUG] Responding to workspace/configuration`)
                    this.sendResponse(message.id, [{}])
                    continue
                }

                if (message.id !== undefined && this.pendingRequests.has(message.id)) {
                    console.log(`[ATX-DEBUG] Received response for request ${message.id}`)
                    const { resolve, reject } = this.pendingRequests.get(message.id)!
                    this.pendingRequests.delete(message.id)
                    if (message.error) {
                        reject(new Error(message.error.message))
                    } else {
                        resolve(message.result)
                    }
                }
            } catch (e) {
                console.error(`[ATX-DEBUG] JSON parse error:`, e)
            }
        }
    }

    private send(obj: JsonRpcMessage): void {
        const content = JSON.stringify(obj)
        const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`
        console.log(`[ATX-DEBUG] SENDING to stdin (${content.length} bytes): ${content.substring(0, 500)}`)
        this.process.stdin.write(header + content)
        console.log(`[ATX-DEBUG] SENT successfully`)
    }

    private sendResponse(id: number, result: any): void {
        console.log(`[ATX-DEBUG] sendResponse id=${id}`)
        this.send({ jsonrpc: '2.0', id, result })
    }

    async sendRequest(method: string, params: any): Promise<any> {
        const id = ++this.requestId
        const message: JsonRpcMessage = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        }

        console.log(`[ATX-DEBUG] sendRequest: method=${method}, id=${id}`)
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject })
            this.send(message)
            console.log(`[ATX-DEBUG] Request ${id} sent, waiting for response...`)
        })
    }

    sendNotification(method: string, params: any): void {
        console.log(`[ATX-DEBUG] sendNotification: method=${method}`)
        const message: JsonRpcMessage = {
            jsonrpc: '2.0',
            method,
            params,
        }
        this.send(message)
    }

    async initialize(): Promise<any> {
        console.log(`[ATX-DEBUG] ========== CALLING INITIALIZE ==========`)
        return this.sendRequest('initialize', {
            processId: process.pid,
            capabilities: {},
            rootUri: null,
            initializationOptions: { aws: { awsConfigSectionName: 'aws' } },
        })
    }

    close(): void {
        console.log(`[ATX-DEBUG] ========== CLOSING LSP CLIENT ==========`)
        this.process.kill()
    }
}
