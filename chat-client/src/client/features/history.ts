import { ConversationAction, ConversationItemGroup, ListConversationsResult } from '@aws/language-server-runtimes-types'
import { ChatItemButton, DetailedList, DetailedListItem, MynahUI, TextBasedFormItem } from '@aws/mynah-ui'
import { toMynahIcon } from '../utils'
import { Messager } from '../messager'

export const ChatHistory = {
    TabBarButtonId: 'history_sheet',
} as const

interface MynahDetailedList {
    update: (data: DetailedList) => void
    close: () => void
    changeTarget: (direction: 'up' | 'down', snapOnLastAndFirst?: boolean) => void
    getTargetElementId: () => string | undefined
}

export class ChatHistoryList {
    historyDetailedList: MynahDetailedList | undefined

    constructor(
        private mynahUi: MynahUI,
        private messager: Messager
    ) {}

    show(params: ListConversationsResult) {
        const detailedList = {
            header: params.header,
            filterOptions: params.filterOptions?.map(filter => ({
                ...filter,
                icon: toMynahIcon(filter.icon),
            })),
            list: this.toConversationGroups(params.list),
        }
        // set auto focus on the 1st filter option item
        if (detailedList.filterOptions && detailedList.filterOptions.length > 0) {
            // we currently support only text-based items
            ;(detailedList.filterOptions[0] as TextBasedFormItem).autoFocus = true
        }

        if (this.historyDetailedList) {
            this.historyDetailedList.update(detailedList)
        } else {
            this.historyDetailedList = this.mynahUi.openDetailedList({
                detailedList: detailedList,
                events: {
                    onFilterValueChange: this.onFilterValueChange,
                    onKeyPress: this.onKeyPress,
                    onItemSelect: this.onItemSelect,
                    onActionClick: this.onActionClick,
                    onClose: this.onClose,
                },
            })
        }
    }

    close() {
        this.historyDetailedList?.close()
    }

    private onFilterValueChange = (filterValues: Record<string, any>) => {
        this.messager.onListConversations(filterValues)
    }

    private onItemSelect = (item: DetailedListItem) => {
        if (!item.id) {
            throw new Error('Conversation id is not defined')
        }

        if (item.id === 'empty') {
            return
        }

        this.messager.onConversationClick(item.id)
    }

    private onActionClick = (action: ChatItemButton) => {
        const conversationAction = this.getConversationAction(action.text)
        this.messager.onConversationClick(action.id, conversationAction)
    }

    private onClose = () => {
        this.historyDetailedList = undefined
    }

    private onKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.close()
        } else if (e.key === 'Enter') {
            const targetElementId = this.historyDetailedList?.getTargetElementId()
            if (targetElementId) {
                this.onItemSelect({
                    id: targetElementId,
                })
            }
        } else if (e.key === 'ArrowUp') {
            this.historyDetailedList?.changeTarget('up')
        } else if (e.key === 'ArrowDown') {
            this.historyDetailedList?.changeTarget('down')
        }
    }

    private toConversationGroups = (groups: ConversationItemGroup[]) => {
        return groups.map(group => ({
            groupName: group.groupName,
            icon: toMynahIcon(group.icon),
            children: group.items?.map(item => ({
                ...item,
                icon: toMynahIcon(item.icon),
                actions: item.actions?.map(action => ({
                    ...action,
                    icon: toMynahIcon(action.icon),
                })),
            })),
        }))
    }

    private getConversationAction = (actionText: string | undefined): ConversationAction => {
        switch (actionText) {
            case 'Export':
                return 'export'
            case 'Delete':
                return 'delete'
            default:
                throw new Error(`Unsupported action: ${actionText}`)
        }
    }
}
