import { CancellationToken, Server } from '@aws/language-server-runtimes/server-interface'
import { FsRead, FsReadParams } from './fsRead'
import { FsWrite, FsWriteParams } from './fsWrite'
import { ListDirectory, ListDirectoryParams } from './listDirectory'
import { ExecuteBash, ExecuteBashParams } from './executeBash'
import { LspGetDocuments, LspGetDocumentsParams } from './lspGetDocuments'
import { LspReadDocumentContents, LspReadDocumentContentsParams } from './lspReadDocumentContents'
import { LspApplyWorkspaceEdit, LspApplyWorkspaceEditParams } from './lspApplyWorkspaceEdit'
import { AGENT_TOOLS_CHANGED, McpManager } from './mcp/mcpManager'
import { McpTool } from './mcp/mcpTool'
import { McpToolDefinition } from './mcp/mcpTypes'
import {
    getGlobalMcpConfigPath,
    getGlobalPersonaConfigPath,
    getWorkspaceMcpConfigPaths,
    getWorkspacePersonaConfigPaths,
    createNamespacedToolName,
    enabledMCP,
} from './mcp/mcpUtils'

export const FsToolsServer: Server = ({ workspace, logging, agent, lsp }) => {
    const fsReadTool = new FsRead({ workspace, lsp, logging })
    const fsWriteTool = new FsWrite({ workspace, lsp, logging })
    const listDirectoryTool = new ListDirectory({ workspace, logging, lsp })

    agent.addTool(fsReadTool.getSpec(), async (input: FsReadParams) => {
        // TODO: fill in logic for handling invalid tool invocations
        // TODO: implement chat streaming via queueDescription.
        await fsReadTool.validate(input)
        return await fsReadTool.invoke(input)
    })

    agent.addTool(fsWriteTool.getSpec(), async (input: FsWriteParams) => {
        // TODO: fill in logic for handling invalid tool invocations
        // TODO: implement chat streaming via queueDescription.
        await fsWriteTool.validate(input)
        return await fsWriteTool.invoke(input)
    })

    agent.addTool(listDirectoryTool.getSpec(), async (input: ListDirectoryParams, token?: CancellationToken) => {
        await listDirectoryTool.validate(input)
        return await listDirectoryTool.invoke(input, token)
    })
    agent.addTool(listDirectoryTool.getSpec(), async (input: ListDirectoryParams, token?: CancellationToken) => {
        await listDirectoryTool.validate(input)
        return await listDirectoryTool.invoke(input, token)
    })

    return () => {}
}

export const BashToolsServer: Server = ({ logging, workspace, agent, lsp }) => {
    const bashTool = new ExecuteBash({ logging, workspace, lsp })
    agent.addTool(
        bashTool.getSpec(),
        async (input: ExecuteBashParams, token?: CancellationToken, updates?: WritableStream) => {
            await bashTool.validate(input)
            return await bashTool.invoke(input, token, updates)
        }
    )
    return () => {}
}

export const LspToolsServer: Server = ({ workspace, logging, lsp, agent }) => {
    const lspGetDocuments = new LspGetDocuments({ workspace, logging })
    const lspReadDocumentContents = new LspReadDocumentContents({ workspace, logging })
    const lspApplyWorkspaceEdit = new LspApplyWorkspaceEdit({ lsp, logging })

    agent.addTool(LspGetDocuments.getSpec(), (input: LspGetDocumentsParams) => lspGetDocuments.invoke(input))
    agent.addTool(LspReadDocumentContents.getSpec(), (input: LspReadDocumentContentsParams) =>
        lspReadDocumentContents.invoke(input)
    )
    agent.addTool(LspApplyWorkspaceEdit.getSpec(), input => lspApplyWorkspaceEdit.invoke(input))

    return () => {}
}

export const McpToolsServer: Server = ({ credentialsProvider, workspace, logging, lsp, agent }) => {
    const registered: Record<string, string[]> = {}

    const allNamespacedTools = new Set<string>()

    function registerServerTools(server: string, defs: McpToolDefinition[]) {
        // 1) remove old tools
        for (const name of registered[server] ?? []) {
            agent.removeTool(name)
        }
        registered[server] = []

        // 2) add new enabled tools
        for (const def of defs) {
            const namespaced = createNamespacedToolName(def.serverName, def.toolName, allNamespacedTools)
            const tool = new McpTool({ logging, workspace, lsp }, def)

            agent.addTool({ name: namespaced, description: def.description, inputSchema: def.inputSchema }, input =>
                tool.invoke(input)
            )
            registered[server].push(namespaced)
            logging.info(`MCP: registered tool ${namespaced} (original: ${def.serverName}___${def.toolName})`)
        }
    }

    lsp.onInitialized(async () => {
        if (!enabledMCP(lsp.getClientInitializeParams())) {
            logging.warn('MCP is currently not supported')
            return
        }

        const wsUris = lsp.getClientInitializeParams()?.workspaceFolders?.map(f => f.uri) ?? []
        const wsConfigPaths = getWorkspaceMcpConfigPaths(wsUris)
        const globalConfigPath = getGlobalMcpConfigPath(workspace.fs.getUserHomeDir())
        const allConfigPaths = [...wsConfigPaths, globalConfigPath]

        const wsPersonaPaths = getWorkspacePersonaConfigPaths(wsUris)
        const globalPersonaPath = getGlobalPersonaConfigPath(workspace.fs.getUserHomeDir())
        const allPersonaPaths = [...wsPersonaPaths, globalPersonaPath]

        const mgr = await McpManager.init(allConfigPaths, allPersonaPaths, { logging, workspace, lsp })

        const byServer: Record<string, McpToolDefinition[]> = {}
        // only register enabled tools
        for (const d of mgr.getEnabledTools()) {
            ;(byServer[d.serverName] ||= []).push(d)
        }
        for (const [server, defs] of Object.entries(byServer)) {
            registerServerTools(server, defs)
        }

        mgr.events.on(AGENT_TOOLS_CHANGED, (server: string, defs: McpToolDefinition[]) => {
            registerServerTools(server, defs)
        })
    })

    return async () => {
        await McpManager.instance.close()
    }
}
