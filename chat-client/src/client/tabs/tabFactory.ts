import { ChatItemType, MynahUIDataModel } from '@aws/mynah-ui'

export type DefaultTabData = MynahUIDataModel

export class TabFactory {
    public static generateUniqueId() {
        // from https://github.com/aws/mynah-ui/blob/a3799f47ca4b7c02850264e328539a40709a6858/src/helper/guid.ts#L6
        const firstPart: number = (Math.random() * 46656) | 0
        const secondPart: number = (Math.random() * 46656) | 0
        return `000${firstPart.toString(36)}`.slice(-3) + `000${secondPart.toString(36)}`.slice(-3)
    }

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
