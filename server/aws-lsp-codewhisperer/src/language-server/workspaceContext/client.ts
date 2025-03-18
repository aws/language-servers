import { WebSocket } from 'ws'
import { Logging } from '@aws/language-server-runtimes/server-interface'

export class WebSocketClient {
    private ws: WebSocket | null = null
    private logging: Logging
    private readonly url: string
    private reconnectAttempts: number = 0
    private readonly maxReconnectAttempts: number = 5
    private messageQueue: string[] = []

    constructor(url: string, logging: Logging) {
        this.url = url
        this.logging = logging
        this.connect()
    }

    private connect(): void {
        try {
            // TODO, this is temporary code to pass websocket messages through proxy until MDE SSO is ready
            const customLookup = (hostname: string, options: any, callback: any) => {
                // Always return 127.0.0.1 regardless of the hostname
                callback(null, '127.0.0.1', 4) // 4 for IPv4
            }

            this.ws = new WebSocket(this.url, {
                lookup: customLookup,
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

    // https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#sending_data_to_the_server
    public send(message: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
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
