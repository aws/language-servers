/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Configuration for edit prediction auto-trigger
 */
export interface EditPredictionConfig {
    // Time thresholds
    recentEditThresholdMs: number
    userPauseThresholdMs: number
    recentRejectionThresholdMs: number

    // Cursor update interval
    cursorUpdateIntervalMs: number

    // Edit tracking
    editHistoryDurationMs: number
    editAdjacentLineRange: number

    // Required condition flags
    enableRecentEditCheck: boolean
    enableNotInMiddleOfWordCheck: boolean
    enablePreviousDecisionCheck: boolean
    enableNonEmptySuffixCheck: boolean

    // Optional condition flags
    enableLanguageKeywordTrigger: boolean
    enableOperatorDelimiterTrigger: boolean
    enableUserPauseTrigger: boolean
    enableLineBeginningTrigger: boolean

    // Logical operation configuration
    requireAllOptionalConditions: boolean // When true, uses AND instead of OR for optional conditions
}

/**
 * Default configuration values
 */
export const DEFAULT_EDIT_PREDICTION_CONFIG: EditPredictionConfig = {
    // Time thresholds
    recentEditThresholdMs: 20000, // 20 seconds
    userPauseThresholdMs: 10000, // 10 seconds
    recentRejectionThresholdMs: 30000, // 30 seconds

    // Cursor update interval
    cursorUpdateIntervalMs: 250, // 250 milliseconds

    // Edit tracking
    editHistoryDurationMs: 300000, // 5 minutes
    editAdjacentLineRange: 30,

    // Required condition flags
    enableRecentEditCheck: true,
    enableNotInMiddleOfWordCheck: true,
    enablePreviousDecisionCheck: true,
    enableNonEmptySuffixCheck: true,

    // Optional condition flags
    enableLanguageKeywordTrigger: true,
    enableOperatorDelimiterTrigger: true,
    enableUserPauseTrigger: true,
    enableLineBeginningTrigger: true,

    // Logical operation configuration
    requireAllOptionalConditions: false,
}

/**
 * Configuration manager for edit prediction auto-trigger
 */
export class EditPredictionConfigManager {
    private static instance: EditPredictionConfigManager
    private config: EditPredictionConfig

    private constructor() {
        this.config = { ...DEFAULT_EDIT_PREDICTION_CONFIG }
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): EditPredictionConfigManager {
        if (!EditPredictionConfigManager.instance) {
            EditPredictionConfigManager.instance = new EditPredictionConfigManager()
        }
        return EditPredictionConfigManager.instance
    }

    /**
     * Get the current configuration
     */
    public getConfig(): EditPredictionConfig {
        return { ...this.config }
    }

    /**
     * Update the configuration
     *
     * @param updates Partial configuration updates
     */
    public updateConfig(updates: Partial<EditPredictionConfig>): void {
        this.config = {
            ...this.config,
            ...updates,
        }
    }

    /**
     * Reset to default configuration
     */
    public resetToDefaults(): void {
        this.config = { ...DEFAULT_EDIT_PREDICTION_CONFIG }
    }
}
