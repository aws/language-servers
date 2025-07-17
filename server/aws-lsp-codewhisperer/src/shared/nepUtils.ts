export function isEditsInvolveEmptyLinesOnly(unifiedDiff: string): boolean {
    // Split the diff into lines
    const diffLines = unifiedDiff.split('\n')

    // Skip the header lines (starting with ---, +++, @@)
    const contentLines = diffLines.filter(
        line => line && !line.startsWith('---') && !line.startsWith('+++') && !line.startsWith('@@')
    )

    // Check each change line (starting with + or -)
    for (const line of contentLines) {
        // If it's not a change line, skip it
        if (!line.startsWith('+') && !line.startsWith('-')) {
            continue
        }

        // Remove the first character (+ or -) and check if the rest is empty
        const content = line.substring(1)
        if (content.trim() !== '') {
            // If we find any non-empty change, return false
            return false
        }
    }

    return true
}
