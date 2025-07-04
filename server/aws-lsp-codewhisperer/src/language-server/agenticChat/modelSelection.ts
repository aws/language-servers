import { ListAvailableModelsResult } from '@aws/language-server-runtimes/protocol'

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

export const modelOptions: ListAvailableModelsResult['models'] = Object.entries(modelRecord).map(
    ([value, { label }]) => ({
        id: value,
        name: label,
    })
)

export const modelOptionsForRegion: Record<string, ListAvailableModelsResult['models']> = {
    'us-east-1': modelOptions,
    'eu-central-1': modelOptions.filter(option => option.id !== BedrockModel.CLAUDE_SONNET_4_20250514_V1_0),
}
