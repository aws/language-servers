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
    [BedrockModel.CLAUDE_3_7_SONNET_20250219_V1_0]: { label: 'claude-3.7-sonnet' },
    [BedrockModel.CLAUDE_SONNET_4_20250514_V1_0]: { label: 'claude-4-sonnet' },
}

export const FALLBACK_MODEL_OPTIONS: ListAvailableModelsResult['models'] = Object.entries(FALLBACK_MODEL_RECORD).map(
    ([value, { label }]) => ({
        id: value,
        name: label,
    })
)
