import { CancellationToken, Server } from '@aws/language-server-runtimes/server-interface'
import { FsRead, FsReadParams } from './fsRead'
import { FsWrite, FsWriteParams } from './fsWrite'
import { ListDirectory, ListDirectoryParams } from './listDirectory'
import { ExecuteBash, ExecuteBashParams } from './executeBash'
import { LspGetDocuments, LspGetDocumentsParams } from './lspGetDocuments'
import { LspReadDocumentContents, LspReadDocumentContentsParams } from './lspReadDocumentContents'
import { LspApplyWorkspaceEdit } from './lspApplyWorkspaceEdit'
import { McpManager } from './mcp/mcpManager'
import { McpTool } from './mcp/mcpTool'
import { FileSearch, FileSearchParams } from './fileSearch'
import { GrepSearch } from './grepSearch'
import { QCodeReview } from './qCodeReview'
import { CodeWhispererServiceToken } from '../../../shared/codeWhispererService'

export const QCodeAnalysisServer: Server = ({
    workspace,
    logging,
    agent,
    lsp,
    sdkInitializator,
    credentialsProvider,
}) => {
    logging.info('QCodeAnalysisServer')
    const qCodeReviewTool = new QCodeReview({ workspace, lsp, logging })

    lsp.onInitialized(async () => {
        logging.info('LSP on initialize for QCodeAnalysisServer')
        // Get credentials provider from the LSP context
        if (!credentialsProvider.hasCredentials) {
            logging.error('Credentials provider not available')
            return
        }

        // Create the CodeWhisperer client
        const codeWhispererClient = new CodeWhispererServiceToken(
            credentialsProvider,
            workspace,
            logging,
            process.env.CODEWHISPERER_REGION || 'us-east-1',
            process.env.CODEWHISPERER_ENDPOINT || 'https://codewhisperer.us-east-1.amazonaws.com/',
            sdkInitializator
        )

        agent.addTool(
            {
                name: QCodeReview.toolName,
                description: QCodeReview.toolDescription,
                inputSchema: QCodeReview.inputSchema,
            },
            async (input: any) => {
                return await qCodeReviewTool.execute(input, { codeWhispererClient })
            }
        )
    })

    return () => {}
}

export const FsToolsServer: Server = ({ workspace, logging, agent, lsp }) => {
    const fsReadTool = new FsRead({ workspace, lsp, logging })
    const fsWriteTool = new FsWrite({ workspace, lsp, logging })
    const listDirectoryTool = new ListDirectory({ workspace, logging, lsp })
    const fileSearchTool = new FileSearch({ workspace, lsp, logging })
    const grepSearchTool = new GrepSearch({ workspace, logging, lsp })

    agent.addTool(fsReadTool.getSpec(), async (input: FsReadParams) => {
        await fsReadTool.validate(input)
        return await fsReadTool.invoke(input)
    })

    agent.addTool(fsWriteTool.getSpec(), async (input: FsWriteParams) => {
        await fsWriteTool.validate(input)
        return await fsWriteTool.invoke(input)
    })

    agent.addTool(listDirectoryTool.getSpec(), async (input: ListDirectoryParams, token?: CancellationToken) => {
        await listDirectoryTool.validate(input)
        return await listDirectoryTool.invoke(input, token)
    })

    agent.addTool(fileSearchTool.getSpec(), async (input: FileSearchParams, token?: CancellationToken) => {
        await fileSearchTool.validate(input)
        return await fileSearchTool.invoke(input, token)
    })

    // Temporarily disable grep search
    // agent.addTool(grepSearchTool.getSpec(), async (input: GrepSearchParams, token?: CancellationToken) => {
    //     await grepSearchTool.validate(input)
    //     return await grepSearchTool.invoke(input, token)
    // })

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
    lsp.onInitialized(async () => {
        // todo: move to constants
        var workspaceFolders = workspace.getAllWorkspaceFolders()
        const wsUris = workspaceFolders?.map(f => f.uri) ?? []
        const wsConfigPaths = wsUris.map(uri => `${uri}/.amazonq/mcp.json`)
        const globalConfigPath = `${workspace.fs.getUserHomeDir()}/.aws/amazonq/mcp.json`
        const allPaths = [...wsConfigPaths, globalConfigPath]

        const mgr = await McpManager.init(allPaths, { logging, workspace, lsp })

        for (const def of mgr.getAllTools()) {
            const baseSpec = def
            const namespaced = `${def.serverName}_${def.toolName}`
            const tool = new McpTool({ logging, workspace, lsp }, def)

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
