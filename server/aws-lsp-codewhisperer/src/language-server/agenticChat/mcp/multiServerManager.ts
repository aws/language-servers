import { Logging } from '@aws/language-server-runtimes/server-interface'
import { ServerConfig } from './serverConfig'
import { ServerClient } from './serverClient'
import { Client } from '@modelcontextprotocol/sdk/client/index'

export class MultiServerManager {
    private servers: Map<
        string,
        {
            client: Client
            config: ServerConfig
            capabilities: {
                tools: any[]
            }
        }
    > = new Map()

    private constructor(private logging: Logging) {}

    public static async init(serversConfig: Map<string, ServerConfig>, logging: Logging): Promise<MultiServerManager> {
        const manager = new MultiServerManager(logging)

        await Promise.all(Array.from(serversConfig.entries()).map(([id, config]) => manager.addServer(id, config)))

        return manager
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

    private async addServer(name: string, config: any): Promise<void> {
        const client = await ServerClient.connectStdioClient(config, this.logging)
        if (!client) {
            this.logging.error(`Skipping server ${name}: could not connect`)
            return
        }

        try {
            const tools = await client.listTools()

            this.servers.set(name, {
                client,
                config,
                capabilities: {
                    tools: tools.tools,
                },
            })

            this.logging.debug(`Server ${name} added successfully`)
        } catch (error: any) {
            this.logging.error(`Failed to list server ${name} tools: ${error}`)
        }
    }
}
