import { Server } from '@aws/language-server-runtimes/server-interface'
import * as path from 'path'
import { ServerConfigReader } from './serverConfigReader'

// TODO: configure this server through InitializeParams enable/disable
export const McpServer: Server = ({ lsp, workspace, logging, agent }) => {
    let serverConfigReader: ServerConfigReader

    lsp.onInitialized(async () => {
        serverConfigReader = new ServerConfigReader(workspace, logging)

        const serversConfig = await readServersConfig()
    })

    const readServersConfig = async () => {
        const wsConfigs = lsp
            .getClientInitializeParams()
            ?.workspaceFolders?.map(folder => path.join(folder.uri, '.amazonq/mcp.json'))
        const globalConfig = path.join(workspace.fs.getUserHomeDir(), '/.aws/amazonq/mcp.json')
        const configs = wsConfigs ? wsConfigs.concat(globalConfig) : [globalConfig]

        return serverConfigReader.read(configs)
    }

    return () => {}
}
