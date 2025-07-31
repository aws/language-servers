import { CancellationToken, Server, ToolClassification } from '@aws/language-server-runtimes/server-interface'
import { FsRead, FsReadParams } from './fsRead'
import { FsWrite, FsWriteParams } from './fsWrite'
import { ListDirectory, ListDirectoryParams } from './listDirectory'
import { ExecuteBash, ExecuteBashParams } from './executeBash'
import { LspGetDocuments, LspGetDocumentsParams } from './lspGetDocuments'
import { LspReadDocumentContents, LspReadDocumentContentsParams } from './lspReadDocumentContents'
import { LspApplyWorkspaceEdit } from './lspApplyWorkspaceEdit'
import { AGENT_TOOLS_CHANGED, McpManager } from './mcp/mcpManager'
import { McpTool } from './mcp/mcpTool'
import { FileSearch, FileSearchParams } from './fileSearch'
import { GrepSearch } from './grepSearch'
import { CodeReview } from './qCodeAnalysis/codeReview'
import { CodeWhispererServiceToken } from '../../../shared/codeWhispererService'
import { McpToolDefinition } from './mcp/mcpTypes'
import {
    getGlobalAgentConfigPath,
    getWorkspaceAgentConfigPaths,
    createNamespacedToolName,
    enabledMCP,
    migrateToAgentConfig,
    enabledMcpAdmin,
} from './mcp/mcpUtils'
import { FsReplace, FsReplaceParams } from './fsReplace'
import { CodeReviewUtils } from './qCodeAnalysis/codeReviewUtils'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../../shared/constants'
import { ProfileStatusMonitor } from './mcp/profileStatusMonitor'
import { AmazonQTokenServiceManager } from '../../../shared/amazonQServiceManager/AmazonQTokenServiceManager'

export const FsToolsServer: Server = ({ workspace, logging, agent, lsp }) => {
    const fsReadTool = new FsRead({ workspace, lsp, logging })
    const fsWriteTool = new FsWrite({ workspace, lsp, logging })
    const listDirectoryTool = new ListDirectory({ workspace, logging, lsp })
    const fileSearchTool = new FileSearch({ workspace, lsp, logging })
    const fsReplaceTool = new FsReplace({ workspace, lsp, logging })

    agent.addTool(
        fsReadTool.getSpec(),
        async (input: FsReadParams) => {
            await fsReadTool.validate(input)
            return await fsReadTool.invoke(input)
        },
        ToolClassification.BuiltIn
    )

    agent.addTool(
        fsWriteTool.getSpec(),
        async (input: FsWriteParams) => {
            await fsWriteTool.validate(input)
            return await fsWriteTool.invoke(input)
        },
        ToolClassification.BuiltInCanWrite
    )

    agent.addTool(
        fsReplaceTool.getSpec(),
        async (input: FsReplaceParams) => {
            await fsReplaceTool.validate(input)
            return await fsReplaceTool.invoke(input)
        },
        ToolClassification.BuiltInCanWrite
    )

    agent.addTool(
        listDirectoryTool.getSpec(),
        async (input: ListDirectoryParams, token?: CancellationToken) => {
            await listDirectoryTool.validate(input)
            return await listDirectoryTool.invoke(input, token)
        },
        ToolClassification.BuiltIn
    )

    agent.addTool(
        fileSearchTool.getSpec(),
        async (input: FileSearchParams, token?: CancellationToken) => {
            await fileSearchTool.validate(input)
            return await fileSearchTool.invoke(input, token)
        },
        ToolClassification.BuiltIn
    )

    // Temporarily disable grep search
    // agent.addTool(grepSearchTool.getSpec(), async (input: GrepSearchParams, token?: CancellationToken) => {
    //     await grepSearchTool.validate(input)
    //     return await grepSearchTool.invoke(input, token)
    // }, ToolClassification.BuiltIn)

    return () => {}
}

