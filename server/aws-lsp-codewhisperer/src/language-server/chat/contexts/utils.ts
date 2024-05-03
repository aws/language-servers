import { ProgrammingLanguage } from '@amzn/codewhisperer-streaming'
import { Position, Range, TextDocument } from 'vscode-languageserver-textdocument'

export type CursorState = { position: Position } | { range: Range }

/**
 * Extend the cursor range on both end up to charactersLimit for context (if applicable)
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
    const beforeCharacters = Math.ceil(extraCharactersAllowed / 2)
    const afterCharacters = Math.floor(extraCharactersAllowed / 2)

    // Try adding number of extra characters equally on both end first
    startOffset = Math.max(0, startOffset - beforeCharacters)
    endOffset = Math.min(endOffset + afterCharacters, maxOffset)

    // If there are remaining characters, which means that we reached at least one end of the document
    const remainingCharacters = charactersLimit - (endOffset - startOffset)

    if (remainingCharacters > 0) {
        // Since we are at the beginning on the document, try adding the remaining to the characters, and vice versa.
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
    if (selection.start.line === selection.end.line && selection.start.character === selection.end.character) {
        return undefined
    }

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

const languageIdExactMatch = new Set<string>([
    'bat',
    'yaml',
    'xsl',
    'xml',
    'vue',
    'tex',
    'typescript',
    'swift',
    'stylus',
    'sql',
    'slim',
    'shaderlab',
    'sass',
    'rust',
    'ruby',
    'r',
    'python',
    'pug',
    'powershell',
    'php',
    'perl',
    'markdown',
    'makefile',
    'lua',
    'less',
    'latex',
    'json',
    'javascript',
    'java',
    'ini',
    'html',
    'haml',
    'handlebars',
    'groovy',
    'go',
    'diff',
    'css',
    'c',
    'coffeescript',
    'clojure',
    'bibtex',
    'abap',
])

export function extractLanguageNameFromFile(file: TextDocument): ProgrammingLanguage {
    const languageId = file.languageId

    if (languageIdExactMatch.has(languageId)) {
        return { languageName: languageId }
    }

    switch (languageId) {
        case 'cpp':
        case 'cuda-cpp':
            return { languageName: 'c++' }
        case 'csharp':
            return { languageName: 'c#' }
        case 'dockerfile':
            return { languageName: 'dockerfile' }
        case 'fsharp':
            return { languageName: 'f#' }
        case 'git-commit':
        case 'git-rebase':
            return { languageName: 'git' }
        case 'jsonc':
            return { languageName: 'json' }
        case 'objective-c':
            return { languageName: 'objective-c' }
        case 'objective-cpp':
            return { languageName: 'objective-c++' }
        case 'perl6':
            return { languageName: 'raku' }
        case 'jade':
            return { languageName: 'pug' }
        case 'razor':
            return { languageName: 'razor' }
        case 'scss':
            return { languageName: 'sass' }
        case 'shellscript':
            return { languageName: 'sh' }
        case 'vb':
            return { languageName: 'visual-basic' }
        case 'vue-html':
            return { languageName: 'vue' }
        default:
            if (['javascript', 'node'].some(identifier => languageId.includes(identifier))) {
                return { languageName: 'javascript' }
            } else if (languageId.includes('typescript')) {
                // is this actually right? Can we use typescript react
                return { languageName: 'typescript' }
            } else if (languageId.includes('python')) {
                return { languageName: 'python' }
            }

            return { languageName: undefined }
    }
}
