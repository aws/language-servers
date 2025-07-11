import { BedrockModel } from './modelSelection'

export const genericErrorMsg = 'An unexpected error occurred, check the logs for more information.'
export const loadingThresholdMs = 2000
export const generateAssistantResponseInputLimit = 500_000
export const outputLimitExceedsPartialMsg = 'output exceeds maximum character limit of'
export const responseTimeoutMs = 240_000
export const responseTimeoutPartialMsg = 'Response processing timed out after'
export const clientTimeoutMs = 245_000
export const defaultModelId = BedrockModel.CLAUDE_SONNET_4_20250514_V1_0
export const DEFAULT_MACOS_RUN_SHORTCUT = '&#8984; R'
export const DEFAULT_WINDOW_RUN_SHORTCUT = 'Ctrl + R'
export const DEFAULT_LINUX_RUN_SHORTCUT = 'Meta + R'
export const DEFAULT_MACOS_STOP_SHORTCUT = '&#8984; Delete'
export const DEFAULT_WINDOW_STOP_SHORTCUT = 'Ctrl + Backspace'
export const DEFAULT_LINUX_STOP_SHORTCUT = 'Meta + Backspace'
