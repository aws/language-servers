/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid'
import * as http from 'http'
import { URL } from 'url'
import * as WebSocket from 'ws'
import * as crypto from 'crypto'
import { bool } from 'aws-sdk/clients/signer'

/**
 * API request/response log data
 */
export interface ApiLogData {
    request: any
    response: any
    error?: string | null
    endpoint: string
    statusCode?: number
    latency?: number
    metadata?: Record<string, any>
}

/**
 * Completion log data
 */
export interface CompletionLogData {
    textDocument: {
        uri: string
        languageId?: string
    }
    position: {
        line: number
        character: number
    }
    context?: {
        triggerKind: number
        requestUuid?: string
        selectedCompletionInfo?: {
            range?: {
                start: {
                    line: number
                    character: number
                }
                end: {
                    line: number
                    character: number
                }
            }
        }
    }
    documentContent?: {
        leftContent: string
        rightContent: string
        currentLine: string
        lineCount: number
    }
    suggestionCount?: number
    suggestionType?: string
    responseContext?: any
}

export interface EditAutoTriggerData {
    // Required conditions
    hasRecentEdit: boolean
    isNotInMiddleOfWord: boolean
    isPreviousDecisionNotReject: boolean
    hasNonEmptySuffix: boolean
    requiredConditionsMet: boolean

    // Optional conditions
    isAfterKeyword: boolean
    isAfterOperatorOrDelimiter: boolean
    hasUserPaused: boolean
    isAtLineBeginning: boolean
    optionalConditionsMet: boolean

    // Code context
    cursor: string
    currentLine: string

    // Result
    shouldTrigger: boolean

    // File context
    filename?: string
    language?: string
    position?: {
        line: number
        character: number
    }
}

export interface AutoTriggerdata {
    completionsAutoTrigger: boolean
    editAutoTrigger: boolean
}

/**
 * Discriminated union for log data types
 */
export type LogData =
    | { type: 'api'; data: ApiLogData }
    | { type: 'completion'; data: CompletionLogData }
    | { type: 'edit'; data: EditAutoTriggerData }
    | { type: 'autoTrigger'; data: AutoTriggerdata }

/**
 * Unified log entry interface
 */
export interface LogEntry {
    id: string
    requestId: string
    timestamp: string
    logData: LogData
}

/**
 * WebSocket message types
 */
export type WebSocketMessage = {
    type: 'log' | 'clear' | 'getAll' | 'subscribe' | 'unsubscribe'
    data?: any
}

/**
 * Simple circular buffer implementation
 */
class CircularBuffer<T> {
    private buffer: Array<T | null>
    private head = 0
    private tail = 0
    private size = 0
    private readonly capacity: number

    constructor(capacity: number) {
        this.buffer = new Array(capacity).fill(null)
        this.capacity = capacity
    }

    push(item: T): void {
        this.buffer[this.head] = item
        this.head = (this.head + 1) % this.capacity
        if (this.size < this.capacity) {
            this.size++
        } else {
            this.tail = (this.tail + 1) % this.capacity
        }
    }

    getAll(): T[] {
        const result: T[] = []
        if (this.size === 0) return result

        let current = this.tail
        for (let i = 0; i < this.size; i++) {
            const item = this.buffer[current]
            if (item !== null) {
                result.push(item)
            }
            current = (current + 1) % this.capacity
        }
        return result
    }

    clear(): void {
        this.buffer.fill(null)
        this.head = 0
        this.tail = 0
        this.size = 0
    }
}

/**
 * ANSI color codes for terminal output
 */
export const ConsoleColors = {
    // Basic colors
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',

    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    // Background colors
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m',

    // AWS specific colors
    awsOrange: '\x1b[38;5;208m',
}

/**
 * Color scheme for different log types
 */
const logColors = {
    api: {
        prefix: ConsoleColors.awsOrange + ConsoleColors.bright,
        key: ConsoleColors.awsOrange,
        value: ConsoleColors.white,
        error: ConsoleColors.red,
        success: ConsoleColors.green,
    },
    completion: {
        prefix: ConsoleColors.blue + ConsoleColors.bright,
        key: ConsoleColors.blue,
        value: ConsoleColors.white,
        highlight: ConsoleColors.cyan,
    },
    edit: {
        prefix: ConsoleColors.green + ConsoleColors.bright,
        key: ConsoleColors.green,
        value: ConsoleColors.white,
        condition: ConsoleColors.yellow,
    },
    autoTrigger: {
        prefix: ConsoleColors.magenta + ConsoleColors.bright,
        key: ConsoleColors.magenta,
        value: ConsoleColors.white,
        highlight: ConsoleColors.yellow,
    },
}

