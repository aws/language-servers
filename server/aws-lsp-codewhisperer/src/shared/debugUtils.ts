/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { AWSError } from 'aws-sdk'
import { Request, Response } from 'aws-sdk/lib/core'
import { RequestExtras } from '../client/token/codewhisperer'
import { ApolloServer } from 'apollo-server'
import { gql } from 'apollo-server-core'
import { v4 as uuidv4 } from 'uuid'
import { Position, InlineCompletionWithReferencesParams } from '@aws/language-server-runtimes/server-interface'

/**
 * Interface for EditPredictionAutoTrigger evaluation data
 */
export interface EditPredictionAutoTriggerData {
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
}

/**
 * Interface for InlineCompletionsHandler request data
 */
export interface InlineCompletionsHandlerData {
    // Document information
    textDocument: {
        uri: string
        languageId?: string
    }

    // Cursor position
    position: Position

    // Request context
    context?: {
        triggerKind: number
        requestUuid?: string
        selectedCompletionInfo?: {
            range?: {
                start: Position
                end: Position
            }
        }
    }

    // Content information (optional)
    documentContent?: {
        leftContent: string
        rightContent: string
        currentLine: string
        lineCount: number
    }
}

/**
 * Parse raw InlineCompletionWithReferencesParams into a structured InlineCompletionsHandlerData object
 *
 * @param params The raw params from the LSP request
 * @param documentContent Optional document content information
 * @returns Structured data object for logging
 */
export function parseInlineCompletionParams(
    params: InlineCompletionWithReferencesParams,
    documentContent?: {
        leftContent: string
        rightContent: string
        currentLine: string
        lineCount: number
    }
): InlineCompletionsHandlerData {
    return {
        textDocument: {
            uri: params.textDocument.uri,
        },
        position: params.position,
        context: params.context,
        documentContent,
    }
}

/**
 * Interface for request/response log entry
 */
export interface RequestLogEntry {
    flareRequestId: string
    timestamp: string
    request: any
    response: string
    endpoint: string
    error: string
    requestId: string
    responseCode: number
    latency: number
    metadata?: Record<string, any>
}

/**
 * Interface for debug log entry
 */
export interface DebugLogEntry {
    flareRequestId: string
    timestamp: string
    message: string
    data?: Record<string, any> | string
    level: 'debug' | 'info' | 'warn' | 'error'
    source: string
}

/**
 * Circular buffer implementation for storing log entries
 */
class CircularBuffer<T> {
    private buffer: Array<T | null>
    private head: number = 0
    private tail: number = 0
    private size: number = 0
    private capacity: number

    constructor(capacity: number) {
        this.buffer = new Array(capacity).fill(null)
        this.capacity = capacity
    }

    /**
     * Add an item to the buffer
     */
    push(item: T): void {
        this.buffer[this.head] = item
        this.head = (this.head + 1) % this.capacity
        if (this.size < this.capacity) {
            this.size++
        } else {
            this.tail = (this.tail + 1) % this.capacity
        }
    }

    /**
     * Get all items in the buffer
     */
    getAll(): T[] {
        const result: T[] = []
        if (this.size === 0) {
            return result
        }

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

    /**
     * Clear the buffer
     */
    clear(): void {
        this.buffer.fill(null)
        this.head = 0
        this.tail = 0
        this.size = 0
    }
}

/**
 * Debug logger singleton class
 */
export class DebugLogger {
    private static instance: DebugLogger
    private requestLogs: CircularBuffer<RequestLogEntry>
    private debugLogs: CircularBuffer<DebugLogEntry>
    private server: ApolloServer | null = null
    private port: number = 4000
    private isServerRunning: boolean = false
    private requestMap: Map<string, RequestLogEntry> = new Map()
    private debugLogMap: Map<string, DebugLogEntry[]> = new Map()

    private constructor() {
        // Initialize circular buffers
        this.requestLogs = new CircularBuffer<RequestLogEntry>(1000)
        this.debugLogs = new CircularBuffer<DebugLogEntry>(10000)

        // Start GraphQL server if enabled
        this.startGraphQLServer()
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): DebugLogger {
        if (!DebugLogger.instance) {
            DebugLogger.instance = new DebugLogger()
        }
        return DebugLogger.instance
    }

