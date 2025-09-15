import { Range, TextDocument } from 'vscode-languageserver-textdocument'

/**
 * Extend the cursor range on both ends up to charactersLimit for context (if applicable)
 */

export function getExtendedCodeBlockRange(
    document: TextDocument,
    originalRange: Range,
    charactersLimit: number
): Range {
    let startOffset = document.offsetAt(originalRange.start)
    let endOffset = document.offsetAt(originalRange.end)

    const totalSelectedCharacters = endOffset - startOffset

    // if the total selected characters are greater than the character limit, trims the characters
    if (totalSelectedCharacters >= charactersLimit) {
        return {
            start: document.positionAt(startOffset),
            end: document.positionAt(startOffset + charactersLimit),
        }
    }

    // lineCount + 1 puts us outside the bound so `.offsetAt` returns the max offset
    const maxOffset = document.offsetAt({
        line: document.lineCount + 1,
        character: 0,
    })

    const extraCharactersAllowed = charactersLimit - totalSelectedCharacters

    // Accounting for the edge case when there is an odd number of characters
    const prependCharacterCount = Math.ceil(extraCharactersAllowed / 2)
    const appendCharacterCount = Math.floor(extraCharactersAllowed / 2)

    // Try adding number of extra characters "equally" on both end first
    startOffset = Math.max(0, startOffset - prependCharacterCount)
    endOffset = Math.min(endOffset + appendCharacterCount, maxOffset)

    // If there are remaining characters, which means that we reached at least one end of the document
    const remainingCharacters = charactersLimit - (endOffset - startOffset)

    if (remainingCharacters > 0) {
        // Since we are at the beginning on the document, try adding the remaining characters to the end, and vice versa.
        if (startOffset === 0) {
            endOffset = Math.min(endOffset + remainingCharacters, maxOffset)
        } else {
            startOffset = Math.max(startOffset - remainingCharacters, 0)
        }
    }

    return {
        start: document.positionAt(startOffset),
        end: document.positionAt(endOffset),
    }
}

/**
 * Since we are only sending over the code block, the selection that
 * reflects the position in the entire document needs to be adjusted.
 */
export function getSelectionWithinExtendedRange(selection: Range, extendedRange: Range): Range | undefined {
    return {
        start: {
            line: selection.start.line - extendedRange.start.line,
            character:
                selection.start.line === extendedRange.start.line
                    ? selection.start.character - extendedRange.start.character
                    : selection.start.character,
        },
        end: {
            line: selection.end.line - extendedRange.start.line,
            character:
                selection.end.line === extendedRange.end.line
                    ? selection.end.character - extendedRange.start.character
                    : selection.end.character,
        },
    }
}
