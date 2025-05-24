import { Features } from '../../../types'
import { MCP_SERVER_STATUS_CHANGED, McpManager } from './mcpManager'
import {
    DetailedListGroup,
    DetailedListItem,
    FilterOption,
    ListMcpServersParams,
    McpServerClickParams,
} from '@aws/language-server-runtimes/protocol'

import { getGlobalMcpConfigPath, getGlobalPersonaConfigPath, getWorkspacePersonaConfigPaths } from './mcpUtils'
import { McpPermissionType, MCPServerConfig, MCPServerPermission, McpServerRuntimeState } from './mcpTypes'

interface PermissionOption {
    label: string
    value: string
}

export class McpEventHandler {
    #features: Features
    #eventListenerRegistered: boolean

    constructor(features: Features) {
        this.#features = features
        this.#eventListenerRegistered = false
    }

    /**
     * Handles MCP server state changes and notifies the client
     */
    handleServerStateChange(serverName: string, state: McpServerRuntimeState) {
        this.#features.logging.info(`MCP server state changed: ${serverName} - ${state.status}`)

        // Send chat options update with notification
        try {
            this.#features.logging.info(`Sending chatOptionsUpdate with notification for server: ${serverName}`)
            this.#features.chat.sendChatUpdate({
                tabId: 'mcpserver',
                data: {
                    placeholderText: 'mcp-server-update',
                    messages: [],
                },
            })
            this.#features.logging.info('chatOptionsUpdate sent successfully')
        } catch (error) {
            this.#features.logging.error(`Failed to send chatOptionsUpdate: ${error}`)
        }
    }

    /**
     * Handles the list MCP servers event
     */
    async onListMcpServers(params: ListMcpServersParams) {
        const mcpManager = McpManager.instance

        // Only register the event listener once
        if (!this.#eventListenerRegistered) {
            mcpManager.events.on(MCP_SERVER_STATUS_CHANGED, (serverName: string, state: McpServerRuntimeState) => {
                this.#features.logging.info(`Received MCP_SERVER_STATUS_CHANGED event: ${serverName} - ${state.status}`)
                this.handleServerStateChange(serverName, state)
            })
            this.#eventListenerRegistered = true
        }
        const mcpManagerServerConfigs = mcpManager.getAllServerConfigs()

        // Transform server configs into DetailedListItem objects
        const activeItems: DetailedListItem[] = []
        const disabledItems: DetailedListItem[] = []
        const builtInItems: DetailedListItem[] = []

        // Get built-in tools programmatically
        const allTools = this.#features.agent.getTools({ format: 'bedrock' })
        const mcpToolNames = new Set(mcpManager.getAllTools().map(tool => tool.toolName))
        const builtInTools = allTools
            .filter(tool => !mcpToolNames.has(tool.toolSpecification.name))
            .map(tool => ({
                name: tool.toolSpecification.name,
                description: tool.toolSpecification.description || `${tool.toolSpecification.name} tool`,
            }))

        // Add built-in tools as a server in the active items
        // activeItems.push({
        //     title: 'Built-in',
        //     description: `${builtInTools.length} tools`,
        //     children: [
        //         {
        //             groupName: 'serverInformation',
        //             children: [
        //                 {
        //                     title: 'status',
        //                     description: 'ENABLED',
        //                 },
        //                 {
        //                     title: 'toolcount',
        //                     description: `${builtInTools.length}`,
        //                 },
        //             ],
        //         },
        //     ],
        // })

        Array.from(mcpManagerServerConfigs.entries()).forEach(([serverName, config]) => {
            const toolsWithPermissions = mcpManager.getAllToolsWithPermissions(serverName)
            const toolsCount = toolsWithPermissions.length
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
                                description: serverState?.status || 'DISABLED',
                            },
                            {
                                title: 'toolcount',
                                description: `${toolsCount}`,
                            },
                        ],
                    },
                ],
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
        this.#features.logging.log(`[VSCode Server] onMcpServerClick event with params: ${JSON.stringify(params)}`)

        // Use a map of handlers for different action types
        const handlers: Record<string, () => Promise<any>> = {
            'add-new-mcp': () => this.#handleAddNewMcp(params),
            'save-mcp': () => this.#handleSaveMcp(params),
            'open-mcp-server': () => this.#handleOpenMcpServer(params),
            'edit-mcp': () => this.#handleEditMcpServer(params),

            'mcp-permission-change': () => this.#handleMcpPermissionChange(params),
            'refresh-mcp-list': () => this.#handleRefreshMCPList(params),
            'mcp-enable-server': () => this.#handleEnableMcpServer(params),
            'mcp-disable-server': () => this.#handleDisableMcpServer(params),
            'mcp-delete-server': () => this.#handleDeleteMcpServer(params),
            'mcp-fix-server': () => this.#handleEditMcpServer(params),
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

    async #handleAddNewMcp(params: McpServerClickParams, error?: string) {
        const existingValues = params.optionsValues || {}
        let argsValue = [
            {
                persistent: true,
                value: { arg_key: '' },
            },
        ]
        if (existingValues.args && Array.isArray(existingValues.args)) {
            argsValue = existingValues.args.map((arg, index) => ({
                persistent: index === 0,
                value: {
                    arg_key: arg.arg_key || '',
                },
            }))
        }

        let envVarsValue = [
            {
                persistent: true,
                value: {
                    env_var_name: '',
                    env_var_value: '',
                },
            },
        ]
        if (existingValues.env_variables && Array.isArray(existingValues.env_variables)) {
            envVarsValue = existingValues.env_variables.map((env, index) => ({
                persistent: index === 0,
                value: {
                    env_var_name: env.env_var_name || '',
                    env_var_value: env.env_var_value || '',
                },
            }))
        }

        return {
            id: params.id,
            header: {
                title: 'Add MCP Server',
                status: error
                    ? {
                          title: error,
                          icon: 'cancel-circle',
                          status: 'error',
                      }
                    : {},
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
                    status: error ? 'error' : 'primary',
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
                    value: existingValues.scope || 'global',
                },
                {
                    type: 'textinput',
                    id: 'name',
                    title: 'Name',
                    value: existingValues.name || '',
                    mandatory: true,
                },
                {
                    type: 'select',
                    id: 'transport',
                    title: 'Transport',
                    mandatory: true,
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
                    value: existingValues.command || '',
                    mandatory: true,
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
                    value: argsValue,
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
                    value: envVarsValue,
                },
                {
                    type: 'numericinput',
                    id: 'timeout',
                    title: 'Timeout',
                    description: 'Seconds',
                    value: existingValues.timeout || '60', // Default value
                    mandatory: false,
                },
            ],
        }
    }
    /**
     * Validates the MCP server form values
     */
    #validateMcpServerForm(values: Record<string, string>): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!values.name || values.name.trim() === '') {
            errors.push('Server name cannot be empty')
        } else {
            if (!/^[a-zA-Z0-9-]+$/.test(values.name)) {
                errors.push('Server name can only contain alphanumeric characters and hyphens')
            }
        }

        if (!values.command || values.command.trim() === '') {
            errors.push('Command is required for stdio transport')
        }

        if (values.timeout && values.timeout.trim() !== '') {
            const timeoutNum = Number(values.timeout.trim())
            if (timeoutNum <= 0) {
                errors.push('Timeout must be a positive number')
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    /**
     * Handles saving a new MCP server configuration
     */
    async #handleSaveMcp(params: McpServerClickParams) {
        if (!params.optionsValues) {
            return this.#getDefaultMcpResponse(params.id)
        }
        // Validate form values - this should already be validated client-side
        // but we validate again as a safety measure
        const validation = this.#validateMcpServerForm(params.optionsValues)
        let error: string
        if (!validation.isValid) {
            this.#features.logging.error(`Invalid MCP server form: ${validation.errors.join(', ')}`)
            error = validation.errors[0]
            params.id = 'add-new-mcp'
            return this.#handleAddNewMcp(params, error)
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
        }

        // TODO: handle ws/global selection
        const configPath = getGlobalMcpConfigPath(this.#features.workspace.fs.getUserHomeDir())
        const personaPath = getGlobalPersonaConfigPath(this.#features.workspace.fs.getUserHomeDir())

        if (McpManager.instance.getAllServerConfigs().has(serverName)) {
            // update server
            await McpManager.instance.updateServer(serverName, config)
        } else {
            // create server
            await McpManager.instance.addServer(serverName, config, configPath, personaPath)
        }

        return this.#handleOpenMcpServer({ id: 'open-mcp-server', title: serverName })
    }

    /**
     * Handles opening an MCP server details view
     */
    async #handleOpenMcpServer(params: McpServerClickParams) {
        const serverName = params.title
        if (!serverName) {
            return { id: params.id }
        }

        let filterOptions: FilterOption[] = []
        if (serverName === 'Built-in') {
            // Handle Built-in server specially
            const allTools = this.#features.agent.getTools({ format: 'bedrock' })
            const mcpToolNames = new Set(McpManager.instance.getAllTools().map(tool => tool.toolName))
            const builtInTools = allTools
                .filter(tool => !mcpToolNames.has(tool.toolSpecification.name))
                .map(tool => {
                    // Set default permission based on tool name
                    const permission = 'alwaysAllow'

                    return {
                        tool: {
                            toolName: tool.toolSpecification.name,
                            description: tool.toolSpecification.description || `${tool.toolSpecification.name} tool`,
                        },
                        permission,
                    }
                })

            filterOptions = this.#buildServerFilterOptions(serverName, builtInTools)

            return {
                id: params.id,
                header: {
                    title: serverName,
                    status: {},
                    actions: [],
                },
                list: [],
                filterActions: [],
                filterOptions,
            }
        } else {
            // Handle regular MCP servers
            const toolsWithPermissions = McpManager.instance.getAllToolsWithPermissions(serverName)
            filterOptions = this.#buildServerFilterOptions(serverName, toolsWithPermissions)

            return {
                id: params.id,
                header: {
                    title: serverName,
                    status: {},
                    actions: [
                        {
                            id: 'edit-mcp',
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
    }

    /**
     * Handles enabling an MCP server
     */
    async #handleEnableMcpServer(params: McpServerClickParams) {
        const serverName = params.title
        if (!serverName) {
            return { id: params.id }
        }

        // TODO: handle ws/global selection
        let personaPath = getGlobalPersonaConfigPath(this.#features.workspace.fs.getUserHomeDir())

        const perm: MCPServerPermission = {
            enabled: true,
            toolPerms: {},
            __configPath__: personaPath,
        }

        try {
            await McpManager.instance.updateServerPermission(serverName, perm)
            await this.#handleRefreshMCPList({
                id: params.id,
            })
        } catch (error) {
            this.#features.logging.error(`Failed to enable MCP server: ${error}`)
        }
        return { id: params.id }
    }

    /**
     * Handles disabling an MCP server
     */
    async #handleDisableMcpServer(params: McpServerClickParams) {
        const serverName = params.title
        if (!serverName) {
            return { id: params.id }
        }

        // TODO: handle ws/global selection
        let personaPath = getGlobalPersonaConfigPath(this.#features.workspace.fs.getUserHomeDir())

        const perm: MCPServerPermission = {
            enabled: false,
            toolPerms: {},
            __configPath__: personaPath,
        }

        try {
            await McpManager.instance.updateServerPermission(serverName, perm)
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

    /**
     * Handles edit MCP configuration
     */
    async #handleEditMcpServer(params: McpServerClickParams) {
        const serverName = params.title
        if (!serverName) {
            return { id: params.id }
        }

        const config = McpManager.instance.getAllServerConfigs().get(serverName)
        if (!config) {
            return {
                id: params.id,
                header: {
                    title: 'Edit MCP Server',
                    status: {
                        title: `Server "${serverName}" not found`,
                        icon: 'cancel-circle',
                        status: 'error',
                    },
                },
                list: [],
            }
        }

        const existingValues: Record<string, any> = {
            name: serverName,
            transport: 'stdio',
            command: config.command,
            args: (config.args ?? []).map(a => ({ arg_key: a })),
            env_variables: Object.entries(config.env ?? {}).map(([k, v]) => ({
                env_var_name: k,
                env_var_value: v,
            })),
            timeout: (config.timeout ?? 60).toString(),
        }

        const view = await this.#handleAddNewMcp({
            ...params,
            id: 'add-new-mcp',
            optionsValues: existingValues,
        })

        view.id = params.id
        if (view.header) {
            view.header.title = 'Edit MCP Server'
        }
        return view
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
                placeholder: 'global',
            },
        ]

        // Add tool select options
        toolsWithPermissions.forEach(item => {
            const toolName = item.tool.toolName
            const currentPermission = this.#getCurrentPermission(item.permission)
            // For Built-in server, use a special function that doesn't include the 'Disable' option
            const permissionOptions = this.#buildPermissionOptions(item.permission)

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
    #getCurrentPermission(permission: string): string {
        if (permission === McpPermissionType.alwaysAllow) {
            return 'Always run'
        } else if (permission === McpPermissionType.deny) {
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

        if (currentPermission !== McpPermissionType.alwaysAllow) {
            permissionOptions.push({ label: 'Always run', value: McpPermissionType.alwaysAllow })
        }

        if (currentPermission !== McpPermissionType.ask) {
            permissionOptions.push({ label: 'Ask to run', value: McpPermissionType.ask })
        }

        if (currentPermission !== McpPermissionType.deny) {
            permissionOptions.push({ label: 'Disable', value: McpPermissionType.deny })
        }

        return permissionOptions
    }

    /**
     * Builds permission options for Built-in tools (no 'Disable' option)
     */
    // #buildBuiltInPermissionOptions(currentPermission: string) {
    //     const permissionOptions: PermissionOption[] = []

    //     if (currentPermission !== 'alwaysAllow') {
    //         permissionOptions.push({
    //             label: 'Always run',
    //             value: 'alwaysAllow',
    //         })
    //     }

    //     if (currentPermission !== 'ask') {
    //         permissionOptions.push({
    //             label: 'Ask to run',
    //             value: 'ask',
    //         })
    //     }

    //     return permissionOptions
    // }

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
            // Skip server config check for Built-in server
            if (serverName !== 'Built-in') {
                const serverConfig = McpManager.instance.getAllServerConfigs().get(serverName)
                if (!serverConfig) {
                    throw new Error(`Server '${serverName}' not found`)
                }
            }

            const mcpServerPermission = this.#processPermissionUpdates(updatedPermissionConfig)

            await McpManager.instance.updateServerPermission(serverName, mcpServerPermission)
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
        // TODO: handle ws/global selection
        let personaPath = getGlobalPersonaConfigPath(this.#features.workspace.fs.getUserHomeDir())

        const perm: MCPServerPermission = {
            enabled: true,
            toolPerms: {},
            __configPath__: personaPath,
        }

        // Process each tool permission setting
        for (const [key, val] of Object.entries(updatedPermissionConfig)) {
            if (key === 'scope') continue

            // // Get the default permission for this tool from McpManager
            // let defaultPermission = McpManager.instance.getToolPerm(serverName, key)

            // // If no default permission is found, use 'alwaysAllow' for Built-in and 'ask' for MCP servers
            // if (!defaultPermission) {
            //     defaultPermission = serverName === 'Built-in' ? 'alwaysAllow' : 'ask'
            // }

            switch (val) {
                case McpPermissionType.alwaysAllow:
                    perm.toolPerms[key] = McpPermissionType.alwaysAllow
                    break
                case McpPermissionType.deny:
                    perm.toolPerms[key] = McpPermissionType.deny
                    break
                case McpPermissionType.ask:
                default:
                    perm.toolPerms[key] = McpPermissionType.ask
            }
        }

        return perm
    }
}
