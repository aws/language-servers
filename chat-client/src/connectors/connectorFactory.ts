import { ChatItem, ChatItemType, MynahIcons, MynahUI, MynahUIProps } from '@aws/mynah-ui'
import { Connector, CWCChatItem } from './connector'
import { TabsStorage } from './storages/tabsStorage'
import { QuickActionHandler } from './quickActions/handler'

export const connectorFactory = (
    mynahUiProps: MynahUIProps,
    ref: { mynahUI: MynahUI | undefined },
    ideApiPostMessage: (msg: any) => void
): [Connector | undefined, MynahUIProps] => {
    const tabsStorage = new TabsStorage()
    // eslint-disable-next-line prefer-const
    let quickActionHandler: QuickActionHandler

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
    function getQuickActionHandler() {
        if (!quickActionHandler) {
            quickActionHandler = new QuickActionHandler({
                mynahUI: ref.mynahUI!,
                connector: featuresConnector,
                tabsStorage,
            })
        }

        return quickActionHandler
    }

    // NOTE: 02. Route events from connectors (triggered by business logic / extension) to UI
    const featuresConnector = new Connector(
        tabsStorage,
        // Defines features-specific handlers
        {
            tabsStorage,
            onUpdatePlaceholder(tabID: string, newPlaceholder: string) {
                ref.mynahUI!.updateStore(tabID, {
                    promptInputPlaceholder: newPlaceholder,
                })
            },
            onChatInputEnabled: (tabID: string, enabled: boolean) => {
                ref.mynahUI!.updateStore(tabID, {
                    promptInputDisabledState: tabsStorage.isTabDead(tabID) || !enabled,
                })
            },
            onUpdateAuthentication: (isAmazonQEnabled: boolean, authenticatingTabIDs: string[]): void => {
                // TODO
            },
            onQuickHandlerCommand: (tabID: string, command?: string, eventId?: string) => {
                tabsStorage.updateTabLastCommand(tabID, command)
                if (command === 'aws.awsq.transform') {
                    quickActionHandler.handle({ command: '/transform' }, tabID, eventId)
                } else if (command === 'aws.awsq.clearchat') {
                    quickActionHandler.handle({ command: '/clear' }, tabID)
                }
            },
            onChatAnswerUpdated: (tabID: string, item: ChatItem) => {
                if (item.messageId !== undefined) {
                    ref.mynahUI!.updateChatAnswerWithMessageId(tabID, item.messageId, {
                        ...(item.body !== undefined ? { body: item.body } : {}),
                        ...(item.buttons !== undefined ? { buttons: item.buttons } : {}),
                        ...(item.followUp !== undefined ? { followUp: item.followUp } : {}),
                    })
                } else {
                    ref.mynahUI!.updateLastChatAnswer(tabID, {
                        ...(item.body !== undefined ? { body: item.body } : {}),
                        ...(item.buttons !== undefined ? { buttons: item.buttons } : {}),
                        ...(item.followUp !== undefined ? { followUp: item.followUp } : {}),
                    })
                }
            },
            onAsyncEventProgress: (
                tabID: string,
                inProgress: boolean,
                message: string | undefined,
                messageId: string | undefined = undefined,
                enableStopAction: boolean = false
            ) => {
                if (inProgress) {
                    ref.mynahUI!.updateStore(tabID, {
                        loadingChat: true,
                        promptInputDisabledState: true,
                        cancelButtonWhenLoading: enableStopAction,
                    })

                    if (message && messageId) {
                        ref.mynahUI!.updateChatAnswerWithMessageId(tabID, messageId, {
                            body: message,
                        })
                    } else if (message) {
                        ref.mynahUI!.updateLastChatAnswer(tabID, {
                            body: message,
                        })
                    } else {
                        ref.mynahUI!.addChatItem(tabID, {
                            type: ChatItemType.ANSWER_STREAM,
                            body: '',
                            messageId: messageId,
                        })
                    }
                    tabsStorage.updateTabStatus(tabID, 'busy')
                    return
                }

                ref.mynahUI!.updateStore(tabID, {
                    loadingChat: false,
                    promptInputDisabledState: tabsStorage.isTabDead(tabID),
                })
                tabsStorage.updateTabStatus(tabID, 'free')
            },
            onOpenSettingsMessage(tabId: string) {
                ref.mynahUI!.addChatItem(tabId, {
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
                ref.mynahUI!.updateStore(tabId, {
                    loadingChat: false,
                    promptInputDisabledState: tabsStorage.isTabDead(tabId),
                })
                return
            },
            onError: (tabID: string, message: string, title: string) => {
                // TODO
            },
            onWarning: (tabID: string, message: string, title: string) => {
                // TODO
            },
            onChatAnswerReceived: (tabID: string, item: CWCChatItem, messageData: any) => {
                if (item.type === ChatItemType.ANSWER_PART || item.type === ChatItemType.CODE_RESULT) {
                    ref.mynahUI!.updateLastChatAnswer(tabID, {
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
                    ref.mynahUI!.addChatItem(tabID, {
                        ...item,
                        messageId: item.messageId,
                        codeBlockActions: {
                            // TODO: Requires investigation: shouldDisplayDiff is for basic chat,
                            // but we do not have that functionality in basic chat
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
                    ref.mynahUI!.updateStore(tabID, {
                        loadingChat: true,
                        cancelButtonWhenLoading: false,
                        promptInputDisabledState: true,
                    })

                    tabsStorage.updateTabStatus(tabID, 'busy')
                    return
                }

                if (item.type === ChatItemType.ANSWER) {
                    ref.mynahUI!.updateStore(tabID, {
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
            sendMessageToExtension: message => {
                ideApiPostMessage(message)
            },
        }
    )

    // NOTE: 03. Route actions in UI to connector or base chat
    // Adapter: override generic MynahUI handlers with feature-specific functionality
    const connectorMynahUiProps: MynahUIProps = {
        ...mynahUiProps,
        onChatPrompt(tabId, prompt, eventId) {
            if (tabsStorage.getTab(tabId)?.type === 'gumby') {
                featuresConnector.requestAnswer(tabId, {
                    chatMessage: prompt.prompt ?? '',
                })
                return
            }

            if (prompt.command?.trim() === '/transform') {
                getQuickActionHandler().handle(prompt, tabId, eventId)
                return
            }

            mynahUiProps.onChatPrompt?.(tabId, prompt, eventId)
        },
        onInBodyButtonClicked(tabId, messageId, action, eventId) {
            if (tabsStorage.getTab(tabId)?.type === 'gumby') {
                featuresConnector.onCustomFormAction(tabId, action)
                return
            }

            mynahUiProps.onInBodyButtonClicked?.(tabId, messageId, action, eventId)
        },
        onCustomFormAction(tabId, action, eventId) {
            if (tabsStorage.getTab(tabId)?.type === 'gumby') {
                featuresConnector.onCustomFormAction(tabId, action)
                return
            }

            mynahUiProps.onCustomFormAction?.(tabId, action, eventId)
        },
        onTabRemove(tabId) {
            if (tabsStorage.getTab(tabId)?.type === 'gumby') {
                featuresConnector.onTabRemove(tabId)
                return
            }

            mynahUiProps.onTabRemove?.(tabId)
        },
        onTabChange(tabId) {
            if (tabsStorage.getTab(tabId)?.type === 'gumby') {
                featuresConnector.onTabChange(tabId)
                return
            }

            mynahUiProps.onTabChange?.(tabId)
        },
        onLinkClick(tabId, messageId, link, mouseEvent) {
            if (tabsStorage.getTab(tabId)?.type === 'gumby') {
                mouseEvent?.preventDefault()
                mouseEvent?.stopPropagation()
                mouseEvent?.stopImmediatePropagation()
                featuresConnector.onResponseBodyLinkClick(tabId, messageId, link)
                return
            }

            mynahUiProps.onLinkClick?.(tabId, messageId, link, mouseEvent)
        },
    }

    return [featuresConnector, connectorMynahUiProps]
}
