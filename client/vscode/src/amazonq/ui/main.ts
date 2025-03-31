import { ChatItem, ChatItemType, ChatPrompt, MynahIcons, MynahUI, MynahUIDataModel, ProgressField } from '@aws/mynah-ui'
import { Connector, CWCChatItem } from './ideConnector'
import { QuickActionHandler } from './quickActions/handler'
import { TabsStorage, TabType } from './storages/tabsStorage'
import { DiffTreeFileInfo } from './diffTree/types'
import { WelcomeFollowupType } from './apps/amazonqCommonsConnector'
import { ChatEventHandler, ChatClientAdapter } from '@aws/chat-client'

export const createConnectorAdapter = (ideApiPostMessage: (msg: any) => void) => {
    return new LegacyQChatConnectorAdapter(ideApiPostMessage)
}

export class LegacyQChatConnectorAdapter implements ChatClientAdapter {
    tabStorage: TabsStorage
    mynahUIRef?: { mynahUI: MynahUI | undefined }
    connector?: Connector
    supportedTabTypes = ['gumby', 'featuredev', 'review', 'testgen', 'doc']
    supportedCommands = ['/transform', '/dev', '/review', '/test', '/doc']
    ideApiPostMessage: (msg: any) => void

    constructor(ideApiPostMessage: (msg: any) => void) {
        this.tabStorage = new TabsStorage()
        this.ideApiPostMessage = ideApiPostMessage
    }

    isSupportedQuickAction(command: string): boolean {
        return this.supportedCommands.includes(command)
    }