export const QCodeAnalysisServer: Server = ({
    agent,
    credentialsProvider,
    logging,
    lsp,
    sdkInitializator,
    telemetry,
    workspace,
}) => {
    logging.info('QCodeAnalysisServer')
    const codeReviewTool = new CodeReview({
        credentialsProvider,
        logging,
        telemetry,
        workspace,
    })

    lsp.onInitialized(async () => {
        if (!CodeReviewUtils.isAgenticReviewEnabled(lsp.getClientInitializeParams())) {
            logging.warn('Agentic Review is currently not supported')
            return
        }

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
            process.env.CODEWHISPERER_REGION || DEFAULT_AWS_Q_REGION,
            process.env.CODEWHISPERER_ENDPOINT || DEFAULT_AWS_Q_ENDPOINT_URL,
            sdkInitializator
        )

        agent.addTool(
            {
                name: CodeReview.toolName,
                description: CodeReview.toolDescription,
                inputSchema: CodeReview.inputSchema,
            },
            async (input: any, token?: CancellationToken, updates?: WritableStream) => {
                return await codeReviewTool.execute(input, {
                    codeWhispererClient: codeWhispererClient,
                    cancellationToken: token,
                    writableStream: updates,
                })
            },
            ToolClassification.BuiltIn
        )
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
        },
        ToolClassification.BuiltInCanWrite
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

export const McpToolsServer: Server = ({
    credentialsProvider,
    workspace,
    logging,
    lsp,
    agent,
    telemetry,
    runtime,
    sdkInitializator,
    chat,
}) => {
    const registered: Record<string, string[]> = {}
    const allNamespacedTools = new Set<string>()
    let profileStatusMonitor: ProfileStatusMonitor | undefined

    function removeAllMcpTools(): void {
        logging.info('Removing all MCP tools due to admin configuration')
        for (const [server, toolNames] of Object.entries(registered)) {
            for (const name of toolNames) {
                agent.removeTool(name)
                allNamespacedTools.delete(name)
                logging.info(`MCP: removed tool ${name}`)
            }
            registered[server] = []
        }
        void McpManager.instance.close(true) //keep the instance but close all servers.

        try {
            chat?.sendChatUpdate({
                tabId: 'mcpserver',
                data: {
                    placeholderText: 'mcp-server-update',
                    messages: [],
                },
            })
        } catch (error) {
            logging.error(`Failed to send chatOptionsUpdate: ${error}`)
        }
    }

    function registerServerTools(server: string, defs: McpToolDefinition[]) {
        // 1) remove old tools
        for (const name of registered[server] ?? []) {
            agent.removeTool(name)
            allNamespacedTools.delete(name)
        }
        registered[server] = []

        // 2) add new enabled tools
        for (const def of defs) {
            // Sanitize the tool name

            // Check if this tool name is already in use
            const namespaced = createNamespacedToolName(
                def.serverName,
                def.toolName,
                allNamespacedTools,
                McpManager.instance.getToolNameMapping()
            )
            const tool = new McpTool({ logging, workspace, lsp }, def)

            // Add explanation field to input schema
            const inputSchemaWithExplanation = {
                ...def.inputSchema,
                properties: {
                    ...def.inputSchema.properties,
                    explanation: {
                        type: 'string',
                        description:
                            'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
                    },
                },
            }

            const loggedToolName = `${namespaced} (original: ${def.toolName})`
            try {
                agent.addTool(
                    {
                        name: namespaced,
                        description: (def.description?.trim() || 'undefined').substring(0, 10240),
                        inputSchema: inputSchemaWithExplanation,
                    },
                    input => tool.invoke(input),
                    ToolClassification.MCP
                )
                registered[server].push(namespaced)
                logging.info(`MCP: registered tool ${loggedToolName}`)
            } catch (e) {
                console.warn(`Failed to register tool ${loggedToolName}:`, e)
            }
        }
    }

    async function initializeMcp() {
        try {
            const wsUris = workspace.getAllWorkspaceFolders()?.map(f => f.uri) ?? []
            const wsAgentPaths = getWorkspaceAgentConfigPaths(wsUris)
            const globalAgentPath = getGlobalAgentConfigPath(workspace.fs.getUserHomeDir())
            const allAgentPaths = [...wsAgentPaths, globalAgentPath]

            await migrateToAgentConfig(workspace, logging, agent)

            const mgr = await McpManager.init(allAgentPaths, {
                logging,
                workspace,
                lsp,
                telemetry,
                credentialsProvider,
                runtime,
            })

            McpManager.instance.clearToolNameMapping()

            const byServer: Record<string, McpToolDefinition[]> = {}
            for (const d of mgr.getEnabledTools()) {
                ;(byServer[d.serverName] ||= []).push(d)
            }
            for (const [server, defs] of Object.entries(byServer)) {
                registerServerTools(server, defs)
            }

            mgr.events.on(AGENT_TOOLS_CHANGED, (server: string, defs: McpToolDefinition[]) => {
                registerServerTools(server, defs)
            })
        } catch (e) {
            logging.error(`Failed to initialize MCP:', ${e}`)
        }
    }

    lsp.onInitialized(async () => {
        if (!enabledMCP(lsp.getClientInitializeParams())) {
            logging.warn('MCP is currently not supported')
            return
        }

        if (sdkInitializator) {
            profileStatusMonitor = new ProfileStatusMonitor(
                credentialsProvider,
                workspace,
                logging,
                sdkInitializator,
                removeAllMcpTools,
                () => {
                    logging.info('MCP enabled by profile status monitor')
                    void initializeMcp()
                }
            )

            // Wait for profile ARN to be available before checking MCP state
            const checkAndInitialize = async (connectionType?: string) => {
                const shouldInitialize = await profileStatusMonitor!.checkInitialState()
                if (shouldInitialize) {
                    logging.info('MCP enabled, initializing immediately')
                    void initializeMcp()
                }
                profileStatusMonitor!.start()
            }

            // Check if service manager is ready
            try {
                const serviceManager = AmazonQTokenServiceManager.getInstance()
                if (serviceManager.getState() === 'INITIALIZED') {
                    void checkAndInitialize(serviceManager.getConnectionType())
                } else {
                    // Poll for service manager to be ready
                    const pollForReady = () => {
                        if (serviceManager.getState() === 'INITIALIZED') {
                            void checkAndInitialize(serviceManager.getConnectionType())
                        } else {
                            setTimeout(pollForReady, 100)
                        }
                    }
                    setTimeout(pollForReady, 100)
                }
            } catch (error) {
                // Service manager not initialized yet, default to enabled
                logging.info('Service manager not ready, defaulting MCP to enabled')
                void initializeMcp()
                profileStatusMonitor!.start()
            }
        }
    })

    return async () => {
        profileStatusMonitor?.stop()
        await McpManager.instance.close()
    }
}
