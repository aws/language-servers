import * as os from 'os'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { FileContext } from '../../../shared/codeWhispererService'
import typedCoefficients = require('./coefficients.json')
import { TextDocumentContentChangeEvent } from 'vscode-languageserver-textdocument'

type TypedCoefficients = typeof typedCoefficients
type Coefficients = TypedCoefficients & {
    [K in keyof TypedCoefficients]: TypedCoefficients[K] extends number ? TypedCoefficients[K] : Record<string, number>
}

/**
 * Add a string indexer to each category coefficient so we can accept string inputs
 * from consumers while maintaining type safety inside the auto-trigger
 * (and prevent accidental deletions and typos in the json file for non-category coefficients)
 */
const coefficients: Coefficients = typedCoefficients as Coefficients

// The threshold to trigger an auto-trigger based on the sigmoid of the result
const TRIGGER_THRESHOLD = 0.43

// The sigmoid function to clamp the auto-trigger result to the (0, 1) range
const sigmoid = (x: number) => {
    return 1 / (1 + Math.exp(-x))
}

// Check if a character or a single character insertion (sometimes expanded to matching character for brackets)
// are special characters. This could be expanded if more languages with other special characters are supported.
const isSpecialCharacter = (char: string) => ['(', '()', '[', '[]', '{', '{}', ':'].includes(char)

export type CodewhispererTriggerType = 'AutoTrigger' | 'OnDemand'

// Two triggers are explicitly handled, SpecialCharacters and Enter. Everything else is expected to be a trigger
// based on regular typing, and is considered a 'Classifier' trigger.
export type CodewhispererAutomatedTriggerType = 'SpecialCharacters' | 'Enter' | 'Classifier'

/**
 * Determine the trigger type based on the file context. Currently supports special cases for Special Characters and Enter keys,
 * as determined by the File Context. For regular typing or undetermined triggers, the Classifier trigger type is used.
 *
 * This is a helper function that can be used since in LSP we don't have the actual keypress events. So we don't know
 * (exactly) whether a position was reached through for instance inserting a new line or backspacing the next line.
 *
 * @param fileContext The file with left and right context based on the invocation position
 * @returns The TriggerType
 */
export const triggerType = (fileContext: FileContext): CodewhispererAutomatedTriggerType => {
    const trimmedLeftContext = fileContext.leftFileContent.trimEnd()
    if (isSpecialCharacter(trimmedLeftContext.at(-1) || '')) {
        return 'SpecialCharacters'
    }

    const lastCRLF = fileContext.leftFileContent.lastIndexOf('\r\n')
    if (lastCRLF >= 0 && fileContext.leftFileContent.substring(lastCRLF + 2).trim() === '') {
        return 'Enter'
    }

    const lastLF = fileContext.leftFileContent.lastIndexOf('\n')
    if (lastLF >= 0 && fileContext.leftFileContent.substring(lastLF + 1).trim() === '') {
        return 'Enter'
    }

    return 'Classifier'
}

// Enter key should always start with ONE '\n' or '\r\n' and potentially following spaces due to IDE reformat
function isEnterKey(str: string): boolean {
    if (str.length === 0) {
        return false
    }
    return (
        (str.startsWith('\r\n') && str.substring(2).trim() === '') ||
        (str[0] === '\n' && str.substring(1).trim() === '')
    )
}

function isSingleLine(str: string): boolean {
    let newLineCounts = 0
    for (const ch of str) {
        if (ch === '\n') {
            newLineCounts += 1
        }
    }

    // since pressing Enter key possibly will generate string like '\n        ' due to indention
    if (isEnterKey(str)) {
        return true
    }
    if (newLineCounts >= 1) {
        return false
    }
    return true
}

function isUserTypingSpecialChar(str: string): boolean {
    return ['(', '()', '[', '[]', '{', '{}', ':'].includes(str)
}

function isTabKey(str: string): boolean {
    const tabSize = 4 // TODO: Use IDE real tab size
    if (str.length % tabSize === 0 && str.trim() === '') {
        return true
    }
    return false
}

