/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileContext } from '../../../shared/codeWhispererService'
import { Position, TextDocument } from '@aws/language-server-runtimes/server-interface'
import { CursorTracker } from '../tracker/cursorTracker'
import { RecentEditTracker } from '../tracker/codeEditTracker'
import { EditPredictionConfigManager } from './editPredictionConfig'
import { CodeWhispererSupplementalContext } from '../../../shared/models/model'
import { UserTriggerDecision } from '../session/sessionManager'

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

const coefficients = {
    keyword: {
        get: 1.1235,
        const: -0.7675,
        try: 0.6546,
        number: 0.6149,
        this: 0.5651,
        return: -0.4762,
        from: -0.4207,
        None: -0.3971,
        True: -0.3919,
        true: -0.325,
        async: -0.3236,
        false: 0.3115,
        else: 0.2746,
        type: -0.273,
        null: -0.2177,
        if: -0.1763,
        in: -0.1396,
        void: 0.1379,
        any: 0.1319,
        as: 0.1032,
        import: 0.1001,
        for: -0.0042,
        is: 0.0719,
        other: -0.0509,
        string: 0.0186,
    },
    lastChar: {
        // alphabet
        a: 0.0149,
        c: 0.0553,
        d: -0.1598,
        e: -0.2132,
        f: 0.348,
        i: 0.0913,
        l: 0.1584,
        m: -0.353,
        n: -0.0291,
        o: 0.1346,
        p: -0.2929,
        Q: -0.0205,
        r: 0.0753,
        s: -0.0287,
        S: 0.2682,
        t: 0.123,
        u: 0.2866,
        y: -0.0166,
        // numbers
        '1': -0.2389,
        '2': -0.1672,
        // special chars
        '(': -0.0113,
        ')': 0.035,
        '{': 0.1935,
        '}': 0.0512,
        ';': 0.1611,
        '/': -0.1337,
        '>': -0.0997,
        '.': -0.0358,
        ',': -0.0952,
        '\\n': 0.0364,
        ' ': -0.066,
        _: 0.0122,
        "'": -0.0939,
        '"': -0.0006,
        // others
        others: -0.0828,
    },
    language: {
        c: 0.1426,
        cpp: -0.0935,
        sql: -0.0674,
        java: 0.0905,
        javascript: 0.1512,
        json: 0.1256,
        kotlin: -0.2586,
        python: 0.1293,
        rust: -0.0603,
        scala: 0.1985,
        shell: 0.1605,
        tf: -0.3423,
        typescript: 0.1318,
        yaml: -0.2152,
        others: 0.0512,
    },
    leftContextLineCount: {
        lte25: -0.0695,
        gt26: -0.0245,
    },
    editHistory: {
        changedCharsNorm: 0.0174,
        linesDeletedNorm: -0.0833,
        linesAddedNorm: 0.0539,
    },
    lastLineLength: {
        lte4: -0.0119,
        gte_5_lte12: -0.0411,
        gt13: -0.0411,
    },
    ar: {
        previous5: 0.4723,
    },
}

// TODO: interface is not finalized
type EditAutoTriggerInput = {
    textDocument: TextDocument
    fileContext: FileContext
    triggerChar: string
    cursorPosition: Position
    recentEdits: CodeWhispererSupplementalContext
    recentDecisions: UserTriggerDecision[]
}

type EditClassifierFeatures = {
    lastCharacter: string
    lastLineLength: number
    leftContextLineCount: number
    rightContextLineCount: number
    normalizedEditHistory: EditHistoryFeature | undefined
    language: string
    keyword: string
    userAR: number
}

type EditHistoryFeature = {
    changedCharacters: number
    addedLines: number
    deletedLines: number
}

class EditClassifier {
    private _score: number | undefined
    constructor(private readonly params: EditAutoTriggerInput) {
        // TODO: set this.features = features
        this.prepareFeatures(params)
    }

    score() {
        if (this._score !== undefined) {
            return this._score
        }
        // TODO: formula
    }