    /**
     * Generate a new request UUID
     */
    public generateflareRequestId(): string {
        return uuidv4()
    }

    /**
     * Log request/response information
     */
    public async logRequestResponse(
        flareRequestId: string,
        req: Request<any, AWSError> & RequestExtras,
        resp: Response<any, AWSError> | null,
        error: string | AWSError,
        reqId: string,
        endpoint: string,
        latency?: number
    ): Promise<void> {
        // Validate required inputs
        if (!req || !reqId || !endpoint) {
            console.error('Missing required parameters for logging')
            return
        }

        try {
            const logEntry: RequestLogEntry = {
                flareRequestId,
                timestamp: new Date().toISOString(),
                request: req.httpRequest.body,
                response: resp?.httpResponse?.body?.toString() || 'No response body',
                endpoint,
                error: error?.toString() || 'No error',
                requestId: reqId,
                responseCode: resp?.httpResponse?.statusCode || 0,
                latency: latency || 0,
            }

            // Store in circular buffer
            this.requestLogs.push(logEntry)

            // Store in map for quick lookup
            this.requestMap.set(flareRequestId, logEntry)

            console.log(`[DebugLogger] Logged request/response for ${flareRequestId}`)
        } catch (err) {
            console.error('Failed to log request/response:', err)
        }
    }

    /**
     * Log debug information
     */
    public log(
        flareRequestId: string | undefined,
        message: string,
        data?: Record<string, any> | string | EditPredictionAutoTriggerData | InlineCompletionsHandlerData,
        level: 'debug' | 'info' | 'warn' | 'error' = 'info',
        source: string = 'unknown'
    ): void {
        const uuid = flareRequestId || 'global'

        try {
            const logEntry: DebugLogEntry = {
                flareRequestId: uuid,
                timestamp: new Date().toISOString(),
                message,
                data,
                level,
                source,
            }

            // Store in circular buffer
            this.debugLogs.push(logEntry)

            // Store in map for quick lookup
            if (!this.debugLogMap.has(uuid)) {
                this.debugLogMap.set(uuid, [])
            }
            this.debugLogMap.get(uuid)?.push(logEntry)

            // Also log to console for visibility
            console.log(`[${level.toUpperCase()}][${source}][${uuid}] ${message}`, data || '')
        } catch (err) {
            console.error('Failed to log debug information:', err)
        }
    }

    /**
     * Get all request logs
     */
    public getAllRequestLogs(): RequestLogEntry[] {
        return this.requestLogs.getAll()
    }

    /**
     * Get all debug logs
     */
    public getAllDebugLogs(): DebugLogEntry[] {
        return this.debugLogs.getAll()
    }

    /**
     * Get request log by UUID
     */
    public getRequestLogByUUID(flareRequestId: string): RequestLogEntry | undefined {
        return this.requestMap.get(flareRequestId)
    }

    /**
     * Get debug logs by UUID
     */
    public getDebugLogsByUUID(flareRequestId: string): DebugLogEntry[] {
        return this.debugLogMap.get(flareRequestId) || []
    }

