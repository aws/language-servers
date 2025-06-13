import { ToolUse } from '@aws/codewhisperer-streaming-client'

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
