import { ChatItemFormItem } from '@aws/mynah-ui'

export type Region = 'us-east-1' | 'eu-central-1'

export enum BedrockModel {
    CLAUDE_3_7_SONNET_20250219_V1_0 = 'CLAUDE_3_7_SONNET_20250219_V1_0',
    CLAUDE_3_5_SONNET_20241022_V2_0 = 'CLAUDE_3_5_SONNET_20241022_V2_0',
}

const baseModelOptions: { value: string; label: string }[] = [
    { label: 'Automatic', value: 'auto' },
    { label: 'Claude Sonnet 3.7', value: BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0 },
    { label: 'Claude Sonnet 3.5', value: BedrockModel.CLAUDE_3_5_SONNET_20241022_V2_0 },
]

export const baseModelSelection: ChatItemFormItem = {
    type: 'select',
    id: 'model-selection',
    options: baseModelOptions,
    value: 'auto',
}

export const modelSelectionForRegion: Record<Region, ChatItemFormItem> = {
    'us-east-1': {
        ...baseModelSelection,
        options: [
            ...baseModelOptions.slice(0, 1),
            // Additional models can go here
            ...baseModelOptions.slice(1),
        ],
    },
    'eu-central-1': baseModelSelection,
}
