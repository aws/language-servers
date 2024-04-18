import { ChatItemType, MynahUIDataModel } from '@aws/mynah-ui'

export class TabFactory {
    public createTab(needWelcomeMessages: boolean): MynahUIDataModel {
        const tabData: MynahUIDataModel = {
            tabTitle: 'Chat',
            promptInputInfo:
                'Use of Amazon Q is subject to the [AWS Responsible AI Policy](https://aws.amazon.com/machine-learning/responsible-ai/policy/).',
            promptInputPlaceholder: 'Ask a question or enter "/" for quick actions',
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
