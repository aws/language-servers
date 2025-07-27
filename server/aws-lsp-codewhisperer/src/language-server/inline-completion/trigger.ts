import { CodewhispererLanguage } from '../../shared/languageDetection'
import {
    CodewhispererAutomatedTriggerType,
    getAutoTriggerType,
    triggerType,
    autoTrigger,
    getNormalizeOsName,
} from './auto-trigger/autoTrigger'
import { InlineCompletionTriggerKind } from 'vscode-languageserver-protocol'
import { SessionManager } from './session/sessionManager'
import { InlineCompletionWithReferencesParams } from '@aws/language-server-runtimes/protocol'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { editPredictionAutoTrigger } from './auto-trigger/editPredictionAutoTrigger'
import { CursorTracker } from './tracker/cursorTracker'
import { RecentEditTracker } from './tracker/codeEditTracker'
import { CodeWhispererServiceBase, CodeWhispererServiceToken } from '../../shared/codeWhispererService'
import { PredictionTypes } from '../../client/token/codewhispererbearertokenclient'

interface QInlineTrigger {
    triggerCharacters: string
}

export class NepTrigger {}

export class ManualTrigger implements QInlineTrigger {
    constructor(readonly triggerCharacters: string) {}
}

export abstract class QAutoTrigger implements QInlineTrigger {
    triggerType: CodewhispererAutomatedTriggerType
    triggerCharacters: string

    constructor(type: CodewhispererAutomatedTriggerType, ch: string) {
        this.triggerType = type
        this.triggerCharacters = ch
    }
}

export class KeyBasedAutoTrigger extends QAutoTrigger {
    constructor(t: CodewhispererAutomatedTriggerType, ch: string) {
        super(t, ch)
    }
}

export class ClassifierAutoTrigger extends QAutoTrigger {
    constructor(
        ch: string,
        readonly classifierScore: number,
        readonly classifierThreshold: number
    ) {
        super('Classifier', ch)
    }
}

/**
 * Manual trigger - should always have 'Completions'
 * Auto trigger
 *  - Classifier - should have 'Completions' when classifier evalualte to true given the editor's states
 *  - Others - should always have 'Completions'
 */
export function shouldTriggerSuggestion(
    service: CodeWhispererServiceBase,
    fileContext: {
        fileUri: string
        filename: string
        programmingLanguage: {
            languageName: CodewhispererLanguage
        }
        leftFileContent: string
        rightFileContent: string
    },
    inlineParams: InlineCompletionWithReferencesParams,
    sessionManager: SessionManager,
    cursorTracker: CursorTracker,
    recentEditsTracker: RecentEditTracker,
    ideCategory: string,
    logging: Logging,
    config: any
): {
    predictionTypes: PredictionTypes
    completions: QInlineTrigger | undefined
    edits: NepTrigger | undefined
} {
    const predictionTypes: PredictionTypes = []
    const inlineTrigger = shouldTriggerCompletions(fileContext, inlineParams, sessionManager, ideCategory, logging)
    const editsEnabled: boolean = config.editsEnabled === true
    const editsTrigger = shouldTriggerEdits(
        service,
        fileContext,
        inlineParams,
        cursorTracker,
        recentEditsTracker,
        editsEnabled
    )

    if (inlineTrigger) {
        predictionTypes.push('COMPLETIONS')
    }
    if (editsTrigger) {
        predictionTypes.push('EDITS')
    }

    return {
        predictionTypes: predictionTypes,
        completions: inlineTrigger,
        edits: editsTrigger,
    }
}

