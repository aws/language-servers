/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export type McpServerStatus = 'INITIALIZING' | 'ENABLED' | 'FAILED' | 'DISABLED'

export interface McpServerRuntimeState {
    status: McpServerStatus
    toolsCount: number
    lastError?: string
}

export interface McpToolDefinition {
    serverName: string
    toolName: string
    description: string
    inputSchema: any
}

export interface MCPServerConfig {
    command: string
    args?: string[]
    env?: Record<string, string>
    initializationTimeout?: number
    timeout?: number
    disabled?: boolean
    autoApprove?: boolean
    toolOverrides?: Record<string, { autoApprove?: boolean; disabled?: boolean }>
    __configPath__?: string
}

export interface ListToolsResponse {
    tools: {
        name?: string
        description?: string
        inputSchema?: object
        [key: string]: any
    }[]
}
