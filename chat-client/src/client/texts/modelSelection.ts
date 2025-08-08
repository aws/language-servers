import { ChatItem, ChatItemFormItem, ChatItemType } from '@aws/mynah-ui'

export const modelSelection: ChatItemFormItem = {
    type: 'select',
    id: 'model-selection',
    mandatory: true,
    hideMandatoryIcon: true,
    border: false,
    autoWidth: true,
}

export const getModelSelectionChatItem = (modelName: string): ChatItem => ({
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: `Switched model to ${modelName}`,
})

export const modelUnavailableBanner: Partial<ChatItem> = {
    messageId: 'model-unavailable-banner',
    header: {
        icon: 'warning',
        iconStatus: 'warning',
        body: '### Model Unavailable',
    },
    body: `The model you've selected is experiencing high load. Please switch to another model and try again.`,
    canBeDismissed: true,
}

export const modelThrottledBanner: Partial<ChatItem> = {
    messageId: 'model-throttled-banner',
    header: {
        icon: 'warning',
        iconStatus: 'warning',
        body: '### Model Unavailable',
    },
    body: `I am experiencing high traffic, please try again shortly.`,
    canBeDismissed: true,
}
