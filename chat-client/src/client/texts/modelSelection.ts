import { ChatItemFormItem } from '@aws/mynah-ui'

export const modelSelection: ChatItemFormItem = {
    type: 'select',
    id: 'model-selection',
    options: [
        { label: 'Automatic', value: 'auto' },
        { label: 'Claude Sonnet 3.7', value: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0' },
        { label: 'Claude Sonnet 3.5', value: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0' },
    ],
    value: 'auto',
}
