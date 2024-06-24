import { ChatItemType, MynahUIDataModel } from '@aws/mynah-ui'

export type DefaultTabData = Partial<MynahUIDataModel>

export class TabFactory {
    constructor(private defaultTabData: DefaultTabData) {}

    public createTab(needWelcomeMessages: boolean): MynahUIDataModel {
        const tabData: MynahUIDataModel = {
            ...this.defaultTabData,
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
                : [],
        }
        return tabData
    }

    public updateDefaultTabData(defaultTabData: DefaultTabData) {
        this.defaultTabData = { ...this.defaultTabData, ...defaultTabData }
    }

    public getDefaultTabData(): DefaultTabData {
        return this.defaultTabData
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
}
