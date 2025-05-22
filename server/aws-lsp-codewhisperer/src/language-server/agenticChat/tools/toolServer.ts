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

export const McpToolsServer: Server = ({ workspace, logging, lsp, agent }) => {
    const registered: Record<string, string[]> = {}

    const MAX_TOOL_NAME_LENGTH = 64

    const allNamespacedTools = new Set<string>()

    function createNamespacedToolName(serverName: string, toolName: string): string {
        const separator = '___'

        //case 1: both serverName and toolName are within limit
        const fullName = `${serverName}${separator}${toolName}`
        if (fullName.length <= MAX_TOOL_NAME_LENGTH) {
            //if it is unique, return it
            if (!allNamespacedTools.has(fullName)) {
                allNamespacedTools.add(fullName)
                return fullName
            }
        }

        //case2: serverName is too long
        if (serverName.length > MAX_TOOL_NAME_LENGTH) {
            const maxServerLength = MAX_TOOL_NAME_LENGTH - separator.length - Math.min(toolName.length, 10)
            let truncatedServerName = serverName.substring(0, Math.max(4, maxServerLength))
            let namespacedName = `${truncatedServerName}${separator}${toolName}`

            if (namespacedName.length > MAX_TOOL_NAME_LENGTH) {
                const excess = namespacedName.length - MAX_TOOL_NAME_LENGTH
                truncatedServerName = truncatedServerName.substring(0, truncatedServerName.length - excess)
                namespacedName = `${truncatedServerName}${separator}${toolName}`
            }

            //ensure uniqueness
            let uniqueIndex = 1
            let baseTruncatedServerName = truncatedServerName
            while (allNamespacedTools.has(namespacedName)) {
                truncatedServerName = `${baseTruncatedServerName}${uniqueIndex++}`
                namespacedName = `${truncatedServerName}${separator}${toolName}`

                //length check
                if (namespacedName.length > MAX_TOOL_NAME_LENGTH) {
                    const excess = namespacedName.length - MAX_TOOL_NAME_LENGTH
                    truncatedServerName = truncatedServerName.substring(0, truncatedServerName.length - excess)
                    namespacedName = `${truncatedServerName}${separator}${toolName}`
                }
            }

            allNamespacedTools.add(namespacedName)
            return namespacedName
        }

        //case 3: toolName is too long
        if (toolName.length >= MAX_TOOL_NAME_LENGTH) {
            const maxToolLength = MAX_TOOL_NAME_LENGTH - separator.length - Math.min(4, serverName.length)
            let truncatedToolName = toolName.substring(0, maxToolLength)
            let namespacedName = `${serverName}${separator}${truncatedToolName}`

            if (namespacedName.length > MAX_TOOL_NAME_LENGTH) {
                const excess = namespacedName.length - MAX_TOOL_NAME_LENGTH
                truncatedToolName = truncatedToolName.substring(0, truncatedToolName.length - excess)
                namespacedName = `${serverName}${separator}${truncatedToolName}`
            }

            //ensure uniqueness
            while (allNamespacedTools.has(namespacedName)) {
                const serverPrefix = serverName.substring(0, Math.min(serverName.length, namespacedName.length + 1))
                truncatedToolName = truncatedToolName.substring(1)
                namespacedName = `${serverPrefix}${separator}${truncatedToolName}`

                if (namespacedName.length > MAX_TOOL_NAME_LENGTH) {
                    const excess = namespacedName.length - MAX_TOOL_NAME_LENGTH
                    truncatedToolName = truncatedToolName.substring(0, truncatedToolName.length - excess)
                    namespacedName = `${serverPrefix}${separator}${truncatedToolName}`
                }
            }

            allNamespacedTools.add(namespacedName)
            return namespacedName
        }

        //case 4: both are within the limit but combined exceeds the limit
        if (toolName.length < MAX_TOOL_NAME_LENGTH && serverName.length < MAX_TOOL_NAME_LENGTH) {
            const maxServerLength = MAX_TOOL_NAME_LENGTH - separator.length - toolName.length
            let truncatedServerName = serverName.substring(0, Math.max(1, maxServerLength))
            let namespacedName = `${truncatedServerName}${separator}${toolName}`

            if (namespacedName.length > MAX_TOOL_NAME_LENGTH) {
                const excess = namespacedName.length - MAX_TOOL_NAME_LENGTH
                truncatedServerName = truncatedServerName.substring(0, truncatedServerName.length - excess)
                namespacedName = `${truncatedServerName}${separator}${toolName}`
            }

            //ensure uniqueness
            let uniqueIndex = 1
            let baseTruncatedServerName = truncatedServerName
            while (allNamespacedTools.has(namespacedName)) {
                truncatedServerName = `${baseTruncatedServerName}${uniqueIndex++}`

                if ((truncatedServerName + separator + toolName).length > MAX_TOOL_NAME_LENGTH) {
                    baseTruncatedServerName = baseTruncatedServerName.substring(
                        0,
                        baseTruncatedServerName.length - String(uniqueIndex).length
                    )
                    truncatedServerName = `${baseTruncatedServerName}${uniqueIndex}`
                }
                namespacedName = `${truncatedServerName}${separator}${toolName}`
            }

            allNamespacedTools.add(namespacedName)
            return namespacedName
        }

        //this shoudl never happen, only needed for typescript
        const defaultName = `${serverName}${separator}${toolName}`
        return defaultName
    }

    function registerServerTools(server: string, defs: McpToolDefinition[]) {
        // 1) remove old tools
        for (const name of registered[server] ?? []) {
            agent.removeTool(name)
        }
        registered[server] = []

        // 2) add new enabled tools
        for (const def of defs) {
            const namespaced = createNamespacedToolName(def.serverName, def.toolName)
            const tool = new McpTool({ logging, workspace, lsp }, def)

            agent.addTool({ name: namespaced, description: def.description, inputSchema: def.inputSchema }, input =>
                tool.invoke(input)
            )
            registered[server].push(namespaced)
            logging.info(`MCP: registered tool ${namespaced} (original: ${def.serverName}___${def.toolName})`)
        }
    }

    lsp.onInitialized(async () => {
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
