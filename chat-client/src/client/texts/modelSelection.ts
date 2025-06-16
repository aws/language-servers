import { ChatItem, ChatItemFormItem, ChatItemType } from '@aws/mynah-ui'

export enum BedrockModel {
    CLAUDE_SONNET_4_20250514_V1_0 = 'CLAUDE_SONNET_4_20250514_V1_0',
    CLAUDE_3_7_SONNET_20250219_V1_0 = 'CLAUDE_3_7_SONNET_20250219_V1_0',
}

type ModelDetails = {
    label: string
}

const modelRecord: Record<BedrockModel, ModelDetails> = {
    [BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0]: { label: 'Claude Sonnet 3.7' },
    [BedrockModel.CLAUDE_SONNET_4_20250514_V1_0]: { label: 'Claude Sonnet 4' },
}

const modelOptions = Object.entries(modelRecord).map(([value, { label }]) => ({
    value,
    label,
}))

export const modelSelection: ChatItemFormItem = {
    type: 'select',
    id: 'model-selection',
    options: modelOptions,
    mandatory: true,
    hideMandatoryIcon: true,
    border: false,
    autoWidth: true,
}

export const getModelSelectionChatItem = (modelId: string): ChatItem => ({
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: `Switched model to ${modelRecord[modelId as BedrockModel].label}`,
})

export const modelUnavailableBanner: Partial<ChatItem> = {
    messageId: 'model-unavailable-banner',
    header: {
        icon: 'warning',
        iconStatus: 'warning',
        body: '### Model Unavailable',
    },
    body: `The model you selected is temporarily unavailable. Please switch to a different model and try again.`,
    canBeDismissed: true,
}
