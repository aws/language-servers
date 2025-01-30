import { WebSocket } from 'ws'

export class WebSocketClient {
    private ws: WebSocket | null = null
    private readonly url: string
    private readonly pingInterval: number = 3000
    private readonly pongTimeout: number = 10000
    private pingTimeoutId: NodeJS.Timeout | null = null
    private pongTimeoutId: NodeJS.Timeout | null = null
    private reconnectAttempts: number = 0
    private readonly maxReconnectAttempts: number = 5
    private messageQueue: string[] = []

    constructor(url: string) {
        this.url = url
        this.connect()
    }

    private connect(): void {
        try {
            this.ws = new WebSocket(this.url)
            this.attachEventListeners()
        } catch (error) {
            console.error('WebSocket connection error:', error)
            this.handleDisconnect()
        }
    }
    /*
    private cleanup(): void {
        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }
            this.ws = null;
        }

        this.stopHeartbeat();
    }
     */

    private attachEventListeners(): void {
        if (!this.ws) return

        this.ws.on('open', () => {
            console.log('Connected to server')
            this.reconnectAttempts = 0
            this.startHeartbeat()
            this.flushMessageQueue()
        })

        this.ws.on('message', (data: string) => {
            data = data.toString()
            // if (data === 'pong') {
            //     this.handlePong();
            // } else {
            console.log('Received message:', data)
            //}
        })

        this.ws.on('pong', () => this.handlePong())

        this.ws.onclose = event => {
            console.log('WebSocket connection closed')
            this.handleDisconnect()
        }
        // this.ws.on('close', () => {
        //     console.log('WebSocket connection closed');
        //     this.handleDisconnect();
        // });

        this.ws.on('error', error => {
            console.error('WebSocket error:', error)
            // this.handleDisconnect();
        })
    }

    private startHeartbeat(): void {
        this.stopHeartbeat()

        this.pingTimeoutId = setInterval(() => {
            this.sendPing()
        }, this.pingInterval)
    }

    private stopHeartbeat(): void {
        if (this.pingTimeoutId) {
            clearInterval(this.pingTimeoutId)
            this.pingTimeoutId = null
        }
        if (this.pongTimeoutId) {
            clearTimeout(this.pongTimeoutId)
            this.pongTimeoutId = null
        }
    }

    private sendPing(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            // this.ws.send('ping');
            this.ws.ping()

            this.pongTimeoutId = setTimeout(() => {
                console.log('Pong not received - connection dead')
                this.handleDisconnect()
            }, this.pongTimeout)
        }
    }

    private handlePong(): void {
        if (this.pongTimeoutId) {
            clearTimeout(this.pongTimeoutId)
            this.pongTimeoutId = null
        }
    }

    private handleDisconnect(): void {
        this.stopHeartbeat()

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
            const message = this.messageQueue.shift()
            if (message) {
                this.send(message)
            }
        }
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#sending_data_to_the_server
    public send(message: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(message)
        } else {
            this.messageQueue.push(message)
            console.error('Message queued until connection is ready')
        }
    }

    public disconnect(): void {
        this.stopHeartbeat()
        if (this.ws) {
            this.ws.terminate()
            this.ws = null
        }
    }
}
