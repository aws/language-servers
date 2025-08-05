import { BedrockModel } from './modelSelection'

// Error message constants
export const GENERIC_ERROR_MS = 'An unexpected error occurred, check the logs for more information.'
export const OUTPUT_LIMIT_EXCEEDS_PARTIAL_MSG = 'output exceeds maximum character limit of'
export const RESPONSE_TIMEOUT_PARTIAL_MSG = 'Response processing timed out after'

// Time Constants
export const LOADING_THRESHOLD_MS = 2000
export const CLIENT_TIMEOUT_MS = 245_000
export const RESPONSE_TIMEOUT_MS = 240_000

// LLM Constants
export const GENERATE_ASSISTANT_RESPONSE_INPUT_LIMIT = 500_000
export const DEFAULT_MODEL_ID = BedrockModel.CLAUDE_SONNET_4_20250514_V1_0

// Compaction
export const COMPACTION_BODY = (threshold: number) =>
    `The context window is almost full (${threshold}%) and exceeding it will clear your history. Amazon Q can compact your history instead.`
export const COMPACTION_HEADER_BODY = 'Compact chat history?'
export const COMPACTION_PROMPT = `
[SYSTEM NOTE: This is an automated summarization request, not from the user]\n\n
<task>
Your task is to generate a concise summary of the conversation history between an AI coding agent (assistant) and user once the LLM context window is reached.
This summary will replace the raw conversation history, so it should contain important information from the history such that it enables continuning the conversation with the user in a coherent manner.
Output the summary in markdown format with sections provided in format tag.
</task>

<format>
The summary should have following main sections:
## Conversation Summary
- contains an entry for each key topic discussed
## Files and Code Summary
- contains entries on what was learned about the files and code discussed. If relevant, it includes file paths, function signatures, and key changes
## Key Insights
- contains a summary for each key insight learned from the conversation (such as user preferences, technical details, decisions made, etc.)
## Most Recent Topic
- contains a detailed summary of the most recent topic discussed along with details of actions taken so far to address the user needs along with ALL tools executed
</format>

<guidelines>
- Add an entry to Key Insights section for any SIGNIFICANT tool usages whose result is important for continuing the conversation
- DO NOT respond conversationally. DO NOT address the user directly.
- For files that were read/written, exclude the full raw content but keep their path and what was learned about them
- If a file was loaded multiple times, only keep information about its latest fetch
- For code pieces, capture file paths and key changes
- Summarize code content concisely rather than including full snippets
- Remove chat conventions (greetings, offers to help, etc.)
- Only output the summary and nothing else
</guidelines>

<prioritize>
- Information essential for continuing the conversation effectively
- Technical details and code patterns that maintain context
- User primary goals and requirements
- Adding more details for recent conversations/actions over older ones
</prioritize>

<example_output>
## Conversation Summary
- **Topic1**: Summary of what was done to address Topic1 and the final conclusion
- **Topic2**: Summary of what was done to address Topic2 and the final conclusion

## Files and Code Summary
- **fileA path**: learnings about fileA
- **fileB path**: learnings about fileB
- **codeSnippetA**: learnings from codeSnippetA

## Key Insights
- **INSIGHT**: Insight1
- **INSIGHT**: Insight2

## Most Recent Topic
**Topic**: the most recent topic being discussed
**Progress**: Key actions taken so far to address the topic
**Tools Used**:
- **toolUsage1**: Summary of what was done in toolUsage1 and ultimate result
</example_output>
`

// shortcut constant
export const DEFAULT_MACOS_RUN_SHORTCUT = '&#8679; &#8984; &#8629;'
export const DEFAULT_WINDOW_RUN_SHORTCUT = 'Ctrl + &#8679; + &#8629;'
export const DEFAULT_LINUX_RUN_SHORTCUT = 'Meta + &#8679; + &#8629;'
export const DEFAULT_MACOS_STOP_SHORTCUT = '&#8679; &#8984; &#9003;'
export const DEFAULT_WINDOW_STOP_SHORTCUT = 'Ctrl + &#8679; + &#9003;'
export const DEFAULT_LINUX_STOP_SHORTCUT = 'Meta + &#8679; + &#9003;'
export const DEFAULT_MACOS_REJECT_SHORTCUT = '&#8679; &#8984; R'
export const DEFAULT_WINDOW_REJECT_SHORTCUT = 'Ctrl + &#8679; + R'
export const DEFAULT_LINUX_REJECT_SHORTCUT = 'Meta + &#8679; + R'

// Warning Message Constants
export const DESTRUCTIVE_COMMAND_WARNING_MSG = 'WARNING: Potentially destructive command detected:\n\n'
export const MUTATE_COMMAND_WARNING_MSG = 'Mutation command:\n\n'
export const OUT_OF_WORKSPACE_WARNING_MSG = 'Execution out of workspace scope:\n\n'
export const CREDENTIAL_FILE_WARNING_MSG =
    'WARNING: Command involves credential files that require secure permissions:\n\n'
export const BINARY_FILE_WARNING_MSG = 'WARNING: Command involves binary files that require secure permissions:\n\n'