/**
 * Format specific fields for each log type
 */
function formatApiLog(data: ApiLogData): string {
    const { endpoint, statusCode, latency, error } = data
    const colors = logColors.api
    const status = statusCode
        ? statusCode >= 200 && statusCode < 300
            ? colors.success + statusCode + ConsoleColors.reset
            : colors.error + statusCode + ConsoleColors.reset
        : colors.error + 'No status' + ConsoleColors.reset

    let output = [
        colors.key + 'Endpoint:' + ConsoleColors.reset + ' ' + colors.value + endpoint + ConsoleColors.reset,
        colors.key + 'Status:' + ConsoleColors.reset + ' ' + status,
    ]

    if (latency !== undefined) {
        output.push(
            colors.key + 'Latency:' + ConsoleColors.reset + ' ' + colors.value + `${latency}ms` + ConsoleColors.reset
        )
    }

    if (error) {
        output.push(colors.error + 'Error:' + ConsoleColors.reset + ' ' + colors.error + error + ConsoleColors.reset)
    }

    return output.join(' | ')
}

function formatCompletionLog(data: CompletionLogData): string {
    const { textDocument, position, suggestionCount, suggestionType } = data
    const colors = logColors.completion

    let output = [
        colors.key +
            'File:' +
            ConsoleColors.reset +
            ' ' +
            colors.value +
            (textDocument.uri.split('/').pop() || '') +
            ConsoleColors.reset,
        colors.key +
            'Pos:' +
            ConsoleColors.reset +
            ' ' +
            colors.value +
            `${position.line}:${position.character}` +
            ConsoleColors.reset,
    ]

    if (suggestionCount !== undefined) {
        output.push(
            colors.key +
                'Suggestions:' +
                ConsoleColors.reset +
                ' ' +
                colors.value +
                suggestionCount.toString() +
                ConsoleColors.reset
        )
    }

    if (suggestionType) {
        output.push(
            colors.key + 'Type:' + ConsoleColors.reset + ' ' + colors.highlight + suggestionType + ConsoleColors.reset
        )
    }

    if (data.documentContent?.currentLine) {
        const truncatedLine =
            data.documentContent.currentLine.length > 40
                ? data.documentContent.currentLine.substring(0, 37) + '...'
                : data.documentContent.currentLine
        output.push(
            colors.key + 'Line:' + ConsoleColors.reset + ' ' + colors.value + truncatedLine + ConsoleColors.reset
        )
    }

    return output.join(' | ')
}

function formatEditLog(data: EditAutoTriggerData): string {
    const { shouldTrigger, filename, language } = data
    const colors = logColors.edit

    let output = [
        colors.key +
            'Trigger:' +
            ConsoleColors.reset +
            ' ' +
            colors.condition +
            (shouldTrigger ? 'Yes' : 'No') +
            ConsoleColors.reset,
    ]

    if (filename) {
        output.push(
            colors.key +
                'File:' +
                ConsoleColors.reset +
                ' ' +
                colors.value +
                (filename.split('/').pop() || '') +
                ConsoleColors.reset
        )
    }

    if (language) {
        output.push(colors.key + 'Lang:' + ConsoleColors.reset + ' ' + colors.value + language + ConsoleColors.reset)
    }

    // Add key conditions that led to the decision
    const conditions = []
    if (data.hasRecentEdit) conditions.push('Recent Edit')
    if (data.isNotInMiddleOfWord) conditions.push('Not In Word')
    if (data.isPreviousDecisionNotReject) conditions.push('Not Rejected')
    if (data.hasNonEmptySuffix) conditions.push('Has Suffix')

    if (conditions.length > 0) {
        output.push(
            colors.key +
                'Conditions:' +
                ConsoleColors.reset +
                ' ' +
                colors.condition +
                conditions.join(', ') +
                ConsoleColors.reset
        )
    }

    return output.join(' | ')
}

function formatAutoTriggerLog(data: AutoTriggerdata): string {
    const { completionsAutoTrigger, editAutoTrigger } = data
    const colors = logColors.autoTrigger

    let output = [
        colors.key +
            'Completions:' +
            ConsoleColors.reset +
            ' ' +
            colors.highlight +
            (completionsAutoTrigger ? 'Enabled' : 'Disabled') +
            ConsoleColors.reset,
        colors.key +
            'Edit:' +
            ConsoleColors.reset +
            ' ' +
            colors.highlight +
            (editAutoTrigger ? 'Enabled' : 'Disabled') +
            ConsoleColors.reset,
    ]

    return output.join(' | ')
}

