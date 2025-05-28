import { ChatItem, ChatItemFormItem, ChatItemType } from '@aws/mynah-ui'

export type Region = 'us-east-1' | 'eu-central-1'

export enum BedrockModel {
    CLAUDE_3_7_SONNET_20250219_V1_0 = 'CLAUDE_3_7_SONNET_20250219_V1_0',
    CLAUDE_3_5_SONNET_20241022_V2_0 = 'CLAUDE_3_5_SONNET_20241022_V2_0',
}

type ModelDetails = {
    label: string
}

const modelRecord: Record<BedrockModel, ModelDetails> = {
    [BedrockModel.CLAUDE_3_5_SONNET_20241022_V2_0]: { label: 'Claude Sonnet 3.5' },
    [BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0]: { label: 'Claude Sonnet 3.7' },
}

const baseModelOptions = Object.entries(modelRecord).map(([value, { label }]) => ({
    value,
    label,
}))

// Create a function to get the current model selection to ensure it's always fresh
export const getBaseModelSelection = (): ChatItemFormItem => ({
    type: 'select',
    id: 'model-selection',
    options: baseModelOptions,
    placeholder: 'Auto',
    border: false,
    autoWidth: true,
})

// For backward compatibility
export const baseModelSelection = getBaseModelSelection()

export const modelSelectionForRegion: Record<Region, ChatItemFormItem> = {
    'us-east-1': baseModelSelection,
    'eu-central-1': baseModelSelection,
}

export const getModelSelectionChatItem = (modelId: string): ChatItem => ({
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: `Switched model to ${modelId === '' ? 'Auto' : modelRecord[modelId as BedrockModel].label}`,
})
