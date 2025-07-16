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

// Warning Message Constants
export const DESTRUCTIVE_COMMAND_WARNING_MSG = 'WARNING: Potentially destructive command detected:\n\n'
export const MUTATE_COMMAND_WARNING_MSG = 'Mutation command:\n\n'
export const OUT_OF_WORKSPACE_WARNING_MSG = 'Execution out of workspace scope:\n\n'
export const CREDENTIAL_FILE_WARNING_MSG =
    'WARNING: Command involves credential files that require secure permissions:\n\n'
export const BINARY_FILE_WARNING_MSG = 'WARNING: Command involves binary files that require secure permissions:\n\n'