    /**
     * Start the GraphQL server
     */
    private startGraphQLServer(): void {
        if (this.isServerRunning) {
            return
        }

        // Define GraphQL schema
        const typeDefs = gql`
            type RequestLogEntry {
                flareRequestId: String!
                timestamp: String!
                request: String!
                response: String!
                endpoint: String!
                error: String!
                requestId: String!
                responseCode: Int!
                latency: Float!
                metadata: String
            }

            type DebugLogEntry {
                flareRequestId: String!
                timestamp: String!
                message: String!
                data: String
                level: String!
                source: String!
            }

            type EditPredictionAutoTriggerData {
                hasRecentEdit: Boolean!
                isNotInMiddleOfWord: Boolean!
                isPreviousDecisionNotReject: Boolean!
                hasNonEmptySuffix: Boolean!
                requiredConditionsMet: Boolean!
                isAfterKeyword: Boolean!
                isAfterOperatorOrDelimiter: Boolean!
                hasUserPaused: Boolean!
                isAtLineBeginning: Boolean!
                optionalConditionsMet: Boolean!
                cursor: String!
                currentLine: String!
                shouldTrigger: Boolean!
            }

            type Position {
                line: Int!
                character: Int!
            }

            type DocumentRange {
                start: Position!
                end: Position!
            }

            type TextDocumentInfo {
                uri: String!
                languageId: String
            }

            type CompletionContext {
                triggerKind: Int!
                requestUuid: String
                selectedCompletionInfo: SelectedCompletionInfo
            }

            type SelectedCompletionInfo {
                range: DocumentRange
            }

            type DocumentContent {
                leftContent: String
                rightContent: String
                currentLine: String
                lineCount: Int
            }

            type InlineCompletionsHandlerData {
                textDocument: TextDocumentInfo!
                position: Position!
                context: CompletionContext
                documentContent: DocumentContent
            }

            type Query {
                requestLogs: [RequestLogEntry!]!
                debugLogs: [DebugLogEntry!]!
                requestLogByUUID(flareRequestId: String!): RequestLogEntry
                debugLogsByUUID(flareRequestId: String!): [DebugLogEntry!]!
            }
        `

        // Define resolvers
        const resolvers = {
            Query: {
                requestLogs: () => {
                    const logs = this.getAllRequestLogs()
                    return logs.map(log => ({
                        ...log,
                        request: typeof log.request === 'object' ? JSON.stringify(log.request) : log.request,
                        metadata: log.metadata ? JSON.stringify(log.metadata) : null,
                    }))
                },
                debugLogs: () => {
                    const logs = this.getAllDebugLogs()
                    return logs.map(log => ({
                        ...log,
                        data: log.data ? JSON.stringify(log.data) : null,
                    }))
                },
                requestLogByUUID: (_: any, { flareRequestId }: { flareRequestId: string }) => {
                    const log = this.getRequestLogByUUID(flareRequestId)
                    if (!log) return null
                    return {
                        ...log,
                        request: typeof log.request === 'object' ? JSON.stringify(log.request) : log.request,
                        metadata: log.metadata ? JSON.stringify(log.metadata) : null,
                    }
                },
                debugLogsByUUID: (_: any, { flareRequestId }: { flareRequestId: string }) => {
                    const logs = this.getDebugLogsByUUID(flareRequestId)
                    return logs.map(log => ({
                        ...log,
                        data: log.data ? JSON.stringify(log.data) : null,
                    }))
                },
            },
        }

        // Create Apollo Server with proper landing page plugin instead of deprecated playground option
        this.server = new ApolloServer({
            typeDefs,
            resolvers,
            introspection: true,
            plugins: [
                // Use the appropriate plugin based on Apollo Server version
                require('apollo-server-core').ApolloServerPluginLandingPageGraphQLPlayground(),
            ],
        })

        // Start server
        this.server
            .listen({ port: this.port })
            .then(({ url }) => {
                console.log(`🚀 Debug GraphQL server ready at ${url}`)
                this.isServerRunning = true
            })
            .catch(err => {
                console.error('Failed to start GraphQL server:', err)
            })
    }

    /**
     * Stop the GraphQL server
     */
    public async stopGraphQLServer(): Promise<void> {
        if (this.server && this.isServerRunning) {
            await this.server.stop()
            this.isServerRunning = false
            console.log('GraphQL server stopped')
        }
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use DebugLogger.getInstance().logRequestResponse() instead
 */
export async function logRequestResponseToFile(
    req: Request<any, AWSError> & RequestExtras,
    resp: Response<any, AWSError> | null,
    error: string | AWSError,
    reqId: string,
    endpoint: string,
    latency?: number
): Promise<void> {
    // Generate a UUID for this request if not provided
    const flareRequestId = 'legacy-' + uuidv4()

    // Use the new logger
    await DebugLogger.getInstance().logRequestResponse(flareRequestId, req, resp, error, reqId, endpoint, latency)
}