// Reference: https://github.com/aws/aws-toolkit-vscode/blob/amazonq/v1.74.0/packages/core/src/codewhisperer/service/keyStrokeHandler.ts#L222
// Enter, Special character guarantees a trigger
// Regular keystroke input will be evaluated by classifier
export const getAutoTriggerType = (
    contentChanges: TextDocumentContentChangeEvent[]
): CodewhispererAutomatedTriggerType | undefined => {
    if (contentChanges.length !== 1) {
        // Won't trigger cwspr on multi-line changes
        // event.contentChanges.length will be 2 when user press Enter key multiple times
        return undefined
    }
    const changedText = contentChanges[0].text
    if (isSingleLine(changedText)) {
        if (changedText.length === 0) {
            return undefined
        } else if (isEnterKey(changedText)) {
            return 'Enter'
        } else if (isTabKey(changedText)) {
            return undefined
        } else if (isUserTypingSpecialChar(changedText)) {
            return 'SpecialCharacters'
        } else if (changedText.length === 1) {
            return 'Classifier'
        } else if (new RegExp('^[ ]+$').test(changedText)) {
            // single line && single place reformat should consist of space chars only
            return undefined
        }
    }
    return undefined
}
// reference: https://github.com/aws/aws-toolkit-vscode/blob/amazonq/v1.74.0/packages/core/src/codewhisperer/service/classifierTrigger.ts#L579
export function getNormalizeOsName(): string {
    const name = os.platform()
    const version = os.version()
    const lowercaseName = name.toLowerCase()
    if (lowercaseName.includes('windows')) {
        if (!version) {
            return 'Windows'
        } else if (version.includes('Windows NT 10') || version.startsWith('10')) {
            return 'Windows 10'
        } else if (version.includes('6.1')) {
            return 'Windows 7'
        } else if (version.includes('6.3')) {
            return 'Windows 8.1'
        } else {
            return 'Windows'
        }
    } else if (
        lowercaseName.includes('macos') ||
        lowercaseName.includes('mac os') ||
        lowercaseName.includes('darwin')
    ) {
        return 'Mac OS X'
    } else if (lowercaseName.includes('linux')) {
        return 'Linux'
    } else {
        return name
    }
}

// Normalize values based on minn and maxx values in the coefficients.
const normalize = (val: number, field: keyof typeof typedCoefficients.minn & keyof typeof typedCoefficients.maxx) =>
    (val - typedCoefficients.minn[field]) / (typedCoefficients.maxx[field] - typedCoefficients.minn[field])

/**
 * Parameters to the auto trigger. Contains all information to make a decision.
 */
type AutoTriggerParams = {
    fileContext: FileContext
    char: string
    triggerType: string // Left as String intentionally to support future and unknown trigger types
    os: string
    previousDecision: string
    ide: string
    lineNum: number
}

/**
 * Auto Trigger to determine whether a keystroke or edit should trigger a recommendation invocation.
 * It uses information about the file, the position, the last entered character, the environment,
 * and previous recommendation decisions from the user to determine whether a new recommendation
 * should be shown. The auto-trigger is not stateful and does not keep track of past invocations.
 */
