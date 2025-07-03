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
    getGlobalPersonaConfigPath,
    getWorkspaceMcpConfigPaths,
    getWorkspacePersonaConfigPaths,
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
        const header = {
            title: 'MCP Servers',
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
        this.#features.logging.log(`[VSCode Server] onMcpServerClick event with params: ${JSON.stringify(params)}`)

        // Use a map of handlers for different action types
        const handlers: Record<string, () => Promise<any>> = {
            'add-new-mcp': () => this.#handleAddNewMcp(params),
            'save-mcp': () => this.#handleSaveMcp(params),
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

    /**
     * Returns the default MCP servers response
     */
    #getDefaultMcpResponse(id: string) {
        return {
            id,
            header: {
                title: 'MCP Servers',
                status: {},
                description: `Add MCP servers to extend Q's capabilities.`,
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

        if (existingValues.name) {
            const serverName = existingValues.name
            const sanitizedServerName = sanitizeName(serverName)
            const serverState = McpManager.instance.getAllServerConfigs().get(sanitizedServerName)
            if (
                !serverState ||
                serverState?.__configPath__ === getGlobalMcpConfigPath(this.#features.workspace.fs.getUserHomeDir())
            ) {
                existingValues.scope = 'global'
            } else {
                existingValues.scope = 'workspace'
            }
        }

        const serverStatusError = this.#getServerStatusError(existingValues.name) || {}
        return {
            id: params.id,
            header: {
                title: 'Add MCP Server',
                status: error
                    ? {
                          title: error,
                          icon: 'cancel-circle',
                          status: 'error' as Status,
                      }
                    : serverStatusError,
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
                    status: error ? ('error' as Status) : 'primary',
                },
            ],
            filterOptions: [
                {
                    type: 'radiogroup',
                    id: 'scope',
                    title: 'Scope',
                    options: [
                        {
                            label: `Global - Used globally.`,
                            value: 'global',
                        },
                        {
                            label: `This workspace - Only used in this workspace.`,
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
                    title: 'Timeout - use 0 to disable',
                    value: existingValues.timeout || 60, // Default to 60 seconds in UI
                    mandatory: false,
                },
            ],
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

                if (existingServers.has(values.name) && values.name !== originalServerName) {
                    errors.push(`Server name "${values.name}" already exists`)
                }
            }
        }

        if (!values.command || values.command.trim() === '') {
            errors.push('Command is required for stdio transport')
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
            if (isEditMode) {
                params.id = 'edit-mcp'
                params.title = originalServerName!
                return this.#handleEditMcpServer(params, error)
            } else {
                params.id = 'add-new-mcp'
                return this.#handleAddNewMcp(params, error)
            }
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

        try {
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

        // Config file requires timeout in milliseconds
        const timeoutInMs = (parseInt(params.optionsValues.timeout) ?? 60) * 1000
        const config: MCPServerConfig = {
            command: params.optionsValues.command,
            args,
            env,
            timeout: timeoutInMs,
        }

        let configPath = getGlobalMcpConfigPath(this.#features.workspace.fs.getUserHomeDir())
        let personaPath = await this.#getPersonaPath()
        if (params.optionsValues['scope'] !== 'global') {
            // Get workspace folders and convert to paths
            const workspaceFolders = this.#features.workspace.getAllWorkspaceFolders()
            // Extract paths from workspace folders - uri is already a string
            const workspacePaths = workspaceFolders.map(folder => folder.uri)

            // Get the first path from the result or fall back to configPath
            const workspaceMcpPaths = getWorkspaceMcpConfigPaths(workspacePaths)
            configPath =
                Array.isArray(workspaceMcpPaths) && workspaceMcpPaths.length > 0
                    ? normalizePathFromUri(workspaceMcpPaths[0], this.#features.logging)
                    : configPath

            // Get the appropriate persona path using our helper method
            personaPath = await this.#getPersonaPath()
        }

        // needs to false BEFORE changing any server state, to prevent going to list servers page after clicking save button
        this.#shouldDisplayListMCPServers = false

        // Set flag to ignore file changes during server operations
        this.#isProgrammaticChange = true

        try {
            if (isEditMode && originalServerName) {
                await McpManager.instance.removeServer(originalServerName)
                await McpManager.instance.addServer(serverName, config, configPath, personaPath)
            } else {
                // Create new server
                await McpManager.instance.addServer(serverName, config, configPath, personaPath)
                this.#newlyAddedServers.add(serverName)
            }
        } finally {
            // Reset flag after operations
            this.#isProgrammaticChange = false
        }

        this.#currentEditingServerName = undefined

        // need to check server state now, as there is possibility of error during server initialization
        const serverStatusError = this.#getServerStatusError(serverName)

        // Emit telemetry event regardless of success/failure
        this.#telemetryController?.emitMCPServerInitializeEvent({
            source: isEditMode ? 'updateServer' : 'addServer',
            command: config.command,
            enabled: true,
            numTools: McpManager.instance.getAllToolsWithPermissions(serverName).length,
            scope: params.optionsValues['scope'] === 'global' ? 'global' : 'workspace',
            transportType: 'stdio',
            languageServerVersion: this.#features.runtime.serverInfo.version,
        })

        if (serverStatusError) {
            // Error case: remove config from config file only if it's a newly added server
            if (this.#newlyAddedServers.has(serverName)) {
                await McpManager.instance.removeServerFromConfigFile(serverName)
                this.#newlyAddedServers.delete(serverName)
            }

            // Stay on add/edit page and show error to user
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
                    status: serverStatusError || {},
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

        // Get the appropriate persona path
        const personaPath = await this.#getPersonaPath()

        const perm: MCPServerPermission = {
            enabled: true,
            toolPerms: {},
            __configPath__: personaPath,
        }

        // Set flag to ignore file changes during permission update
        this.#isProgrammaticChange = true

        try {
            await McpManager.instance.updateServerPermission(serverName, perm)
            this.#emitMCPConfigEvent()
        } catch (error) {
            this.#features.logging.error(`Failed to enable MCP server: ${error}`)
        } finally {
            // Reset flag after operations
            this.#isProgrammaticChange = false
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

        // Get the appropriate persona path
        const personaPath = await this.#getPersonaPath()

        const perm: MCPServerPermission = {
            enabled: false,
            toolPerms: {},
            __configPath__: personaPath,
        }

        // Set flag to ignore file changes during permission update
        this.#isProgrammaticChange = true

        try {
            await McpManager.instance.updateServerPermission(serverName, perm)
            this.#emitMCPConfigEvent()
        } catch (error) {
            this.#features.logging.error(`Failed to disable MCP server: ${error}`)
        } finally {
            // Reset flag after operations
            this.#isProgrammaticChange = false
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

        // Set flag to ignore file changes during server deletion
        this.#isProgrammaticChange = true

        try {
            await McpManager.instance.removeServer(serverName)
        } catch (error) {
            this.#features.logging.error(`Failed to delete MCP server: ${error}`)
        } finally {
            // Reset flag after operations
            this.#isProgrammaticChange = false
        }

        return { id: params.id }
    }

    /**
     * Handles edit MCP configuration
     */
    async #handleEditMcpServer(params: McpServerClickParams, error?: string) {
        await this.#handleSavePermissionChange({ id: 'save-mcp-permission' })
        const serverName = params.title
        if (!serverName) {
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

        // UI must display timeout to user in seconds
        const timeoutInSeconds =
            params.optionsValues?.timeout || Math.floor((config.timeout ?? 60000) / 1000).toString()
        const existingValues: Record<string, any> = {
            name: params.optionsValues?.name || serverName,
            transport: 'stdio',
            command: params.optionsValues?.command || config.command,
            args: params.optionsValues?.args || (config.args ?? []).map(a => ({ arg_key: a })),
            env_variables:
                params.optionsValues?.env_variables ||
                Object.entries(config.env ?? {}).map(([k, v]) => ({
                    env_var_name: k,
                    env_var_value: v,
                })),
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
            const currentPermission = this.#getCurrentPermission(item.permission)
            // For Built-in server, use a special function that doesn't include the 'Deny' option
            const permissionOptions = this.#buildPermissionOptions(item.permission)

            filterOptions.push({
                type: 'select',
                id: `${toolName}`,
                title: toolName,
                description: item.tool.description,
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
            return 'Always allow'
        } else if (permission === McpPermissionType.deny) {
            return 'Deny'
        } else {
            return 'Ask'
        }
    }

    /**
     * Builds permission options excluding the current one
     */
    #buildPermissionOptions(currentPermission: string) {
        const permissionOptions: PermissionOption[] = []

        if (currentPermission !== McpPermissionType.alwaysAllow) {
            permissionOptions.push({ label: 'Always allow', value: McpPermissionType.alwaysAllow })
        }

        if (currentPermission !== McpPermissionType.ask) {
            permissionOptions.push({ label: 'Ask', value: McpPermissionType.ask })
        }

        if (currentPermission !== McpPermissionType.deny) {
            permissionOptions.push({ label: 'Deny', value: McpPermissionType.deny })
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
            if (serverName !== 'Built-in') {
                const serverConfig = McpManager.instance.getAllServerConfigs().get(serverName)
                if (!serverConfig) {
                    throw new Error(`Server '${serverName}' not found`)
                }
            }

            const mcpServerPermission = await this.#processPermissionUpdates(updatedPermissionConfig)

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
                this.#telemetryController?.emitMCPServerInitializeEvent({
                    source: 'updatePermission',
                    command: serverConfig.command,
                    enabled: true,
                    numTools: McpManager.instance.getAllToolsWithPermissions(serverName).length,
                    scope:
                        serverConfig?.__configPath__ ===
                        getGlobalMcpConfigPath(this.#features.workspace.fs.getUserHomeDir())
                            ? 'global'
                            : 'workspace',
                    transportType: 'stdio',
                    languageServerVersion: this.#features.runtime.serverInfo.version,
                })
            }

            // Clear the pending permission config after applying
            this.#pendingPermissionConfig = undefined

            this.#features.logging.info(`Applied permission changes for server: ${serverName}`)
            return { id: params.id }
        } catch (error) {
            this.#features.logging.error(`Failed to save MCP permissions: ${error}`)
            return { id: params.id }
        } finally {
            // Reset flag after operations
            this.#isProgrammaticChange = false
        }
    }

    #emitMCPConfigEvent() {
        // Emit MCP config event after reinitialization
        const mcpManager = McpManager.instance
        const serverConfigs = mcpManager.getAllServerConfigs()
        const activeServers = Array.from(serverConfigs.entries()).filter(
            ([name, _]) => !mcpManager.isServerDisabled(name)
        )

        // Count global vs project servers
        const globalServers = Array.from(serverConfigs.entries()).filter(
            ([_, config]) =>
                config?.__configPath__ === getGlobalMcpConfigPath(this.#features.workspace.fs.getUserHomeDir())
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
            const enabled = !mcpManager.isServerDisabled(serverName)
            if (enabled) {
                this.#telemetryController?.emitMCPServerInitializeEvent({
                    source: 'reload',
                    command: config.command,
                    enabled,
                    numTools: mcpManager.getAllToolsWithPermissions(serverName).length,
                    scope:
                        config?.__configPath__ === getGlobalMcpConfigPath(this.#features.workspace.fs.getUserHomeDir())
                            ? 'global'
                            : 'workspace',
                    transportType: 'stdio',
                    languageServerVersion: this.#features.runtime.serverInfo.version,
                })
            }
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
     * Gets the appropriate persona path, checking workspace path first if it exists
     * @returns The persona path to use (workspace if exists, otherwise global)
     */
    async #getPersonaPath(): Promise<string> {
        const allPermissions = McpManager.instance.getAllPermissions()
        for (const [, permission] of allPermissions) {
            if (permission.__configPath__) {
                return permission.__configPath__
            }
        }
        const globalPersonaPath = getGlobalPersonaConfigPath(this.#features.workspace.fs.getUserHomeDir())

        // Get workspace folders and check for workspace persona path
        const workspaceFolders = this.#features.workspace.getAllWorkspaceFolders()
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspacePaths = workspaceFolders.map(folder => folder.uri)
            const workspacePersonaPaths = getWorkspacePersonaConfigPaths(workspacePaths)

            if (Array.isArray(workspacePersonaPaths) && workspacePersonaPaths.length > 0) {
                try {
                    // Convert URI format to filesystem path if needed using the utility function
                    const personaPath = normalizePathFromUri(workspacePersonaPaths[0], this.#features.logging)

                    // Check if the workspace persona path exists
                    const fileExists = await this.#features.workspace.fs.exists(personaPath)
                    if (fileExists) {
                        return personaPath
                    }
                } catch (e) {
                    this.#features.logging.warn(`Failed to check if workspace persona path exists: ${e}`)
                }
            }
        }

        // Return global path if workspace path doesn't exist or there was an error
        return globalPersonaPath
    }

    /**
     * Processes permission updates from the UI
     */
    async #processPermissionUpdates(updatedPermissionConfig: any) {
        // Get the appropriate persona path
        const personaPath = await this.#getPersonaPath()

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

            // If the value is an empty string (''), skip this tool to preserve its existing permission in the persona file
            if (val === '') continue
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

        const configPaths = [
            ...getWorkspaceMcpConfigPaths(wsUris),
            ...(homeDir ? [getGlobalMcpConfigPath(homeDir)] : []),
        ]
        const personaPaths = [
            ...getWorkspacePersonaConfigPaths(wsUris),
            ...(homeDir ? [getGlobalPersonaConfigPath(homeDir)] : []),
        ]

        const allPaths = [...configPaths, ...personaPaths]

        this.#fileWatcher.watchPaths(allPaths, async () => {
            if (this.#isProgrammaticChange) {
                return
            }
            await this.#handleRefreshMCPList({ id: 'refresh-mcp-list' })
        })
    }

    /**
     * Cleanup file watchers
     */
    dispose(): void {
        this.#fileWatcher.close()
    }
}
