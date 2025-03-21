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
