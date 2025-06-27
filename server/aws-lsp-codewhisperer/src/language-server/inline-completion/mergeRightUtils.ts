import { InlineCompletionItemWithReferences, TextDocument } from '@aws/language-server-runtimes/server-interface'
import { CodeWhispererSession } from './session/sessionManager'
import { applyUnifiedDiff, generateUnifiedDiffWithTimestamps } from './diffUtils'
import { FileContext } from '../../shared/codeWhispererService'

/**
 * Returns the longest overlap between the Suffix of firstString and Prefix of second string
 * getPrefixSuffixOverlap("adwg31", "31ggrs") = "31"
 */
export function getPrefixSuffixOverlap(firstString: string, secondString: string) {
    let i = Math.min(firstString.length, secondString.length)
    while (i > 0) {
        if (secondString.slice(0, i) === firstString.slice(-i)) {
            break
        }
        i--
    }
    return secondString.slice(0, i)
}

/**
 * Returns the last index of the longest overlap between the first string and the second string
 * @param targetString the target string
 * @param searchString the search string
 * @returns last index of the longest overlap between the first string and the second string
 * @example getPrefixOverlapLastIndex("public static void", "static") = 13
 */
export function getPrefixOverlapLastIndex(targetString: string, searchString: string) {
    let i = searchString.length
    let idx = -1
    while (i > 0) {
        idx = targetString.indexOf(searchString.slice(0, i))
        if (idx != -1) {
            return idx + i
        }
        i--
    }
    return idx
}

export function truncateOverlapWithRightContext(
    rightFileContent: string,
    suggestion: string,
    userEdit?: string
): string {
    const trimmedSuggestion = suggestion.trim()
    // limit of 5000 for right context matching
    const rightContext = rightFileContent
        .substring(0, 5000)
        .replaceAll('\r\n', '\n')
        .replace(/^[^\S\n]+/, '') // remove leading tabs and whitespaces
    let prefixOverlapLastIndex = 0
    if (userEdit) {
        const trimmpedUserEdit = userEdit.trim()
        prefixOverlapLastIndex = getPrefixOverlapLastIndex(trimmedSuggestion, trimmpedUserEdit)
        if (prefixOverlapLastIndex == -1) {
            return ''
        }
    }
    const prefixSuffixOverlap = getPrefixSuffixOverlap(trimmedSuggestion, rightContext)
    const prefixSuffixOverlapIndex = suggestion.lastIndexOf(prefixSuffixOverlap)
    if (prefixSuffixOverlapIndex >= 0) {
        const truncated = suggestion.slice(prefixOverlapLastIndex, prefixSuffixOverlapIndex)
        return truncated.trim().length ? truncated : ''
    } else {
        return suggestion
    }
}

/**
 * Merge Edit suggestions with current file context.
 * @param currentSession current session that contains previous suggestions
 * @param currentTextDocument current text document
 * @param currentFileContext current file context that contains the cursor position
 * @returns InlineCompletionItemWithReferences[] with merged edit suggestions and new diff content in insertText field
 */
export function mergeEditSuggestionsWithFileContext(
    currentSession: CodeWhispererSession,
    currentTextDocument: TextDocument,
    currentFileContext: FileContext
): InlineCompletionItemWithReferences[] {
    return currentSession.suggestions
        .map(suggestion => {
            // generate the previous suggested file content by applying previous suggestion to previous doc content
            const previousTextDocument = currentSession.document
            const suggestedFileContent = applyUnifiedDiff(previousTextDocument.getText(), suggestion.content)
            const currentLeftFileContent = currentFileContext.leftFileContent
            const currentRightFileContent = currentFileContext.rightFileContent
            const previousLeftFileContent = currentSession.requestContext.fileContext.leftFileContent
            const userEdit = currentLeftFileContent.substring(previousLeftFileContent.length)
            // if the user moves the cursor backward, deletes some contents, or goes to the next line, discard the suggestion
            if (previousLeftFileContent.length > currentLeftFileContent.length || userEdit.includes('\n')) {
                return {
                    insertText: '',
                    isInlineEdit: true,
                    itemId: suggestion.itemId,
                }
            }
            // find the first overlap between the user input and the previous suggestion
            const mergedRightContent = truncateOverlapWithRightContext(
                currentRightFileContent,
                suggestedFileContent,
                userEdit
            )
            // if the merged right content is empty, discard the suggestion
            if (!mergedRightContent) {
                return {
                    insertText: '',
                    isInlineEdit: true,
                    itemId: suggestion.itemId,
                }
            }
            // generate new diff from the merged content
            const newDiff = generateUnifiedDiffWithTimestamps(
                currentTextDocument.uri,
                currentSession.document.uri,
                currentTextDocument.getText(),
                currentLeftFileContent + mergedRightContent,
                Date.now(),
                Date.now()
            )
            suggestion.content = newDiff
            currentSession.requestContext.fileContext = currentFileContext
            currentSession.document = currentTextDocument
            return {
                insertText: newDiff,
                isInlineEdit: true,
                itemId: suggestion.itemId,
            }
        })
        .filter(item => item.insertText !== '')
}
