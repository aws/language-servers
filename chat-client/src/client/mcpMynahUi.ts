/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChatItemButton, DetailedListItem, ListItemEntry, MynahUI, SingularFormItem } from '@aws/mynah-ui'
import { Button, ListMcpServersResult, McpServerClickResult } from '@aws/language-server-runtimes-types'
import { Messager } from './messager'
import { toMynahIcon } from './utils'

// Type definitions for MCP server parameters
export type McpFilterOption = {
    type: 'textarea' | 'textinput' | 'select' | 'numericinput' | 'radiogroup' | 'list'
    id: string
    title: string
    description?: string
    icon?: string
    options?: Array<{ label: string; value: string }>
    mandatory?: boolean
    value?: ListItemEntry[]
    items?: SingularFormItem[]
}

export type McpListItem = {
    title: string
    description?: string
    groupActions?: any
}

export type McpListGroup = {
    groupName?: string
    children?: McpListItem[]
}

export type McpServerParams = McpServerClickResult & {
    header?: {
        title?: string
        description?: string
        status?: any
        actions?: Button[]
    }
    filterOptions?: McpFilterOption[]
    filterActions?: Button[]
    list?: McpListGroup[]
}

export class McpMynahUi {
    private mynahUi: MynahUI
    private messager: Messager
    private isMcpServersListActive = false

    constructor(mynahUi: MynahUI, messager: Messager) {
        this.mynahUi = mynahUi
        this.messager = messager
    }

    /**
     * Processes filter options by converting icons to Mynah icons
     */
    private processFilterOptions(filterOptions?: McpFilterOption[]) {
        return filterOptions?.map(filter => ({
            ...filter,
            icon: filter.icon ? toMynahIcon(filter.icon) : undefined,
            mandatory: filter.mandatory ?? false,
            value: filter.value ?? undefined,
            items: filter.items ?? undefined,
        }))
    }

    /**
     * Processes filter actions by converting icons to Mynah icons
     */
    private processFilterActions(filterActions?: Button[]) {
        return filterActions?.map(action => ({
            ...action,
            icon: action.icon ? toMynahIcon(action.icon) : undefined,
        }))
    }

    /**
     * Processes a list group for the detailed list UI
     */
    private processListGroup(group: McpListGroup, isServerView = false) {
        const children = group.children?.map(item => {
            if (isServerView) {
                return {
                    id: item.title,
                    title: item.title,
                    description: item.description,
                    icon: toMynahIcon('tools'),
                    groupActions: item.groupActions,
                }
            }
            return {
                title: item.title,
                description: item.description,
            }
        })

        return {
            groupName: group.groupName,
            children,
        }
    }

    /**
     * Creates a detailed list configuration for adding a new MCP server
     */
    private createAddMcpServerDetailedList(params: McpServerParams) {
        const detailedList = {
            selectable: false,
            textDirection: 'row',
            header: {
                title: params.header?.title || 'Add MCP Server',
                description: params.header?.description || '',
                status: params.header?.status || {},
                actions: params.header?.actions?.map(action => ({
                    ...action,
                    icon: action.icon ? toMynahIcon(action.icon) : undefined,
                })),
            },
            filterOptions: this.processFilterOptions(params.filterOptions),
            filterActions: params.filterActions,
        } as any

        const isEditMode = params.header?.title === 'Edit MCP Server'
        const hasError = params.header?.status?.status === 'error'

        const serverName = (params.filterOptions?.[1] as any)?.value

        if (isEditMode && hasError) {
            detailedList.header.actions = [
                {
                    id: 'mcp-details-menu',
                    icon: toMynahIcon('ellipsis'),
                    items: [
                        {
                            id: 'mcp-disable-server',
                            text: `Disable MCP server`,
                            data: { serverName },
                        },
                        {
                            id: 'mcp-delete-server',
                            confirmation: {
                                cancelButtonText: 'Cancel',
                                confirmButtonText: 'Delete',
                                title: 'Delete Filesystem MCP server',
                                description:
                                    'This configuration will be deleted and no longer available in Q. \n\n This cannot be undone.',
                            },
                            text: `Delete MCP server`,
                            data: { serverName },
                        },
                    ],
                },
            ]
        }

        // Process list if present
        if (params.list && params.list.length > 0) {
            detailedList.list = params.list.map(group => this.processListGroup(group))
        }

        return detailedList
    }

