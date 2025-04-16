import { Logger, Workspace } from '@aws/language-server-runtimes/server-interface'

type ServerConfig = {
    command: string
    args?: string[]
    env?: Record<string, string>
    timeout?: number
}

export class ServerConfigReader {
    constructor(
        private workspace: Workspace,
        private logging: Logger
    ) {}

    public async read(paths: string[]): Promise<Map<string, ServerConfig>> {
        const serverConfigs = new Map<string, ServerConfig>()

        for (const path of paths) {
            const configs = await this.readConfig(path)

            for (const [serverName, config] of configs) {
                if (serverConfigs.has(serverName)) {
                    this.logging.warn(`Duplicate server configuration found for '${serverName}' in ${path}. Skipping.`)
                    continue
                }
                serverConfigs.set(serverName, config)
            }
        }

        return serverConfigs
    }

    private async readConfig(path: string): Promise<[string, ServerConfig][]> {
        const config: [string, ServerConfig][] = []
        const json = await this.readFile(path)

        if (json === null || !json.mcpServers || typeof json.mcpServers !== 'object') {
            this.logging.warn(`Server config at ${path} is invalid`)
            return config
        }

        for (const [serverName, configData] of Object.entries(json.mcpServers)) {
            const serverData = configData as ServerConfig

            if (!serverData.command) {
                this.logging.warn(`Invalid server config at ${path}: 'command' is required for ${serverName}`)
                continue
            }

            const serverConfig: ServerConfig = {
                command: serverData.command,
                args: serverData.args || [],
                env: serverData.env || {},
                timeout: serverData.timeout,
            }

            config.push([serverName, serverConfig])
        }

        return config
    }

    private async readFile(path: string): Promise<any | undefined> {
        try {
            const content = await this.workspace.fs.readFile(path)
            return JSON.parse(content.toString())
        } catch (error: any) {
            this.logging.warn(`Failed to read server config at ${path}: ${error.message}`)
            return undefined
        }
    }
}
