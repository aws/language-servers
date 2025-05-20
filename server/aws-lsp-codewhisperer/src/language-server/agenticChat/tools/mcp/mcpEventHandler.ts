import { Features } from '../../../types'
import { McpManager } from './mcpManager'
import {
    DetailedListGroup,
    DetailedListItem,
    FilterOption,
    ListMcpServersParams,
    McpServerClickParams,
} from '@aws/language-server-runtimes/protocol'
import { getGlobalMcpConfigPath, getGlobalPersonaConfigPath, getWorkspacePersonaConfigPaths } from './mcpUtils'
import { MCPServerPermission } from './mcpTypes'

interface PermissionOption {
    label: string
    value: string
}

export class McpEventHandler {
    constructor(private features: Pick<Features, 'logging' | 'workspace' | 'lsp'>) {}

    /**
     * Handles the list MCP servers event
     */
    async onListMcpServers(params: ListMcpServersParams) {
        const mcpManager = McpManager.instance
        const mcpManagerServerConfigs = mcpManager.getAllServerConfigs()

        // Transform server configs into DetailedListItem objects
        const activeItems: DetailedListItem[] = []
        const disabledItems: DetailedListItem[] = []

        Array.from(mcpManagerServerConfigs.entries()).forEach(([serverName, config]) => {
            const toolsWithPermissions = mcpManager.getAllToolsWithPermissions(serverName)
            const toolsCount = toolsWithPermissions.length

            const item: DetailedListItem = {
                title: serverName,
                description: `Command: ${config.command}`,
            }

            if (mcpManager.isServerDisabled(serverName)) {
                disabledItems.push(item)
            } else {
                activeItems.push({
                    ...item,
                    description: `${toolsCount}`,
                })
            }
        })

        // Create the groups
        const groups: DetailedListGroup[] = []

        if (activeItems.length > 0) {
            groups.push({
                groupName: 'Active',
                children: activeItems,
                actions: [
                    {
                        id: 'active-servers',
                        text: `${activeItems.length} servers with tools`,
                    },
                ],
            })
        }

        if (disabledItems.length > 0) {
            groups.push({
                groupName: 'Disabled',
                children: disabledItems,
            })
        }

        // Return the result in the expected format
        return {
            header: {
                title: 'MCP Servers',
                description:
                    "Q automatically uses any MCP servers that have been added, so you don't have to add them as context.",
            },
            list: groups,
        }
    }

    /**
     * Handles MCP server click events
     */

    async onMcpServerClick(params: McpServerClickParams) {
        this.features.logging.log(`[VSCode Server] onMcpServerClick event with params: ${JSON.stringify(params)}`)

        // Use a map of handlers for different action types
        const handlers: Record<string, () => Promise<any>> = {
            'add-new-mcp': () => this.#handleAddNewMcp(params),
            'save-mcp': () => this.#handleSaveMcp(params),
            'open-mcp-server': () => this.#handleOpenMcpServer(params),
            'mcp-permission-change': () => this.#handleMcpPermissionChange(params),
            'refresh-mcp-list': () => this.#handleRefreshMCPList(params),
            'mcp-disable-server': () => this.#handleDisableMcpServer(params),
            'mcp-delete-server': () => this.#handleDeleteMcpServer(params),
        }

        // Execute the appropriate handler or return default response
        const handler = handlers[params.id]
        if (handler) {
            return await handler()
        }

        return this.#getDefaultMcpResponse(params.id)
    }

