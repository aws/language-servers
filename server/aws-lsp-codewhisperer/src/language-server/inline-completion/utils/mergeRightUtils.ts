import { InlineCompletionItemWithReferences, Range } from '@aws/language-server-runtimes/server-interface'
import { Suggestion } from '../../../shared/codeWhispererService'

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

export function truncateOverlapWithRightContext(rightFileContent: string, suggestion: string): string {
    const trimmedSuggestion = suggestion.trim()
    // limit of 5000 for right context matching
    const rightContext = rightFileContent
        .substring(0, 5000)
        .replaceAll('\r\n', '\n')
        .replace(/^[^\S\n]+/, '') // remove leading tabs and whitespaces
    const overlap = getPrefixSuffixOverlap(trimmedSuggestion, rightContext)
    const overlapIndex = suggestion.lastIndexOf(overlap)
    if (overlapIndex >= 0) {
        const truncated = suggestion.slice(0, overlapIndex)
        return truncated.trim().length ? truncated : ''
    } else {
        return suggestion
    }
}

export const mergeSuggestionsWithRightContext = (
    rightFileContext: string,
    suggestions: Suggestion[],
    includeImportsWithSuggestions: boolean,
    range?: Range
): InlineCompletionItemWithReferences[] => {
    return suggestions.map(suggestion => {
        const insertText: string = truncateOverlapWithRightContext(rightFileContext, suggestion.content)
        let references = suggestion.references
            ?.filter(
                ref =>
                    !(
                        ref.recommendationContentSpan?.start && insertText.length <= ref.recommendationContentSpan.start
                    ) && insertText.length
            )
            .map(r => {
                return {
                    licenseName: r.licenseName,
                    referenceUrl: r.url,
                    referenceName: r.repository,
                    position: r.recommendationContentSpan && {
                        startCharacter: r.recommendationContentSpan.start,
                        endCharacter: r.recommendationContentSpan.end
                            ? Math.min(r.recommendationContentSpan.end, insertText.length - 1)
                            : r.recommendationContentSpan.end,
                    },
                }
            })

        return {
            itemId: suggestion.itemId,
            insertText: insertText,
            range,
            references: references?.length ? references : undefined,
            mostRelevantMissingImports: includeImportsWithSuggestions
                ? suggestion.mostRelevantMissingImports
                : undefined,
        }
    })
}
