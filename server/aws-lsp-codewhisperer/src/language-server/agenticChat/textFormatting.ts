import { ToolUse } from '@amzn/codewhisperer-streaming'

/**
 * Unescapes HTML entities and backslash-escaped angle brackets in a string.
 * This reverses:
 * 1. HTML escaping done by escape-html: " → &quot;, & → &amp;, ' → &#39;, < → &lt;, > → &gt;
 * 2. Backslash escaping of angle brackets that may appear in the LLM response: \< → <, \> → >
 */
export function unescapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
    }
    // First unescape HTML entities
    let result = text.replace(/&(?:amp|lt|gt|quot|#39);/g, match => htmlEntities[match] || match)

    // Then unescape backslash-escaped angle brackets (but only when they appear as \< or \>)
    // This handles cases where the LLM returns literal backslash-escaped angle brackets
    result = result.replace(/\\</g, '<').replace(/\\>/g, '>')

    return result
}

function codeBlocked(s: string) {
    const codeBlock = `\`\`\`\``

    return `${codeBlock}${s}${codeBlock}`
}

function boldText(s: string) {
    return `**${s}**`
}

function formatJson(s: any) {
    return codeBlocked(JSON.stringify(s, null, 2))
}

export function executeToolMessage(toolUse: ToolUse) {
    return `⚡️ Executing: tool **${toolUse.name}**
                Arguments: ${formatJson(toolUse.input)}`
}

export function toolResultMessage(toolUse: ToolUse, result: any) {
    return `✅ Tool ${boldText(toolUse.name ?? 'unknown tool')} completed with result: 
                ${formatJson(result)}`
}

export function toolErrorMessage(toolUse: ToolUse, errorMessage: string) {
    return `❌ Tool ${boldText(toolUse.name ?? 'unknown tool')} failed
    \`Error: ${errorMessage}\``
}