    /**
     * Creates a detailed list configuration for viewing an MCP server
     */
    private createViewMcpServerDetailedList(params: McpServerParams) {
        const detailedList = {
            selectable: false,
            textDirection: 'row',
            list: params.list?.map(group => this.processListGroup(group, true)),
            filterOptions: this.processFilterOptions(params.filterOptions),
        } as any

        // Process header if present
        if (params.header) {
            detailedList.header = {
                title: params.header.title,
                description: params.header.description,
                status: params.header.status,
                actions: params.header.actions?.map(action => ({
                    ...action,
                    icon: action.icon ? toMynahIcon(action.icon) : undefined,
                    ...(action.id === 'mcp-details-menu'
                        ? {
                              items: [
                                  {
                                      id: 'mcp-disable-server',
                                      text: `Disable MCP server`,
                                  },
                                  {
                                      id: 'mcp-delete-server',
                                      confirmation: {
                                          cancelButtonText: 'Cancel',
                                          confirmButtonText: 'Delete',
                                          title: 'Delete Filesystem MCP server',
                                          description:
                                              'This configuration will be deleted and no longer available in Q. \n\n This cannot be undone.',
                                      },
                                      text: `Delete MCP server`,
                                  },
                              ],
                          }
                        : {}),
                })),
            }
        }

        // Add filter actions if present
        if (params.filterActions && params.filterActions.length > 0) {
            detailedList.filterActions = this.processFilterActions(params.filterActions)
        }

        return detailedList
    }

    /**
     * Displays the list of MCP servers
     */
    public listMcpServers(params: ListMcpServersResult) {
        this.isMcpServersListActive = true
        // Convert the ListMcpServersResult to the format expected by mynahUi.openDetailedList
        const detailedList: any = {
            selectable: true,
            textDirection: 'row',
            header: params.header
                ? {
                      title: params.header.title,
                      description: params.header.description,
                      status: params.header.status,
                      actions: [
                          {
                              id: 'add-new-mcp',
                              icon: toMynahIcon('plus'),
                              status: 'clear',
                              description: 'Add new MCP',
                          },
                          {
                              id: 'refresh-mcp-list',
                              icon: toMynahIcon('refresh'),
                              status: 'clear',
                              description: 'Refresh MCP servers',
                          },
                      ],
                  }
                : undefined,
            filterOptions: params.filterOptions?.map(filter => ({
                ...filter,
                icon: toMynahIcon(filter.icon),
            })),
            list: params.list.map(group => ({
                groupName: group.groupName,
                children: group.children?.map(item => {
                    // Determine icon based on group name and status
                    let icon
                    let iconForegroundStatus

                    // Extract status from serverInformation if available
                    const serverInfoGroup = item.children?.find(child => child.groupName === 'serverInformation')
                    const statusChild = serverInfoGroup?.children?.find(child => child.title === 'status')
                    const status = statusChild?.description || 'DISABLED'

                    if (status === 'ENABLED') {
                        icon = 'ok-circled'
                        iconForegroundStatus = 'success'
                    } else if (status === 'FAILED') {
                        icon = 'cancel-circle'
                        iconForegroundStatus = 'error'
                    } else if (status === 'INITIALIZING') {
                        icon = 'progress'
                        iconForegroundStatus = 'info'
                    } else if (group.groupName === 'Disabled') {
                        icon = 'block'
                        iconForegroundStatus = 'info'
                    }

                    // Create actions based on group name
                    const actions = []
                    if (group.groupName === 'Active') {
                        if (status !== 'FAILED') {
                            const getToolCount = () => {
                                const serverInfoGroup = item.children?.find(
                                    child => child.groupName === 'serverInformation'
                                )
                                if (serverInfoGroup) {
                                    const toolCountChild = serverInfoGroup.children?.find(
                                        child => child.title === 'toolcount'
                                    )
                                    if (toolCountChild) {
                                        return toolCountChild.description ?? '0'
                                    }
                                }
                                return '0'
                            }

                            const toolCount = getToolCount()
                            actions.push({
                                id: 'open-mcp-server',
                                icon: toMynahIcon('tools'),
                                description: `${toolCount} available tools`,
                                text: toolCount,
                            })
                            actions.push({
                                id: 'open-mcp-server',
                                icon: toMynahIcon('right-open'),
                            })
                        } else {
                            actions.push({
                                id: 'mcp-fix-server',
                                icon: toMynahIcon('pencil'),
                                text: 'Fix Configuration',
                                description: 'Fix Configuration',
                            })
                            actions.push({
                                id: 'open-mcp-server',
                                icon: toMynahIcon('right-open'),
                                disabled: true,
                            })
                        }
                    } else if (group.groupName === 'Disabled') {
                        actions.push({
                            id: 'mcp-enable-server',
                            icon: toMynahIcon('ok'),
                            text: 'Enable',
                            description: 'Enable',
                        })
                        actions.push({
                            id: 'mcp-delete-server',
                            icon: toMynahIcon('trash'),
                            text: 'Delete',
                            description: 'Delete',
                            confirmation: {
                                cancelButtonText: 'Cancel',
                                confirmButtonText: 'Delete',
                                title: 'Delete Filesystem MCP server',
                                description:
                                    'This configuration will be deleted and no longer available in Q. \n\n This cannot be undone.',
                            },
                        })
                        actions.push({
                            id: 'open-mcp-server',
                            icon: toMynahIcon('right-open'),
                            disabled: true,
                        })
                    }

                    return {
                        id: 'mcp-server-click',
                        title: item.title,
                        icon: toMynahIcon(icon),
                        iconForegroundStatus: iconForegroundStatus,
                        groupActions: false,
                        actions: actions,
                    }
                }),
            })),
        }

        if (detailedList.filterOptions && detailedList.filterOptions.length > 0) {
            // eslint-disable-next-line no-extra-semi
            ;(detailedList.filterOptions[0] as any).autoFocus = true
        }

        const mcpSheet = this.mynahUi.openDetailedList({
            detailedList: detailedList,
            events: {
                onFilterValueChange: (filterValues: Record<string, any>) => {
                    this.messager.onListMcpServers(filterValues)
                },
                onKeyPress: (e: KeyboardEvent) => {
                    if (e.key === 'Escape') {
                        mcpSheet.close()
                    }
                },
                onItemSelect: (item: DetailedListItem) => {
                    // actionId: open-mcp-server if valid server or mcp-fix-server if server needs to be fixed
                    const actionId = item.actions?.[0].id
                    if (actionId) {
                        this.messager.onMcpServerClick(actionId, item.title)
                    }
                },
                onItemClick: (item: DetailedListItem) => {
                    if (item.id) {
                        this.messager.onMcpServerClick(item.id)
                    }
                },
                onActionClick: (action: ChatItemButton, item?: DetailedListItem) => {
                    this.messager.onMcpServerClick(action.id, item?.title)
                },
                onClose: () => {
                    this.isMcpServersListActive = false
                },
                onTitleActionClick: button => {
                    this.messager.onMcpServerClick(button.id)
                },
            },
        })
    }

