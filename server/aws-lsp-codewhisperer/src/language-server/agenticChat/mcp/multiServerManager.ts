import { Logging, ToolSpec } from '@aws/language-server-runtimes/server-interface'
import { ServerConfig } from './serverConfig'
import { ServerClient } from './serverClient'
import { Client } from '@modelcontextprotocol/sdk/client/index'

const TOOL_NAME_DELIMITER = '::'
class NamespacedToolName {
    constructor(private _name: string) {
        if (!this.name) {
            throw new Error('Name cannot be empty')
        }

        const parts = this.name.split(TOOL_NAME_DELIMITER)
        if (parts.length !== 2) {
            throw new Error(`Invalid tool name format: "${this.name}"`)
        }
    }

    static create(serverName: string, toolName: string): NamespacedToolName {
        return new NamespacedToolName(`${serverName}${TOOL_NAME_DELIMITER}${toolName}`)
    }

    get name(): string {
        return this._name
    }

    split(): { serverName: string; toolName: string } {
        const [serverName, toolName] = this.name.split(TOOL_NAME_DELIMITER)
        return { serverName, toolName }
    }
}

export class MultiServerManager {
    private servers: Map<
        string,
        {
            client: Client
            capabilities: {
                tools: ToolSpec[]
            }
            config: {
                timeout?: number
            }
        }
    > = new Map()

    private constructor(private logging: Logging) {}

    public static async init(serversConfig: Map<string, ServerConfig>, logging: Logging): Promise<MultiServerManager> {
        const manager = new MultiServerManager(logging)

        await Promise.all(Array.from(serversConfig.entries()).map(([id, config]) => manager.addServer(id, config)))

        return manager
    }

    getTools(): ToolSpec[] {
        const tools: ToolSpec[] = []

        for (const [serverName, server] of this.servers.entries()) {
            const serverTools = server.capabilities.tools.map(tool => ({
                ...tool,
                name: NamespacedToolName.create(serverName, tool.name).name,
            }))
            tools.push(...serverTools)
        }

        return tools
    }

    async executeTool(name: string, args: any): Promise<any> {
        try {
            const result = await this.invokeTool(name, args)
            return result // TODO: Convert this to proper output that Q works with
        } catch (error: any) {
            this.logging.error(`Error executing tool ${name}: ${error}`)
            return { error: error.message } // TODO: proper error result
        }
    }

    async close(): Promise<void> {
        const closePromises = Array.from(this.servers.entries()).map(async ([name, server]) => {
            try {
                await server.client.close()
                this.logging.debug(`Server ${name} closed successfully`)
            } catch (error: any) {
                this.logging.error(`Error closing server ${name}: ${error}`)
            }
        })

        await Promise.all(closePromises)
        this.servers.clear()
    }

    private async addServer(name: string, config: ServerConfig): Promise<void> {
        const client = await ServerClient.connectStdioClient(config, this.logging)
        if (!client) {
            this.logging.error(`Skipping server ${name}: could not connect`)
            return
        }

        try {
            const tools = await client.listTools()
            const toolSpecs = tools.tools
                .map(tool => tool as ToolSpec)
                .filter(tool => tool.name && tool.description && tool.inputSchema)

            this.servers.set(name, {
                client,
                capabilities: {
                    tools: toolSpecs,
                },
                config: {
                    timeout: config.timeout,
                },
            })

            this.logging.debug(`Server ${name} added successfully`)
        } catch (error: any) {
            this.logging.error(`Failed to list server ${name} tools: ${error}`)
        }
    }

    private async invokeTool(name: string, args: any): Promise<any> {
        const { serverName, toolName } = new NamespacedToolName(name).split()
        const server = this.servers.get(serverName)
        const tool = server?.capabilities.tools.find(tool => tool.name === toolName)
        if (!server || !tool) {
            throw new Error(`Tool ${toolName} not found on server ${serverName}`)
        }

        // TODO: valudate args against schema?

        this.logging.debug(`Executing tool ${toolName} on server ${serverName} with input ${JSON.stringify(args)}`)

        const request = { name: toolName, arguments: args }
        const options = { timeout: server.config.timeout }
        return server.client.callTool(request, undefined, options)
    }
}
