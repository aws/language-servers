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

export type DefaultTabData = MynahUIDataModel

export const ExportTabBarButtonId = 'export'

export class TabFactory {
    private history: boolean = false
    private export: boolean = false

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
        pairProgrammingCardActive: boolean,
        chatMessages?: ChatMessage[]
    ): MynahUIDataModel {
        const tabData: MynahUIDataModel = {
            ...this.getDefaultTabData(),
            chatItems: needWelcomeMessages
                ? [
                      ...(pairProgrammingCardActive ? [programmerModeCard] : []),
                      {
                          type: ChatItemType.ANSWER,
                          body: `Hi, I'm Amazon Q. I can answer your software development questions. 
                        Ask me to explain, debug, or optimize your code. 
                        You can enter \`/\` to see a list of quick actions.`,
                      },
                  ]
                : chatMessages
                  ? (chatMessages as ChatItem[])
                  : [],
            ...(disclaimerCardActive ? { promptInputStickyCard: disclaimerCard } : {}),
            promptInputOptions: [pairProgrammingPromptInput],
        }
        return tabData
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

    public getDefaultTabData(): DefaultTabData {
        const tabData = {
            ...this.defaultTabData,
            ...(this.quickActionCommands ? { quickActionCommands: this.quickActionCommands } : {}),
        }

        tabData.tabBarButtons = this.getTabBarButtons()
        return tabData
    }

    private getTabBarButtons(): TabBarMainAction[] | undefined {
        const tabBarButtons = [...(this.defaultTabData.tabBarButtons ?? [])]

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

        return tabBarButtons.length ? tabBarButtons : undefined
    }
}
