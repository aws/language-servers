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
import { DebugLogger, EditPredictionAutoTriggerData } from '../../../shared/debugUtils'

// Debug logger function
const DEBUG = true
function log(message: string, state?: object): void {
    if (DEBUG) {
        if (state) {
            console.log(`[EditPredictionAutoTrigger] ${message}`, JSON.stringify(state))
        } else {
            console.log(`[EditPredictionAutoTrigger] ${message}`)
        }
    }
}

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
    flareRequestId?: string // Optional request UUID for tracking
}

/**
 * Auto-trigger for edit predictions based on rule-based logic
 *
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
    flareRequestId,
}: EditPredictionAutoTriggerParams): {
    shouldTrigger: boolean
} => {
    // Get configuration
    const config = EditPredictionConfigManager.getInstance().getConfig()

    // Extract necessary context
    const leftContextLines = fileContext.leftFileContent.split(/\r?\n/)
    const rightContextLines = fileContext.rightFileContent.split(/\r?\n/)
    const currentLineContent = leftContextLines[leftContextLines.length - 1] || ''
    const position = { line: lineNum, character: currentLineContent.length }

    // Log the start of evaluation if flareRequestId is provided
    if (flareRequestId) {
        DebugLogger.getInstance().log(
            flareRequestId,
            'Starting editPredictionAutoTrigger evaluation',
            {
                filename: fileContext.filename,
                lineNum,
                char,
                previousDecision,
                position,
            },
            'debug',
            'editPredictionAutoTrigger'
        )
    }

    // 1. Check required conditions
    // 1.1 Recent Edit Detection
    const hasRecentEdit = recentEdits?.hasRecentEditInLine(
        fileContext.filename,
        lineNum,
        config.recentEditThresholdMs,
        config.editAdjacentLineRange
    )
    // 1.2 Cursor Position (not in middle of word)
    const charToLeft = currentLineContent.length > 0 ? currentLineContent[currentLineContent.length - 1] : ''
    const charToRight = rightContextLines[0]?.[0] || ''

    const isWhitespaceOrSpecial = (char: string): boolean => {
        return char === '' || /\s/.test(char) || /[^\w\s]/.test(char)
    }

    const isNotInMiddleOfWord = isWhitespaceOrSpecial(charToLeft) || isWhitespaceOrSpecial(charToRight)

    // 1.3 Previous User Decision
    const isPreviousDecisionNotReject = previousDecision !== 'Reject'

    // 1.4 Non-empty Suffix
    const hasNonEmptySuffix = rightContextLines.length > 1 && rightContextLines[1].trim().length > 0

    // 2. Check optional conditions
    const languageDetector = LanguageDetectorFactory.getDetector(fileContext.programmingLanguage.languageName)

    // 2.1 Language-specific Keywords
    const isAfterKeyword = config.enableLanguageKeywordTrigger && languageDetector.isAfterKeyword(currentLineContent)

    // 2.2 Operators and Delimiters
    const isAfterOperatorOrDelimiter =
        config.enableOperatorDelimiterTrigger && languageDetector.isAfterOperatorOrDelimiter(currentLineContent)

    // 2.3 User Pause
    const hasUserPaused =
        config.enableUserPauseTrigger &&
        cursorHistory?.hasPositionChanged(fileContext.filename, position, config.userPauseThresholdMs) === false

    // 2.4 Line Beginning
    const isAtLineBeginning =
        config.enableLineBeginningTrigger && languageDetector.isAtLineBeginning(currentLineContent)

    // Determine if we should trigger
    const requiredConditionsMet =
        (hasRecentEdit && isNotInMiddleOfWord && isPreviousDecisionNotReject && hasNonEmptySuffix) || false
    const optionalConditionsMet = isAfterKeyword || isAfterOperatorOrDelimiter || hasUserPaused || isAtLineBeginning
    const shouldTrigger = (requiredConditionsMet && optionalConditionsMet) || false

    // Create state object for logging
    const state: EditPredictionAutoTriggerData = {
        // Required conditions
        hasRecentEdit,
        isNotInMiddleOfWord,
        isPreviousDecisionNotReject,
        hasNonEmptySuffix,
        requiredConditionsMet,
        // Optional conditions
        isAfterKeyword,
        isAfterOperatorOrDelimiter,
        hasUserPaused,
        isAtLineBeginning,
        optionalConditionsMet,
        // Code context
        cursor: `${lineNum}:${position.character}`,
        currentLine: `${currentLineContent.slice(0, position.character)}█${currentLineContent.slice(position.character)}${rightContextLines[0] || ''}`,
        // Result
        shouldTrigger,
    }

    // Log with DebugLogger if flareRequestId is provided
    if (flareRequestId) {
        DebugLogger.getInstance().log(
            flareRequestId,
            'EditPredictionAutoTrigger evaluation result',
            state,
            shouldTrigger ? 'info' : 'debug',
            'editPredictionAutoTrigger'
        )
    }

    // Legacy console logging
    if (DEBUG) {
        const logParts = [
            // Required conditions
            `hasRecentEdit: ${hasRecentEdit}`,
            `isNotInMiddleOfWord: ${isNotInMiddleOfWord}`,
            `isPreviousDecisionNotReject: ${isPreviousDecisionNotReject}`,
            `hasNonEmptySuffix: ${hasNonEmptySuffix}`,
            `requiredConditionsMet: ${requiredConditionsMet}`,
            // Optional conditions
            `isAfterKeyword: ${isAfterKeyword}`,
            `isAfterOperatorOrDelimiter: ${isAfterOperatorOrDelimiter}`,
            `hasUserPaused: ${hasUserPaused}`,
            `isAtLineBeginning: ${isAtLineBeginning}`,
            `optionalConditionsMet: ${optionalConditionsMet}`,
            // Code context (just 2 lines)
            `cursor: ${lineNum}:${position.character}`,
            `currentLine: ${currentLineContent.slice(0, position.character)}█${currentLineContent.slice(position.character)}${rightContextLines[0] || ''}`,
        ]
        console.log(`[EditPredictionAutoTrigger] State: ${logParts.join('; ')}`)
    }
    return { shouldTrigger }
}
