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

// shortcut constant
export const DEFAULT_MACOS_RUN_SHORTCUT = '&#8984; R'
export const DEFAULT_WINDOW_RUN_SHORTCUT = 'Ctrl + R'
export const DEFAULT_LINUX_RUN_SHORTCUT = 'Meta + R'
export const DEFAULT_MACOS_STOP_SHORTCUT = '^ C'
export const DEFAULT_WINDOW_STOP_SHORTCUT = 'Ctrl + C'
export const DEFAULT_LINUX_STOP_SHORTCUT = 'Meta + C'
export const DEFAULT_MACOS_REJECT_SHORTCUT = '&#8984; E'
export const DEFAULT_WINDOW_REJECT_SHORTCUT = 'Ctrl + E'
export const DEFAULT_LINUX_REJECT_SHORTCUT = 'Meta + E'
