import { CodewhispererLanguage } from '../../shared/languageDetection'
import { SessionManager } from './session/sessionManager'
import { InlineCompletionWithReferencesParams } from '@aws/language-server-runtimes/protocol'
import { editPredictionAutoTrigger } from './auto-trigger/editPredictionAutoTrigger'
import { CursorTracker } from './tracker/cursorTracker'
import { RecentEditTracker } from './tracker/codeEditTracker'
import { CodeWhispererServiceBase, CodeWhispererServiceToken } from '../../shared/codeWhispererService'

export class NepTrigger {}

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
    sessionManager: SessionManager,
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

    const previousDecision = sessionManager.getPreviousSession()?.getAggregatedUserTriggerDecision()
    const res = editPredictionAutoTrigger({
        fileContext: fileContext,
        lineNum: inlineParams.position.line,
        char: triggerCharacters,
        previousDecision: previousDecision ?? '',
        cursorHistory: cursorTracker,
        recentEdits: recentEditsTracker,
    })

    if (res.shouldTrigger) {
        return new NepTrigger()
    } else {
        return undefined
    }
}
