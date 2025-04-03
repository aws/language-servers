import { FileContext } from '../../../shared/codeWhispererService'
import typedCoefficients = require('./coefficients.json')

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
export const autoTrigger = ({
    fileContext,
    char,
    triggerType,
    os,
    previousDecision,
    ide,
    lineNum,
}: AutoTriggerParams): {
    shouldTrigger: boolean
    classifierResult: number
    classifierThreshold: number
} => {
    const leftContextLines = fileContext.leftFileContent.split(/\r?\n/)
    const leftContextAtCurrentLine = leftContextLines[leftContextLines.length - 1]
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