/**
 * Simple logger singleton class with strong typing
 */
export class Logger {
    private static instance: Logger
    private logs: CircularBuffer<LogEntry>
    private logMap: Map<string, LogEntry[]>
    private subscribers: Set<(entry: LogEntry) => void> = new Set()
    private useColors: boolean = true

    private constructor(capacity = 10000) {
        this.logs = new CircularBuffer<LogEntry>(capacity)
        this.logMap = new Map<string, LogEntry[]>()

        // Check if colors should be disabled (e.g., in CI environments)
        if (process.env.NO_COLOR === 'true' || process.env.FORCE_COLOR === '0') {
            this.useColors = false
        }
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger()
        }
        return Logger.instance
    }

    public getRequestHash(uri: string, content: string, posX: number, posY: number): string {
        return crypto.createHash('sha256').update(`${uri}:${content}:${posX}:${posY}`).digest('hex')
    }

    /**
     * Subscribe to log events
     */
    public subscribe(callback: (entry: LogEntry) => void): () => void {
        this.subscribers.add(callback)
        return () => {
            this.subscribers.delete(callback)
        }
    }

    /**
     * Notify subscribers of new log entry
     */
    private notifySubscribers(entry: LogEntry): void {
        this.subscribers.forEach(callback => {
            try {
                callback(entry)
            } catch (error) {
                console.error('Error in log subscriber:', error)
            }
        })
    }

    /**
     * Core logging method with type safety
     */
    private createLogEntry<T extends LogData['type']>(
        type: T,
        data: Extract<LogData, { type: T }>['data'],
        requestId?: string
    ): LogEntry {
        const id = requestId || 'unknown'

        const entry: LogEntry = {
            id,
            requestId: id,
            timestamp: new Date().toISOString(),
            logData: { type, data } as LogData,
        }

        // Store in circular buffer
        this.logs.push(entry)

        // Store in map for quick lookup
        if (!this.logMap.has(id)) {
            this.logMap.set(id, [])
        }
        this.logMap.get(id)?.push(entry)

        // Log to console for visibility
        console.log(`[${type.toUpperCase()}][${id}]`, data)

        // Notify subscribers
        this.notifySubscribers(entry)

        return entry
    }

    /**
     * Log API request/response with type safety
     */
    public logApi(data: ApiLogData, requestId?: string): string {
        const entry = this.createLogEntry('api', data, requestId)
        return entry.id
    }

    /**
     * Log completion data with type safety
     */
    public logCompletion(data: CompletionLogData, requestId?: string): string {
        const entry = this.createLogEntry('completion', data, requestId)
        return entry.id
    }

    /**
     * Log edit prediction data with type safety
     */
    public logEdit(data: EditAutoTriggerData, requestId?: string): string {
        const entry = this.createLogEntry('edit', data, requestId)
        return entry.id
    }

    /**
     * Log auto trigger data with type safety
     */
    public logAutoTrigger(data: AutoTriggerdata, requestId?: string): string {
        const entry = this.createLogEntry('autoTrigger', data, requestId)
        return entry.id
    }

    /**
     * Get all logs
     */
    public getAllLogs(): LogEntry[] {
        return this.logs.getAll()
    }

    /**
     * Get logs by request ID
     */
    public getLogsByRequestId(requestId: string): LogEntry[] {
        return this.logMap.get(requestId) || []
    }

    /**
     * Get logs by type with type safety
     */
    public getLogsByType<T extends LogData['type']>(
        type: T
    ): Array<LogEntry & { logData: Extract<LogData, { type: T }> }> {
        return this.logs.getAll().filter(log => log.logData.type === type) as Array<
            LogEntry & { logData: Extract<LogData, { type: T }> }
        >
    }

    /**
     * Get API logs with proper typing
     */
    public getApiLogs(): Array<LogEntry & { logData: { type: 'api'; data: ApiLogData } }> {
        return this.getLogsByType('api')
    }

    /**
     * Get completion logs with proper typing
     */
    public getCompletionLogs(): Array<LogEntry & { logData: { type: 'completion'; data: CompletionLogData } }> {
        return this.getLogsByType('completion')
    }

    /**
     * Get edit logs with proper typing
     */
    public getEditLogs(): Array<LogEntry & { logData: { type: 'edit'; data: EditAutoTriggerData } }> {
        return this.getLogsByType('edit')
    }

    /**
     * Get auto trigger logs with proper typing
     */
    public getAutoTriggerLogs(): Array<LogEntry & { logData: { type: 'autoTrigger'; data: AutoTriggerdata } }> {
        return this.getLogsByType('autoTrigger')
    }

    /**
     * Clear all logs
     */
    public clearLogs(): void {
        this.logs.clear()
        this.logMap.clear()
    }
}

