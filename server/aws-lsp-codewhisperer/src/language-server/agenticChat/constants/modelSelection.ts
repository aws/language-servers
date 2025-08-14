import { ListAvailableModelsResult } from '@aws/language-server-runtimes/protocol'

/**
 * @deprecated Do not add new models to the enum.
 */
export enum BedrockModel {
    CLAUDE_SONNET_4_20250514_V1_0 = 'CLAUDE_SONNET_4_20250514_V1_0',
    CLAUDE_3_7_SONNET_20250219_V1_0 = 'CLAUDE_3_7_SONNET_20250219_V1_0',
}

type ModelDetails = {
    label: string
}

export const FALLBACK_MODEL_RECORD: Record<BedrockModel, ModelDetails> = {
    [BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0]: { label: 'Claude 3.7 Sonnet' },
    [BedrockModel.CLAUDE_SONNET_4_20250514_V1_0]: { label: 'Claude Sonnet 4' },
}

export const BEDROCK_MODEL_TO_MODEL_ID: Record<BedrockModel, string> = {
    [BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0]: 'claude-3.7-sonnet',
    [BedrockModel.CLAUDE_SONNET_4_20250514_V1_0]: 'claude-sonnet-4',
}

export const FALLBACK_MODEL_OPTIONS: ListAvailableModelsResult['models'] = Object.entries(FALLBACK_MODEL_RECORD).map(
    ([value, { label }]) => ({
        id: value,
        name: label,
    })
)
