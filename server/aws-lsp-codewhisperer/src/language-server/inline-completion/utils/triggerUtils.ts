import { SessionManager } from '../session/sessionManager'
import {
    DidChangeTextDocumentParams,
    InlineCompletionWithReferencesParams,
} from '@aws/language-server-runtimes/protocol'
import { editPredictionAutoTrigger } from '../auto-trigger/editPredictionAutoTrigger'
import { CursorTracker } from '../tracker/cursorTracker'
import { RecentEditTracker } from '../tracker/codeEditTracker'
import {
    ClientFileContextClss,
    CodeWhispererServiceBase,
    CodeWhispererServiceToken,
    FileContext,
} from '../../../shared/codeWhispererService'

export class NepTrigger {}

export function shouldTriggerEdits(
    service: CodeWhispererServiceBase,
    fileContext: FileContext,
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

export function inferTriggerChar(
    fileContext: ClientFileContextClss,
    changes: DidChangeTextDocumentParams | undefined
): string {
    if (changes?.contentChanges && changes.contentChanges.length > 0 && changes.contentChanges[0].text !== undefined) {
        const chars = changes.contentChanges[0].text
        // TODO: A deletion document change will be empty string with non empty range length, however not sure why we can't access TextDocumentContentChangeEvent.rangeLength here
        if (chars.length === 0) {
            return fileContext.leftFileContent.trim().at(-1) ?? ''
        }

        if (chars.length > 1) {
            // TODO: monkey patch, should refine these logic
            // Users hit newline and IDE or other extensions auto format for users
            // For such documentChanges might be '\n    ' (newline + 4 space)
            if (isDocumentChangedFromNewLine(chars)) {
                return '\n'
            }

            if (chars === `''`) {
                return `'`
            }

            if (chars === `""`) {
                return `"`
            }

            if (chars === '()') {
                return '('
            }

            if (chars === '{}') {
                return '{'
            }

            if (chars === '[]') {
                return '['
            }
        }

        return chars
    }

    // if the client does not emit document change for the trigger, use left most character.
    return fileContext.leftFileContent.trim().at(-1) ?? ''
}

/**
 * A proxy to estimate the provided string is from enter key
 * Input = ['\n\t', '\n   ', '\n         ', '  \ndef ']
 * Input = [true, true, true, false]
 */
export function isDocumentChangedFromNewLine(s: string) {
    return /^\n[\s\t]+$/.test(s)
}

// TODO: Should refine the logic
export function lastTokenFromString(str: string): string {
    const tokens = str.trim().split(/\s+/)
    if (tokens.length === 0) {
        return ''
    }
    const lastWordBeforeProcess = tokens[tokens.length - 1]

    const a = lastWordBeforeProcess.match(/\w+/g) || []

    return a.at(-1) ?? ''
}
