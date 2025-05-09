import { ChatItemFormItem } from '@aws/mynah-ui'

export type Region = 'us-east-1' | 'eu-central-1'

const baseModelOptions: { value: string; label: string }[] = [
    { label: 'Automatic', value: 'auto' },
    { label: 'Claude Sonnet 3.7', value: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0' },
    { label: 'Claude Sonnet 3.5', value: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0' },
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
