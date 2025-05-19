import {
    DetailedListGroup,
    DetailedListItem,
    McpServerClickParams,
    McpServerClickResult,
} from '@aws/language-server-runtimes/protocol'
import { McpManager } from './mcpManager'
import { Features } from '../../../types'

/**
 * Controller for MCP UI-related functionality
 */
export class McpEventHandler {
    #features: Features

    constructor(features: Features) {
        this.#features = features
    }

    /**
     * Handles listing MCP servers for the UI
     * @returns List of MCP servers grouped by status
     */
    async onListMcpServers() {
        const mcpManagerServerConfigs = McpManager.instance.getAllServerConfigs()
        const serversAndTools = McpManager.instance.listServersAndTools()

        // Transform server configs into DetailedListItem objects
        const activeItems: DetailedListItem[] = []
        const disabledItems: DetailedListItem[] = []

        Array.from(mcpManagerServerConfigs.entries()).forEach(([serverName, config]) => {
            const toolNames = serversAndTools[serverName] || []
            const toolsCount = toolNames.length

            const item: DetailedListItem = {
                title: serverName,
                description: `Command: ${config.command}`,
            }

            if (config.disabled) {
                disabledItems.push(item)
            } else {
                activeItems.push(item)
            }
        })

        // Create the groups
        const groups: DetailedListGroup[] = []

        if (activeItems.length > 0) {
            groups.push({
                groupName: 'Active',
                children: activeItems,
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
     * Handles clicks on MCP servers in the UI
     * @param params Parameters for the click event
     * @returns Result of the click action
     */
    async onMcpServerClick(params: McpServerClickParams): Promise<McpServerClickResult> {
        this.#log(`[VSCode Server] onMcpServerClick event with params: ${JSON.stringify(params)}`)
        if (params.id === 'add-new-mcp') {
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
                                value: 'Yes',
                            },
                            {
                                label: `This workspace - Only used in this workspace. Edit config`,
                                value: 'No',
                            },
                        ],
                    },
                    {
                        type: 'textinput', // User input text
                        id: 'name',
                        title: 'Name',
                    },
                    {
                        type: 'select', // Drop down
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
                        type: 'textinput', // User input text
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
        } else if (params.id === 'open-mcp-xx') {
            // Edit
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
        }
    }

    /**
     * Log a message to the features logging system
     * @param messages Messages to log
     */
    #log(...messages: string[]) {
        this.#features.logging.log(messages.join(' '))
    }
}
