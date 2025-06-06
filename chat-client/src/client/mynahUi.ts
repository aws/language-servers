/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    AuthFollowUpClickedParams,
    CopyCodeToClipboardParams,
    ErrorParams,
    GenericCommandParams,
    InsertToCursorPositionParams,
    SendToPromptParams,
    TriggerType,
    isValidAuthFollowUpType,
} from '@aws/chat-client-ui-types'
import {
    ButtonClickParams,
    ChatMessage,
    ChatResult,
    ChatUpdateParams,
    ContextCommand,
    ContextCommandParams,
    ConversationClickResult,
    FeedbackParams,
    FollowUpClickParams,
    GetSerializedChatParams,
    InfoLinkClickParams,
    LinkClickParams,
    ListConversationsResult,
    OPEN_WORKSPACE_INDEX_SETTINGS_BUTTON_ID,
    OpenTabParams,
    SourceLinkClickParams,
} from '@aws/language-server-runtimes-types'
import {
    ChatItem,
    ChatItemType,
    ChatPrompt,
    MynahUI,
    MynahUIDataModel,
    NotificationType,
    MynahUIProps,
    QuickActionCommand,
    ChatItemButton,
} from '@aws/mynah-ui'
import { VoteParams } from '../contracts/telemetry'
import { Messager } from './messager'
import { ExportTabBarButtonId, TabFactory } from './tabs/tabFactory'
import { disclaimerAcknowledgeButtonId, disclaimerCard } from './texts/disclaimer'
import { ChatClientAdapter, ChatEventHandler } from '../contracts/chatClientAdapter'
import { withAdapter } from './withAdapter'
import {
    toDetailsWithoutIcon,
    toMynahButtons,
    toMynahContextCommand,
    toMynahFileList,
    toMynahHeader,
    toMynahIcon,
} from './utils'
import { ChatHistory, ChatHistoryList } from './features/history'
import { pairProgrammingModeOff, pairProgrammingModeOn, programmerModeCard } from './texts/pairProgramming'
import { getModelSelectionChatItem } from './texts/modelSelection'

export interface InboundChatApi {
    addChatResponse(params: ChatResult, tabId: string, isPartialResult: boolean): void
    updateChat(params: ChatUpdateParams): void
    sendToPrompt(params: SendToPromptParams): void
    sendGenericCommand(params: GenericCommandParams): void
    showError(params: ErrorParams): void
    openTab(requestId: string, params: OpenTabParams): void
    sendContextCommands(params: ContextCommandParams): void
    listConversations(params: ListConversationsResult): void
    conversationClicked(params: ConversationClickResult): void
    getSerializedChat(requestId: string, params: GetSerializedChatParams): void
    createTabId(openTab?: boolean): string | undefined
}

type ContextCommandGroups = MynahUIDataModel['contextCommands']

const ContextPrompt = {
    CreateItemId: 'create-saved-prompt',
    CancelButtonId: 'cancel-create-prompt',
    SubmitButtonId: 'submit-create-prompt',
    PromptNameFieldId: 'prompt-name',
} as const

const getTabPromptInputValue = (mynahUi: MynahUI, tabId: string, optionId: string) => {
    const promptInputOptions = mynahUi.getTabData(tabId)?.getStore()?.promptInputOptions ?? []
    return promptInputOptions.find(item => item.id === optionId)?.value
}

const getTabPairProgrammingMode = (mynahUi: MynahUI, tabId: string) =>
    getTabPromptInputValue(mynahUi, tabId, 'pair-programmer-mode') === 'true'

const getTabModelSelection = (mynahUi: MynahUI, tabId: string) =>
    getTabPromptInputValue(mynahUi, tabId, 'model-selection')

export const handlePromptInputChange = (mynahUi: MynahUI, tabId: string, optionsValues: Record<string, string>) => {
    const previousPairProgrammerValue = getTabPairProgrammingMode(mynahUi, tabId)
    const currentPairProgrammerValue = optionsValues['pair-programmer-mode'] === 'true'

    if (currentPairProgrammerValue !== previousPairProgrammerValue) {
        mynahUi.addChatItem(tabId, currentPairProgrammerValue ? pairProgrammingModeOn : pairProgrammingModeOff)
    }

    const previousModelSelectionValue = getTabModelSelection(mynahUi, tabId)
    const currentModelSelectionValue = optionsValues['model-selection']

    if (currentModelSelectionValue !== previousModelSelectionValue) {
        mynahUi.addChatItem(tabId, getModelSelectionChatItem(currentModelSelectionValue))
    }

    const promptInputOptions = mynahUi.getTabData(tabId).getStore()?.promptInputOptions
    mynahUi.updateStore(tabId, {
        promptInputOptions: promptInputOptions?.map(option => {
            option.value = optionsValues[option.id]
            return option
        }),
    })
}

