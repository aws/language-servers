import { ListAvailableModelsResult } from '@aws/language-server-runtimes/protocol'

export enum BedrockModel {
    CLAUDE_SONNET_4_20250514_V1_0 = 'CLAUDE_SONNET_4_20250514_V1_0',
    CLAUDE_3_7_SONNET_20250219_V1_0 = 'CLAUDE_3_7_SONNET_20250219_V1_0',
}

type ModelDetails = {
    label: string
}

const MODEL_RECORD: Record<BedrockModel, ModelDetails> = {
    [BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0]: { label: 'Claude Sonnet 3.7' },
    [BedrockModel.CLAUDE_SONNET_4_20250514_V1_0]: { label: 'Claude Sonnet 4' },
}

export const MODEL_OPTIONS: ListAvailableModelsResult['models'] = Object.entries(MODEL_RECORD).map(
    ([value, { label }]) => ({
        id: value,
        name: label,
    })
)

export const MODEL_OPTIONS_FOR_REGION: Record<string, ListAvailableModelsResult['models']> = {
    'us-east-1': MODEL_OPTIONS,
    'eu-central-1': MODEL_OPTIONS,
}
