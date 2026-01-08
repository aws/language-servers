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
        const lines = this.buffer.split('\n')

        for (const line of lines) {
            if (line.startsWith('Content-Length:') || line.trim() === '') {
                continue
            }

            try {
                const message: JsonRpcMessage = JSON.parse(line)
                console.log(`[ATX-DEBUG] Parsed message: ${JSON.stringify(message).substring(0, 500)}`)

                // Handle server requests (like workspace/configuration)
                if (message.method === 'workspace/configuration' && message.id !== undefined) {
                    console.log(`[ATX-DEBUG] Responding to workspace/configuration request`)
                    this.sendResponse(message.id, [{}])
                    continue
                }

                // Handle responses to our requests
                if (message.id !== undefined && this.pendingRequests.has(message.id)) {
                    console.log(`[ATX-DEBUG] Received response for request ${message.id}`)
                    const { resolve, reject } = this.pendingRequests.get(message.id)!
                    this.pendingRequests.delete(message.id)
                    if (message.error) {
                        console.log(`[ATX-DEBUG] Response is ERROR: ${message.error.message}`)
                        reject(new Error(message.error.message))
                    } else {
                        console.log(`[ATX-DEBUG] Response is SUCCESS`)
                        resolve(message.result)
                    }
                }
            } catch (e) {
                // Not valid JSON, continue
            }
        }

        // Keep only the last incomplete line
        const lastNewline = this.buffer.lastIndexOf('\n')
        if (lastNewline !== -1) {
            this.buffer = this.buffer.substring(lastNewline + 1)
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