    /**
     * Returns the default MCP servers response
     */
    #getDefaultMcpResponse(id: string) {
        return {
            id,
            header: {
                title: 'MCP Servers',
                status: {},
                description:
                    'Q automatically uses any MCP servers that have been added, so you don\'t have to add them as context. All MCPs are defaulted to "Ask before running".',
                actions: [],
            },
            list: [],
        }
    }

    /**
     * Handles the add new MCP server action
     */
    async #handleAddNewMcp(params: McpServerClickParams) {
        return {
            id: params.id,
            header: {
                title: 'Add MCP Server',
                status: {},
                actions: [],
            },
            list: [],
            filterActions: [
                {
                    id: 'cancel-mcp',
                    text: 'Cancel',
                },
                {
                    id: 'save-mcp',
                    text: 'Save',
                    status: 'primary',
                },
            ],
            filterOptions: [
                {
                    type: 'radiogroup',
                    id: 'scope',
                    title: 'Scope',
                    options: [
                        {
                            label: `Global - Used globally. Edit config`,
                            value: 'global',
                        },
                        {
                            label: `This workspace - Only used in this workspace. Edit config`,
                            value: 'workspace',
                        },
                    ],
                },
                {
                    type: 'textinput',
                    id: 'name',
                    title: 'Name',
                },
                {
                    type: 'select',
                    id: 'transport',
                    title: 'Transport',
                    options: [
                        {
                            label: 'stdio',
                            value: 'yes',
                        },
                    ],
                },
                {
                    type: 'textinput',
                    id: 'command',
                    title: 'Command',
                },
                {
                    type: 'numericinput',
                    id: 'timeout',
                    title: 'Timeout',
                    description: 'Seconds',
                },
            ],
        }
    }

    /**
     * Handles saving a new MCP server configuration
     */
    async #handleSaveMcp(params: McpServerClickParams) {
        if (!params.optionsValues) {
            return this.#getDefaultMcpResponse(params.id)
        }

        const config = {
            name: params.optionsValues.name,
            command: params.optionsValues.command,
            transport: params.optionsValues.transport,
            timeout: parseInt(params.optionsValues.timeout),
            disabled: false,
        }

        let configPath = ''
        if (params.optionsValues.scope === 'global') {
            configPath = getGlobalMcpConfigPath(this.features.workspace.fs.getUserHomeDir())
        }
        let personaPath = ''
        if (params.optionsValues.scope === 'global') {
            personaPath = getGlobalPersonaConfigPath(this.features.workspace.fs.getUserHomeDir())
        }
        // TODO: According to workspace specific scope and persona and pass configPath to addServer
        await McpManager.instance.addServer(config.name, config, configPath, personaPath)

        return this.#getDefaultMcpResponse(params.id)
    }

    /**
     * Handles opening an MCP server details view
     */
    async #handleOpenMcpServer(params: McpServerClickParams) {
        const serverName = params.title
        if (!serverName) {
            return { id: params.id }
        }

        const toolsWithPermissions = McpManager.instance.getAllToolsWithPermissions(serverName)
        const filterOptions = this.#buildServerFilterOptions(serverName, toolsWithPermissions)

        return {
            id: params.id,
            header: {
                title: serverName,
                status: {},
                actions: [
                    {
                        id: 'edit-setup',
                        icon: 'pencil',
                        text: 'Edit setup',
                    },
                    {
                        id: 'mcp-details-menu',
                        icon: 'ellipsis-h',
                        text: '',
                    },
                ],
            },
            list: [],
            filterActions: [],
            filterOptions,
        }
    }

    /**
     * Handles disabling an MCP server
     */
    async #handleDisableMcpServer(params: McpServerClickParams) {
        const serverName = params.title
        if (!serverName) {
            return { id: params.id }
        }

        // todo handle ws/global selection
        let personaPath = getGlobalPersonaConfigPath(this.features.workspace.fs.getUserHomeDir())

        // build new permission object
        const perm: MCPServerPermission = {
            enabled: false,
            toolPerms: {},
            __configPath__: personaPath,
        }

        try {
            await McpManager.instance.updateServerPermission(serverName, perm)
        } catch (error) {
            this.features.logging.error(`Failed to disable MCP server: ${error}`)
        }

        return { id: params.id }
    }

    /**
     * Handles deleting an MCP server
     */
    async #handleDeleteMcpServer(params: McpServerClickParams) {
        const serverName = params.title
        if (!serverName) {
            return { id: params.id }
        }

        try {
            await McpManager.instance.removeServer(serverName)
        } catch (error) {
            this.features.logging.error(`Failed to delete MCP server: ${error}`)
        }

        return { id: params.id }
    }

    /**
     * Builds filter options for server configuration
     */
    #buildServerFilterOptions(serverName: string, toolsWithPermissions: any[]) {
        const filterOptions: FilterOption[] = [
            {
                type: 'radiogroup',
                id: 'scope',
                title: 'Scope',
                options: [
                    {
                        label: `Global - Used globally. Edit config`,
                        value: 'global',
                    },
                    {
                        label: `This workspace - Only used in this workspace. Edit config`,
                        value: 'workspace',
                    },
                ],
            },
        ]

        // Add tool select options
        toolsWithPermissions.forEach(item => {
            const toolName = item.tool.toolName
            const currentPermission = item.permission
            const permissionOptions = this.#buildPermissionOptions(currentPermission)

            filterOptions.push({
                type: 'select',
                id: `${toolName}`,
                title: toolName,
                placeholder: currentPermission,
                options: permissionOptions,
            })
        })

        return filterOptions
    }

    /**
     * Builds permission options excluding the current one
     */
    #buildPermissionOptions(currentPermission: string) {
        const permissionOptions: PermissionOption[] = []

        if (currentPermission !== 'alwaysAllow') {
            permissionOptions.push({
                label: 'Always run',
                value: 'alwaysAllow',
            })
        }

        if (currentPermission !== 'ask') {
            permissionOptions.push({
                label: 'Ask to run',
                value: 'ask',
            })
        }

        if (currentPermission !== 'deny') {
            permissionOptions.push({
                label: 'Disable',
                value: 'deny',
            })
        }

        return permissionOptions
    }

    /**
     * Handles MCP permission change events
     */
    async #handleMcpPermissionChange(params: McpServerClickParams) {
        const serverName = params.title
        const updatedPermissionConfig = params.optionsValues

        if (!serverName || !updatedPermissionConfig) {
            return { id: params.id }
        }

        try {
            const serverConfig = McpManager.instance.getAllServerConfigs().get(serverName)
            if (!serverConfig) {
                throw new Error(`Server '${serverName}' not found`)
            }

            const MCPServerPermission = this.#processPermissionUpdates(updatedPermissionConfig)

            await McpManager.instance.updateServerPermission(serverName, MCPServerPermission)
            return { id: params.id }
        } catch (error) {
            this.features.logging.error(`Failed to update MCP permissions: ${error}`)
            return { id: params.id }
        }
    }

    /**
     * Handled refresh MCP list events
     */
    async #handleRefreshMCPList(params: McpServerClickParams) {
        try {
            await McpManager.instance.reinitializeMcpServers()
            return {
                id: params.id,
            }
        } catch (err) {
            this.features.logging.error(`Failed to reinitialize MCP servers: ${err}`)
            return {
                id: params.id,
            }
        }
    }

    /**
     * Processes permission updates from the UI
     */
    #processPermissionUpdates(updatedPermissionConfig: any) {
        // todo handle ws/global selection
        let personaPath = getGlobalPersonaConfigPath(this.features.workspace.fs.getUserHomeDir())

        // build new permission object
        const perm: MCPServerPermission = {
            enabled: true,
            toolPerms: {},
            __configPath__: personaPath,
        }

        // Process each tool permission setting
        for (const [key, val] of Object.entries(updatedPermissionConfig)) {
            if (key === 'scope') continue
            switch (val) {
                case 'always':
                    perm.toolPerms[key] = 'alwaysAllow'
                    break
                case 'deny':
                    perm.toolPerms[key] = 'deny'
                    break
                case 'ask':
                default:
                    perm.toolPerms[key] = 'ask'
            }
        }

        return perm
    }
}
