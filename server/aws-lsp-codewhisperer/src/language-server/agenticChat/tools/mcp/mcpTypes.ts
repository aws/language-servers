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
