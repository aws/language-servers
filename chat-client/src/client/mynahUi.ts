/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    AuthFollowUpClickedParams,
    ErrorParams,
    GenericCommandParams,
    InsertToCursorPositionParams,
    SendToPromptParams,
    isValidAuthFollowUpType,
} from '@aws/chat-client-ui-types'
import { ChatResult } from '@aws/language-server-runtimes-types'
import { ChatItem, ChatItemType, ChatPrompt, MynahUI, NotificationType } from '@aws/mynah-ui'
import { CopyCodeToClipboardParams, VoteParams } from '../contracts/telemetry'
import { Messager } from './messager'
import { TabFactory } from './tabs/tabFactory'

export interface InboundChatApi {
    addChatResponse(params: ChatResult, tabId: string, isFinalResult: boolean): void
    sendToPrompt(params: SendToPromptParams): void
    sendGenericCommand(params: GenericCommandParams): void
    showError(params: ErrorParams): void
}

export const createMynahUi = (messager: Messager, tabFactory: TabFactory): [MynahUI, InboundChatApi] => {
    const handleChatPrompt = (mynahUi: MynahUI, tabId: string, prompt: ChatPrompt, _eventId?: string) => {
        // Send chat prompt to server
        messager.onChatPrompt({ prompt, tabId })

        // Add user prompt to UI
        mynahUi.addChatItem(tabId, {
            type: ChatItemType.PROMPT,
            body: prompt.escapedPrompt,
        })

        // Set UI to loading state
        mynahUi.updateStore(tabId, {
            loadingChat: true,
            promptInputDisabledState: true,
        })

        // Create initial empty response
        mynahUi.addChatItem(tabId, {
            type: ChatItemType.ANSWER_STREAM,
        })
    }

    const mynahUi = new MynahUI({
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
        onFollowUpClicked(tabId, messageId, followUp, eventId) {
            if (followUp.type !== undefined && isValidAuthFollowUpType(followUp.type)) {
                const payload: AuthFollowUpClickedParams = {
                    tabId,
                    messageId,
                    eventId,
                    authFollowupType: followUp.type,
                }
                messager.onAuthFollowUpClicked(payload)
            } else {
                const prompt = followUp.prompt ? followUp.prompt : followUp.pillText
                handleChatPrompt(mynahUi, tabId, { prompt: prompt, escapedPrompt: prompt }, eventId)
            }

            // TODO, Use messager to send followUpClicked notification to server
        },
        onChatPrompt(tabId, prompt, eventId) {
            handleChatPrompt(mynahUi, tabId, prompt, eventId)
        },

        onReady: messager.onUiReady,
        onTabAdd: (tabId: string) => {
            messager.onTabAdd(tabId)
        },
        onTabRemove: (tabId: string) => {
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
        tabs: {
            'tab-1': {
                isSelected: true,
                store: tabFactory.createTab(true),
            },
        },
        defaults: {
            store: tabFactory.createTab(true),
        },
        config: {
            maxTabs: 10,
            texts: uiComponentsTexts,
        },
    })

    const getOrCreateTabId = () => {
        let tabId = mynahUi.getSelectedTabId()
        if (!tabId) {
            tabId = mynahUi.updateStore('', tabFactory.createTab(false))
            if (tabId === undefined) {
                mynahUi.notify({
                    content: uiComponentsTexts.noMoreTabsTooltip,
                    type: NotificationType.WARNING,
                })
                return undefined
            }
        }

        return tabId
    }

    const addChatResponse = (chatResult: ChatResult, tabId: string, isPartialResult: boolean) => {
        if (!chatResult.body) {
            return
        }

        if (isPartialResult) {
            mynahUi.updateLastChatAnswer(tabId, {
                body: chatResult.body,
                messageId: chatResult.messageId,
                followUp: chatResult.followUp,
                relatedContent: chatResult.relatedContent,
                canBeVoted: chatResult.canBeVoted,
                // Currently there is a typo in the codeReference field in runtimes package leading to incompatibility between mynah and runtimes
                // TODO, use spread syntax when https://github.com/aws/language-server-runtimes/pull/120 is released into a new version
                // ...chatResult
            })

            return
        }

        const followUps = chatResult.followUp
            ? {
                  text: chatResult.followUp.text || 'Suggested follow up questions:',
                  options: chatResult.followUp.options,
              }
            : {}

        mynahUi.updateLastChatAnswer(tabId, {
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

    const sendToPrompt = (params: SendToPromptParams) => {
        const tabId = getOrCreateTabId()
        if (!tabId) return

        const markdownSelection = ['\n```\n', params.selection, '\n```'].join('')

        mynahUi.addToUserPrompt(tabId, markdownSelection)
        messager.onSendToPrompt(params, tabId)
    }

    const sendGenericCommand = (params: GenericCommandParams) => {
        const tabId = getOrCreateTabId()
        if (!tabId) return

        const body = [
            params.genericCommand,
            ' the following part of my code:',
            '\n```\n',
            params.selection,
            '\n```',
        ].join('')
        const chatPrompt: ChatPrompt = { prompt: body, escapedPrompt: body }

        handleChatPrompt(mynahUi, tabId, chatPrompt)
    }

    const showError = (params: ErrorParams) => {
        const tabId = getOrCreateTabId()
        if (!tabId) return

        const answer: ChatItem = {
            type: ChatItemType.ANSWER,
            body: `**${params.title}** 
${params.message}`,
        }

        mynahUi.addChatItem(params.tabId, answer)
        messager.onError(params)
    }

    const api = {
        addChatResponse: addChatResponse,
        sendToPrompt: sendToPrompt,
        sendGenericCommand: sendGenericCommand,
        showError: showError,
    }

    return [mynahUi, api]
}

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
    stopGenerating: 'Stop generating',
    copyToClipboard: 'Copied to clipboard',
    noMoreTabsTooltip: 'You can only open ten conversation tabs at a time.',
    codeSuggestionWithReferenceTitle: 'Some suggestions contain code with references.',
    spinnerText: 'Generating your answer...',
}
