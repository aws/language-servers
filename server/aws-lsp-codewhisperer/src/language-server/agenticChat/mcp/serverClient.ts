import { Client } from '@modelcontextprotocol/sdk/client/index'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio'
import { ServerConfig } from './serverConfig'
import { Logging } from '@aws/language-server-runtimes/server-interface'

export class ServerClient {
    static async connectStdioClient(config: ServerConfig, logging: Logging): Promise<Client | undefined> {
        const client = new Client(
            // TODO: propagate real extension info
            { name: 'MultiServerClient', version: '1.0.0' },
            { capabilities: {} }
        )

        try {
            // TODO: reconnect/disconnect handling
            const transport = new StdioClientTransport({
                command: config.command,
                args: config.args,
                env: config.env,
            })
            await client.connect(transport, { timeout: config.timeout })
            return client
        } catch (e) {
            logging.error(`Failed to connect to server: ${e}`)
            return undefined
        }
    }
}
