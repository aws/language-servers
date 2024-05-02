import { ProgrammingLanguage } from '@amzn/codewhisperer-streaming'
import { Position, Range, TextDocument } from 'vscode-languageserver-textdocument'

export type CursorState = { position: Position } | { range: Range }

/**
 * Extend the cursor range up to charactersLimit for context (if applicable)
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

    // line: lineCount + 1 puts us outside the bound so .offsetAt returns the upper bound
    const maxOffset = document.offsetAt({
        line: document.lineCount + 1,
        character: 0,
    })

    // wonder if we want to prioritize snedinng an entire line
    while (endOffset - startOffset < charactersLimit && (startOffset > 0 || endOffset < maxOffset)) {
        const charactersCount = endOffset - startOffset

        // edge case where extending on both side would result in exceeding character limit
        if (charactersCount === charactersLimit - 1) {
            if (startOffset > 0) {
                startOffset--
            } else {
                endOffset++
            }
        } else {
            startOffset = Math.max(0, startOffset - 1)
            endOffset = Math.min(endOffset + 1, maxOffset)
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
