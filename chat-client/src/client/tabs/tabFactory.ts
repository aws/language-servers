import {
    ChatItem,
    ChatItemType,
    MynahIcons,
    MynahUIDataModel,
    QuickActionCommandGroup,
    TabBarMainAction,
} from '@aws/mynah-ui'
import { disclaimerCard } from '../texts/disclaimer'
import { ChatMessage } from '@aws/language-server-runtimes-types'
import { ChatHistory } from '../features/history'
import { pairProgrammingPromptInput, programmerModeCard } from '../texts/pairProgramming'
import { modelSelection } from '../texts/modelSelection'
import { toDetailsWithoutIcon, toMynahButtons, toMynahFileList, toMynahHeader } from '../utils'

export type DefaultTabData = MynahUIDataModel

export const ExportTabBarButtonId = 'export'

export const McpServerTabButtonId = 'mcp_init'

export const ShowLogsTabBarButtonId = 'show_logs'

export class TabFactory {
    private history: boolean = false
    private export: boolean = false
    private agenticMode: boolean = false
    private mcp: boolean = false
    private modelSelectionEnabled: boolean = false
    private reroute: boolean = false
    private codeReviewInChat: boolean = false
    private showLogs: boolean = false
    initialTabId: string

    public static generateUniqueId() {
        // from https://github.com/aws/mynah-ui/blob/a3799f47ca4b7c02850264e328539a40709a6858/src/helper/guid.ts#L6
        const firstPart: number = (Math.random() * 46656) | 0
        const secondPart: number = (Math.random() * 46656) | 0
        return `000${firstPart.toString(36)}`.slice(-3) + `000${secondPart.toString(36)}`.slice(-3)
    }

    constructor(
        private defaultTabData: DefaultTabData,
        private quickActionCommands?: QuickActionCommandGroup[],
        private bannerMessage?: ChatMessage
    ) {
        this.initialTabId = TabFactory.generateUniqueId()
    }

    public createTab(disclaimerCardActive: boolean): MynahUIDataModel {
        const tabData: MynahUIDataModel = {
            ...this.getDefaultTabData(),
            ...(disclaimerCardActive ? { promptInputStickyCard: disclaimerCard } : {}),
            promptInputOptions: this.agenticMode
                ? [pairProgrammingPromptInput, ...(this.modelSelectionEnabled ? [modelSelection] : [])]
                : [],
            cancelButtonWhenLoading: this.agenticMode, // supported for agentic chat only
        }
        return tabData
    }

    public getChatItems(
        needWelcomeMessages: boolean,
        pairProgrammingCardActive: boolean,
        chatMessages?: ChatMessage[]
    ): ChatItem[] {
        return [
            ...(this.bannerMessage ? [this.getBannerMessage() as ChatItem] : []),
            ...(needWelcomeMessages
                ? [
                      ...(this.agenticMode && pairProgrammingCardActive ? [programmerModeCard] : []),
                      {
                          type: ChatItemType.ANSWER,
                          body: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 200px 0 20px 0;">

<div style="font-size: 24px; margin-bottom: 12px;"><strong>Amazon Q</strong></div>
<div style="background: rgba(128, 128, 128, 0.15); border: 1px solid rgba(128, 128, 128, 0.25); border-radius: 8px; padding: 8px; margin: 4px 0; text-align: center;">
<div style="font-size: 14px; margin-bottom: 4px;"><strong>Did you know?</strong></div>
<div>${this.getRandomTip()}</div>
</div>

Select code & ask me to explain, debug or optimize it, or type \`/\` for quick actions

</div>`,
                          canBeVoted: false,
                      },
                  ]
                : chatMessages
                  ? chatMessages.map(msg => this.chatMessageToChatItem(msg))
                  : []),
        ]
    }

