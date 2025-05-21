import { Features } from '../../../types'
import { McpManager } from './mcpManager'
import {
    DetailedListGroup,
    DetailedListItem,
    FilterOption,
    ListMcpServersParams,
    McpServerClickParams,
} from '@aws/language-server-runtimes/protocol'
import { getGlobalMcpConfigPath } from './mcpUtils'
import { MCPServerConfig } from './mcpTypes'

interface PermissionOption {
    label: string
    value: string
}

export class McpEventHandler {
    #features: Features

    constructor(features: Features) {
        this.#features = features
    }

    /**
     * Handles the list MCP servers event
     */
    async onListMcpServers(params: ListMcpServersParams) {
        const mcpManagerServerConfigs = McpManager.instance.getAllServerConfigs()

        // Transform server configs into DetailedListItem objects
        const activeItems: DetailedListItem[] = []
        const disabledItems: DetailedListItem[] = []

        Array.from(mcpManagerServerConfigs.entries()).forEach(([serverName, config]) => {
            const toolsWithStates = McpManager.instance.getAllToolsWithStates(serverName)
            const toolsCount = toolsWithStates.length
            const serverState = McpManager.instance.getServerState(serverName)

            const item: DetailedListItem = {
                title: serverName,
                description: `Command: ${config.command}`,
                children: [
                    {
                        groupName: 'serverInformation',
                        children: [
                            {
                                title: 'status',
                                description: serverState?.status || 'Unknown',
                            },
                            {
                                title: 'toolcount',
                                description: `${toolsCount}`,
                            },
                        ],
                    },
                ],
            }

            if (config.disabled) {
                disabledItems.push(item)
            } else {
                activeItems.push({
                    ...item,
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
        this.#features.logging.log(`[VSCode Server] onMcpServerClick event with params: ${JSON.stringify(params)}`)

        // Use a map of handlers for different action types
        const handlers: Record<string, () => Promise<any>> = {
            'add-new-mcp': () => this.#handleAddNewMcp(params),
            'save-mcp': () => this.#handleSaveMcp(params),
            'open-mcp-server': () => this.#handleOpenMcpServer(params),
            'mcp-permission-change': () => this.#handleMcpPermissionChange(params),
            'refresh-mcp-list': () => this.#handleRefreshMCPList(params),
            'mcp-enable-server': () => this.#handleEnableMcpServer(params),
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
                    type: 'list',
                    id: 'args',
                    title: 'Arguments - optional',
                    mandatory: false,
                    items: [
                        {
                            id: 'arg_key',
                            type: 'textinput',
                        },
                    ],
                    value: [
                        {
                            persistent: true,
                            value: {
                                arg_key: '',
                            },
                        },
                    ],
                },
                {
                    type: 'list',
                    id: 'env_variables',
                    title: 'Environment variables - optional',
                    mandatory: false,
                    items: [
                        {
                            id: 'env_var_name',
                            title: 'Name',
                            type: 'textinput',
                        },
                        {
                            id: 'env_var_value',
                            title: 'Value',
                            type: 'textinput',
                        },
                    ],
                    value: [],
                },
                {
                    type: 'numericinput',
                    id: 'timeout',
                    title: 'Timeout',
                    description: 'Seconds',
                    value: '60', // Default value
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

        // Process args to string[]
        let args: string[] = []
        const argsValue = params.optionsValues.args

        // Handle the case where argsValue might be a direct array or another type
        try {
            // Try to safely access and process the value
            const argsArray = Array.isArray(argsValue) ? argsValue : []
            args = argsArray
                .map((item: any) => {
                    return typeof item === 'object' && item !== null && 'arg_key' in item ? String(item.arg_key) : ''
                })
                .filter(Boolean)
        } catch (e) {
            this.#features.logging.warn(`Failed to process args: ${e}`)
        }

        // Process env_variables to Record<string, string>
        let env: Record<string, string> = {}
        const envValue = params.optionsValues.env_variables

        // Handle the case where envValue might be a direct array or another type
        try {
            // Try to safely access and process the value
            const envArray = Array.isArray(envValue) ? envValue : []
            env = envArray.reduce((acc: Record<string, string>, item: any) => {
                if (item && typeof item === 'object' && 'env_var_name' in item && 'env_var_value' in item) {
                    acc[String(item.env_var_name)] = String(item.env_var_value)
                }
                return acc
            }, {})
        } catch (e) {
            this.#features.logging.warn(`Failed to process env variables: ${e}`)
        }

        const serverName = params.optionsValues.name
        const config: MCPServerConfig = {
            command: params.optionsValues.command,
            args,
            env,
            timeout: parseInt(params.optionsValues.timeout),
            disabled: false,
        }

        let configPath = ''
        if (params.optionsValues.scope === 'global') {
            configPath = getGlobalMcpConfigPath(this.#features.workspace.fs.getUserHomeDir())
        }
        // TODO: According to workspace specific scope and persona and pass configPath to addServer
        await McpManager.instance.addServer(serverName, config, configPath)

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

        const toolsWithStates = McpManager.instance.getAllToolsWithStates(serverName)
        const filterOptions = this.#buildServerFilterOptions(serverName, toolsWithStates)

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
     * Handles enabling an MCP server
     */
    async #handleEnableMcpServer(params: McpServerClickParams) {
        const serverName = params.title
        if (!serverName) {
            return { id: params.id }
        }
        try {
            await McpManager.instance.updateServerPermission(serverName, { disabled: false })
            await this.#handleRefreshMCPList({
                id: params.id,
            })
        } catch (error) {
            this.#features.logging.error(`Failed to enable MCP server: ${error}`)
        }
        return { id: params.id }
    }

    /**
     * Builds filter options for server configuration
     */
    /**
     * Handles disabling an MCP server
     */
    async #handleDisableMcpServer(params: McpServerClickParams) {
        const serverName = params.title
        if (!serverName) {
            return { id: params.id }
        }

        try {
            await McpManager.instance.updateServerPermission(serverName, { disabled: true })
        } catch (error) {
            this.#features.logging.error(`Failed to disable MCP server: ${error}`)
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
            this.#features.logging.error(`Failed to delete MCP server: ${error}`)
        }

        return { id: params.id }
    }

    #buildServerFilterOptions(serverName: string, toolsWithStates: any[]) {
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

        // Get server config to check existing permissions
        const serverConfig = McpManager.instance.getAllServerConfigs().get(serverName)

        // Add tool select options
        toolsWithStates.forEach(item => {
            const toolName = item.tool.toolName
            const currentPermission = this.#getCurrentPermission(serverConfig, toolName)
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
     * Gets the current permission setting for a tool
     */
    #getCurrentPermission(serverConfig: any, toolName: string): string {
        const toolOverrides = serverConfig?.toolOverrides?.[toolName]

        if (toolOverrides?.autoApprove === true) {
            return 'Always run'
        } else if (toolOverrides?.disabled === true) {
            return 'Disable'
        } else {
            return 'Ask to run'
        }
    }

    /**
     * Builds permission options excluding the current one
     */
    #buildPermissionOptions(currentPermission: string) {
        const permissionOptions: PermissionOption[] = []

        if (currentPermission !== 'Always run') {
            permissionOptions.push({
                label: 'Always run',
                value: 'always',
            })
        }

        if (currentPermission !== 'Ask to run') {
            permissionOptions.push({
                label: 'Ask to run',
                value: 'ask',
            })
        }

        if (currentPermission !== 'Disable') {
            permissionOptions.push({
                label: 'Disable',
                value: 'disable',
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

            const toolOverrides = this.#processPermissionUpdates(updatedPermissionConfig)

            // Update the permissions directly in the config file
            await McpManager.instance.updateServerPermission(serverName, { toolOverrides })
            return { id: params.id }
        } catch (error) {
            this.#features.logging.error(`Failed to update MCP permissions: ${error}`)
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
            this.#features.logging.error(`Failed to reinitialize MCP servers: ${err}`)
            return {
                id: params.id,
            }
        }
    }

    /**
     * Processes permission updates from the UI
     */
    #processPermissionUpdates(updatedPermissionConfig: any) {
        const toolOverrides: Record<string, { autoApprove?: boolean; disabled?: boolean }> = {}

        // Process each tool permission setting
        Object.entries(updatedPermissionConfig).forEach(([key, value]) => {
            // Skip the scope setting
            if (key === 'scope') return

            // Only process entries with actual values
            if (value) {
                const permValue = value as string

                if (permValue === 'always') {
                    toolOverrides[key] = { autoApprove: true, disabled: false }
                } else if (permValue === 'ask') {
                    toolOverrides[key] = { autoApprove: false, disabled: false }
                } else if (permValue === 'disable') {
                    toolOverrides[key] = { disabled: true }
                }
            }
        })

        return toolOverrides
    }
}
