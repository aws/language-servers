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
            this.logging.log(`WebSocket connection closed ${event.code}, ${event.reason}, ${event.wasClean}`)
            if (!event.wasClean) {
                this.handleDisconnect()
            }
        }

        this.ws.on('error', error => {
            this.logging.error(`WebSocket error: ${error}`)
        })

        this.ws.on('unexpected-response', (req, res) => {
            this.logging.log(
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
            this.logging.log(`Reconnecting attempt ${this.reconnectAttempts} in ${delay}ms...`)

            setTimeout(() => {
                this.connect()
            }, delay)
        } else {
            this.logging.error('Max reconnection attempts reached')
        }
    }

    private flushMessageQueue(): void {
        this.logging.log(`Flushing message queue of length ${this.messageQueue.length}, ${this.url}`)
        while (this.messageQueue.length > 0) {
            this.logging.log(`Flushing ${this.messageQueue.length} queued events through websocket`)
            const message = this.messageQueue.shift()
            if (message) {
                this.send(message)
            }
        }
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

    // https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#sending_data_to_the_server
    public send(message: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            // TODO, remove this log
            this.logging.log(`Sending message: ${message}`)
            this.ws.send(message)
        } else {
            this.messageQueue.push(message)
            this.logging.warn('Message queued until connection is ready')
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
            // Remove all event listeners
            this.ws.removeAllListeners()
            // Close the connection
            this.ws.close()
            this.ws = null
        }

        this.logging.log('WebSocket client destroyed')
    }
}
