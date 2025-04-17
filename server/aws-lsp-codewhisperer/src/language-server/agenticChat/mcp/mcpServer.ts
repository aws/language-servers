import { Server } from '@aws/language-server-runtimes/server-interface'
import * as path from 'path'
import { ServerConfigReader } from './serverConfigReader'
import { MultiServerManager } from './multiServerManager'

// TODO: configure through InitializeParams enable/disable
export const McpServer: Server = ({ lsp, workspace, logging, agent }) => {
    let serversManager: MultiServerManager

    lsp.onInitialized(async () => {
        const serverConfigReader = new ServerConfigReader(workspace, logging)
        const serversConfig = await readServersConfig(serverConfigReader)

        serversManager = await MultiServerManager.init(serversConfig, logging)

        for (const tool of serversManager.getTools()) {
            agent.addTool(tool, (input: any) => {
                return serversManager.executeTool(tool.name, input)
            })
        }
    })

    // TODO: move inside ServerConfigReader
    const readServersConfig = async (serverConfigReader: ServerConfigReader) => {
        const wsConfigs = lsp
            .getClientInitializeParams()
            ?.workspaceFolders?.map(folder => path.join(folder.uri, '.amazonq/mcp.json'))
        const globalConfig = path.join(workspace.fs.getUserHomeDir(), '/.aws/amazonq/mcp.json')
        const configs = wsConfigs ? wsConfigs.concat(globalConfig) : [globalConfig]

        return serverConfigReader.read(configs)
    }

    return async () => {
        await serversManager?.close()
    }
}