    /**
     * Converts a ChatMessage (from history restoration) to a ChatItem for MynahUI rendering.
     * This applies the same transformations as prepareChatItemFromMessage in mynahUi.ts
     * to ensure tool cards, file lists, MCP summaries, etc. render correctly.
     */
    private chatMessageToChatItem(message: ChatMessage): ChatItem {
        // Convert message type to ChatItemType
        const typeMap: Record<string, ChatItemType> = {
            prompt: ChatItemType.PROMPT,
            answer: ChatItemType.ANSWER,
            'answer-stream': ChatItemType.ANSWER_STREAM,
            directive: ChatItemType.DIRECTIVE,
            tool: ChatItemType.ANSWER,
            'system-prompt': ChatItemType.SYSTEM_PROMPT,
        }
        const msgType = message.type ?? 'answer'
        const chatItemType = typeMap[msgType] ?? ChatItemType.ANSWER

        // Handle MCP tool summary with accordion view
        if (message.type === 'tool' && message.summary) {
            return {
                type: ChatItemType.ANSWER,
                messageId: message.messageId,
                summary: {
                    content: message.summary.content
                        ? {
                              padding: false,
                              wrapCodes: true,
                              header: message.summary.content.header
                                  ? {
                                        icon: message.summary.content.header.icon as any,
                                        body: message.summary.content.header.body,
                                        buttons: message.summary.content.header.buttons as any,
                                        status: undefined, // No spinner for restored items
                                        fileList: undefined,
                                    }
                                  : undefined,
                          }
                        : undefined,
                    collapsedContent:
                        message.summary.collapsedContent?.map(item => ({
                            body: item.body,
                            header: item.header
                                ? {
                                      body: item.header.body,
                                  }
                                : undefined,
                            fullWidth: true,
                            padding: false,
                            muted: false,
                            wrapCodes: item.header?.body === 'Parameters' ? true : false,
                            codeBlockActions: { copy: null, 'insert-to-cursor': null },
                        })) || [],
                },
            }
        }

        // Process header for tool messages
        const processedHeader = toMynahHeader(message.header)
        const fileList = toMynahFileList(message.fileList)
        const buttons = toMynahButtons(message.buttons)

        if (message.type === 'tool' && processedHeader) {
            if (processedHeader.buttons) {
                processedHeader.buttons = processedHeader.buttons.map(button => ({
                    ...button,
                    status: button.status ?? 'clear',
                }))
            }
            if (processedHeader.fileList) {
                processedHeader.fileList = {
                    ...processedHeader.fileList,
                    fileTreeTitle: '',
                    hideFileCount: true,
                    details: toDetailsWithoutIcon(processedHeader.fileList.details),
                    renderAsPills:
                        !processedHeader.fileList.details ||
                        (Object.values(processedHeader.fileList.details).every(detail => !detail.changes) &&
                            (!processedHeader.buttons ||
                                !processedHeader.buttons.some(button => button.id === 'undo-changes')) &&
                            !processedHeader.status?.icon),
                }
            }
            // Clear status for completed historical items
            if (processedHeader && !message.header?.status) {
                processedHeader.status = undefined
            }
        }

        // Check if header should be included
        const includeHeader =
            processedHeader &&
            ((processedHeader.buttons !== undefined &&
                processedHeader.buttons !== null &&
                processedHeader.buttons.length > 0) ||
                processedHeader.status !== undefined ||
                processedHeader.icon !== undefined ||
                processedHeader.fileList !== undefined)

        const padding =
            message.type === 'tool' ? (fileList ? true : message.messageId?.endsWith('_permission')) : undefined

        // Check if message should be muted (stopped, rejected, etc.)
        const shouldMute =
            message.header?.status?.text !== undefined &&
            ['Stopped', 'Rejected', 'Ignored', 'Failed', 'Error'].includes(message.header.status.text)

        return {
            type: chatItemType,
            messageId: message.messageId,
            body: message.body,
            header: includeHeader ? processedHeader : undefined,
            buttons: buttons,
            fileList,
            relatedContent: message.relatedContent,
            codeReference: message.codeReference,
            canBeVoted: message.canBeVoted,
            followUp: message.followUp as any,
            fullWidth: message.type === 'tool' && includeHeader ? true : undefined,
            padding,
            wrapCodes: message.type === 'tool',
            codeBlockActions: message.type === 'tool' ? { 'insert-to-cursor': null, copy: null } : undefined,
            ...(shouldMute ? { muted: true } : {}),
        }
    }

    public updateQuickActionCommands(quickActionCommands: QuickActionCommandGroup[]) {
        this.quickActionCommands = [...(this.quickActionCommands ?? []), ...quickActionCommands]
    }

    public enableHistory() {
        this.history = true
    }

    public enableExport() {
        this.export = true
    }

    public enableShowLogs() {
        this.showLogs = true
    }

    public enableAgenticMode() {
        this.agenticMode = true
    }

    public enableMcp() {
        this.mcp = true
    }

    public enableModelSelection() {
        this.modelSelectionEnabled = true
    }

    public enableReroute() {
        this.reroute = true
    }

    public enableCodeReviewInChat() {
        this.codeReviewInChat = true
    }

    public isRerouteEnabled(): boolean {
        return this.reroute
    }

    public isCodeReviewInChatEnabled(): boolean {
        return this.codeReviewInChat
    }

    public getDefaultTabData(): DefaultTabData {
        const tabData = {
            ...this.defaultTabData,
            ...(this.quickActionCommands
                ? {
                      quickActionCommands: this.quickActionCommands,
                  }
                : {}),
        }

        tabData.tabBarButtons = this.getTabBarButtons()
        return tabData
    }

    public setInfoMessages(messages: ChatMessage[] | undefined) {
        if (messages?.length) {
            // For now this messages array is only populated with banner data hence we use the first item
            this.bannerMessage = messages[0]
        }
    }

    private getBannerMessage(): ChatItem | undefined {
        if (this.bannerMessage) {
            return {
                type: ChatItemType.ANSWER,
                status: 'info',
                ...this.bannerMessage,
            } as ChatItem
        }
        return undefined
    }

    private getRandomTip(): string {
        const hints = [
            'You can now see logs with 1-Click!',
            'MCP is available in Amazon Q!',
            'Pinned context is always included in future chat messages',
            'Create and add Saved Prompts using the @ context menu',
            'Compact your conversation with /compact',
            'Ask Q to review your code and see results in the code issues panel!',
        ]

        const randomIndex = Math.floor(Math.random() * hints.length)
        return hints[randomIndex]
    }

    private getTabBarButtons(): TabBarMainAction[] | undefined {
        const tabBarButtons = [...(this.defaultTabData.tabBarButtons ?? [])]

        if (this.mcp) {
            tabBarButtons.push({
                id: McpServerTabButtonId,
                icon: MynahIcons.TOOLS,
                description: 'Configure MCP servers',
            })
        }

        if (this.history) {
            tabBarButtons.push({
                id: ChatHistory.TabBarButtonId,
                icon: MynahIcons.HISTORY,
                description: 'View chat history',
            })
        }

        if (this.export) {
            tabBarButtons.push({
                id: ExportTabBarButtonId,
                icon: MynahIcons.EXTERNAL,
                description: 'Export chat',
            })
        }

        if (this.showLogs) {
            tabBarButtons.push({
                id: ShowLogsTabBarButtonId,
                icon: MynahIcons.FILE,
                description: 'Show logs',
            })
        }

        return tabBarButtons.length ? tabBarButtons : undefined
    }
}
