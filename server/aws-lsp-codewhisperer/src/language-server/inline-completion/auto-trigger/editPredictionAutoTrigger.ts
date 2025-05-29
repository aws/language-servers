/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileContext } from '../../../shared/codeWhispererService'
import { Position } from '@aws/language-server-runtimes/server-interface'
import { CursorTracker } from './cursorTracker'
import { RecentEditTracker } from './recentEditTracker'
import { LanguageDetectorFactory } from './languageDetector'
import { EditPredictionConfigManager } from './editPredictionConfig'

/**
 * Parameters for the edit prediction auto-trigger
 */
export interface EditPredictionAutoTriggerParams {
    fileContext: FileContext;
    lineNum: number;
    char: string;
    previousDecision: string;
    cursorHistory?: CursorTracker;
    recentEdits?: RecentEditTracker;
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
}: EditPredictionAutoTriggerParams): {
    shouldTrigger: boolean
} => {
    // Get configuration
    const config = EditPredictionConfigManager.getInstance().getConfig();
    
    // Extract necessary context
    const leftContextLines = fileContext.leftFileContent.split(/\r?\n/);
    const rightContextLines = fileContext.rightFileContent.split(/\r?\n/);
    const currentLineContent = leftContextLines[leftContextLines.length - 1] || '';
    const position = { line: lineNum, character: currentLineContent.length };
    // Use a placeholder URI since FileContext doesn't have filePath
    const uri = 'file://document';
    
    // 1. Check if all required conditions are true
    
    // 1.1 Recent Edit Detection
    // Check if there's been an edit in the current line within the last 20 seconds
    const hasRecentEdit = recentEdits?.hasRecentEditInLine(
        uri, 
        lineNum, 
        config.recentEditThresholdMs
    ) || false;
    
    if (!hasRecentEdit) {
        return { shouldTrigger: false };
    }
    
    // 1.2 Cursor Position (not in middle of word)
    // Check if cursor has whitespace or special character to left or right
    const charToLeft = currentLineContent.length > 0 ? currentLineContent[currentLineContent.length - 1] : '';
    const charToRight = rightContextLines[0]?.[0] || '';
    
    const isWhitespaceOrSpecial = (char: string): boolean => {
        return /\s/.test(char) || /[^\w\s]/.test(char);
    };
    
    const isNotInMiddleOfWord = isWhitespaceOrSpecial(charToLeft) || isWhitespaceOrSpecial(charToRight);
    
    if (!isNotInMiddleOfWord) {
        return { shouldTrigger: false };
    }
    
    // 1.3 Previous User Decision
    // Check if user has rejected a prediction at this location recently
    if (previousDecision === 'Reject') {
        return { shouldTrigger: false };
    }
    
    // 1.4 Non-empty Suffix
    // Check if there's non-empty content after the current line
    const hasNonEmptySuffix = rightContextLines.length > 1 && rightContextLines[1].trim().length > 0;
    
    if (!hasNonEmptySuffix) {
        return { shouldTrigger: false };
    }
    
    // 2. Check if any of the optional conditions are true
    
    // Get language detector
    const languageDetector = LanguageDetectorFactory.getDetector(fileContext.programmingLanguage.languageName);
    
    // 2.1 Language-specific Keywords
    const isAfterKeyword = config.enableLanguageKeywordTrigger && 
                          languageDetector.isAfterKeyword(currentLineContent);
    
    // 2.2 Operators and Delimiters
    const isAfterOperatorOrDelimiter = config.enableOperatorDelimiterTrigger && 
                                      languageDetector.isAfterOperatorOrDelimiter(currentLineContent);
    
    // 2.3 User Pause
    const hasUserPaused = config.enableUserPauseTrigger && 
                         cursorHistory?.hasPositionChanged(
                             uri, 
                             position, 
                             config.userPauseThresholdMs
                         ) === false;
    
    // 2.4 Line Beginning
    const isAtLineBeginning = config.enableLineBeginningTrigger && 
                             languageDetector.isAtLineBeginning(currentLineContent);
    
    // If any of the optional conditions are true, trigger the edit prediction
    const shouldTrigger = isAfterKeyword || 
                          isAfterOperatorOrDelimiter || 
                          (hasUserPaused || false) || 
                          isAtLineBeginning;
    
    return { shouldTrigger };
};
