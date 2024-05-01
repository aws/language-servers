import { Position, Range } from '@amzn/codewhisperer-streaming'
import { Range as DocumentRange, TextDocument } from 'vscode-languageserver-textdocument'

export type CursorState = { position: Position } | { range: Range }

export function normalizeRange(range: Range): DocumentRange {
    return {
        start: {
            character: range.start!.character!,
            line: range.start!.line!,
        },
        end: {
            character: range.end!.character!,
            line: range.end!.line!,
        },
    }
}

export function getExtendedCodeBlockRange(
    document: TextDocument,
    cursorState: CursorState,
    characterLimit: number
): DocumentRange {
    const targetRange: DocumentRange = normalizeRange(
        'position' in cursorState
            ? {
                  start: cursorState.position,
                  end: cursorState.position,
              }
            : cursorState.range
    )

    let startOffset = document.offsetAt(targetRange.start)
    let endOffset = document.offsetAt(targetRange.end)
    // this will return us the maxOffset theoretically
    const maxOffset = document.offsetAt({
        line: document.lineCount + 1,
        character: 0,
    })

    while (
        endOffset - startOffset < characterLimit &&
        (startOffset > 0 || endOffset < maxOffset) /* what is the upper bound here? */
    ) {
        startOffset = Math.max(0, startOffset - 1)
        endOffset = Math.min(endOffset + 1, maxOffset)
    }

    return {
        start: document.positionAt(startOffset),
        end: document.positionAt(endOffset),
    }
}