    // Created actual handlers connected to custom implementation IDE.
    createChatEventHandler(mynahUIRef: { mynahUI: MynahUI | undefined }): ChatEventHandler {
        this.mynahUIRef = mynahUIRef

        function shouldDisplayDiff(messageData: any) {
            // const tab = tabsStorage.getTab(messageData?.tabID || '')
            // const allowedCommands = [
            //     'aws.amazonq.refactorCode',
            //     'aws.amazonq.fixCode',
            //     'aws.amazonq.optimizeCode',
            //     'aws.amazonq.sendToPrompt',
            // ]
            // if (tab?.type === 'cwc' && allowedCommands.includes(tab.lastCommand || '')) {
            //     return true
            // }
            return false
        }

        const tabsStorage = this.tabStorage
        const handleQuickAction = this.handleQuickAction
        const ideApiPostMessage = this.ideApiPostMessage
        this.connector = new Connector({
            tabsStorage,
            handleCommand: (chatPrompt: ChatPrompt, tabId: string) => {},
            onUpdateAuthentication: (isAmazonQEnabled: boolean, authenticatingTabIDs: string[]): void => {},
            onFileActionClick: (tabID: string, messageId: string, filePath: string, actionName: string): void => {},
            onQuickHandlerCommand: (tabID: string, command?: string, eventId?: string) => {
                tabsStorage.updateTabLastCommand(tabID, command)
                if (command === 'aws.awsq.transform') {
                    handleQuickAction({ command: '/transform' }, tabID, eventId)
                }
            },
            onCWCContextCommandMessage: (message: ChatItem, command?: string): string | undefined => {
                return undefined
            },
            onWelcomeFollowUpClicked: (tabID: string, welcomeFollowUpType: WelcomeFollowupType) => {},
            onChatInputEnabled: (tabID: string, enabled: boolean) => {
                mynahUIRef.mynahUI!.updateStore(tabID, {
                    promptInputDisabledState: tabsStorage.isTabDead(tabID) || !enabled,
                })
            },
            onUpdatePromptProgress(tabID: string, progressField: ProgressField) {},
            onAsyncEventProgress: (
                tabID: string,
                inProgress: boolean,
                message: string | undefined,
                messageId: string | undefined = undefined,
                enableStopAction: boolean = false
            ) => {
                if (inProgress) {
                    mynahUIRef.mynahUI!.updateStore(tabID, {
                        loadingChat: true,
                        promptInputDisabledState: true,
                        cancelButtonWhenLoading: enableStopAction,
                    })

                    if (message && messageId) {
                        mynahUIRef.mynahUI!.updateChatAnswerWithMessageId(tabID, messageId, {
                            body: message,
                        })
                    } else if (message) {
                        mynahUIRef.mynahUI!.updateLastChatAnswer(tabID, {
                            body: message,
                        })
                    } else {
                        mynahUIRef.mynahUI!.addChatItem(tabID, {
                            type: ChatItemType.ANSWER_STREAM,
                            body: '',
                            messageId: messageId,
                        })
                    }
                    tabsStorage.updateTabStatus(tabID, 'busy')
                    return
                }

                mynahUIRef.mynahUI!.updateStore(tabID, {
                    loadingChat: false,
                    promptInputDisabledState: tabsStorage.isTabDead(tabID),
                })
                tabsStorage.updateTabStatus(tabID, 'free')
            },
            sendMessageToExtension: message => {
                ideApiPostMessage(message)
            },
            onChatAnswerUpdated: (tabID: string, item: ChatItem) => {
                if (item.messageId !== undefined) {
                    mynahUIRef.mynahUI!.updateChatAnswerWithMessageId(tabID, item.messageId, {
                        ...(item.body !== undefined ? { body: item.body } : {}),
                        ...(item.buttons !== undefined ? { buttons: item.buttons } : {}),
                        ...(item.followUp !== undefined ? { followUp: item.followUp } : {}),
                    })
                } else {
                    mynahUIRef.mynahUI!.updateLastChatAnswer(tabID, {
                        ...(item.body !== undefined ? { body: item.body } : {}),
                        ...(item.buttons !== undefined ? { buttons: item.buttons } : {}),
                        ...(item.followUp !== undefined ? { followUp: item.followUp } : {}),
                    })
                }
            },
            onChatAnswerReceived: (tabID: string, item: CWCChatItem, messageData: any) => {
                if (item.type === ChatItemType.ANSWER_PART || item.type === ChatItemType.CODE_RESULT) {
                    mynahUIRef.mynahUI!.updateLastChatAnswer(tabID, {
                        ...(item.messageId !== undefined ? { messageId: item.messageId } : {}),
                        ...(item.canBeVoted !== undefined ? { canBeVoted: item.canBeVoted } : {}),
                        ...(item.codeReference !== undefined ? { codeReference: item.codeReference } : {}),
                        ...(item.body !== undefined ? { body: item.body } : {}),
                        ...(item.relatedContent !== undefined ? { relatedContent: item.relatedContent } : {}),
                        ...(item.type === ChatItemType.CODE_RESULT
                            ? { type: ChatItemType.CODE_RESULT, fileList: item.fileList }
                            : {}),
                    })
                    if (
                        item.messageId !== undefined &&
                        item.userIntent !== undefined &&
                        item.codeBlockLanguage !== undefined
                    ) {
                        // TODO: Some hack below for telemetry, we would need proper way to solve it
                        // responseMetadata.set(item.messageId, [item.userIntent, item.codeBlockLanguage])
                    }
                    ideApiPostMessage({
                        command: 'update-chat-message-telemetry',
                        tabID,
                        tabType: tabsStorage.getTab(tabID)?.type,
                        time: Date.now(),
                    })
                    return
                }

                if (
                    item.body !== undefined ||
                    item.relatedContent !== undefined ||
                    item.followUp !== undefined ||
                    item.formItems !== undefined ||
                    item.buttons !== undefined
                ) {
                    mynahUIRef.mynahUI!.addChatItem(tabID, {
                        ...item,
                        messageId: item.messageId,
                        codeBlockActions: {
                            // TODO: shouldDisplayDiff is for basic chat,
                            // but we do not have that functionality in basic chat, so we need to migrate it
                            ...(shouldDisplayDiff(messageData)
                                ? {
                                      'insert-to-cursor': undefined,
                                      accept_diff: {
                                          id: 'accept_diff',
                                          label: 'Apply Diff',
                                          icon: MynahIcons.OK_CIRCLED,
                                          data: messageData,
                                      },
                                      view_diff: {
                                          id: 'view_diff',
                                          label: 'View Diff',
                                          icon: MynahIcons.EYE,
                                          data: messageData,
                                      },
                                  }
                                : {}),
                        },
                    })
                }

                if (
                    item.type === ChatItemType.PROMPT ||
                    item.type === ChatItemType.SYSTEM_PROMPT ||
                    item.type === ChatItemType.AI_PROMPT
                ) {
                    mynahUIRef.mynahUI!.updateStore(tabID, {
                        loadingChat: true,
                        cancelButtonWhenLoading: false,
                        promptInputDisabledState: true,
                    })

                    tabsStorage.updateTabStatus(tabID, 'busy')
                    return
                }

                if (item.type === ChatItemType.ANSWER) {
                    mynahUIRef.mynahUI!.updateStore(tabID, {
                        loadingChat: false,
                        promptInputDisabledState: tabsStorage.isTabDead(tabID),
                    })
                    tabsStorage.updateTabStatus(tabID, 'free')

                    /**
                     * We've received an answer for a tabID and this message has
                     * completed its round trip. Send that information back to
                     * VSCode so we can emit a round trip event
                     **/
                    ideApiPostMessage({
                        command: 'stop-chat-message-telemetry',
                        tabID,
                        tabType: tabsStorage.getTab(tabID)?.type,
                        time: Date.now(),
                    })
                }
            },
            onRunTestMessageReceived: (tabID: string, shouldRunTestMessage: boolean) => {},
            onMessageReceived: (tabID: string, messageData: MynahUIDataModel) => {},
            onFileComponentUpdate: (
                tabID: string,
                filePaths: DiffTreeFileInfo[],
                deletedFiles: DiffTreeFileInfo[],
                messageId: string,
                disableFileActions: boolean
            ) => {},
            onWarning: (tabID: string, message: string, title: string) => {},
            onError: (tabID: string, message: string, title: string) => {},
            onUpdatePlaceholder(tabID: string, newPlaceholder: string) {
                mynahUIRef.mynahUI!.updateStore(tabID, {
                    promptInputPlaceholder: newPlaceholder,
                })
            },
            onNewTab(tabType: TabType) {},
            onOpenSettingsMessage(tabId: string) {
                mynahUIRef.mynahUI!.addChatItem(tabId, {
                    type: ChatItemType.ANSWER,
                    body: `To add your workspace as context, enable local indexing in your IDE settings. After enabling, add @workspace to your question, and I'll generate a response using your workspace as context.`,
                    buttons: [
                        {
                            id: 'open-settings',
                            text: 'Open settings',
                            icon: MynahIcons.EXTERNAL,
                            keepCardAfterClick: false,
                            status: 'info',
                        },
                    ],
                })
                tabsStorage.updateTabStatus(tabId, 'free')
                mynahUIRef.mynahUI!.updateStore(tabId, {
                    loadingChat: false,
                    promptInputDisabledState: tabsStorage.isTabDead(tabId),
                })
                return
            },
            /**
             * Helps with sending static messages that don't need to be sent through to the
             * VSCode side. E.g. help messages
             */
            sendStaticMessages(tabID: string, messages: ChatItem[]) {},
        })

        return this.connector
    }

