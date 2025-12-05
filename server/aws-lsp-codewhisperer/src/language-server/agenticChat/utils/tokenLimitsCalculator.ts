/**
 * Token limits calculator for dynamic LLM context window management.
 *
 * This utility calculates character limits based on the maxInputTokens value
 * returned from the listAvailableModels API, replacing hardcoded constants.
 */

/**
 * Interface representing calculated token and character limits for a model.
 */
export interface TokenLimits {
    /** Raw token limit from API (default: 200,000) */
    maxInputTokens: number
    /** Maximum character count for overall context window: maxInputTokens * 3.5 */
    maxOverallCharacters: number
    /** Input character limit for assistant responses: 0.7 * maxOverallCharacters */
    inputLimit: number
    /** Threshold at which compaction is triggered: 0.7 * maxOverallCharacters */
    compactionThreshold: number
}

/** Default maximum input tokens when API doesn't provide a value */
export const DEFAULT_MAX_INPUT_TOKENS = 200_000

/** Ratio for converting tokens to characters (approximately 3.5 characters per token) */
export const TOKENS_TO_CHARACTERS_RATIO = 3.5

/** Ratio of max overall characters used for input limit */
export const INPUT_LIMIT_RATIO = 0.7

/** Ratio of max overall characters used for compaction threshold */
export const COMPACTION_THRESHOLD_RATIO = 0.7

/**
 * Utility class for calculating token and character limits based on model capabilities.
 */
export class TokenLimitsCalculator {
    /**
     * Calculate character limits from maxInputTokens
     * @param maxInputTokens - The maximum input tokens from the model, defaults to 200K
     * @returns TokenLimits object with all calculated values
     */
    static calculate(maxInputTokens: number = DEFAULT_MAX_INPUT_TOKENS): TokenLimits {
        const maxOverallCharacters = Math.floor(maxInputTokens * TOKENS_TO_CHARACTERS_RATIO)
        const inputLimit = Math.floor(INPUT_LIMIT_RATIO * maxOverallCharacters)
        const compactionThreshold = Math.floor(COMPACTION_THRESHOLD_RATIO * maxOverallCharacters)

        return {
            maxInputTokens,
            maxOverallCharacters,
            inputLimit,
            compactionThreshold,
        }
    }

    /**
     * Extract maxInputTokens from API response with fallback
     * @param model - Model object from listAvailableModels response
     * @returns maxInputTokens value or default (200,000)
     */
    static extractMaxInputTokens(model?: { tokenLimits?: { maxInputTokens?: number } }): number {
        return model?.tokenLimits?.maxInputTokens ?? DEFAULT_MAX_INPUT_TOKENS
    }
}
