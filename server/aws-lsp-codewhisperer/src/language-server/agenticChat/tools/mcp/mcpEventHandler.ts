import { Features } from '../../../types'
import { MCP_SERVER_STATUS_CHANGED, McpManager } from './mcpManager'
import { ChatTelemetryController } from '../../../chat/telemetry/chatTelemetryController'
import { ChokidarFileWatcher } from './chokidarFileWatcher'
// eslint-disable-next-line import/no-nodejs-modules
import * as path from 'path'
import {
    DetailedListGroup,
    DetailedListItem,
    FilterOption,
    ListMcpServersParams,
    McpServerClickParams,
    Status,
} from '@aws/language-server-runtimes/protocol'

import {
    getGlobalMcpConfigPath,
    getGlobalAgentConfigPath,
    getWorkspaceMcpConfigPaths,
    getWorkspaceAgentConfigPaths,
    sanitizeName,
    normalizePathFromUri,
} from './mcpUtils'
import {
    McpPermissionType,
    MCPServerConfig,
    MCPServerPermission,
    McpServerRuntimeState,
    McpServerStatus,
} from './mcpTypes'
import { TelemetryService } from '../../../../shared/telemetry/telemetryService'
import { URI } from 'vscode-uri'

interface PermissionOption {
    label: string
    value: string
    description?: string
}

export class McpEventHandler {
    #features: Features
    #eventListenerRegistered: boolean
    #currentEditingServerName: string | undefined
    #shouldDisplayListMCPServers: boolean
    #telemetryController: ChatTelemetryController
    #pendingPermissionConfig: { serverName: string; permission: MCPServerPermission } | undefined
    #newlyAddedServers: Set<string> = new Set()
    #fileWatcher: ChokidarFileWatcher
    #isProgrammaticChange: boolean = false
    #debounceTimer: NodeJS.Timeout | null = null
    #lastProgrammaticState: boolean = false
    #serverNameBeforeUpdate: string | undefined

    constructor(features: Features, telemetryService: TelemetryService) {
        this.#features = features
        this.#eventListenerRegistered = false
        this.#currentEditingServerName = undefined
        this.#shouldDisplayListMCPServers = true
        this.#telemetryController = new ChatTelemetryController(features, telemetryService)
        this.#pendingPermissionConfig = undefined
        this.#fileWatcher = new ChokidarFileWatcher(features.logging)
        this.#setupFileWatchers()
    }

