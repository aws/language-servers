/**
 * Handles MCP server-related events
 */

import { Features } from '../../../types'
import { McpManager } from './mcpManager'
import {
    DetailedListGroup,
    DetailedListItem,
    FilterOption,
    ListMcpServersParams,
    McpServerClickParams,
} from '@aws/language-server-runtimes/protocol'

export class McpEventHandler {
    constructor(private features: Pick<Features, 'logging'>) {}

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
                    description: `${toolsCount} tools - ${config.command}`,
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

        if (params.id === 'open-mcp-server') {
            const serverName = params.title
            const toolsWithStates = McpManager.instance.getAllToolsWithStates(serverName)
            if (!serverName) {
                return {
                    id: params.id,
                }
            }
            const filterOptions: FilterOption[] = []

            filterOptions.push({
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
            })

            // Get server config to check existing permissions
            const serverConfig = McpManager.instance.getAllServerConfigs().get(serverName)

            // Define permission options interface for easy reference
            interface PermissionOption {
                label: string
                value: string
            }

            // Add tool select options
            toolsWithStates.forEach(item => {
                const toolName = item.tool.toolName

                // Get current permission for this tool if it exists
                const toolOverrides = serverConfig?.toolOverrides?.[toolName]
                let currentPermission = 'Ask to run'

                if (toolOverrides?.autoApprove === true) {
                    currentPermission = 'Always run'
                } else if (toolOverrides?.disabled === true) {
                    currentPermission = 'Deny'
                } else {
                    currentPermission = 'Ask to run'
                }

                // Create permission options excluding the current one
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

                filterOptions.push({
                    type: 'select',
                    id: `${toolName}`,
                    title: toolName,
                    placeholder: currentPermission,
                    options: permissionOptions,
                })
            })

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
        } else if (params.id === 'mcp-permission-change') {
            const serverName = params.title
            const updatedPermissionConfig = params.optionsValues
            if (!serverName || !updatedPermissionConfig) {
                return {
                    id: params.id,
                }
            }
            try {
                const serverConfig = McpManager.instance.getAllServerConfigs().get(serverName)
                if (!serverConfig) {
                    throw new Error(`Server '${serverName}' not found`)
                }
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

                // Update the permissions directly in the config file
                await McpManager.instance.updateServerPermission(serverName, { toolOverrides })
                return {
                    id: params.id,
                }
            } catch (error) {
                this.features.logging.error(`Failed to update MCP permissions: ${error}`)
                return {
                    id: params.id,
                }
            }
        } else if (params.id === 'refresh-mcp-list') {
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

        return {
            id: params.id,
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
}
