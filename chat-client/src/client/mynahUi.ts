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
    Button,
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
    ListMcpServersResult,
    McpServerClickResult,
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
    TextBasedFormItem,
    DetailedListItem,
    SingularFormItem,
    ListItemEntry,
} from '@aws/mynah-ui'
import { VoteParams } from '../contracts/telemetry'
import { Messager } from './messager'
import { ExportTabBarButtonId, McpServerTabButtonId, TabFactory } from './tabs/tabFactory'
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
    listMcpServers(params: ListMcpServersResult): void
    mcpServerClick(params: McpServerClickResult): void
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

const getTabPairProgrammingMode = (mynahUi: MynahUI, tabId: string) => {
    const promptInputOptions = mynahUi.getTabData(tabId)?.getStore()?.promptInputOptions ?? []
    return promptInputOptions.find(item => item.id === 'pair-programmer-mode')?.value === 'true'
}

export const handlePromptInputChange = (mynahUi: MynahUI, tabId: string, optionsValues: Record<string, string>) => {
    const promptTypeValue = optionsValues['pair-programmer-mode']

    if (promptTypeValue != null) {
        mynahUi.addChatItem(tabId, promptTypeValue === 'true' ? pairProgrammingModeOn : pairProgrammingModeOff)
    }
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
                            status: 'main',
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
            if (buttonId === McpServerTabButtonId) {
                messager.onListMcpServers()
                return
            }

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
        const { type, summary, ...chatResultWithoutTypeSummary } = chatResult
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
            const chatItem = {
                ...chatResultWithoutTypeSummary,
                body: chatResult.body,
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
                type: ChatItemType.SYSTEM_PROMPT,
                ...chatResultWithoutTypeSummary,
                header: header,
                buttons: buttons,
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

        const chatItem = {
            ...chatResultWithoutTypeSummary,
            body: chatResult.body,
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
        const { type, summary, ...chatResultWithoutTypeSummary } = chatResult
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
            // @ts-expect-error - type for MynahUI differs from ChatResult types so we ignore it
            mynahUi.updateLastChatAnswer(tabId, { ...chatResultWithoutTypeSummary, header: header })
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
            // @ts-expect-error - type for MynahUI differs from ChatResult types so we ignore it
            mynahUi.addChatItem(tabId, {
                type: ChatItemType.SYSTEM_PROMPT,
                ...chatResultWithoutTypeSummary,
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

    /**
     * Creates a properly formatted chat item for MCP tool summary with accordion view
     */
    const createMcpToolSummaryItem = (message: ChatMessage): Partial<ChatItem> => {
        const muted = message.summary?.content?.header?.status !== undefined
        return {
            type: ChatItemType.ANSWER,
            messageId: message.messageId,
            muted,
            summary: {
                content: message.summary?.content
                    ? {
                          padding: false,
                          wrapCodes: true,
                          header: message.summary.content.header
                              ? {
                                    icon: message.summary.content.header.icon as any,
                                    body: message.summary.content.header.body,
                                    buttons: message.summary.content?.header?.buttons as any,
                                    status: message.summary.content?.header?.status as any,
                                    fileList: undefined,
                                }
                              : undefined,
                      }
                    : undefined,
                collapsedContent:
                    message.summary?.collapsedContent?.map(item => ({
                        body: item.body,
                        header: item.header
                            ? {
                                  body: item.header.body,
                              }
                            : undefined,
                        fullWidth: true,
                        padding: false,
                        muted: true,
                        wrapCodes: item.header?.body === 'Parameters' ? true : false,
                        codeBlockActions: { copy: null, 'insert-to-cursor': null },
                    })) || [],
            },
        }
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
            // Handle MCP tool summary with accordion view
            if (message.summary) {
                return createMcpToolSummaryItem(message)
            }
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
        const shouldMute = message.header?.status?.text !== undefined

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

    const listMcpServers = (params: ListMcpServersResult) => {
        // Convert the ListMcpServersResult to the format expected by mynahUi.openDetailedList
        const detailedList: any = {
            selectable: false,
            textDirection: 'row',
            header: params.header
                ? {
                      title: params.header.title,
                      description: params.header.description,
                      actions: [
                          {
                              id: 'add-new-mcp',
                              icon: toMynahIcon('plus'),
                              status: 'clear',
                              description: 'Add new MCP',
                          },
                          {
                              id: 'refresh-mcp-list',
                              icon: toMynahIcon('refresh'),
                              status: 'clear',
                              description: 'Refresh MCP servers',
                          },
                      ],
                  }
                : undefined,
            filterOptions: params.filterOptions?.map(filter => ({
                ...filter,
                icon: toMynahIcon(filter.icon),
            })),
            list: params.list.map(group => ({
                groupName: group.groupName,
                children: group.children?.map(item => {
                    // Determine icon based on group name and status
                    let icon = 'ok-circled'
                    let iconForegroundStatus = 'success'

                    // Extract status from serverInformation if available
                    const serverInfoGroup = item.children?.find(child => child.groupName === 'serverInformation')
                    const statusChild = serverInfoGroup?.children?.find(child => child.title === 'status')
                    const status = statusChild?.description || 'DISABLED'

                    if (status === 'ENABLED') {
                        icon = 'ok-circled'
                        iconForegroundStatus = 'success'
                    } else if (status === 'FAILED') {
                        icon = 'cancel-circle'
                        iconForegroundStatus = 'error'
                    } else if (status === 'INITIALIZING') {
                        icon = 'progress'
                        iconForegroundStatus = 'info'
                    } else if (group.groupName === 'Disabled') {
                        icon = 'block'
                        iconForegroundStatus = 'info'
                    }

                    // Create actions based on group name
                    const actions = []
                    if (group.groupName === 'Active') {
                        actions.push({
                            id: 'tools-count',
                            icon: toMynahIcon('tools'),
                            text: (() => {
                                const serverInfoGroup = item.children?.find(
                                    child => child.groupName === 'serverInformation'
                                )
                                if (serverInfoGroup) {
                                    const toolCountChild = serverInfoGroup.children?.find(
                                        child => child.title === 'toolcount'
                                    )
                                    if (toolCountChild) {
                                        return toolCountChild.description
                                    }
                                }
                                return '0'
                            })(),
                            disabled: true,
                        })
                        actions.push({
                            id: 'open-mcp-server',
                            icon: toMynahIcon('right-open'),
                        })
                    } else if (group.groupName === 'Disabled') {
                        actions.push({
                            id: 'mcp-enable-server',
                            icon: toMynahIcon('ok-circled'),
                            text: 'Enable',
                            description: 'Enable',
                        })
                        actions.push({
                            id: 'mcp-delete-server',
                            icon: toMynahIcon('trash'),
                            text: 'Delete',
                            description: 'Delete',
                        })
                        actions.push({
                            id: 'open-mcp-server',
                            icon: toMynahIcon('right-open'),
                            disabled: true,
                        })
                    }

                    return {
                        id: 'mcp-server-click',
                        title: item.title,
                        icon: toMynahIcon(icon),
                        iconForegroundStatus: iconForegroundStatus,
                        groupActions: false,
                        actions: actions,
                    }
                }),
            })),
        }

        if (detailedList.filterOptions && detailedList.filterOptions.length > 0) {
            // eslint-disable-next-line no-extra-semi
            ;(detailedList.filterOptions[0] as TextBasedFormItem).autoFocus = true
        }

        const mcpSheet = mynahUi.openDetailedList({
            detailedList: detailedList,
            events: {
                onFilterValueChange: (filterValues: Record<string, any>) => {
                    messager.onListMcpServers(filterValues)
                },
                onKeyPress: (e: KeyboardEvent) => {
                    if (e.key === 'Escape') {
                        mcpSheet.close()
                    }
                },
                onItemSelect: (item: DetailedListItem) => {
                    if (!item.id) {
                        throw new Error('MCP server id is not defined')
                    }
                    messager.onMcpServerClick(item.id)
                },
                onItemClick: (item: DetailedListItem) => {
                    if (item.id) {
                        messager.onMcpServerClick(item.id)
                    }
                },
                onActionClick: (action: ChatItemButton, item?: DetailedListItem) => {
                    messager.onMcpServerClick(action.id, item?.title)
                },
                onClose: () => {
                    // No need to store reference
                },
                onTitleActionClick: button => {
                    messager.onMcpServerClick(button.id)
                },
            },
        })
    }

    // Type definitions for MCP server parameters
    type McpFilterOption = {
        type: 'textarea' | 'textinput' | 'select' | 'numericinput' | 'radiogroup' | 'list'
        id: string
        title: string
        description?: string
        icon?: string
        options?: Array<{ label: string; value: string }>
        mandatory?: boolean
        value?: ListItemEntry[]
        items?: SingularFormItem[]
    }

    type McpListItem = {
        title: string
        description?: string
        groupActions?: any
    }

    type McpListGroup = {
        groupName?: string
        children?: McpListItem[]
    }

    type McpServerParams = McpServerClickResult & {
        header?: {
            title?: string
            description?: string
            status?: any
            actions?: Button[]
        }
        filterOptions?: McpFilterOption[]
        filterActions?: Button[]
        list?: McpListGroup[]
    }

    /**
     * Processes filter options by converting icons to Mynah icons
     */
    const processFilterOptions = (filterOptions?: McpFilterOption[]) => {
        return filterOptions?.map(filter => ({
            ...filter,
            icon: filter.icon ? toMynahIcon(filter.icon) : undefined,
            mandatory: filter.mandatory ?? false,
            value: filter.value ?? undefined,
            items: filter.items ?? undefined,
        }))
    }

    /**
     * Processes filter actions by converting icons to Mynah icons
     */
    const processFilterActions = (filterActions?: Button[]) => {
        return filterActions?.map(action => ({
            ...action,
            icon: action.icon ? toMynahIcon(action.icon) : undefined,
        }))
    }

    /**
     * Processes a list group for the detailed list UI
     */
    const processListGroup = (group: McpListGroup, isServerView = false) => {
        const children = group.children?.map(item => {
            if (isServerView) {
                return {
                    id: item.title,
                    title: item.title,
                    description: item.description,
                    icon: toMynahIcon('tools'),
                    groupActions: item.groupActions,
                }
            }
            return {
                title: item.title,
                description: item.description,
            }
        })

        return {
            groupName: group.groupName,
            children,
        }
    }

    /**
     * Creates a detailed list configuration for adding a new MCP server
     */
    const createAddMcpServerDetailedList = (params: McpServerParams) => {
        const detailedList = {
            selectable: false,
            textDirection: 'row',
            header: {
                title: params.header?.title || 'Add MCP Server',
                description: params.header?.description || '',
                status: params.header?.status || {},
            },
            filterOptions: processFilterOptions(params.filterOptions),
            filterActions: params.filterActions,
        } as any

        // Process list if present
        if (params.list && params.list.length > 0) {
            detailedList.list = params.list.map(group => processListGroup(group))
        }

        return detailedList
    }

    /**
     * Creates a detailed list configuration for viewing an MCP server
     */
    const createViewMcpServerDetailedList = (params: McpServerParams) => {
        const detailedList = {
            selectable: false,
            textDirection: 'row',
            list: params.list?.map(group => processListGroup(group, true)),
            filterOptions: processFilterOptions(params.filterOptions),
        } as any

        // Process header if present
        if (params.header) {
            detailedList.header = {
                title: params.header.title,
                description: params.header.description,
                status: params.header.status,
                actions: params.header.actions?.map(action => ({
                    ...action,
                    icon: action.icon ? toMynahIcon(action.icon) : undefined,
                    ...(action.id === 'mcp-details-menu'
                        ? {
                              items: [
                                  {
                                      id: 'mcp-disable-server',
                                      text: `Disable ${params.header?.title}`,
                                      icon: toMynahIcon('block'),
                                  },
                                  {
                                      id: 'mcp-delete-server',
                                      confirmation: {
                                          cancelButtonText: 'Cancel',
                                          confirmButtonText: 'Delete',
                                          title: 'Delete Filesystem MCP server',
                                          description:
                                              'This configuration will be deleted and no longer available in Q. \n\n This cannot be undone.',
                                      },
                                      text: `Delete ${params.header?.title}`,
                                      icon: toMynahIcon('trash'),
                                  },
                              ],
                          }
                        : {}),
                })),
            }
        }

        // Add filter actions if present
        if (params.filterActions && params.filterActions.length > 0) {
            detailedList.filterActions = processFilterActions(params.filterActions)
        }

        return detailedList
    }

    /**
     * Handles MCP server click events
     */
    const mcpServerClick = (params: McpServerClickResult) => {
        const typedParams = params as McpServerParams

        if (params.id === 'add-new-mcp') {
            //turning off splash loader in case of being on when new server is added
            mynahUi.toggleSplashLoader(false)
            const detailedList = createAddMcpServerDetailedList(typedParams)

            const events = {
                onBackClick: () => {
                    messager.onListMcpServers()
                },
                onFilterActionClick: (
                    actionParams: McpServerClickResult,
                    filterValues?: Record<string, string>,
                    isValid?: boolean
                ) => {
                    if (actionParams.id === 'cancel-mcp') {
                        messager.onListMcpServers()
                    } else if (actionParams.id === 'save-mcp') {
                        mynahUi.toggleSplashLoader(true, '**Activating MCP Server**')
                        messager.onMcpServerClick(actionParams.id, 'Save configuration', filterValues)
                    }
                },
            }

            mynahUi.openDetailedList({ detailedList, events }, true)
        } else if (params.id === 'open-mcp-server') {
            //turning off splash loader in case of being on when new server is added
            mynahUi.toggleSplashLoader(false)
            const detailedList = createViewMcpServerDetailedList(typedParams)

            const mcpServerSheet = mynahUi.openDetailedList(
                {
                    detailedList: detailedList,
                    events: {
                        onFilterValueChange: (filterValues: Record<string, string>) => {
                            // Handle filter value changes for tool permissions
                            messager.onMcpServerClick('mcp-permission-change', detailedList.header?.title, filterValues)
                        },
                        onFilterActionClick: () => {},
                        onTitleActionClick: (action: ChatItemButton) => {
                            messager.onMcpServerClick(action.id, detailedList.header?.title)
                        },
                        onKeyPress: (e: KeyboardEvent) => {
                            if (e.key === 'Escape') {
                                mcpServerSheet.close()
                            }
                        },
                        onActionClick: (action: ChatItemButton) => {
                            // Handle action clicks (save, cancel, etc.)
                            messager.onMcpServerClick(action.id)
                        },
                        onClose: () => {
                            messager.onListMcpServers()
                        },
                        onBackClick: () => {
                            messager.onListMcpServers()
                        },
                    },
                },
                true
            )
        } else if (
            ['mcp-disable-server', 'mcp-delete-server', 'refresh-mcp-list', 'mcp-enable-server'].includes(params.id)
        ) {
            messager.onListMcpServers()
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
        listMcpServers: listMcpServers,
        mcpServerClick: mcpServerClick,
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
