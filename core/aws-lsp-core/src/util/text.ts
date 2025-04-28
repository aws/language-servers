/**
 * cleans up a filename of invalid characters, whitespaces and emojis
 * "foo🤷bar/zu b.txt" => "foo_bar_zu_b.txt"
 * @param input filename
 * @param replaceString optionally override default substitution
 * @returns a cleaned name you can safely use as a file or directory name
 *
 * taken from https://github.com/aws/aws-toolkit-vscode/blob/cf700b6c94ede6a1906549638cf1578e8d4751c1/packages/core/src/shared/utilities/textUtilities.ts#L216
 */
export function sanitizeFilename(input: string, replaceString = '_'): string {
    return (
        input
            // replace invalid chars
            .replace(/[/|\\:*?"<>\s]/g, replaceString)
            // replace emojis https://edvins.io/how-to-strip-emojis-from-string-in-java-script
            .replace(
                /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                replaceString
            )
    )
}

// Partial port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/0c4289b1a0b5d294cc352f7d2e7e586937ac0318/packages/core/src/shared/utilities/textUtilities.ts#L391

export function undefinedIfEmpty(str: string | undefined): string | undefined {
    if (str && str.trim().length > 0) {
        return str
    }

    return undefined
}

/**
 * Truncates string `s` if it has or exceeds `n` chars.
 *
 * If `n` is negative, truncates at start instead of end.
 *
 * @param s String to truncate
 * @param n Truncate after this length
 * @param suffix String appended to truncated value (default: "…")
 */
export function truncate(s: string, n: number, suffix?: string): string {
    suffix = suffix ?? '…'
    if (s.length <= Math.abs(n)) {
        return s
    }
    const start = n < 0 ? s.length - Math.abs(n) : 0
    const end = n < 0 ? s.length : n
    const truncated = s.substring(start, end)
    return n < 0 ? suffix + truncated : truncated + suffix
}
