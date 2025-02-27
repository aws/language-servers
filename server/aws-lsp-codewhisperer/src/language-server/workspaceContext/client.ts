import { WebSocket } from 'ws'

export class WebSocketClient {
    private ws: WebSocket | null = null
    private readonly url: string
    private reconnectAttempts: number = 0
    private readonly maxReconnectAttempts: number = 5
    private messageQueue: string[] = []

    constructor(url: string) {
        this.url = url
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
            console.error('WebSocket connection error:', error)
            this.handleDisconnect()
        }
    }

    private attachEventListeners(): void {
        if (!this.ws) return

        this.ws.on('open', () => {
            console.log('Connected to server')
            this.reconnectAttempts = 0
            this.flushMessageQueue()
        })

        this.ws.on('message', (data: string) => {
            data = data.toString()
            console.log('Received message:', data)
        })

        this.ws.onclose = event => {
            console.log(`WebSocket connection closed ${JSON.stringify(event)}`)
            // TODO, should we uncomment the next line
            // this.handleDisconnect()
        }

        this.ws.on('error', error => {
            console.error('WebSocket error:', error)
        })

        this.ws.on('unexpected-response', (req, res) => {
            console.log('Unexpected response:', {
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
                headers: res.headers,
            })
        })
    }

    private handleDisconnect(): void {
        if (this.ws) {
            this.ws.terminate()
            this.ws = null
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
            console.log(`Reconnecting attempt ${this.reconnectAttempts} in ${delay}ms...`)

            setTimeout(() => {
                this.connect()
            }, delay)
        } else {
            console.error('Max reconnection attempts reached')
        }
    }

    private flushMessageQueue(): void {
        while (this.messageQueue.length > 0) {
            console.log(`Flushing ${this.messageQueue.length} queued events through websocket`)
            const message = this.messageQueue.shift()
            if (message) {
                this.send(message)
            }
        }
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#sending_data_to_the_server
    public send(message: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('Sending message:', message)
            this.ws.send(message)
        } else {
            this.messageQueue.push(message)
            console.error('Message queued until connection is ready')
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.terminate()
            this.ws = null
        }
    }
}
