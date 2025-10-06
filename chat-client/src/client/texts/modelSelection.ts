import { ChatItem, ChatItemFormItem, ChatItemType } from '@aws/mynah-ui'

/**
 * @deprecated use aws/chat/listAvailableModels server request instead
 */
export enum BedrockModel {
    CLAUDE_SONNET_4_20250514_V1_0 = 'CLAUDE_SONNET_4_20250514_V1_0',
}

type ModelDetails = {
    label: string
    description: string
}

const modelRecord: Record<BedrockModel, ModelDetails> = {
    [BedrockModel.CLAUDE_SONNET_4_20250514_V1_0]: {
        label: 'Claude Sonnet 4',
        description: 'Hybrid reasoning and coding for regular use',
    },
}

const modelOptions = Object.entries(modelRecord).map(([value, { label, description }]) => ({
    value,
    label,
    description,
}))

export const modelSelection: ChatItemFormItem = {
    type: 'select',
    id: 'model-selection',
    mandatory: true,
    hideMandatoryIcon: true,
    options: modelOptions,
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
