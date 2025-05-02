import { CancellationToken, Server } from '@aws/language-server-runtimes/server-interface'
import { FsRead, FsReadParams } from './fsRead'
import { FsWrite, FsWriteParams } from './fsWrite'
import { ListDirectory, ListDirectoryParams } from './listDirectory'
import { ExecuteBash, ExecuteBashParams } from './executeBash'
import { LspGetDocuments, LspGetDocumentsParams } from './lspGetDocuments'
import { LspReadDocumentContents, LspReadDocumentContentsParams } from './lspReadDocumentContents'
import { LspApplyWorkspaceEdit, LspApplyWorkspaceEditParams } from './lspApplyWorkspaceEdit'
import { McpManager } from './mcp/mcpManager'
import { McpTool } from './mcp/mcpTool'

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

    agent.addTool(listDirectoryTool.getSpec(), (input: ListDirectoryParams, token?: CancellationToken) =>
        listDirectoryTool.invoke(input, token)
    )

    return () => {}
}

export const BashToolsServer: Server = ({ logging, workspace, agent, lsp }) => {
    const bashTool = new ExecuteBash({ logging, workspace, lsp })
    agent.addTool(bashTool.getSpec(), (input: ExecuteBashParams, token?: CancellationToken, updates?: WritableStream) =>
        bashTool.invoke(input, token, updates)
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
    lsp.onInitialized(async () => {
        // todo: move to constants
        const wsUris = lsp.getClientInitializeParams()?.workspaceFolders?.map(f => f.uri) ?? []
        const wsConfigPaths = wsUris.map(uri => `${uri}/.amazonq/mcp.json`)
        const globalConfigPath = `${workspace.fs.getUserHomeDir()}/.aws/amazonq/mcp.json`
        const allPaths = [...wsConfigPaths, globalConfigPath]

        const mgr = await McpManager.init(allPaths, { logging, workspace, lsp })

        for (const def of mgr.getAllTools()) {
            const baseSpec = def
            const namespaced = `${def.serverName}_${def.toolName}`
            const tool = new McpTool({ logging, workspace, lsp }, def)

            //todo: handle enable/disable here
            agent.addTool(
                { name: namespaced, description: baseSpec.description, inputSchema: baseSpec.inputSchema },
                (input: any) => tool.invoke(input)
            )
            logging.info(`MCP: registered tool ${namespaced}`)
        }
    })

    return async () => {
        await McpManager.instance.close()
    }
}
