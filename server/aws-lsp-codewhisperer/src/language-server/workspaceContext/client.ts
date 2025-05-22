import { WebSocket } from 'ws'
import { BearerCredentials, CredentialsProvider, Logging } from '@aws/language-server-runtimes/server-interface'

export type WebSocketReadyState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'

export class WebSocketClient {
    private ws: WebSocket | null = null
    private logging: Logging
    private credentialsProvider: CredentialsProvider
    private readonly url: string
    private reconnectAttempts: number = 0
    private readonly maxReconnectAttempts: number = 5
    private messageQueue: string[] = []

    constructor(url: string, logging: Logging, credentialsProvider: CredentialsProvider) {
        this.url = url
        this.logging = logging
        this.credentialsProvider = credentialsProvider
        this.connect()
    }

    private connect(): void {
        try {
            const creds = this.credentialsProvider.getCredentials('bearer') as BearerCredentials
            if (!creds?.token) {
                throw new Error('Authorization failed, bearer token is not set')
            }

            this.ws = new WebSocket(this.url, {
                headers: { Authorization: `Bearer ${creds.token}` },
            })

            this.attachEventListeners()
        } catch (error) {
            this.logging.error(`WebSocket connection error: ${error}`)
            this.handleDisconnect()
        }
    }

    private attachEventListeners(): void {
        if (!this.ws) return

        this.ws.on('open', () => {
            this.logging.log(`Connected to server ${this.url}`)
            this.reconnectAttempts = 0
            this.flushMessageQueue()
        })

        this.ws.on('message', (data: string) => {
            data = data.toString()
            this.logging.log(`Received message: ${data}`)
        })

        this.ws.onclose = event => {
            this.logging.log(`WebSocket connection closed with code: ${event.code} reason: ${event.reason}`)
            if (!event.wasClean) {
                this.handleDisconnect()
            }
        }

        this.ws.on('error', error => {
            this.logging.error(`WebSocket error: ${error}`)
        })

        this.ws.on('unexpected-response', (_req, res) => {
            this.logging.warn(
                `Unexpected response: ${JSON.stringify({
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    headers: res.headers,
                })}`
            )
        })
    }

    private handleDisconnect(): void {
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }

        // Apply exponential backoff for both unclean closures and failed reconnection attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
            this.logging.log(
                `WebSocket will attempt reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}s`
            )

            setTimeout(() => {
                this.connect()
            }, delay)
        } else {
            this.logging.warn('Maximum WebSocket reconnection attempts reached')
        }
    }

    private flushMessageQueue(): void {
        if (this.messageQueue.length <= 0) {
            return
        }
        this.logging.log(`Flushing ${this.messageQueue.length} queued events through WebSocket`)
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift()
            if (message) {
                try {
                    this.send(message)
                } catch (error) {
                    this.logging.error(`Error sending message: ${error}`)
                }
            }
        }
    }

    private queueMessage(message: string) {
        // Make sure that didChangeWorkspaceFolders messages go to the front of the queue
        if (message.includes(`workspace/didChangeWorkspaceFolders`)) {
            this.messageQueue.unshift(message)
        } else {
            this.messageQueue.push(message)
        }

        this.logging.log(`WebSocket message queued until connection is ready, queue size: ${this.messageQueue.length}`)
    }

    public isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN
    }

    public getWebsocketReadyState(): WebSocketReadyState {
        if (!this.ws) return 'CLOSED'

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'CONNECTING'
            case WebSocket.OPEN:
                return 'OPEN'
            case WebSocket.CLOSING:
                return 'CLOSING'
            case WebSocket.CLOSED:
                return 'CLOSED'
            default:
                return 'CLOSED'
        }
    }

    public send(message: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(message)
            this.logging.debug('Message sent successfully to the remote workspace')
        } else {
            this.queueMessage(message)
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
    }

    public destroyClient(): void {
        // Clear the message queue
        this.messageQueue = []

        // Prevent any further reconnection attempts
        this.reconnectAttempts = this.maxReconnectAttempts

        if (this.ws) {
            this.ws.close()
            // Allow the close event to be processed before removing listeners
            setTimeout(() => {
                if (this.ws) {
                    this.ws.removeAllListeners()
                }
            }, 1000)
            // Terminate the connection
            this.ws.terminate()
            this.ws = null
        }

        this.logging.log('WebSocket client destroyed')
    }
}