    isSupportedTab(tabId: string): boolean {
        const tabType = this.tabStorage.getTab(tabId)?.type
        return tabType ? this.supportedTabTypes.includes(tabType) : false
    }

    handleMessageReceive(message: MessageEvent): void {
        if (this.connector) {
            this.connector.handleMessageReceive(message)
        } else {
            console.error('Connector not initialized')
        }
    }

    handleQuickAction(prompt: ChatPrompt, tabId: string, eventId: string | undefined): void {
        const handler = this.getQuickActionHandler()
        if (handler) {
            handler.handle(prompt, tabId, eventId)
        } else {
            console.error('Quick action handler not initialized')
        }
    }

    private quickActionHandler?: QuickActionHandler
    private getQuickActionHandler() {
        const tabsStorage = this.tabStorage
        const mynahUI = this.mynahUIRef?.mynahUI
        const connector = this.connector
        if (!this.quickActionHandler && mynahUI && connector) {
            this.quickActionHandler = new QuickActionHandler({
                mynahUI,
                connector,
                tabsStorage,
                isFeatureDevEnabled: true, // TODO: Settings need to be passed somehow
                isGumbyEnabled: true,
                isScanEnabled: true,
                isTestEnabled: true,
                isDocEnabled: true,
            })
        }

        return this.quickActionHandler
    }
}
