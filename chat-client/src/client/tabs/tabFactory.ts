import { ChatMessage } from '@aws/language-server-runtimes-types'
import {
    ChatItem,
    ChatItemType,
    MynahIcons,
    MynahUIDataModel,
    QuickActionCommandGroup,
    TabBarMainAction,
} from '@aws/mynah-ui'
import { disclaimerCard } from '../texts/disclaimer'
import { ChatHistory } from '../features/history'

export type DefaultTabData = MynahUIDataModel

export class TabFactory {
    private enableHistory: boolean = false
    private enableExport: boolean = false

    public static generateUniqueId() {
        // from https://github.com/aws/mynah-ui/blob/a3799f47ca4b7c02850264e328539a40709a6858/src/helper/guid.ts#L6
        const firstPart: number = (Math.random() * 46656) | 0
        const secondPart: number = (Math.random() * 46656) | 0
        return `000${firstPart.toString(36)}`.slice(-3) + `000${secondPart.toString(36)}`.slice(-3)
    }

    constructor(
        private defaultTabData: DefaultTabData,
        private quickActionCommands?: QuickActionCommandGroup[]
    ) {}

    public createTab(
        needWelcomeMessages: boolean,
        disclaimerCardActive: boolean,
        chatMessages?: ChatMessage[]
    ): MynahUIDataModel {
        const tabData: MynahUIDataModel = {
            ...this.getDefaultTabData(),
            chatItems: needWelcomeMessages
                ? [
                      {
                          type: ChatItemType.ANSWER,
                          body: `Hi, I'm Amazon Q. I can answer your software development questions. 
                        Ask me to explain, debug, or optimize your code. 
                        You can enter \`/\` to see a list of quick actions.`,
                      },
                      {
                          type: ChatItemType.ANSWER,
                          followUp: this.getWelcomeBlock(),
                      },
                  ]
                : chatMessages
                  ? (chatMessages as ChatItem[])
                  : [],
            ...(disclaimerCardActive ? { promptInputStickyCard: disclaimerCard } : {}),
        }
        return tabData
    }

    public updateQuickActionCommands(quickActionCommands: QuickActionCommandGroup[]) {
        this.quickActionCommands = [...(this.quickActionCommands ?? []), ...quickActionCommands]
    }

    public enableHistoryAction(isEnabled: boolean) {
        this.enableHistory = isEnabled
    }

    public enableExportAction(isEnabled: boolean) {
        this.enableExport = isEnabled
    }

    public getDefaultTabData(): DefaultTabData {
        return {
            ...this.defaultTabData,
            ...(this.quickActionCommands ? { quickActionCommands: this.quickActionCommands } : {}),
            tabBarButtons: this.getTabBarActions(),
        }
    }

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

    private getTabBarActions(): TabBarMainAction[] {
        const tabBarActions = []

        if (this.enableHistory) {
            tabBarActions.push({
                id: ChatHistory.TabBarButtonId,
                icon: MynahIcons.HISTORY,
                description: 'View chat history',
            })
        }

        if (this.enableExport) {
            tabBarActions.push({
                id: 'export',
                icon: MynahIcons.EXTERNAL,
                description: 'Export chat',
            })
        }

        return tabBarActions
    }
}
