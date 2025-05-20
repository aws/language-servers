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

            const item: DetailedListItem = {
                title: serverName,
                description: `Command: ${config.command}`,
            }

            if (config.disabled) {
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
        this.#features.logging.log(`[VSCode Server] onMcpServerClick event with params: ${JSON.stringify(params)}`)

        // Use a map of handlers for different action types
        const handlers: Record<string, () => Promise<any>> = {
            'add-new-mcp': () => this.#handleAddNewMcp(params),
            'save-mcp': () => this.#handleSaveMcp(params),
            'open-mcp-server': () => this.#handleOpenMcpServer(params),
            'mcp-permission-change': () => this.#handleMcpPermissionChange(params),
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
            configPath = getGlobalMcpConfigPath(this.#features.workspace.fs.getUserHomeDir())
        }
        // TODO: According to workspace specific scope and persona and pass configPath to addServer
        await McpManager.instance.addServer(config.name, config, configPath)

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
     * Builds filter options for server configuration
     */
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
            return 'Deny'
        } else {
            return 'Ask to run'
        }
    }

    /**
     * Builds permission options excluding the current one
     */
    #buildPermissionOptions(currentPermission: string) {
        interface PermissionOption {
            label: string
            value: string
        }

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

        if (currentPermission !== 'Deny') {
            permissionOptions.push({
                label: 'Deny',
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
                } else if (permValue === 'deny') {
                    toolOverrides[key] = { disabled: true }
                }
            }
        })

        return toolOverrides
    }
}