export const handleChatPrompt = (
    mynahUi: MynahUI,
    tabId: string,
    prompt: ChatPrompt,
    messager: Messager,
    triggerType?: TriggerType,
    _eventId?: string,
    agenticMode?: boolean
) => {
    let userPrompt = prompt.escapedPrompt
    messager.onStopChatResponse(tabId)
    if (prompt.command) {
        // Temporary solution to handle clear quick actions on the client side
        if (prompt.command === '/clear') {
            mynahUi.updateStore(tabId, {
                chatItems: [],
            })
        } else if (prompt.command === '/help') {
            userPrompt = DEFAULT_HELP_PROMPT
        }

        // Send prompt when quick action command attached
        messager.onQuickActionCommand({
            quickAction: prompt.command,
            prompt: userPrompt,
            tabId,
        })

        if (prompt.command === '/clear') {
            return
        }
    } else {
        // Send chat prompt to server
        const context = prompt.context?.map(c => (typeof c === 'string' ? { command: c } : c))
        messager.onChatPrompt({ prompt, tabId, context }, triggerType)
    }

    initializeChatResponse(mynahUi, tabId, userPrompt, agenticMode)
}

const initializeChatResponse = (mynahUi: MynahUI, tabId: string, userPrompt?: string, agenticMode?: boolean) => {
    mynahUi.addChatItem(tabId, {
        type: ChatItemType.PROMPT,
        body: userPrompt,
    })

    // Set UI to loading state
    if (agenticMode) {
        mynahUi.updateStore(tabId, {
            loadingChat: true,
            cancelButtonWhenLoading: true,
            promptInputDisabledState: false,
        })
    } else {
        mynahUi.updateStore(tabId, {
            loadingChat: true,
            promptInputDisabledState: true,
        })
    }

    // Create initial empty response
    mynahUi.addChatItem(tabId, {
        type: ChatItemType.ANSWER_STREAM,
    })
}