    /**
     * Handles MCP server state changes and notifies the client
     */
    handleServerStateChange(serverName: string, state: McpServerRuntimeState) {
        this.#features.logging.info(`MCP server state changed: ${serverName} - ${state.status}`)

        if (this.#shouldDisplayListMCPServers) {
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
                this.#features.logging.info('chatOptionsUpdate event for MCP server status update sent successfully')
            } catch (error) {
                this.#features.logging.error(`Failed to send chatOptionsUpdate: ${error}`)
            }
        }
    }

    /**
     * Handles the list MCP servers event
     */
    async onListMcpServers(params: ListMcpServersParams) {
        this.#currentEditingServerName = undefined
        const mcpManager = McpManager.instance

        // Check for errors in loading MCP config files
        const configLoadErrors = mcpManager.getConfigLoadErrors()

        // Only register the event listener once
        if (!this.#eventListenerRegistered) {
            mcpManager.events.on(MCP_SERVER_STATUS_CHANGED, (serverName: string, state: McpServerRuntimeState) => {
                this.#features.logging.info(`Received MCP_SERVER_STATUS_CHANGED event: ${serverName} - ${state.status}`)
                this.handleServerStateChange(serverName, state)
            })
            this.#eventListenerRegistered = true
        }
        const mcpManagerServerConfigs = mcpManager.getAllServerConfigs()

        // Validate server configurations and get any error messages
        let combinedErrors = this.#validateMcpServerConfigs(mcpManagerServerConfigs)

        // Add config load errors if any
        if (configLoadErrors) {
            combinedErrors = combinedErrors ? `${configLoadErrors}\n\n${combinedErrors}` : configLoadErrors
        }

        // Parse validation errors to identify which servers have errors
        const serversWithErrors = new Set<string>()
        if (combinedErrors) {
            this.#features.logging.error(`MCP configuration and validation errors: ${combinedErrors}`)
            const validationErrors = this.#getValidationErrors(mcpManagerServerConfigs)
            validationErrors.forEach(error => {
                if (error.serverName) {
                    serversWithErrors.add(error.serverName)
                }
            })
        }

        // Transform server configs into DetailedListItem objects
        const activeItems: DetailedListItem[] = []
        const disabledItems: DetailedListItem[] = []

        // Get built-in tools programmatically
        const allTools = this.#features.agent.getTools({ format: 'bedrock' })
        const builtInToolNames = new Set(this.#features.agent.getBuiltInToolNames())
        const builtInTools = allTools
            .filter(tool => {
                return builtInToolNames.has(tool.toolSpecification.name) && tool.toolSpecification.name !== 'fsReplace'
            })
            .map(tool => ({
                name: tool.toolSpecification.name,
                description:
                    this.#getBuiltInToolDescription(tool.toolSpecification.name) ||
                    tool.toolSpecification.description ||
                    `${tool.toolSpecification.name} tool`,
            }))

        // Add built-in tools as a server in the active items
        activeItems.push({
            title: 'Built-in',
            description: `${builtInTools.length} tools`,
            children: [
                {
                    groupName: 'serverInformation',
                    children: [
                        {
                            title: 'status',
                            description: 'ENABLED',
                        },
                        {
                            title: 'toolcount',
                            description: `${builtInTools.length}`,
                        },
                    ],
                },
            ],
        })

        Array.from(mcpManagerServerConfigs.entries()).forEach(([serverName, config]) => {
            const toolsWithPermissions = mcpManager.getAllToolsWithPermissions(serverName)
            const toolsCount = toolsWithPermissions.length
            const serverState = McpManager.instance.getServerState(serverName)

            // Check if this server has validation errors
            const hasValidationErrors = serversWithErrors.has(serverName)
            const item: DetailedListItem = {
                title: serverName,
                description: `Command: ${config.command}`,
                children: [
                    {
                        groupName: 'serverInformation',
                        children: [
                            {
                                title: 'status',
                                description: hasValidationErrors ? 'FAILED' : serverState?.status || 'DISABLED',
                            },
                            {
                                title: 'toolcount',
                                description: `${toolsCount}`,
                            },
                        ],
                    },
                ],
            }

            // if (mcpManager.isServerDisabled(serverName)) {
            //     disabledItems.push(item)
            // } else {
            activeItems.push({
                ...item,
                description: `${toolsCount}`,
            })
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
        const header = {
            title: 'MCP Servers and Built-in Tools',
            description: "Add MCP servers to extend Q's capabilities.",
            // only  show error on list mcp server page if unable to read mcp.json file
            status: configLoadErrors
                ? { title: configLoadErrors, icon: 'cancel-circle', status: 'error' as Status }
                : undefined,
        }

        return { header, list: groups }
    }

    /**
     * Handles MCP server click events
     */

    async onMcpServerClick(params: McpServerClickParams) {
        this.#features.logging.log(`onMcpServerClick event with params: ${JSON.stringify(params)}`)

        // Use a map of handlers for different action types
        const handlers: Record<string, () => Promise<any>> = {
            'add-new-mcp': () => {
                this.#currentEditingServerName = undefined
                return this.#handleAddNewMcp(params)
            },
            'save-mcp': () => this.#handleSaveMcp(params),
            'change-transport': () => this.#handleChangeTransport(params),
            'open-mcp-server': () => this.#handleOpenMcpServer(params),
            'edit-mcp': () => this.#handleEditMcpServer(params),
            'mcp-permission-change': () => this.#handleMcpPermissionChange(params),
            'save-permission-change': () => this.#handleSavePermissionChange(params),
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

    async generateEmptyBuiltInToolPermission() {
        const personaPath = await this.#getAgentPath()
        const perm: MCPServerPermission = {
            enabled: true,
            toolPerms: {},
            __configPath__: personaPath,
        }

        return perm
    }

    /**
     * Returns the default MCP servers response
     */
    #getDefaultMcpResponse(id: string) {
        return {
            id,
            header: {
                title: 'MCP Servers and Built-in Tools',
                status: {},
                description: `Add MCP servers to extend Q's capabilities.`,
                actions: [],
            },
            list: [],
        }
    }

    async #handleAddNewMcp(params: McpServerClickParams, error?: string) {
        const existingValues = params.optionsValues || {}

        // Arguments (stdio)
        let argsValue = [{ persistent: true, value: { arg_key: '' } }]
        if (existingValues.args && Array.isArray(existingValues.args)) {
            argsValue = existingValues.args.map((arg, index) => ({
                persistent: index === 0,
                value: { arg_key: arg.arg_key || '' },
            }))
        }

        // Environment variables (stdio)
        let envVarsValue = [
            {
                persistent: true,
                value: { env_var_name: '', env_var_value: '' },
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

        // Headers (http)
        let headersValue: any[] = []
        if (existingValues.headers && Array.isArray(existingValues.headers)) {
            headersValue = existingValues.headers.map(hdr => ({
                persistent: false, // allow every row to be deleted
                value: {
                    key: hdr.key || '',
                    value: hdr.value || '',
                },
            }))
        }

        if (existingValues.name) {
            const serverName = existingValues.name
            const sanitizedServerName = sanitizeName(serverName)
            const serverState = McpManager.instance.getAllServerConfigs().get(sanitizedServerName)
            // Check if the server exists in McpManager
            const mcpManager = McpManager.instance
            const serverConfig = mcpManager.getAllServerConfigs().get(sanitizedServerName)

            if (serverConfig) {
                // Use the helper method to determine if the server is global
                existingValues.scope = mcpManager.isServerGlobal(sanitizedServerName) ? 'global' : 'workspace'
            } else {
                // Default to global scope for new servers
                existingValues.scope = 'global'
            }
        }

        const serverStatusError = this.#getServerStatusError(existingValues.name) || {}

        // Determine which transport is selected (default to stdio)
        const selectedTransport = existingValues.transport || 'stdio'

        return {
            id: params.id,
            header: {
                title: 'Add MCP Server',
                status: error ? { title: error, icon: 'cancel-circle', status: 'error' as Status } : serverStatusError,
                actions: [],
            },
            list: [],
            filterActions: [
                { id: 'cancel-mcp', text: 'Cancel' },
                { id: 'save-mcp', text: 'Save', status: error ? ('error' as Status) : 'primary' },
            ],
            filterOptions: (() => {
                const common = [
                    {
                        type: 'radiogroup',
                        id: 'scope',
                        title: 'Scope',
                        options: [
                            { label: 'Global - Used globally.', value: 'global' },
                            { label: 'This workspace - Only used in this workspace.', value: 'workspace' },
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
                            { label: 'stdio', value: 'stdio' },
                            { label: 'http', value: 'http' },
                        ],
                        value: selectedTransport,
                    },
                ]

                if (selectedTransport === 'http') {
                    return [
                        ...common,
                        {
                            type: 'textinput',
                            id: 'url',
                            title: 'URL',
                            value: existingValues.url || '',
                            mandatory: true,
                        },
                        {
                            type: 'list',
                            id: 'headers',
                            title: 'Headers - optional',
                            items: [
                                { id: 'key', title: 'Key', type: 'textinput' },
                                { id: 'value', title: 'Value', type: 'textinput' },
                            ],
                            ...(headersValue.length > 0 ? { value: headersValue } : {}),
                        },
                        {
                            type: 'numericinput',
                            id: 'timeout',
                            title: 'Timeout - use 0 to disable',
                            value: existingValues.timeout || 60,
                        },
                    ]
                } else {
                    // stdio transport
                    return [
                        ...common,
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
                            items: [{ id: 'arg_key', type: 'textinput' }],
                            value: argsValue,
                        },
                        {
                            type: 'list',
                            id: 'env_variables',
                            title: 'Environment variables - optional',
                            items: [
                                { id: 'env_var_name', title: 'Name', type: 'textinput' },
                                { id: 'env_var_value', title: 'Value', type: 'textinput' },
                            ],
                            value: envVarsValue,
                        },
                        {
                            type: 'numericinput',
                            id: 'timeout',
                            title: 'Timeout - use 0 to disable',
                            value: existingValues.timeout || 60,
                        },
                    ]
                }
            })(),
        }
    }

    /**
     * Validates all MCP server configurations and returns combined error messages
     * @param serverConfigs Map of server configurations to validate
     * @returns Combined error messages or undefined if no errors
     */
    /**
     * Gets validation errors for all server configurations
     * @param serverConfigs Map of server configurations to validate
     * @returns Array of validation errors with server names
     */
    #getValidationErrors(serverConfigs: Map<string, MCPServerConfig>): { serverName: string; errors: string[] }[] {
        const validationErrors: { serverName: string; errors: string[] }[] = []

        for (const [serverName, config] of serverConfigs.entries()) {
            // Create a values object that matches the expected format for validateMcpServerForm
            const values = {
                name: serverName,
                command: config.command,
                timeout: config.timeout?.toString() || '',
                env: config.env,
                args: config.args,
                url: config.url,
                headers: config.headers,
            }

            const validation = this.#validateMcpServerForm(values, false)
            if (!validation.isValid) {
                this.#features.logging.debug(
                    `MCP server validation error for ${serverName}: ${validation.errors.join(', ')}`
                )
                validationErrors.push({ serverName, errors: validation.errors })
            }
        }

        return validationErrors
    }

    /**
     * Validates all MCP server configurations and returns combined error messages
     * @param serverConfigs Map of server configurations to validate
     * @returns Combined error messages or undefined if no errors
     */
    #validateMcpServerConfigs(serverConfigs: Map<string, MCPServerConfig>): string | undefined {
        // Get validation errors for all server configurations
        const validationErrors = this.#getValidationErrors(serverConfigs)

        // Return validation errors if any were found
        if (validationErrors.length > 0) {
            // Combine all error messages
            return validationErrors
                .map(error => {
                    return error.serverName
                        ? `Server name: ${error.serverName} Error: ${error.errors.join('')}`
                        : `Error: ${error.errors.join('')}`
                })
                .join('\n\n')
        }

        return undefined
    }

    /**
     * Validates the MCP server form values
     */
    #validateMcpServerForm(
        values: Record<string, any>,
        checkExistingServerName: boolean,
        originalServerName?: string
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!values.name || values.name.trim() === '') {
            errors.push('Server name cannot be empty')
        } else {
            if (checkExistingServerName) {
                const existingServers = McpManager.instance.getAllServerConfigs()
                const serverState = McpManager.instance.getServerState(values.name)

                if (
                    existingServers.has(values.name) &&
                    values.name !== originalServerName &&
                    serverState?.status === McpServerStatus.ENABLED
                ) {
                    errors.push(`Server name "${values.name}" already exists`)
                }
            }
        }

        const transport = values.transport
        const command = values.command?.trim() || ''
        const url = values.url?.trim() || ''

        // Basic validation for command/url presence and exclusivity
        if (!command && !url) {
            errors.push('Either command or url is required')
        } else if (command && url) {
            errors.push('Provide either command OR url, not both')
        } else if (transport && ((transport === 'stdio' && !command) || (transport !== 'stdio' && !url))) {
            errors.push(`${transport === 'stdio' ? 'Command' : 'URL'} is required for ${transport} transport`)
        }

        if (values.timeout && values.timeout.trim() !== '') {
            const timeoutNum = Number(values.timeout.trim())
            if (timeoutNum < 0) {
                errors.push('Timeout must be zero or a positive number')
            }
        }

        // Environment variables must have both name and value, or neither
        if (Array.isArray(values.env_variables)) {
            const envVars = values.env_variables as Array<{ env_var_name: string; env_var_value: string }>
            const hasEmptyNameWithValue = envVars.some(
                env =>
                    (!env.env_var_name || env.env_var_name.trim() === '') &&
                    env.env_var_value &&
                    env.env_var_value.trim() !== ''
            )
            const hasNameWithEmptyValue = envVars.some(
                env =>
                    env.env_var_name &&
                    env.env_var_name.trim() !== '' &&
                    (!env.env_var_value || env.env_var_value.trim() === '')
            )
            if (hasEmptyNameWithValue) {
                errors.push('Environment variable name cannot be empty when value is provided')
            }
            if (hasNameWithEmptyValue) {
                errors.push('Environment variable value cannot be empty when name is provided')
            }
        }

        if (Array.isArray(values.headers)) {
            const hdrs = values.headers as Array<{ key: string; value: string }>
            const invalidHeaders = hdrs.find(h => {
                const key = h.key?.trim() || ''
                const value = h.value?.trim() || ''
                return (key === '' && value !== '') || (key !== '' && value === '')
            })

            if (invalidHeaders) {
                const hasKey = invalidHeaders.key?.trim()
                errors.push(
                    hasKey
                        ? 'Header value cannot be empty when key is provided'
                        : 'Header key cannot be empty when value is provided'
                )
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

        const selectedTransport = params.optionsValues.transport
        const serverName = params.optionsValues.name
        const sanitizedServerName = sanitizeName(serverName)
        const originalServerName = this.#currentEditingServerName
        const isEditMode = !!(originalServerName && McpManager.instance.getAllServerConfigs().has(originalServerName))

        // Validate form values
        const validation = this.#validateMcpServerForm(
            params.optionsValues,
            true,
            isEditMode ? originalServerName : undefined
        )
        if (!validation.isValid) {
            const error = validation.errors[0]
            params.id = isEditMode ? 'edit-mcp' : 'add-new-mcp'
            return isEditMode
                ? this.#handleEditMcpServer({ ...params, title: originalServerName! }, error)
                : this.#handleAddNewMcp(params, error)
        }

        // stdio‑specific parsing
        let args: string[] = []
        let env: Record<string, string> = {}
        if (selectedTransport === 'stdio') {
            try {
                args = (Array.isArray(params.optionsValues.args) ? params.optionsValues.args : [])
                    .map((item: any) =>
                        item && typeof item === 'object' && 'arg_key' in item ? String(item.arg_key) : ''
                    )
                    .filter(Boolean)
            } catch (e) {
                this.#features.logging.warn(`MCP: Failed to process args: ${e}`)
            }

            try {
                env = (
                    Array.isArray(params.optionsValues.env_variables) ? params.optionsValues.env_variables : []
                ).reduce((acc: Record<string, string>, item: any) => {
                    if (item && 'env_var_name' in item && 'env_var_value' in item) {
                        acc[String(item.env_var_name)] = String(item.env_var_value)
                    }
                    return acc
                }, {})
            } catch (e) {
                this.#features.logging.warn(`MCP: Failed to process env variables: ${e}`)
            }
        }

        // http‑specific parsing
        let headers: Record<string, string> = {}
        if (selectedTransport === 'http') {
            try {
                const raw = Array.isArray(params.optionsValues.headers) ? params.optionsValues.headers : []
                headers = raw.reduce((acc: Record<string, string>, item: any) => {
                    const k = item.key?.toString().trim() ?? ''
                    const v = item.value?.toString().trim() ?? ''
                    // both empty → skip
                    if (k === '' && v === '') {
                        return acc
                    }
                    // otherwise keep (validation layer handles partial-empty cases)
                    acc[k] = item.value ?? ''
                    return acc
                }, {})
            } catch (e) {
                this.#features.logging.warn(`MCP: Failed to process headers: ${e}`)
            }
        }

        // Config file requires timeout in milliseconds
        const timeoutInMs = (parseInt(params.optionsValues.timeout) ?? 60) * 1000

        // build final config (no transport field persisted)
        let config: MCPServerConfig
        if (selectedTransport === 'http') {
            config = {
                url: params.optionsValues.url,
                headers,
                timeout: timeoutInMs,
            }
        } else {
            config = {
                command: params.optionsValues.command,
                args,
                env,
                timeout: timeoutInMs,
            }
        }

        // Get agent path based on scope
        const isGlobal = params.optionsValues['scope'] === 'global'
        const agentPath = await this.#getAgentPath(isGlobal)

        // We still need a configPath for backward compatibility, but it's not used anymore
        const configPath = ''

        // needs to false BEFORE changing any server state, to prevent going to list servers page after clicking save button
        this.#shouldDisplayListMCPServers = false

        // Set flag to ignore file changes during server operations
        this.#isProgrammaticChange = true

        try {
            if (isEditMode && originalServerName) {
                const serverToRemove = this.#serverNameBeforeUpdate || originalServerName
                await McpManager.instance.removeServer(serverToRemove)
                await McpManager.instance.addServer(serverName, config, agentPath)
            } else {
                // Create new server
                await McpManager.instance.addServer(serverName, config, agentPath)
                this.#newlyAddedServers.add(serverName)
            }
        } catch (error) {
            this.#features.logging.error(`Failed to enable MCP server: ${error}`)
        }

        this.#currentEditingServerName = undefined

        // need to check server state now, as there is possibility of error during server initialization
        const serverStatusError = this.#getServerStatusError(serverName)

        this.#telemetryController?.emitMCPServerInitializeEvent({
            source: isEditMode ? 'updateServer' : 'addServer',
            command: selectedTransport === 'stdio' ? params.optionsValues.command : undefined,
            url: selectedTransport === 'http' ? params.optionsValues.url : undefined,
            enabled: true,
            numTools: McpManager.instance.getAllToolsWithPermissions(serverName).length,
            scope: params.optionsValues['scope'] === 'global' ? 'global' : 'workspace',
            transportType: selectedTransport,
            languageServerVersion: this.#features.runtime.serverInfo.version,
        })

        if (serverStatusError) {
            await McpManager.instance.removeServerFromConfigFile(serverName)

            if (this.#newlyAddedServers.has(serverName)) {
                this.#newlyAddedServers.delete(serverName)
            }

            // Stay on add/edit page and show error to user
            // Keep isProgrammaticChange true during error handling to prevent file watcher triggers
            if (isEditMode) {
                params.id = 'edit-mcp'
                params.title = sanitizedServerName
                return this.#handleEditMcpServer(params)
            } else {
                params.id = 'add-new-mcp'
                return this.#handleAddNewMcp(params)
            }
        } else {
            // Success case: if this was a newly added server, remove it from tracking
            if (this.#newlyAddedServers.has(serverName)) {
                this.#newlyAddedServers.delete(serverName)
            }

            this.#isProgrammaticChange = false

            // Go to tools permissions page
            return this.#handleOpenMcpServer({ id: 'open-mcp-server', title: sanitizedServerName })
        }
    }

    /**
     * Handles opening an MCP server details view
     */
    async #handleOpenMcpServer(params: McpServerClickParams) {
        const serverName = params.title
        if (!serverName) {
            return { id: params.id }
        }
        const serverStatusError = this.#getServerStatusError(serverName)

        let filterOptions: FilterOption[] = []
        if (serverName === 'Built-in') {
            // Handle Built-in server specially
            const allTools = this.#features.agent.getTools({ format: 'bedrock' })
            const builtInToolNames = new Set(this.#features.agent.getBuiltInToolNames())
            // combine fsWrite and fsReplace into fsWrite
            const builtInTools = allTools
                .filter(tool => {
                    return (
                        builtInToolNames.has(tool.toolSpecification.name) && tool.toolSpecification.name !== 'fsReplace'
                    )
                })
                .map(tool => {
                    const permission = McpManager.instance.getToolPerm(serverName, tool.toolSpecification.name)
                    return {
                        tool: {
                            toolName: tool.toolSpecification.name,
                            description:
                                this.#getBuiltInToolDescription(tool.toolSpecification.name) ||
                                tool.toolSpecification.description ||
                                `${tool.toolSpecification.name} tool`,
                        },
                        permission,
                    }
                })

            filterOptions = this.#buildServerFilterOptions(serverName, builtInTools)

            return {
                id: params.id,
                header: {
                    title: serverName,
                    status: serverStatusError || {},
                    description: 'TOOLS',
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
                    status: serverStatusError || {},
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

        // Get the appropriate agent path
        const agentPath = await this.#getAgentPath()

        const perm: MCPServerPermission = {
            enabled: true,
            toolPerms: {},
            __configPath__: agentPath,
        }

        // Set flag to ignore file changes during permission update
        this.#isProgrammaticChange = true

        try {
            await McpManager.instance.updateServerPermission(serverName, perm)
            this.#emitMCPConfigEvent()
        } catch (error) {
            this.#features.logging.error(`Failed to enable MCP server: ${error}`)
        }
        this.#isProgrammaticChange = false
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

        // Get the appropriate agent path
        const agentPath = await this.#getAgentPath()

        const perm: MCPServerPermission = {
            enabled: false,
            toolPerms: {},
            __configPath__: agentPath,
        }

        // Set flag to ignore file changes during permission update
        this.#isProgrammaticChange = true

        try {
            await McpManager.instance.updateServerPermission(serverName, perm)
            this.#emitMCPConfigEvent()
        } catch (error) {
            this.#features.logging.error(`Failed to disable MCP server: ${error}`)
        }

        this.#isProgrammaticChange = false
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

        // Set flag to ignore file changes during server deletion
        this.#isProgrammaticChange = true

        try {
            await McpManager.instance.removeServer(serverName)

            return { id: params.id }
        } catch (error) {
            this.#features.logging.error(`Failed to delete MCP server: ${error}`)
            this.#isProgrammaticChange = false
            return { id: params.id }
        }
    }

    /**
     * Handles edit MCP configuration
     */
    async #handleEditMcpServer(params: McpServerClickParams, error?: string) {
        // Set programmatic change flag to true to prevent file watcher triggers
        this.#isProgrammaticChange = true
        await this.#handleSavePermissionChange({ id: 'save-mcp-permission' })

        const serverName = params.title
        if (!serverName) {
            this.#isProgrammaticChange = false
            return { id: params.id }
        }
        this.#currentEditingServerName = serverName

        const config = McpManager.instance.getAllServerConfigs().get(serverName)
        if (!config) {
            return {
                id: params.id,
                header: {
                    title: 'Edit MCP Server',
                    status: {
                        title: `Server "${serverName}" not found`,
                        icon: 'cancel-circle',
                        status: 'error' as Status,
                    },
                },
                list: [],
            }
        }

        // Respect a user flip first; otherwise fall back to what the stored configuration implies.
        const transport = params.optionsValues?.transport ?? (config.url ? 'http' : 'stdio')

        // Convert stored structures to UI‑friendly lists
        const argsList = (config.args ?? []).map(a => ({ arg_key: a })) // for stdio
        const envList = Object.entries(config.env ?? {}).map(([k, v]) => ({
            env_var_name: k,
            env_var_value: v,
        })) // for stdio
        const headersList = Object.entries(config.headers ?? {}).map(([k, v]) => ({
            key: k,
            value: v,
        })) // for http

        // UI must display timeout to user in seconds
        const timeoutInSeconds =
            params.optionsValues?.timeout || Math.floor((config.timeout ?? 60000) / 1000).toString()

        const existingValues: Record<string, any> = {
            name: params.optionsValues?.name || serverName,
            transport,
            command: params.optionsValues?.command || config.command,
            args: params.optionsValues?.args || argsList,
            env_variables: params.optionsValues?.env_variables || envList,
            url: params.optionsValues?.url || config.url,
            headers: params.optionsValues?.headers || headersList,
            timeout: timeoutInSeconds,
            scope: params.optionsValues?.scope,
        }

        const view = await this.#handleAddNewMcp(
            {
                ...params,
                id: 'add-new-mcp',
                optionsValues: existingValues,
            },
            error
        )

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
        const filterOptions: FilterOption[] = []

        // Add tool select options
        toolsWithPermissions.forEach(item => {
            const toolName = item.tool.toolName
            // For Built-in server, use a special function that doesn't include the 'Deny' option
            let permissionOptions = this.#buildPermissionOptions()

            if (serverName === 'Built-in') {
                permissionOptions = this.#buildBuiltInPermissionOptions()
            }

            filterOptions.push({
                type: 'select',
                id: `${toolName}`,
                title: toolName,
                description: item.tool.description,
                options: permissionOptions,
                ...(toolName === 'fsWrite'
                    ? { disabled: true, selectTooltip: 'Permission for this tool is not configurable yet' }
                    : {}),
                ...{ value: item.permission, boldTitle: true, mandatory: true, hideMandatoryIcon: true },
            })
        })

        return filterOptions
    }

    async #handleChangeTransport(params: McpServerClickParams) {
        const { optionsValues, title } = params
        const editingServerName = this.#currentEditingServerName

        // Clean up transport-specific fields
        if (optionsValues) {
            const transport = optionsValues.transport ?? 'stdio' // Maintain default to 'stdio'
            const fieldsToDelete = transport === 'http' ? ['command', 'args', 'env_variables'] : ['url', 'headers']

            fieldsToDelete.forEach(field => delete optionsValues[field])
        }

        // Handle server name change in edit mode
        if (editingServerName && title && editingServerName !== title) {
            const servers = McpManager.instance.getAllServerConfigs()
            const existingConfig = servers.get(editingServerName)

            if (existingConfig) {
                const updatedServers = new Map(servers)
                updatedServers.delete(editingServerName)
                updatedServers.set(title, existingConfig)
                await McpManager.instance.updateServerMap(updatedServers)
            }
            this.#serverNameBeforeUpdate = editingServerName
        }

        params.id = editingServerName ? 'edit-mcp' : 'add-new-mcp'
        return editingServerName ? this.#handleEditMcpServer(params) : this.#handleAddNewMcp(params)
    }

    /**
     * Builds permission options excluding the current one
     */
    #buildPermissionOptions() {
        const permissionOptions: PermissionOption[] = []

        permissionOptions.push({
            label: 'Ask',
            value: McpPermissionType.ask,
            description: 'Ask for your approval each time this tool is run',
        })

        permissionOptions.push({
            label: 'Always allow',
            value: McpPermissionType.alwaysAllow,
            description: 'Always allow this tool to run without asking for approval',
        })

        permissionOptions.push({ label: 'Deny', value: McpPermissionType.deny, description: 'Never run this tool' })

        return permissionOptions
    }

    /**
     * Builds permission options for Built-in tools (no 'Disable' option)
     */
    #buildBuiltInPermissionOptions() {
        const permissionOptions: PermissionOption[] = []

        permissionOptions.push({
            label: 'Ask',
            value: 'ask',
            description: 'Ask for your approval each time this tool is run',
        })

        permissionOptions.push({
            label: 'Always Allow',
            value: 'alwaysAllow',
            description: 'Always allow this tool to run without asking for approval',
        })

        return permissionOptions
    }

    #getBuiltInToolDescription(toolName: string) {
        switch (toolName) {
            case 'fsRead':
                return 'Read the content of files.'
            case 'listDirectory':
                return 'List the structure of a directory and its subdirectories.'
            case 'fileSearch':
                return 'Search for files and directories using fuzzy name matching.'
            case 'executeBash':
                return 'Run shell or powershell commands.\n\nNote: read-only commands are auto-run'
            case 'fsWrite':
            case 'fsReplace':
                return 'Create or edit files.'
            case 'codeReview':
                return 'Review tool analyzes code for security vulnerabilities, quality issues, and best practices across multiple programming languages.'
            default:
                return ''
        }
    }

    /**
     * Handles MCP permission change events to update the pending permission config without applying changes
     */
    async #handleMcpPermissionChange(params: McpServerClickParams) {
        const serverName = params.title

        const updatedPermissionConfig = params.optionsValues
        if (!serverName || !updatedPermissionConfig) {
            return { id: params.id }
        }

        try {
            // Skip server config check for Built-in server
            const serverConfig = McpManager.instance.getAllServerConfigs().get(serverName)
            if (serverName !== 'Built-in') {
                if (!serverConfig) {
                    throw new Error(`Server '${serverName}' not found`)
                }
            }

            const mcpServerPermission = await this.#processPermissionUpdates(
                serverName,
                updatedPermissionConfig,
                serverConfig?.__configPath__
            )

            // Store the permission config instead of applying it immediately
            this.#pendingPermissionConfig = {
                serverName,
                permission: mcpServerPermission,
            }

            this.#features.logging.info(`Stored pending permission change for server: ${serverName}`)

            return { id: params.id }
        } catch (error) {
            this.#features.logging.error(`Failed to process MCP permissions: ${error}`)
            return { id: params.id }
        }
    }

    /**
     * Handles saving MCP permission changes
     * Applies the stored permission changes
     */
    async #handleSavePermissionChange(params: McpServerClickParams) {
        if (!this.#pendingPermissionConfig) {
            this.#features.logging.warn('No pending permission changes to save')
            return { id: params.id }
        }

        // Set flag to ignore file changes during permission update
        this.#isProgrammaticChange = true

        try {
            const { serverName, permission } = this.#pendingPermissionConfig

            // Apply the stored permission changes
            await McpManager.instance.updateServerPermission(serverName, permission)
            this.#emitMCPConfigEvent()

            // Get server config to emit telemetry
            const serverConfig = McpManager.instance.getAllServerConfigs().get(serverName)
            if (serverConfig) {
                // Emit server initialize event after permission change
                const transportType = serverConfig.command ? 'stdio' : 'http'
                this.#telemetryController?.emitMCPServerInitializeEvent({
                    source: 'updatePermission',
                    command: transportType === 'stdio' ? serverConfig.command : undefined,
                    url: transportType === 'http' ? serverConfig.url : undefined,
                    enabled: true,
                    numTools: McpManager.instance.getAllToolsWithPermissions(serverName).length,
                    scope:
                        serverConfig.__configPath__ ===
                        getGlobalAgentConfigPath(this.#features.workspace.fs.getUserHomeDir())
                            ? 'global'
                            : 'workspace',
                    transportType: transportType,
                    languageServerVersion: this.#features.runtime.serverInfo.version,
                })
            } else {
                // it's mean built-in tool, but do another extra check to confirm
                if (serverName === 'Built-in') {
                    let toolName: string[] = []
                    let perm: string[] = []

                    for (const [key, val] of Object.entries(permission.toolPerms)) {
                        toolName.push(key)
                        perm.push(val)
                    }

                    this.#telemetryController?.emitMCPServerInitializeEvent({
                        source: 'updatePermission',
                        command: 'Built-in',
                        enabled: true,
                        numTools: McpManager.instance.getAllToolsWithPermissions(serverName).length,
                        scope:
                            permission.__configPath__ ===
                            getGlobalAgentConfigPath(this.#features.workspace.fs.getUserHomeDir())
                                ? 'global'
                                : 'workspace',
                        transportType: '',
                        languageServerVersion: this.#features.runtime.serverInfo.version,
                        toolName: toolName,
                        permission: perm,
                    })
                }
            }

            // Clear the pending permission config after applying
            this.#pendingPermissionConfig = undefined

            this.#features.logging.info(`Applied permission changes for server: ${serverName}`)
            return { id: params.id }
        } catch (error) {
            this.#features.logging.error(`Failed to save MCP permissions: ${error}`)
            this.#isProgrammaticChange = false
            return { id: params.id }
        }
    }

    #emitMCPConfigEvent() {
        // Emit MCP config event after reinitialization
        const mcpManager = McpManager.instance
        const serverConfigs = mcpManager.getAllServerConfigs()
        const activeServers = Array.from(serverConfigs.entries())

        // Get the global agent path
        const globalAgentPath = getGlobalAgentConfigPath(this.#features.workspace.fs.getUserHomeDir())

        // Count global vs project servers
        const globalServers = Array.from(serverConfigs.entries()).filter(
            ([_, config]) => config.__configPath__ === globalAgentPath
        ).length
        const projectServers = serverConfigs.size - globalServers

        // Count tools by permission
        let toolsAlwaysAllowed = 0
        let toolsDenied = 0

        for (const [serverName, _] of activeServers) {
            const toolsWithPermissions = mcpManager.getAllToolsWithPermissions(serverName)
            toolsWithPermissions.forEach(item => {
                if (item.permission === McpPermissionType.alwaysAllow) {
                    toolsAlwaysAllowed++
                } else if (item.permission === McpPermissionType.deny) {
                    toolsDenied++
                }
            })
        }

        this.#telemetryController?.emitMCPConfigEvent({
            numActiveServers: activeServers.length,
            numGlobalServers: globalServers,
            numProjectServers: projectServers,
            numToolsAlwaysAllowed: toolsAlwaysAllowed,
            numToolsDenied: toolsDenied,
            languageServerVersion: this.#features.runtime.serverInfo.version,
        })

        // Emit server initialize events for all active servers
        for (const [serverName, config] of serverConfigs.entries()) {
            const transportType = config.command ? 'stdio' : 'http'
            // const enabled = !mcpManager.isServerDisabled(serverName)
            this.#telemetryController?.emitMCPServerInitializeEvent({
                source: 'reload',
                command: transportType === 'stdio' ? config.command : undefined,
                url: transportType === 'http' ? config.url : undefined,
                enabled: true,
                numTools: mcpManager.getAllToolsWithPermissions(serverName).length,
                scope: config.__configPath__ === globalAgentPath ? 'global' : 'workspace',
                transportType: 'stdio',
                languageServerVersion: this.#features.runtime.serverInfo.version,
            })
        }
    }

    /**
     * Handled refresh MCP list events
     * @param params The click parameters
     * @param isProgrammatic Whether this refresh was triggered by a programmatic change
     */
    async #handleRefreshMCPList(params: McpServerClickParams, isProgrammatic: boolean = false) {
        this.#shouldDisplayListMCPServers = true

        // Set flag to ignore file changes during reinitialization if this is a programmatic change
        this.#isProgrammaticChange = isProgrammatic

        try {
            await McpManager.instance.reinitializeMcpServers()
            this.#emitMCPConfigEvent()

            // Reset flag after reinitialization
            this.#isProgrammaticChange = false

            return {
                id: params.id,
            }
        } catch (err) {
            this.#features.logging.error(`Failed to reinitialize MCP servers: ${err}`)

            // Reset flag in case of error
            this.#isProgrammaticChange = false

            return {
                id: params.id,
            }
        }
    }

    /**
     * Gets the appropriate agent path, checking workspace path first if it exists
     * @returns The agent path to use (workspace if exists, otherwise global)
     */
    async #getAgentPath(isGlobal: boolean = true): Promise<string> {
        if (isGlobal) {
            return getGlobalAgentConfigPath(this.#features.workspace.fs.getUserHomeDir())
        }

        const globalAgentPath = getGlobalAgentConfigPath(this.#features.workspace.fs.getUserHomeDir())

        // Get workspace folders and check for workspace agent path
        const workspaceFolders = this.#features.workspace.getAllWorkspaceFolders()
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspacePaths = workspaceFolders.map(folder => folder.uri)
            const workspaceAgentPaths = getWorkspaceAgentConfigPaths(workspacePaths)

            if (Array.isArray(workspaceAgentPaths) && workspaceAgentPaths.length > 0) {
                try {
                    // Convert URI format to filesystem path if needed using the utility function
                    const agentPath = normalizePathFromUri(workspaceAgentPaths[0], this.#features.logging)

                    return agentPath
                } catch (e) {
                    this.#features.logging.warn(`Failed to check if workspace agent path exists: ${e}`)
                }
            }
        }

        // Return global path if workspace path doesn't exist or there was an error
        return globalAgentPath
    }

    /**
     * Processes permission updates from the UI
     */
    async #processPermissionUpdates(serverName: string, updatedPermissionConfig: any, agentPath: string | undefined) {
        const perm: MCPServerPermission = {
            enabled: true,
            toolPerms: {},
            __configPath__: agentPath,
        }

        // Process each tool permission setting
        for (const [key, val] of Object.entries(updatedPermissionConfig)) {
            if (key === 'scope') continue

            const currentPerm = McpManager.instance.getToolPerm(serverName, key)
            if (val === currentPerm) continue
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

    /**
     * Gets the UI status object for a specific MCP server
     */
    #getServerStatusError(serverName: string): { title: string; icon: string; status: Status } | undefined {
        const serverStates = McpManager.instance.getAllServerStates()
        const serverState = serverStates.get(serverName)

        if (!serverState) {
            return undefined
        }

        // Only return status if there's an error
        if (serverState.lastError) {
            return {
                title: serverState.lastError,
                icon: 'cancel-circle',
                status: 'error',
            }
        }

        return undefined
    }

    /**
     * Setup file watchers for MCP config and persona files
     */
    #setupFileWatchers(): void {
        const wsUris = this.#features.workspace.getAllWorkspaceFolders()?.map(f => f.uri) ?? []
        let homeDir: string | undefined
        try {
            homeDir = this.#features.workspace.fs.getUserHomeDir?.()
        } catch (e) {
            this.#features.logging.warn(`Failed to get user home directory: ${e}`)
        }

        // Only watch agent config files
        const agentPaths = [
            ...getWorkspaceAgentConfigPaths(wsUris),
            ...(homeDir ? [getGlobalAgentConfigPath(homeDir)] : []),
        ]

        const allPaths = [...agentPaths]

        this.#fileWatcher.watchPaths(allPaths, () => {
            // Store the current programmatic state when the event is triggered
            this.#lastProgrammaticState = this.#isProgrammaticChange

            // Log the values for debugging
            this.#features.logging.info(
                `File watcher triggered - isProgrammaticChange: ${this.#isProgrammaticChange}, ` +
                    `lastProgrammaticState: ${this.#lastProgrammaticState}`
            )

            // Clear any existing timer
            if (this.#debounceTimer) {
                clearTimeout(this.#debounceTimer)
            }

            // Set a new timer with 2 second debounce
            this.#debounceTimer = setTimeout(async () => {
                // Log the values again when the timer fires
                this.#features.logging.debug(
                    `Debounce timer fired - lastProgrammaticState: ${this.#lastProgrammaticState}`
                )

                // Only proceed if the stored state allows it
                if (!this.#lastProgrammaticState) {
                    await this.#handleRefreshMCPList({ id: 'refresh-mcp-list' })
                } else {
                    this.#isProgrammaticChange = false
                    this.#features.logging.debug('Skipping refresh due to programmatic change')
                }
                this.#debounceTimer = null
            }, 2000)
        })
    }

    /**
     * Cleanup file watchers
     */
    dispose(): void {
        if (this.#debounceTimer) {
            clearTimeout(this.#debounceTimer)
            this.#debounceTimer = null
        }
        this.#fileWatcher.close()
    }
}
