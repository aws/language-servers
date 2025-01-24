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