export const autoTrigger = (
    { fileContext, char, triggerType, os, previousDecision, ide, lineNum }: AutoTriggerParams,
    logging: Logging
): {
    shouldTrigger: boolean
    classifierResult: number
    classifierThreshold: number
} => {
    const leftContextLines = fileContext.leftFileContent.split(/\r?\n/)
    const leftContextAtCurrentLine = leftContextLines[leftContextLines.length - 1]
    const rightContextLines = fileContext.rightFileContent.split(/\r?\n/)
    const rightContextAtCurrentLine = rightContextLines[0]
    // reference: https://github.com/aws/aws-toolkit-vscode/blob/amazonq/v1.74.0/packages/core/src/codewhisperer/service/keyStrokeHandler.ts#L102
    // we do not want to trigger when there is immediate right context on the same line
    // with "}" being an exception because of IDE auto-complete
    // this was from product spec for VSC and JB
    if (
        rightContextAtCurrentLine.length &&
        !rightContextAtCurrentLine.startsWith(' ') &&
        rightContextAtCurrentLine.trim() !== '}' &&
        rightContextAtCurrentLine.trim() !== ')' &&
        ['VSCODE', 'JETBRAINS'].includes(ide)
    ) {
        logging.debug(`Skip auto trigger: immediate right context`)
        return {
            shouldTrigger: false,
            classifierResult: 0,
            classifierThreshold: TRIGGER_THRESHOLD,
        }
    }
    const tokens = leftContextAtCurrentLine.trim().split(' ')
    const lastToken = tokens[tokens.length - 1]

    const keyword = lastToken?.length > 1 ? lastToken : ''

    const lengthOfLeftCurrent = leftContextLines[leftContextLines.length - 1].length
    const lengthOfLeftPrev = leftContextLines[leftContextLines.length - 2]?.length ?? 0
    const lengthOfRight = fileContext.rightFileContent.trim().length

    const triggerTypeCoefficient = coefficients.triggerTypeCoefficient[triggerType] ?? 0
    const osCoefficient = coefficients.osCoefficient[os] ?? 0
    const charCoefficient = coefficients.charCoefficient[char] ?? 0
    const keyWordCoefficient = coefficients.charCoefficient[keyword] ?? 0

    const languageCoefficient = coefficients.languageCoefficient[fileContext.programmingLanguage.languageName] ?? 0

    let previousDecisionCoefficient = 0
    if (previousDecision === 'Accept') {
        previousDecisionCoefficient = coefficients.prevDecisionAcceptCoefficient
    } else if (previousDecision === 'Reject') {
        previousDecisionCoefficient = coefficients.prevDecisionRejectCoefficient
    } else if (previousDecision === 'Discard' || previousDecision === 'Empty') {
        previousDecisionCoefficient = coefficients.prevDecisionOtherCoefficient
    }

    const ideCoefficient = coefficients.ideCoefficient[ide] ?? 0

    let leftContextLengthCoefficient = 0
    if (fileContext.leftFileContent.length >= 0 && fileContext.leftFileContent.length < 5) {
        leftContextLengthCoefficient = coefficients.lengthLeft0To5Coefficient
    } else if (fileContext.leftFileContent.length >= 5 && fileContext.leftFileContent.length < 10) {
        leftContextLengthCoefficient = coefficients.lengthLeft5To10Coefficient
    } else if (fileContext.leftFileContent.length >= 10 && fileContext.leftFileContent.length < 20) {
        leftContextLengthCoefficient = coefficients.lengthLeft10To20Coefficient
    } else if (fileContext.leftFileContent.length >= 20 && fileContext.leftFileContent.length < 30) {
        leftContextLengthCoefficient = coefficients.lengthLeft20To30Coefficient
    } else if (fileContext.leftFileContent.length >= 30 && fileContext.leftFileContent.length < 40) {
        leftContextLengthCoefficient = coefficients.lengthLeft30To40Coefficient
    } else if (fileContext.leftFileContent.length >= 40 && fileContext.leftFileContent.length < 50) {
        leftContextLengthCoefficient = coefficients.lengthLeft40To50Coefficient
    }

    const classifierResult =
        coefficients.lengthOfRightCoefficient * normalize(lengthOfRight, 'lenRight') +
        coefficients.lengthOfLeftCurrentCoefficient * normalize(lengthOfLeftCurrent, 'lenLeftCur') +
        coefficients.lengthOfLeftPrevCoefficient * normalize(lengthOfLeftPrev, 'lenLeftPrev') +
        coefficients.lineNumCoefficient * normalize(lineNum, 'lineNum') +
        osCoefficient +
        triggerTypeCoefficient +
        charCoefficient +
        keyWordCoefficient +
        ideCoefficient +
        coefficients.intercept +
        previousDecisionCoefficient +
        languageCoefficient +
        leftContextLengthCoefficient
    const shouldTrigger = sigmoid(classifierResult) > TRIGGER_THRESHOLD

    return {
        shouldTrigger,
        classifierResult,
        classifierThreshold: TRIGGER_THRESHOLD,
    }
}