export function shouldTriggerEdits(
    service: CodeWhispererServiceBase,
    fileContext: {
        fileUri: string
        filename: string
        programmingLanguage: {
            languageName: CodewhispererLanguage
        }
        leftFileContent: string
        rightFileContent: string
    },
    inlineParams: InlineCompletionWithReferencesParams,
    cursorTracker: CursorTracker,
    recentEditsTracker: RecentEditTracker,
    editsEnabled: boolean
): NepTrigger | undefined {
    if (!editsEnabled) {
        return undefined
    }
    // edits type suggestion is only implemented in bearer token based IDE for now, we dont want to expose such suggestions to other platforms
    if (!(service instanceof CodeWhispererServiceToken)) {
        return undefined
    }

    const documentChangeParams = inlineParams.documentChangeParams
    const hasDocChangedParams =
        documentChangeParams?.contentChanges &&
        documentChangeParams.contentChanges.length > 0 &&
        documentChangeParams.contentChanges[0].text !== undefined

    // if the client does not emit document change for the trigger, use left most character.
    const triggerCharacters = hasDocChangedParams
        ? documentChangeParams.contentChanges[0].text
        : (fileContext.leftFileContent.trim().at(-1) ?? '')

    const res = editPredictionAutoTrigger({
        fileContext: fileContext,
        lineNum: inlineParams.position.line,
        char: triggerCharacters,
        cursorHistory: cursorTracker,
        recentEdits: recentEditsTracker,
    })

    if (res.shouldTrigger) {
        return new NepTrigger()
    } else {
        return undefined
    }
}

export function shouldTriggerCompletions(
    fileContext: {
        fileUri: string
        filename: string
        programmingLanguage: {
            languageName: CodewhispererLanguage
        }
        leftFileContent: string
        rightFileContent: string
    },
    inlineParams: InlineCompletionWithReferencesParams,
    sessionManager: SessionManager,
    ideCategory: string,
    logging: Logging
): QInlineTrigger | undefined {
    const documentChangeParams = inlineParams.documentChangeParams

    // let triggerCharacters = ''
    // let codewhispererAutoTriggerType: CodewhispererAutomatedTriggerType | undefined = undefined
    // Reference: https://github.com/aws/aws-toolkit-vscode/blob/amazonq/v1.74.0/packages/core/src/codewhisperer/service/classifierTrigger.ts#L477
    const hasDocChangedParams =
        documentChangeParams?.contentChanges &&
        documentChangeParams.contentChanges.length > 0 &&
        documentChangeParams.contentChanges[0].text !== undefined

    // if the client does not emit document change for the trigger, use left most character.
    const triggerCharacters = hasDocChangedParams
        ? documentChangeParams.contentChanges[0].text
        : (fileContext.leftFileContent.trim().at(-1) ?? '')

    if (inlineParams.context.triggerKind === InlineCompletionTriggerKind.Invoked) {
        return new ManualTrigger(triggerCharacters)
    }

    const codewhispererAutoTriggerType = hasDocChangedParams
        ? getAutoTriggerType(documentChangeParams.contentChanges)
        : triggerType(fileContext)

    const previousDecision = sessionManager.getPreviousSession()?.getAggregatedUserTriggerDecision()

    switch (codewhispererAutoTriggerType) {
        case undefined: {
            return undefined
        }

        case 'Classifier': {
            const autoTriggerResult = autoTrigger(
                {
                    fileContext, // The left/right file context and programming language
                    lineNum: inlineParams.position.line, // the line number of the invocation, this is the line of the cursor
                    char: triggerCharacters, // Add the character just inserted, if any, before the invication position
                    ide: ideCategory ?? '',
                    os: getNormalizeOsName(),
                    previousDecision, // The last decision by the user on the previous invocation
                    triggerType: codewhispererAutoTriggerType, // The 2 trigger types currently influencing the Auto-Trigger are SpecialCharacter and Enter
                },
                logging
            )

            if (autoTriggerResult.shouldTrigger) {
                return new ClassifierAutoTrigger(
                    triggerCharacters,
                    autoTriggerResult.classifierResult,
                    autoTriggerResult.classifierThreshold
                )
            } else {
                return undefined
            }
        }

        case 'Enter': {
            return new KeyBasedAutoTrigger(codewhispererAutoTriggerType, triggerCharacters)
        }

        case 'SpecialCharacters': {
            return new KeyBasedAutoTrigger(codewhispererAutoTriggerType, triggerCharacters)
        }

        default:
            return undefined
    }
}
