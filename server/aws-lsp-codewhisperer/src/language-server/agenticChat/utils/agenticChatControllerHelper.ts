import { ListAvailableModelsResult } from '@aws/language-server-runtimes/protocol'
import { MODEL_OPTIONS, MODEL_OPTIONS_FOR_REGION } from '../constants/modelSelection'

/**
 * Gets the latest available model for a region, optionally excluding a specific model
 * @param region The AWS region
 * @param exclude Optional model ID to exclude
 * @returns The latest available model
 */
export function getLatestAvailableModel(
    region: string | undefined,
    exclude?: string
): ListAvailableModelsResult['models'][0] {
    const models = region && MODEL_OPTIONS_FOR_REGION[region] ? MODEL_OPTIONS_FOR_REGION[region] : MODEL_OPTIONS
    return [...models].reverse().find(model => model.id !== exclude) ?? models[models.length - 1]
}