// Export a singleton instance for easy access
export const logger = Logger.getInstance()

// For backward compatibility
export const DebugLogger = Logger

/**
 * Combined HTTP and WebSocket Server for exposing logs via API and real-time updates
 */
export class LoggerServer {
    private static instance: LoggerServer
    private httpServer: http.Server | null = null
    private wsServer: WebSocket.Server | null = null
    private port: number = 3000
    private clients: Set<WebSocket> = new Set()
    private unsubscribe: (() => void) | null = null

    private constructor() {}

    /**
     * Get the singleton instance
     */
    public static getInstance(): LoggerServer {
        if (!LoggerServer.instance) {
            LoggerServer.instance = new LoggerServer()
        }
        return LoggerServer.instance
    }

    /**
     * Broadcast a message to all connected WebSocket clients
     */
    private broadcast(message: WebSocketMessage): void {
        const messageStr = JSON.stringify(message)
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr)
            }
        })
    }

    /**
     * Handle new log entries and broadcast to clients
     */
    private handleNewLogEntry(entry: LogEntry): void {
        this.broadcast({
            type: 'log',
            data: entry,
        })
    }

    /**
     * Start the server
     * @param port The port to listen on (default: 3000)
     */
    public start(port: number = 3000): void {
        if (this.httpServer) {
            console.log('Logger server is already running')
            return
        }

        this.port = port

        // Create HTTP server
        this.httpServer = http.createServer((req, res) => {
            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

            // Handle OPTIONS request for CORS preflight
            if (req.method === 'OPTIONS') {
                res.writeHead(200)
                res.end()
                return
            }

            // Only handle GET requests
            if (req.method !== 'GET') {
                res.writeHead(405, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Method not allowed' }))
                return
            }

            try {
                const url = new URL(req.url || '', `http://localhost:${this.port}`)
                const pathname = url.pathname

                // Serve a simple HTML client for WebSocket testing
                if (pathname === '/' || pathname === '/index.html') {
                    res.writeHead(200, { 'Content-Type': 'text/html' })

                    // Read the HTML UI from /tmp/index.html if available, otherwise use a basic fallback
                    try {
                        const fs = require('fs')

                        // Try to read from /tmp/index.html
                        if (fs.existsSync('/tmp/index.html')) {
                            const htmlContent = fs.readFileSync('/tmp/index.html', 'utf8')
                            res.end(htmlContent)
                            return
                        }
                    } catch (error) {
                        console.error('Error reading HTML UI file:', error)
                    }

                    // Fallback to basic HTML if file reading fails
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>AWS CodeWhisperer Logger</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                h1 { color: #232F3E; }
                                .status { margin: 20px 0; }
                                .connected { color: green; }
                                .disconnected { color: red; }
                                button { padding: 8px 16px; margin-right: 10px; cursor: pointer; }
                            </style>
                        </head>
                        <body>
                            <h1>AWS CodeWhisperer Logger</h1>
                            <div class="status">Status: <span id="statusText" class="disconnected">Disconnected</span></div>
                            <div>
                                <button id="clearBtn">Clear Logs</button>
                                <button id="reconnectBtn">Reconnect</button>
                            </div>
                            <div id="logs" style="margin-top: 20px;"></div>
                            
                            <script>
                                const statusText = document.getElementById('statusText');
                                const logsDiv = document.getElementById('logs');
                                const clearBtn = document.getElementById('clearBtn');
                                const reconnectBtn = document.getElementById('reconnectBtn');
                                let ws;
                                
                                function connect() {
                                    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                                    ws = new WebSocket(\`\${protocol}//\${window.location.host}/ws\`);
                                    
                                    ws.onopen = () => {
                                        statusText.textContent = 'Connected';
                                        statusText.className = 'connected';
                                        ws.send(JSON.stringify({ type: 'getAll' }));
                                    };
                                    
                                    ws.onclose = () => {
                                        statusText.textContent = 'Disconnected';
                                        statusText.className = 'disconnected';
                                        setTimeout(connect, 5000);
                                    };
                                    
                                    ws.onmessage = (event) => {
                                        const message = JSON.parse(event.data);
                                        if (message.type === 'clear') {
                                            logsDiv.innerHTML = '';
                                        } else if (message.type === 'getAll' || message.type === 'log') {
                                            const logs = message.type === 'getAll' ? message.data : [message.data];
                                            logs.forEach(log => {
                                                const logEntry = document.createElement('div');
                                                logEntry.style.margin = '10px 0';
                                                logEntry.style.padding = '10px';
                                                logEntry.style.border = '1px solid #ddd';
                                                logEntry.textContent = JSON.stringify(log, null, 2);
                                                logsDiv.prepend(logEntry);
                                            });
                                        }
                                    };
                                }
                                
                                clearBtn.addEventListener('click', () => {
                                    if (ws && ws.readyState === WebSocket.OPEN) {
                                        ws.send(JSON.stringify({ type: 'clear' }));
                                    }
                                });
                                
                                reconnectBtn.addEventListener('click', () => {
                                    if (ws) ws.close();
                                    connect();
                                });
                                
                                connect();
                            </script>
                        </body>
                        </html>
                    `)
                    return
                }

                // API: List all logs
                if (pathname === '/api/logs/list') {
                    const logs = logger.getAllLogs()
                    const summary = logs.map(log => ({
                        id: log.id,
                        requestId: log.requestId,
                        timestamp: log.timestamp,
                        type: log.logData.type,
                    }))

                    res.writeHead(200, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify(summary))
                    return
                }

                // API: Get log by ID
                if (pathname === '/api/logs/get') {
                    const id = url.searchParams.get('id')

                    if (!id) {
                        res.writeHead(400, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ error: 'Missing required parameter: id' }))
                        return
                    }

                    const logs = logger.getLogsByRequestId(id)

                    if (logs.length === 0) {
                        res.writeHead(404, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ error: 'Log not found' }))
                        return
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify(logs))
                    return
                }

                // Not found
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Not found' }))
            } catch (error) {
                console.error('Error handling request:', error)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Internal server error' }))
            }
        })

        // Create WebSocket server
        this.wsServer = new WebSocket.Server({ server: this.httpServer })

        // Handle WebSocket connections
        this.wsServer.on('connection', ws => {
            console.log('New WebSocket client connected')
            this.clients.add(ws)

            // Handle messages from client
            ws.on('message', message => {
                try {
                    const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage

                    switch (parsedMessage.type) {
                        case 'getAll':
                            // Send all logs to the client
                            ws.send(
                                JSON.stringify({
                                    type: 'getAll',
                                    data: logger.getAllLogs(),
                                })
                            )
                            break

                        case 'clear':
                            // Clear all logs
                            logger.clearLogs()
                            this.broadcast({ type: 'clear' })
                            break

                        case 'subscribe':
                            // Already subscribed by default
                            break

                        case 'unsubscribe':
                            // Not implemented - clients are always subscribed
                            break
                    }
                } catch (error) {
                    console.error('Error handling WebSocket message:', error)
                }
            })

            // Handle client disconnection
            ws.on('close', () => {
                console.log('WebSocket client disconnected')
                this.clients.delete(ws)
            })

            // Handle errors
            ws.on('error', error => {
                console.error('WebSocket error:', error)
                this.clients.delete(ws)
            })
        })

        // Subscribe to logger events
        this.unsubscribe = logger.subscribe(this.handleNewLogEntry.bind(this))

        // Start the server
        this.httpServer.listen(this.port, () => {
            console.log(`Logger server started on port ${this.port}`)
            console.log(`WebSocket endpoint: ws://localhost:${this.port}/ws`)
            console.log(`Web UI: http://localhost:${this.port}/`)
            console.log(`Available HTTP endpoints:`)
            console.log(`- GET http://localhost:${this.port}/api/logs/list - List all logs`)
            console.log(`- GET http://localhost:${this.port}/api/logs/get?id=<requestId> - Get log by ID`)
        })
    }

    /**
     * Stop the server
     */
    public stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.httpServer) {
                console.log('Logger server is not running')
                resolve()
                return
            }

            // Unsubscribe from logger events
            if (this.unsubscribe) {
                this.unsubscribe()
                this.unsubscribe = null
            }

            // Close all WebSocket connections
            if (this.wsServer) {
                this.clients.forEach(client => {
                    client.terminate()
                })
                this.clients.clear()
                this.wsServer.close()
                this.wsServer = null
            }

            // Close HTTP server
            this.httpServer.close(err => {
                if (err) {
                    console.error('Error stopping logger server:', err)
                    reject(err)
                    return
                }

                console.log('Logger server stopped')
                this.httpServer = null
                resolve()
            })
        })
    }
}

// Export a singleton instance for easy access
export const loggerServer = LoggerServer.getInstance()

// For backward compatibility
export const LoggerHttpServer = LoggerServer
