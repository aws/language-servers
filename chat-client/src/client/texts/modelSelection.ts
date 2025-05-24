import { ChatItemFormItem } from '@aws/mynah-ui'

export type Region = 'us-east-1' | 'eu-central-1'

export enum BedrockModel {
    CLAUDE_3_7_SONNET_20250219_V1_0 = 'CLAUDE_3_7_SONNET_20250219_V1_0',
    CLAUDE_3_5_SONNET_20241022_V2_0 = 'CLAUDE_3_5_SONNET_20241022_V2_0',
}

const baseModelOptions: { value: string; label: string }[] = [
    { label: 'Claude Sonnet 3.7', value: BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0 },
    { label: 'Claude Sonnet 3.5', value: BedrockModel.CLAUDE_3_5_SONNET_20241022_V2_0 },
]

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
