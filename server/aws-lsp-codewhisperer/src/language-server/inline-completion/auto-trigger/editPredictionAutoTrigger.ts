/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileContext } from '../../../shared/codeWhispererService'
import { Position } from '@aws/language-server-runtimes/server-interface'
import { CursorTracker } from '../tracker/cursorTracker'
import { RecentEditTracker } from '../tracker/codeEditTracker'
import { LanguageDetectorFactory } from './languageDetector'
import { EditPredictionConfigManager } from './editPredictionConfig'

/**
 * Parameters for the edit prediction auto-trigger
 */
export interface EditPredictionAutoTriggerParams {
    fileContext: FileContext
    lineNum: number
    char: string
    previousDecision: string
    cursorHistory: CursorTracker
    recentEdits: RecentEditTracker
}

/**
 * Auto-trigger for edit predictions if users' editor state meets ALL the following conditions
 * (condition 1) there are recent edits
 * (condition 2) non-empty content in one of the lines following the current line
 * @param params Parameters for the auto-trigger
 * @returns Object indicating whether to trigger an edit prediction
 */
export const editPredictionAutoTrigger = ({
    fileContext,
    lineNum,
    char,
    previousDecision,
    cursorHistory,
    recentEdits,
}: EditPredictionAutoTriggerParams): {
    shouldTrigger: boolean
} => {
    // Get configuration
    const config = EditPredictionConfigManager.getInstance().getConfig()

    // Extract necessary context
    const rightContextLines = fileContext.rightFileContent.split(/\r?\n/)

    // [condition 1] Recent Edit Detection
    const hasRecentEdit = recentEdits?.hasRecentEditInLine(
        fileContext.fileUri,
        lineNum,
        config.recentEditThresholdMs,
        config.editAdjacentLineRange
    )

    // [condition 2] Non-empty content in one of the lines following the current line
    let hasNonEmptySuffix = false
    const maxLinesToScanForContent = Math.min(rightContextLines.length, config.maxLinesToScanForContent + 1)
    if (maxLinesToScanForContent > 0) {
        const linesToScanForContent = rightContextLines.slice(1, maxLinesToScanForContent)
        hasNonEmptySuffix = linesToScanForContent.some(line => line.trim().length > 0)
    }

    const shouldTrigger = hasRecentEdit && hasNonEmptySuffix

    return { shouldTrigger }
}