    /**
     * Handles MCP server click events
     */
    public mcpServerClick(params: McpServerClickResult) {
        const typedParams = params as McpServerParams
        if (params.id === 'add-new-mcp' || params.id === 'edit-mcp' || params.id === 'mcp-fix-server') {
            this.mynahUi.toggleSplashLoader(false)
            const detailedList = this.createAddMcpServerDetailedList(typedParams)

            const events = {
                onBackClick: () => {
                    this.messager.onListMcpServers()
                },
                onFilterActionClick: (
                    actionParams: McpServerClickResult,
                    filterValues?: Record<string, string>,
                    isValid?: boolean
                ) => {
                    if (actionParams.id === 'cancel-mcp') {
                        this.messager.onListMcpServers()
                        return
                    }

                    // new and update will share the same save-mcp
                    if (actionParams.id === 'save-mcp') {
                        this.mynahUi.toggleSplashLoader(true, '**Activating MCP Server**')
                        this.messager.onMcpServerClick(actionParams.id, 'Save configuration', filterValues)
                    }
                },
                onTitleActionClick: (action: ChatItemButton) => {
                    const serverName = (action as any).data?.serverName
                    this.messager.onMcpServerClick(action.id, serverName)
                },
            }
            this.mynahUi.openDetailedList({ detailedList, events }, true)
        } else if (params.id === 'open-mcp-server') {
            //turning off splash loader in case of being on when new server is added
            this.mynahUi.toggleSplashLoader(false)
            const detailedList = this.createViewMcpServerDetailedList(typedParams)

            const mcpServerSheet = this.mynahUi.openDetailedList(
                {
                    detailedList: detailedList,
                    events: {
                        onFilterValueChange: (filterValues: Record<string, string>) => {
                            // Handle filter value changes for tool permissions
                            this.messager.onMcpServerClick(
                                'mcp-permission-change',
                                detailedList.header?.title,
                                filterValues
                            )
                        },
                        onFilterActionClick: () => {},
                        onTitleActionClick: (action: ChatItemButton) => {
                            this.messager.onMcpServerClick(action.id, detailedList.header?.title)
                        },
                        onKeyPress: (e: KeyboardEvent) => {
                            if (e.key === 'Escape') {
                                mcpServerSheet.close()
                            }
                        },
                        onActionClick: (action: ChatItemButton) => {
                            // Handle action clicks (save, cancel, etc.)
                            this.messager.onMcpServerClick(action.id)
                        },
                        onClose: () => {
                            this.messager.onMcpServerClick('save-permission-change')
                        },
                        onBackClick: () => {
                            this.messager.onMcpServerClick('save-permission-change')
                            this.messager.onListMcpServers()
                        },
                    },
                },
                true
            )
        } else if (['mcp-disable-server', 'mcp-delete-server', 'mcp-enable-server'].includes(params.id)) {
            this.messager.onListMcpServers()
        } else if (params.id === 'update-mcp-list') {
            if (this.isMcpServersListActive) {
                this.messager.onListMcpServers()
            }
        }
    }
}