    prepareFeatures(params: EditAutoTriggerInput): EditClassifierFeatures {
        // 1. Last Character
        const lastCharacter = params.triggerChar[params.triggerChar.length - 1]

        // 2. Last Line Length
        const currentLine = getCurrentLine(params.textDocument, params.cursorPosition)
        const lastLineLength = currentLine.left.length // TODO: only left?

        // 3. Left Context Line Count
        const leftContextLineCount = params.fileContext.leftFileContent.split('\n').length + 1

        // 4. Right Context Line Count
        const rightContextLineCount = params.fileContext.rightFileContent.split('\n').length + 1

        // 5. Edit History (only using olderst)
        const oldest = params.recentEdits.supplementalContextItems[0] // nullable
        const editHistory = oldest ? this.processEditHistory(oldest.content) : undefined
        const normalizedEditHistory = editHistory ? this.normalizedRecentEdit(editHistory) : undefined

        // 6. Language
        const lang = params.fileContext.programmingLanguage

        // 7. Keywords
        const tokens = currentLine.left.trim().split(' ') // split(' ') Not strict enough?
        const lastToken = tokens[tokens.length - 1]

        // 8. User AR for last 5
        const ar =
            params.recentDecisions.reduce((acc: number, cur: UserTriggerDecision) => {
                if (cur === 'Accept') {
                    return acc + 1
                } else {
                    return acc
                }
            }, 0) / 5.0

        return {
            lastCharacter: lastCharacter,
            lastLineLength: lastLineLength,
            leftContextLineCount: leftContextLineCount,
            rightContextLineCount: rightContextLineCount,
            normalizedEditHistory: normalizedEditHistory,
            language: lang.languageName,
            userAR: ar,
            keyword: lastToken,
        }
    }

    processEditHistory(udiff: string): EditHistoryFeature {
        const lines = udiff.split('\n')
        const addedLines = lines.filter(line => line.startsWith('+') && !line.startsWith('+++'))
        const deletedLines = lines.filter(line => line.startsWith('-') && !line.startsWith('---'))

        function editDistance(s1: string, s2: string) {
            if (s1.length === 0) {
                return s2.length
            }

            if (s2.length === 0) {
                return s1.length
            }

            let prev: number[] = Array.from({ length: s1.length + 1 }, (_, i) => i)

            for (let i = 0; i < s2.length; i++) {
                const curr: number[] = [i + 1]
                for (let j = 0; j < s1.length; j++) {
                    curr.push(Math.min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (s1[j] !== s2[i] ? 1 : 0)))
                }
                prev = curr
            }

            return prev[s1.length]
        }

        const deletedText = deletedLines.join('\n')
        const addedText = addedLines.join('\n')

        const hisotryChangedChars = editDistance(deletedText, addedText)
        const historyLineAdded = addedLines.length
        const historyLineDeleted = deletedLines.length

        return {
            changedCharacters: hisotryChangedChars,
            addedLines: historyLineAdded,
            deletedLines: historyLineDeleted,
        }
    }

    normalizedRecentEdit(edit: ReturnType<typeof this.processEditHistory>): EditHistoryFeature {
        // Apply min-max normalization using training data min/max values
        const { changedCharacters, addedLines, deletedLines } = edit

        const trainingCharsChangedMin = 0
        const trainingCharsChangedMax = 261
        const normalizedChangedCharacters =
            (changedCharacters - trainingCharsChangedMin) / (trainingCharsChangedMax - trainingCharsChangedMin)

        const trainingLineAddedMin = 0
        const trainingLineAddedMax = 7
        const normalizedAddedLines = (addedLines - trainingLineAddedMin) / (trainingLineAddedMax - trainingLineAddedMin)

        const trainingLineDeletedMin = 0
        const trainingLineDeletedMax = 6
        const normalizedDeletedLines =
            (deletedLines - trainingLineDeletedMin) / (trainingLineDeletedMax - trainingLineDeletedMin)

        return {
            changedCharacters: normalizedChangedCharacters,
            addedLines: normalizedAddedLines,
            deletedLines: normalizedDeletedLines,
        }
    }
}

// TODO: Move to utils and tests
export function getCurrentLine(
    document: TextDocument,
    position: Position
): {
    left: string
    right: string
} {
    const left = document.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line, character: position.character },
    })

    const right = document.getText({
        start: { line: position.line, character: position.character },
        end: { line: position.line, character: Number.MAX_VALUE },
    })

    return { left, right }
}
