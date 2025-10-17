/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClientFileContextClss, FileContext } from '../../../shared/codeWhispererService'
import { CursorTracker } from '../tracker/cursorTracker'
import { RecentEditTracker } from '../tracker/codeEditTracker'
import { EditPredictionConfigManager } from './editPredictionConfig'
import { CodeWhispererSupplementalContext } from '../../../shared/models/model'
import { UserTriggerDecision } from '../session/sessionManager'

// The sigmoid function to clamp the auto-trigger result to the (0, 1) range
const sigmoid = (x: number) => {
    return 1 / (1 + Math.exp(-x))
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

// TODO: restructure interface
const keyWordCoefficients: Record<string, number> = {
    get: 1.171,
    const: -0.7697,
    try: 0.7182,
    number: 0.6706,
    this: 0.6271,
    return: -0.3991,
    from: -0.3515,
    None: -0.3409,
    True: -0.3653,
    true: -0.2502,
    async: -0.3212,
    false: 0.3478,
    else: 0.3154,
    type: -0.2662,
    null: -0.1576,
    if: -0.1276,
    in: -0.0905,
    void: 0.1712,
    any: 0.1663,
    as: 0.139,
    import: 0.1424,
    for: 0.0252,
    is: 0.1023,
    string: 0.0691,
}

const lastCharCoefficients: Record<string, number> = {
    // alphabet
    a: 0.0773,
    c: 0.1191,
    d: -0.0938,
    e: -0.1517,
    f: 0.4246,
    i: 0.154,
    l: 0.2188,
    m: -0.3026,
    n: -0.0324,
    o: 0.196,
    p: -0.2283,
    Q: -0.0205,
    r: 0.1418,
    s: 0.0387,
    S: 0.3369,
    t: 0.1863,
    u: 0.3599,
    y: 0.0456,
    // numbers
    '0': 0.0415,
    '1': -0.1826,
    '2': -0.1085,
    // special chars
    '(': 0.0539,
    ')': 0.0996,
    '{': 0.2644,
    '}': 0.1122,
    ';': 0.2225,
    '/': -0.0745,
    '>': -0.0378,
    '.': 0.0244,
    ',': -0.0274,
    '\\n': 0.1023,
    ' ': -0.066,
    _: 0.0781,
    "'": -0.036,
    '"': 0.0629,
}

const languageCoefficients: Record<string, number> = {
    c: 0.1013,
    cpp: -0.1371,
    sql: -0.1509,
    java: 0.0564,
    javascript: 0.1183,
    json: 0.0811,
    kotlin: -0.3022,
    python: 0.0914,
    rust: -0.1024,
    scala: 0.1648,
    shell: 0.1292,
    tf: -0.3823,
    typescript: 0.0928,
    yaml: -0.2578,
}

const leftContextLineCountCoeffecients = {
    lte25: -0.0417,
}

// TODO: update
const rightContextLineCountCoefficients = {
    lte3: 0,
    gte_4_lte6: 0,
    gte7: 0,
}

const editHistoryCoefficients = {
    changedCharsNorm: 0.0194,
    linesDeletedNorm: -0.084,
    linesAddedNorm: 0.0594,
}

const lastLineLengthCoefficients = {
    lte4: 0.0293,
    gte_5_lte12: -0.0012,
}

const arCoefficients = {
    previous5: 0.4723,
}

// TODO: interface is not finalized
type EditAutoTriggerInput = {
    fileContext: ClientFileContextClss
    triggerChar: string
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

export class EditClassifier {
    static THRESHOLD = 0.53
    static INTERCEPT = -0.2782

    private _score: number | undefined
    private features: EditClassifierFeatures
    constructor(params: EditAutoTriggerInput) {
        this.features = this.prepareFeatures(params)
    }

    shouldTriggerNep(): { shouldTrigger: boolean; threshold: number; score: number } {
        const s = this.score()
        return {
            score: s,
            threshold: EditClassifier.THRESHOLD,
            shouldTrigger: s > EditClassifier.THRESHOLD,
        }
    }

    score() {
        if (this._score !== undefined) {
            return this._score
        }
        // 1. Last Character
        const lastChar = this.features.lastCharacter
        const myLastCharCoef = lastCharCoefficients[lastChar] ?? 0

        // 2. Last Line Length
        const lastLineLength = this.features.lastLineLength
        let myLastLineLengthCoef = 0
        if (lastLineLength <= 4) {
            myLastLineLengthCoef = lastLineLengthCoefficients.lte4
        } else if (lastLineLength >= 5 && lastLineLength <= 12) {
            myLastLineLengthCoef = lastLineLengthCoefficients.gte_5_lte12
        }

        // 3. Left Context Line Count
        const leftContextLineCount = this.features.leftContextLineCount
        const myLeftContextLineCountCoef = leftContextLineCount <= 25 ? leftContextLineCountCoeffecients.lte25 : 0

        // 4. Right Context Line Count
        const rightContextLineCount = this.features.rightContextLineCount
        let myRightContextLineCountCoef = 0
        if (rightContextLineCount <= 3) {
            myRightContextLineCountCoef = rightContextLineCountCoefficients.lte3
        } else if (rightContextLineCount >= 4 && rightContextLineCount <= 6) {
            myRightContextLineCountCoef = rightContextLineCountCoefficients.gte_4_lte6
        } else {
            myRightContextLineCountCoef = rightContextLineCountCoefficients.gte7
        }

        // 5. Edit History (only using oldest)
        const editH = this.features.normalizedEditHistory
        const myAdded = (editH?.addedLines ?? 0) * editHistoryCoefficients.linesAddedNorm
        const myDeleted = (editH?.deletedLines ?? 0) * editHistoryCoefficients.linesDeletedNorm
        const myChanged = (editH?.changedCharacters ?? 0) * editHistoryCoefficients.changedCharsNorm

        // 6. Language
        const lang = this.features.language
        const myLangCoef = languageCoefficients[lang] ?? 0

        // 7. Keyword
        const kw = this.features.keyword
        const myKeywordCoef = keyWordCoefficients[kw] ?? 0

        // 8. AR
        const myArCoef = arCoefficients.previous5 * this.features.userAR

        // Linear combination result
        const logit =
            myLastCharCoef +
            myLastLineLengthCoef +
            myLeftContextLineCountCoef +
            myRightContextLineCountCoef +
            myAdded +
            myDeleted +
            myChanged +
            myLangCoef +
            myKeywordCoef +
            myArCoef +
            EditClassifier.INTERCEPT

        const probability = sigmoid(logit)

        console.log(`classifier:
"logit": ${logit},
"probability": ${probability},
"threshold": ${EditClassifier.THRESHOLD},
@@features@@ 
${JSON.stringify(this.features, undefined, 2)}
@@linear combination of features@@
${JSON.stringify(
    {
        lastChar: myLastCharCoef,
        lastLineLength: myLastLineLengthCoef,
        leftContextLineCount: myLeftContextLineCountCoef,
        rightContextLineCount: myRightContextLineCountCoef,
        addedLines: myAdded,
        deletedLines: myDeleted,
        changedChars: myChanged,
        language: myLangCoef,
        keyword: myKeywordCoef,
        ar: myArCoef,
        intercept: EditClassifier.INTERCEPT,
    },
    undefined,
    2
)}`)

        return probability
    }

    prepareFeatures(params: EditAutoTriggerInput): EditClassifierFeatures {
        // 1. Last Character
        const lastCharacter =
            params.fileContext.leftContextAtCurLine[params.fileContext.leftContextAtCurLine.length - 1]

        // 2. Last Line Length
        const lastLineLength = params.fileContext.leftContextAtCurLine.length // TODO: only left?

        // 3. Left Context Line Count
        const leftContextLineCount = params.fileContext.leftFileContent.split('\n').length

        // 4. Right Context Line Count
        const rightContextLineCount = params.fileContext.rightFileContent.split('\n').length

        // 5. Edit History (only using olderst)
        const oldest =
            params.recentEdits.supplementalContextItems[params.recentEdits.supplementalContextItems.length - 1] // nullable

        const editHistory = oldest ? EditClassifier.processEditHistory(oldest.content) : undefined
        const normalizedEditHistory = editHistory ? EditClassifier.normalizedRecentEdit(editHistory) : undefined

        console.log(`recent edits:
@@raw oldest edit@@
${oldest.content}
@@raw numbers@@
${JSON.stringify(editHistory, undefined, 2)}
@@normalized numbers@@
${JSON.stringify(normalizedEditHistory, undefined, 2)}
@@edits array@@
${params.recentEdits.supplementalContextItems.map(it => it.content)}`)

        // 6. Language
        const lang = params.fileContext.programmingLanguage

        // 7. Keywords
        const tokens = params.fileContext.leftContextAtCurLine.trim().split(' ') // split(' ') Not strict enough?
        const lastToken = tokens[tokens.length - 1]

        // 8. User AR for last 5
        console.log(`recent decisions: ${JSON.stringify(params.recentDecisions)}`)
        // Cold start we assume 0.3 for AR
        const ar =
            params.recentDecisions.length === 0
                ? 0.3
                : params.recentDecisions.reduce((acc: number, cur: UserTriggerDecision) => {
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

    static processEditHistory(udiff: string): EditHistoryFeature {
        console.log(`processing oldest edit udiff: \n${udiff}`)
        const lines = udiff.split('\n')
        const addedLines = lines
            .filter(line => line.startsWith('+') && !line.startsWith('+++'))
            .map(line => line.substring(1))
        const deletedLines = lines
            .filter(line => line.startsWith('-') && !line.startsWith('---'))
            .map(line => line.substring(1))

        const deletedText = deletedLines.join('\n')
        const addedText = addedLines.join('\n')

        const hisotryChangedChars = EditClassifier.editDistance(deletedText, addedText)
        const historyLineAdded = addedLines.length
        const historyLineDeleted = deletedLines.length

        return {
            changedCharacters: hisotryChangedChars,
            addedLines: historyLineAdded,
            deletedLines: historyLineDeleted,
        }
    }

    static normalizedRecentEdit(edit: EditHistoryFeature): EditHistoryFeature {
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

    static editDistance(s1: string, s2: string): number {
        if (s1.length === 0) return s2.length
        if (s2.length === 0) return s1.length

        // Create matrix
        const rows: number = s1.length + 1
        const cols: number = s2.length + 1
        const dp: number[][] = Array(rows)
            .fill(0)
            .map(() => Array(cols).fill(0))

        // Initialize first row and column
        for (let i = 0; i < rows; i++) {
            dp[i][0] = i
        }
        for (let j = 0; j < cols; j++) {
            dp[0][j] = j
        }

        // Fill the matrix
        for (let i = 1; i < rows; i++) {
            for (let j = 1; j < cols; j++) {
                if (s1[i - 1] === s2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1]
                } else {
                    dp[i][j] =
                        1 +
                        Math.min(
                            dp[i - 1][j], // deletion
                            dp[i][j - 1], // insertion
                            dp[i - 1][j - 1] // substitution
                        )
                }
            }
        }

        return dp[rows - 1][cols - 1]
    }
}
