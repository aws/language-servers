import {
    ChatItem,
    ChatItemType,
    MynahIcons,
    MynahUIDataModel,
    QuickActionCommandGroup,
    QuickActionCommandsHeader,
    TabBarMainAction,
} from '@aws/mynah-ui'
import { disclaimerCard } from '../texts/disclaimer'
import { ChatMessage } from '@aws/language-server-runtimes-types'
import { ChatHistory } from '../features/history'
import { pairProgrammingPromptInput, programmerModeCard } from '../texts/pairProgramming'
import { modelSelectionForRegion } from '../texts/modelSelection'

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
                ? [
                      pairProgrammingPromptInput,
                      ...(this.modelSelectionEnabled ? [modelSelectionForRegion['us-east-1']] : []),
                  ]
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
                  ? (chatMessages as ChatItem[])
                  : []),
        ]
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
            ...(this.reroute
                ? {
                      quickActionCommandsHeader: {
                          status: 'warning',
                          icon: MynahIcons.INFO,
                          title: 'Q Developer agentic capabilities',
                          description:
                              "You can now ask Q directly in the chat to generate code, documentation, and unit tests. You don't need to explicitly use /dev, /test, /review or /doc",
                      } as QuickActionCommandsHeader,
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
                description: 'Configure MCP servers and Built-in tools',
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

    // Enhanced welcome messages block for non-agentic mode
    private getEnhancedWelcomeBlock() {
        return {
            text: '',
            options: [
                {
                    pillText: 'Getting Started',
                    prompt: 'What can Amazon Q help me with?',
                    type: 'help',
                },
            ],
        }
    }

    // Agentic welcome messages block
    private getAgenticWelcomeBlock() {
        return {
            text: '',
            options: [
                {
                    pillText: 'Getting Started',
                    prompt: 'What can Amazon Q help me with?',
                    type: 'help',
                },
            ],
        }
    }

    // Legacy welcome messages block
    private getWelcomeBlock() {
        return {
            text: 'Try Examples:',
            options: [
                {
                    pillText: 'Explain selected code',
                    prompt: 'Explain selected code',
                    type: 'init-prompt',
                },
                {
                    pillText: 'How can Amazon Q help me?',
                    type: 'help',
                },
            ],
        }
    }
}