export const createMynahUi = (
    messager: Messager,
    tabFactory: TabFactory,
    disclaimerAcknowledged: boolean,
    pairProgrammingCardAcknowledged: boolean,
    customChatClientAdapter?: ChatClientAdapter,
    featureConfig?: Map<string, any>,
    agenticMode?: boolean
): [MynahUI, InboundChatApi] => {
    let disclaimerCardActive = !disclaimerAcknowledged
    let programmingModeCardActive = !pairProgrammingCardAcknowledged
    let contextCommandGroups: ContextCommandGroups | undefined

    let chatEventHandlers: ChatEventHandler = {
        onCodeInsertToCursorPosition(
            tabId,
            messageId,
            code,
            type,
            referenceTrackerInformation,
            eventId,
            codeBlockIndex,
            totalCodeBlocks
        ) {
            const payload: InsertToCursorPositionParams = {
                tabId,
                messageId,
                code,
                type,
                referenceTrackerInformation,
                eventId,
                codeBlockIndex,
                totalCodeBlocks,
            }
            messager.onInsertToCursorPosition(payload)
        },
        onFocusStateChanged(focusState: boolean) {
            messager.onFocusStateChanged(focusState)
        },
        onFollowUpClicked(tabId, messageId, followUp, eventId) {
            if (followUp.type !== undefined && isValidAuthFollowUpType(followUp.type)) {
                const payload: AuthFollowUpClickedParams = {
                    tabId,
                    messageId,
                    authFollowupType: followUp.type,
                }
                messager.onAuthFollowUpClicked(payload)
                mynahUi.updateStore(tabId, { promptInputDisabledState: false })
            } else {
                const prompt = followUp.prompt ? followUp.prompt : followUp.pillText
                handleChatPrompt(
                    mynahUi,
                    tabId,
                    { prompt: prompt, escapedPrompt: prompt },
                    messager,
                    'click',
                    eventId,
                    agenticMode
                )

                const payload: FollowUpClickParams = {
                    tabId,
                    messageId,
                    followUp,
                }
                messager.onFollowUpClicked(payload)
            }
        },
        onChatPrompt(tabId, prompt, eventId) {
            handleChatPrompt(mynahUi, tabId, prompt, messager, 'click', eventId, agenticMode)
        },
        onReady: () => {
            messager.onUiReady()
            messager.onTabAdd(tabFactory.initialTabId)
        },
        onFileClick: (tabId, filePath, deleted, messageId, eventId, fileDetails) => {
            messager.onFileClick({ tabId, filePath, messageId, fullPath: fileDetails?.data?.['fullPath'] })
        },
        onTabAdd: (tabId: string) => {
            const defaultTabBarData = tabFactory.getDefaultTabData()
            const defaultTabConfig: Partial<MynahUIDataModel> = {
                quickActionCommands: defaultTabBarData.quickActionCommands,
                tabBarButtons: defaultTabBarData.tabBarButtons,
                contextCommands: [
                    ...(contextCommandGroups || []),
                    ...(featureConfig?.get('highlightCommand')
                        ? [
                              {
                                  groupName: 'Additional commands',
                                  commands: [toMynahContextCommand(featureConfig.get('highlightCommand'))],
                              },
                          ]
                        : []),
                ],
                ...(disclaimerCardActive ? { promptInputStickyCard: disclaimerCard } : {}),
            }

            const tabStore = mynahUi.getTabData(tabId).getStore()

            // Tabs can be opened through different methods, including server-initiated 'openTab' requests.
            // The 'openTab' request is specifically used for loading historical chat sessions with pre-existing messages.
            // We check if tabMetadata.openTabKey exists - if it does and is set to true, we skip showing welcome messages
            // since this indicates we're loading a previous chat session rather than starting a new one.
            if (!tabStore?.tabMetadata || !tabStore.tabMetadata.openTabKey) {
                defaultTabConfig.chatItems = tabFactory.getChatItems(true, programmingModeCardActive, [])
            }
            mynahUi.updateStore(tabId, defaultTabConfig)
            messager.onTabAdd(tabId)
        },
        onTabRemove: (tabId: string) => {
            messager.onStopChatResponse(tabId)
            messager.onTabRemove(tabId)
        },
        onTabChange: (tabId: string) => {
            messager.onTabChange(tabId)
        },
        onResetStore: () => {},
        onCopyCodeToClipboard: (
            tabId,
            messageId,
            code,
            type,
            referenceTrackerInformation,
            eventId,
            codeBlockIndex,
            totalCodeBlocks
        ) => {
            const payload: CopyCodeToClipboardParams = {
                tabId,
                messageId,
                code,
                type,
                referenceTrackerInformation,
                eventId,
                codeBlockIndex,
                totalCodeBlocks,
            }
            messager.onCopyCodeToClipboard(payload)
        },
        onVote: (tabId, messageId, vote, eventId) => {
            const payload: VoteParams = {
                tabId,
                messageId,
                vote,
                eventId,
            }
            messager.onVote(payload)
        },
        onSendFeedback: (tabId, feedbackPayload, eventId) => {
            const payload: FeedbackParams = {
                tabId,
                feedbackPayload,
                eventId,
            }
            messager.onSendFeedback(payload)

            mynahUi.notify({
                type: NotificationType.INFO,
                title: 'Your feedback is sent',
                content: 'Thanks for your feedback.',
            })
        },
        onLinkClick: (tabId, messageId, link, mouseEvent, eventId) => {
            mouseEvent?.preventDefault()
            mouseEvent?.stopPropagation()
            mouseEvent?.stopImmediatePropagation()

            const payload: LinkClickParams = {
                tabId,
                messageId,
                link,
                eventId,
            }
            messager.onLinkClick(payload)
        },
        onSourceLinkClick: (tabId, messageId, link, mouseEvent, eventId) => {
            mouseEvent?.preventDefault()
            mouseEvent?.stopPropagation()
            mouseEvent?.stopImmediatePropagation()

            const payload: SourceLinkClickParams = {
                tabId,
                messageId,
                link,
                eventId,
            }
            messager.onSourceLinkClick(payload)
        },
        onInfoLinkClick: (tabId, link, mouseEvent, eventId) => {
            mouseEvent?.preventDefault()
            mouseEvent?.stopPropagation()
            mouseEvent?.stopImmediatePropagation()

            const payload: InfoLinkClickParams = {
                tabId,
                link,
                eventId,
            }
            messager.onInfoLinkClick(payload)
        },
        onInBodyButtonClicked: (tabId, messageId, action, eventId) => {
            if (action.id === disclaimerAcknowledgeButtonId) {
                // Hide the legal disclaimer card
                disclaimerCardActive = false

                // Update the disclaimer getting acknowledged
                messager.onDisclaimerAcknowledged()

                // Remove all disclaimer cards from all tabs
                Object.keys(mynahUi.getAllTabs()).forEach(storeTabKey => {
                    mynahUi.updateStore(storeTabKey, { promptInputStickyCard: null })
                })
            } else if (action.id === OPEN_WORKSPACE_INDEX_SETTINGS_BUTTON_ID) {
                messager.onOpenSettings('amazonQ.workspaceIndex')
            } else {
                const payload: ButtonClickParams = {
                    tabId,
                    messageId,
                    buttonId: action.id,
                }
                messager.onButtonClick(payload)
            }
            if (action.id === 'stop-shell-command') {
                messager.onStopChatResponse(tabId)
            }
        },
        onContextSelected: (contextItem, tabId) => {
            if (contextItem.id === ContextPrompt.CreateItemId) {
                mynahUi.showCustomForm(
                    tabId,
                    [
                        {
                            id: ContextPrompt.PromptNameFieldId,
                            type: 'textinput',
                            mandatory: true,
                            autoFocus: true,
                            title: 'Prompt name',
                            placeholder: 'Enter prompt name',
                            validationPatterns: {
                                patterns: [
                                    {
                                        pattern: /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/,
                                        errorMessage:
                                            'Use only letters, numbers, hyphens, and underscores, starting with a letter or number. Maximum 100 characters.',
                                    },
                                ],
                            },
                            description: "Use this prompt by typing '@' followed by the prompt name.",
                        },
                    ],
                    [
                        {
                            id: ContextPrompt.CancelButtonId,
                            text: 'Cancel',
                            status: 'clear',
                            waitMandatoryFormItems: false,
                        },
                        {
                            id: ContextPrompt.SubmitButtonId,
                            text: 'Create',
                            status: 'primary',
                            waitMandatoryFormItems: true,
                        },
                    ],
                    `Create a saved prompt`
                )
                return false
            }
            return true
        },
        onCustomFormAction: (tabId, action) => {
            if (action.id === ContextPrompt.SubmitButtonId) {
                messager.onCreatePrompt(action.formItemValues![ContextPrompt.PromptNameFieldId])
            }
        },
        onFormTextualItemKeyPress: (event: KeyboardEvent, formData: Record<string, string>, itemId: string) => {
            if (itemId === ContextPrompt.PromptNameFieldId && event.key === 'Enter') {
                event.preventDefault()
                messager.onCreatePrompt(formData[ContextPrompt.PromptNameFieldId])
                return true
            }
            return false
        },
        onTabBarButtonClick: (tabId: string, buttonId: string) => {
            if (buttonId === ChatHistory.TabBarButtonId) {
                messager.onListConversations(undefined, true)
                return
            }

            if (buttonId === ExportTabBarButtonId) {
                messager.onTabBarAction({
                    tabId,
                    action: 'export',
                })
                return
            }

            throw new Error(`Unhandled tab bar button id: ${buttonId}`)
        },
        onPromptInputOptionChange: (tabId, optionsValues) => {
            if (agenticMode) {
                handlePromptInputChange(mynahUi, tabId, optionsValues)
            }
            messager.onPromptInputOptionChange({ tabId, optionsValues })
        },
        onMessageDismiss: (tabId, messageId) => {
            if (messageId === programmerModeCard.messageId) {
                programmingModeCardActive = false
                messager.onChatPromptOptionAcknowledged(messageId)

                // Update the tab defaults to hide the programmer mode card for new tabs
                mynahUi.updateTabDefaults({
                    store: {
                        chatItems: tabFactory.getChatItems(true, false),
                    },
                })
            }
        },
        onStopChatResponse: tabId => {
            messager.onStopChatResponse(tabId)
        },
    }

    const mynahUiProps: MynahUIProps = {
        tabs: {
            [tabFactory.initialTabId]: {
                isSelected: true,
                store: {
                    ...tabFactory.createTab(disclaimerCardActive),
                    chatItems: tabFactory.getChatItems(true, programmingModeCardActive),
                },
            },
        },
        defaults: {
            store: tabFactory.createTab(false),
        },
        config: {
            maxTabs: 10,
            texts: {
                ...uiComponentsTexts,
                // Fallback to original texts in non-agentic chat mode
                stopGenerating: agenticMode ? uiComponentsTexts.stopGenerating : 'Stop generating',
                spinnerText: agenticMode ? uiComponentsTexts.spinnerText : 'Generating your answer...',
            },
            // Total model context window limit 600k.
            // 500k for user input, 100k for context, history, system prompt.
            // beside, MynahUI will automatically crop it depending on the available chars left from the prompt field itself by using a 96 chars of threshold
            // if we want to max user input as 500000, need to configure the maxUserInput as 500096
            maxUserInput: 500096,
            userInputLengthWarningThreshold: 450000,
        },
    }

    const mynahUiRef = { mynahUI: undefined as MynahUI | undefined }
    if (customChatClientAdapter) {
        // Attach routing to custom adapter top of default message handlers
        chatEventHandlers = withAdapter(chatEventHandlers, mynahUiRef, customChatClientAdapter)
    }

    const mynahUi = new MynahUI({
        ...mynahUiProps,
        ...chatEventHandlers,
    })
    mynahUiRef.mynahUI = mynahUi

    const getTabStore = (tabId = mynahUi.getSelectedTabId()) => {
        return tabId ? mynahUi.getAllTabs()[tabId]?.store : undefined
    }

    // The 'openTab' parameter indicates whether this tab creation is initiated by 'openTab' server request
    // to restore a previous chat session (true) or if it's a new client-side tab creation (false/undefined).
    // This distinction helps maintain consistent tab behavior between fresh conversations and restored sessions.
    const createTabId = (openTab?: boolean) => {
        const tabId = mynahUi.updateStore('', {
            ...tabFactory.createTab(disclaimerCardActive),
            tabMetadata: { openTabKey: openTab ? true : false },
        })
        if (tabId === undefined) {
            mynahUi.notify({
                content: uiComponentsTexts.noMoreTabsTooltip,
                type: NotificationType.WARNING,
            })
            return undefined
        }

        return tabId
    }

    const getOrCreateTabId = () => {
        const tabId = mynahUi.getSelectedTabId()

        return tabId ?? createTabId()
    }

    const contextListToHeader = (contextList?: ChatResult['contextList']): ChatItem['header'] => {
        if (contextList === undefined) {
            return undefined
        }

        return {
            fileList: {
                fileTreeTitle: '',
                filePaths: contextList.filePaths?.map(file => file),
                rootFolderTitle: contextList.rootFolderTitle ?? 'Context',
                flatList: true,
                collapsed: true,
                hideFileCount: true,
                details: Object.fromEntries(
                    Object.entries(contextList.details || {}).map(([filePath, fileDetails]) => [
                        filePath,
                        {
                            label:
                                fileDetails.lineRanges
                                    ?.map(range =>
                                        range.first === -1 || range.second === -1
                                            ? ''
                                            : `line ${range.first} - ${range.second}`
                                    )
                                    .join(', ') || '',
                            description: fileDetails.description,
                            clickable: true,
                            data: {
                                fullPath: fileDetails.fullPath || '',
                            },
                        },
                    ])
                ),
            },
        }
    }

    const addChatResponse = (chatResult: ChatResult, tabId: string, isPartialResult: boolean) => {
        if (agenticMode) {
            agenticAddChatResponse(chatResult, tabId, isPartialResult)
        } else {
            legacyAddChatResponse(chatResult, tabId, isPartialResult)
        }
    }

    // addChatResponse handler to support Agentic chat UX changes for handling responses streaming.
    const agenticAddChatResponse = (chatResult: ChatResult, tabId: string, isPartialResult: boolean) => {
        const { type, ...chatResultWithoutType } = chatResult
        let header = toMynahHeader(chatResult.header)
        const fileList = toMynahFileList(chatResult.fileList)
        const buttons = toMynahButtons(chatResult.buttons)

        if (chatResult.contextList !== undefined) {
            header = contextListToHeader(chatResult.contextList)
        }

        const store = mynahUi.getTabData(tabId)?.getStore() || {}
        const chatItems = store.chatItems || []
        const isPairProgrammingMode: boolean = getTabPairProgrammingMode(mynahUi, tabId)

        if (chatResult.additionalMessages?.length) {
            mynahUi.updateStore(tabId, {
                loadingChat: true,
                cancelButtonWhenLoading: true,
            })
            chatResult.additionalMessages.forEach(am => {
                const chatItem: ChatItem = {
                    messageId: am.messageId,
                    type:
                        am.type === 'tool'
                            ? ChatItemType.ANSWER
                            : am.type === 'directive'
                              ? ChatItemType.DIRECTIVE
                              : ChatItemType.ANSWER_STREAM,
                    ...prepareChatItemFromMessage(am, isPairProgrammingMode, isPartialResult),
                }

                if (!chatItems.find(ci => ci.messageId === am.messageId)) {
                    mynahUi.addChatItem(tabId, chatItem)
                } else {
                    mynahUi.updateChatAnswerWithMessageId(tabId, am.messageId!, chatItem)
                }
            })
        }

        if (isPartialResult) {
            mynahUi.updateStore(tabId, {
                loadingChat: true,
                cancelButtonWhenLoading: true,
            })
            const chatItem: ChatItem = {
                ...chatResult,
                summary: chatResult.summary as ChatItem['summary'],
                type: ChatItemType.ANSWER_STREAM,
                header: header,
                buttons: buttons,
                fileList,
                codeBlockActions: isPairProgrammingMode ? { 'insert-to-cursor': null } : undefined,
            }

            if (!chatItems.find(ci => ci.messageId === chatResult.messageId)) {
                mynahUi.addChatItem(tabId, chatItem)
            } else {
                mynahUi.updateChatAnswerWithMessageId(tabId, chatResult.messageId!, chatItem)
            }
            return
        }

        // If chat response from server is an empty object don't do anything
        if (Object.keys(chatResult).length === 0) {
            return
        }
        // If the response is auth follow-up show it as a system prompt
        const followUpOptions = chatResult.followUp?.options
        const isValidAuthFollowUp =
            followUpOptions &&
            followUpOptions.length > 0 &&
            followUpOptions[0].type &&
            isValidAuthFollowUpType(followUpOptions[0].type)
        if (chatResult.body === '' && isValidAuthFollowUp) {
            mynahUi.addChatItem(tabId, {
                ...(chatResultWithoutType as ChatItem),
                header: header,
                buttons: buttons,
                type: ChatItemType.SYSTEM_PROMPT,
            })

            // TODO, prompt should be disabled until user is authenticated
            // Currently we don't have a mechanism to notify chat-client about auth changes
            // mynahUi.updateStore(tabId, { promptInputDisabledState: true })
            return
        }
        const followUps = chatResult.followUp
            ? {
                  text: chatResult.followUp.text ?? 'Suggested follow up questions:',
                  options: chatResult.followUp.options,
              }
            : {}

        const chatItem: ChatItem = {
            ...(chatResult as ChatItem),
            type: ChatItemType.ANSWER_STREAM,
            header: header,
            buttons: buttons,
            codeBlockActions: isPairProgrammingMode ? { 'insert-to-cursor': null } : undefined,
        }

        if (!chatItems.find(ci => ci.messageId === chatResult.messageId)) {
            mynahUi.addChatItem(tabId, chatItem)
        }

        mynahUi.endMessageStream(tabId, chatResult.messageId ?? '', {
            header: header,
            buttons: buttons,
            body: chatResult.body,
            followUp: followUps,
            relatedContent: chatResult.relatedContent,
            canBeVoted: chatResult.canBeVoted,
            codeReference: chatResult.codeReference,
            fileList: chatResult.fileList,
            // messageId excluded
        })

        mynahUi.updateStore(tabId, {
            loadingChat: false,
            cancelButtonWhenLoading: true,
            promptInputDisabledState: false,
        })
    }

    // addChatResponse handler to support extensions that haven't migrated to agentic chat yet
    const legacyAddChatResponse = (chatResult: ChatResult, tabId: string, isPartialResult: boolean) => {
        const { type, ...chatResultWithoutType } = chatResult
        let header = undefined

        if (chatResult.contextList !== undefined) {
            header = {
                fileList: {
                    fileTreeTitle: '',
                    filePaths: chatResult.contextList.filePaths?.map(file => file),
                    rootFolderTitle: 'Context',
                    flatList: true,
                    collapsed: true,
                    hideFileCount: true,
                    details: Object.fromEntries(
                        Object.entries(chatResult.contextList.details || {}).map(([filePath, fileDetails]) => [
                            filePath,
                            {
                                label:
                                    fileDetails.lineRanges
                                        ?.map(range =>
                                            range.first === -1 || range.second === -1
                                                ? ''
                                                : `line ${range.first} - ${range.second}`
                                        )
                                        .join(', ') || '',
                                description: filePath,
                                clickable: true,
                            },
                        ])
                    ),
                },
            }
        }

        if (isPartialResult) {
            mynahUi.updateLastChatAnswer(tabId, {
                ...(chatResultWithoutType as ChatItem),
                header: header,
            })
            return
        }

        // If chat response from server is an empty object don't do anything
        if (Object.keys(chatResult).length === 0) {
            return
        }
        // If the response is auth follow-up show it as a system prompt
        const followUpOptions = chatResult.followUp?.options
        const isValidAuthFollowUp =
            followUpOptions &&
            followUpOptions.length > 0 &&
            followUpOptions[0].type &&
            isValidAuthFollowUpType(followUpOptions[0].type)
        if (chatResult.body === '' && isValidAuthFollowUp) {
            mynahUi.addChatItem(tabId, {
                ...(chatResultWithoutType as ChatItem),
                type: ChatItemType.SYSTEM_PROMPT,
            })

            // TODO, prompt should be disabled until user is authenticated
            // Currently we don't have a mechanism to notify chat-client about auth changes
            // mynahUi.updateStore(tabId, { promptInputDisabledState: true })
            return
        }
        const followUps = chatResult.followUp
            ? {
                  text: chatResult.followUp.text ?? 'Suggested follow up questions:',
                  options: chatResult.followUp.options,
              }
            : {}

        mynahUi.updateLastChatAnswer(tabId, {
            header: header,
            body: chatResult.body,
            messageId: chatResult.messageId,
            followUp: followUps,
            relatedContent: chatResult.relatedContent,
            canBeVoted: chatResult.canBeVoted,
        })

        mynahUi.endMessageStream(tabId, chatResult.messageId ?? '')

        mynahUi.updateStore(tabId, {
            loadingChat: false,
            promptInputDisabledState: false,
        })
    }

    const updateChat = (params: ChatUpdateParams) => {
        const isChatLoading = params.state?.inProgress
        mynahUi.updateStore(params.tabId, {
            loadingChat: isChatLoading,
            cancelButtonWhenLoading: agenticMode,
        })
        if (params.data?.messages.length) {
            const { tabId } = params
            const store = mynahUi.getTabData(tabId).getStore() || {}
            const chatItems = store.chatItems || []

            params.data?.messages.forEach(updatedMessage => {
                if (!updatedMessage.messageId) {
                    // Do not process messages without known ID.
                    return
                }

                const oldMessage = chatItems.find(ci => ci.messageId === updatedMessage.messageId)
                if (!oldMessage) return

                const chatItem: ChatItem = {
                    type: oldMessage.type,
                    ...prepareChatItemFromMessage(updatedMessage, getTabPairProgrammingMode(mynahUi, tabId)),
                }
                mynahUi.updateChatAnswerWithMessageId(tabId, updatedMessage.messageId, chatItem)
            })
        }
    }

    const updateFinalItemTypes = (tabId: string) => {
        const store = mynahUi.getTabData(tabId)?.getStore() || {}
        const chatItems = store.chatItems || []
        const updatedItems = chatItems.map(item => ({
            ...item,
            type: item.type === ChatItemType.ANSWER_STREAM && !item.body ? ChatItemType.ANSWER : item.type,
        }))
        mynahUi.updateStore(tabId, {
            loadingChat: false,
            cancelButtonWhenLoading: agenticMode,
            chatItems: updatedItems,
            promptInputDisabledState: false,
        })
    }

    const prepareChatItemFromMessage = (
        message: ChatMessage,
        isPairProgrammingMode: boolean,
        isPartialResult?: boolean
    ): Partial<ChatItem> => {
        const contextHeader = contextListToHeader(message.contextList)
        const header = contextHeader || toMynahHeader(message.header) // Is this mutually exclusive?
        const fileList = toMynahFileList(message.fileList)

        let processedHeader = header
        if (message.type === 'tool') {
            processedHeader = { ...header }
            if (header?.buttons) {
                processedHeader.buttons = header.buttons.map(button => ({
                    ...button,
                    status: button.status ?? 'clear',
                }))
            }
            if (header?.fileList) {
                processedHeader.fileList = {
                    ...header.fileList,
                    fileTreeTitle: '',
                    hideFileCount: true,
                    details: toDetailsWithoutIcon(header.fileList.details),
                }
            }
            if (!isPartialResult) {
                if (processedHeader && processedHeader.status?.status !== 'error') {
                    processedHeader.status = undefined
                }
            }
        }

        // Check if header should be included
        const includeHeader =
            processedHeader &&
            ((processedHeader.buttons !== undefined &&
                processedHeader.buttons !== null &&
                processedHeader.buttons.length > 0) ||
                processedHeader.status !== undefined ||
                processedHeader.icon !== undefined)

        const padding =
            message.type === 'tool' ? (fileList ? true : message.messageId?.endsWith('_permission')) : undefined

        const processedButtons: ChatItemButton[] | undefined = toMynahButtons(message.buttons)?.map(button =>
            button.id === 'undo-all-changes' ? { ...button, position: 'outside' } : button
        )
        // Adding this conditional check to show the stop message in the center.
        const contentHorizontalAlignment: ChatItem['contentHorizontalAlignment'] = undefined

        // If message.header?.status?.text is Stopped or Rejected or Ignored or Completed etc.. card should be in disabled state.
        const shouldMute = message.header?.status?.text !== undefined && message.header?.status?.text !== 'Completed'

        return {
            body: message.body,
            header: includeHeader ? processedHeader : undefined,
            buttons: processedButtons,
            fileList,
            // file diffs in the header need space
            fullWidth: message.type === 'tool' && message.header?.buttons ? true : undefined,
            padding,
            contentHorizontalAlignment,
            wrapCodes: message.type === 'tool',
            codeBlockActions:
                message.type === 'tool'
                    ? { 'insert-to-cursor': null, copy: null }
                    : isPairProgrammingMode
                      ? { 'insert-to-cursor': null }
                      : undefined,
            ...(shouldMute ? { muted: true } : {}),
        }
    }

    const sendToPrompt = (params: SendToPromptParams) => {
        const tabId = getOrCreateTabId()
        if (!tabId) return

        if (params.autoSubmit && params.prompt) {
            messager.onChatPrompt({ prompt: params.prompt, tabId, context: undefined }, 'contextMenu')
            initializeChatResponse(mynahUi, tabId, params.prompt.prompt, agenticMode)
        } else {
            mynahUi.addToUserPrompt(tabId, params.selection, 'code')
        }
        messager.onSendToPrompt(params, tabId)
    }

    const sendGenericCommand = (params: GenericCommandParams) => {
        let tabId = getOrCreateTabId()

        if (!tabId) return

        // send to a new tab if the current tab is loading
        if (getTabStore(tabId)?.loadingChat) {
            tabId = createTabId()
            if (!tabId) return
        }

        const body = [
            params.genericCommand,
            ' the following part of my code:',
            '\n~~~~\n',
            params.selection,
            '\n~~~~\n',
        ].join('')
        const chatPrompt: ChatPrompt = { prompt: body, escapedPrompt: body }

        handleChatPrompt(mynahUi, tabId, chatPrompt, messager, params.triggerType, undefined, agenticMode)
    }

    const showError = (params: ErrorParams) => {
        const tabId = getOrCreateTabId()
        if (!tabId) return

        const answer: ChatItem = {
            type: ChatItemType.ANSWER,
            body: `**${params.title}** 
${params.message}`,
        }

        mynahUi.updateStore(tabId, {
            loadingChat: false,
            cancelButtonWhenLoading: agenticMode,
            promptInputDisabledState: false,
        })

        mynahUi.addChatItem(params.tabId, answer)
        messager.onError(params)
    }

    const openTab = (requestId: string, params: OpenTabParams) => {
        if (params.tabId) {
            if (params.tabId !== mynahUi.getSelectedTabId()) {
                mynahUi.selectTab(params.tabId)
            }
            messager.onOpenTab(requestId, { tabId: params.tabId })
        } else {
            const messages = params.newTabOptions?.data?.messages
            const tabId = createTabId(true)
            if (tabId) {
                mynahUi.updateStore(tabId, {
                    chatItems: tabFactory.getChatItems(messages ? false : true, programmingModeCardActive, messages),
                })
                messager.onOpenTab(requestId, { tabId })
            } else {
                messager.onOpenTab(requestId, {
                    type: 'InvalidRequest',
                    message: 'No more tabs available',
                })
            }
        }
    }

    const toContextCommands = (commands: ContextCommand[]): QuickActionCommand[] => {
        return commands.map(command => ({
            ...command,
            children: command.children?.map(child => ({
                ...child,
                commands: toContextCommands(child.commands),
            })),
            icon: toMynahIcon(command.icon),
        }))
    }

    const sendContextCommands = (params: ContextCommandParams) => {
        contextCommandGroups = params.contextCommandGroups.map(group => ({
            ...group,
            commands: toContextCommands(group.commands),
        }))

        Object.keys(mynahUi.getAllTabs()).forEach(tabId => {
            mynahUi.updateStore(tabId, {
                contextCommands: [
                    ...(contextCommandGroups || []),
                    ...(featureConfig?.get('highlightCommand')
                        ? [
                              {
                                  groupName: 'Additional commands',
                                  commands: [toMynahContextCommand(featureConfig.get('highlightCommand'))],
                              },
                          ]
                        : []),
                ],
            })
        })
    }

    const chatHistoryList = new ChatHistoryList(mynahUi, messager)
    const listConversations = (params: ListConversationsResult) => {
        chatHistoryList.show(params)
    }

    const conversationClicked = (params: ConversationClickResult) => {
        if (!params.success) {
            mynahUi.notify({
                content: `Failed to ${params.action ?? 'open'} the history`,
                type: NotificationType.ERROR,
            })
            return
        }

        // close history list if conversation item was successfully opened
        if (!params.action) {
            chatHistoryList.close()
            return
        }
        // request update conversations list if conversation item was successfully deleted
        if (params.action === 'delete') {
            messager.onListConversations()
        }
    }

    const getSerializedChat = (requestId: string, params: GetSerializedChatParams) => {
        const supportedFormats = ['markdown', 'html']

        if (!supportedFormats.includes(params.format)) {
            mynahUi.notify({
                content: `Failed to export chat`,
                type: NotificationType.ERROR,
            })

            messager.onGetSerializedChat(requestId, {
                type: 'InvalidRequest',
                message: `Failed to get serialized chat content, ${params.format} is not supported`,
            })

            return
        }

        try {
            const serializedChat = mynahUi.serializeChat(params.tabId, params.format)

            messager.onGetSerializedChat(requestId, {
                content: serializedChat,
            })
        } catch (err) {
            messager.onGetSerializedChat(requestId, {
                type: 'InternalError',
                message: 'Failed to get serialized chat content',
            })
        }
    }

    const api = {
        addChatResponse: addChatResponse,
        updateChat: updateChat,
        sendToPrompt: sendToPrompt,
        sendGenericCommand: sendGenericCommand,
        showError: showError,
        openTab: openTab,
        sendContextCommands: sendContextCommands,
        listConversations: listConversations,
        conversationClicked: conversationClicked,
        getSerializedChat: getSerializedChat,
        createTabId: createTabId,
    }

    return [mynahUi, api]
}

export const DEFAULT_HELP_PROMPT = 'What can Amazon Q help me with?'
const uiComponentsTexts = {
    mainTitle: 'Amazon Q (Preview)',
    copy: 'Copy',
    insertAtCursorLabel: 'Insert at cursor',
    feedbackFormTitle: 'Report an issue',
    feedbackFormOptionsLabel: 'What type of issue would you like to report?',
    feedbackFormCommentLabel: 'Description of issue (optional):',
    feedbackThanks: 'Thanks for your feedback!',
    feedbackReportButtonLabel: 'Report an issue',
    codeSuggestions: 'Code suggestions',
    files: 'file(s)',
    clickFileToViewDiff: 'Click on a file to view diff.',
    showMore: 'Show more',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    stopGenerating: 'Stop',
    copyToClipboard: 'Copied to clipboard',
    noMoreTabsTooltip: 'You can only open ten conversation tabs at a time.',
    codeSuggestionWithReferenceTitle: 'Some suggestions contain code with references.',
    spinnerText: 'Thinking...',
}
