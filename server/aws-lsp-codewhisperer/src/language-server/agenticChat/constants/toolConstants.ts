/**
 * Constants related to tools used in agenticChatController.ts
 * This file centralizes all tool names and related constants to improve code quality and maintainability.
 */

// File system tools
export const FS_READ = 'fsRead'
export const FS_WRITE = 'fsWrite'
export const FS_REPLACE = 'fsReplace'

// Directory tools
export const LIST_DIRECTORY = 'listDirectory'

// Search tools
export const GREP_SEARCH = 'grepSearch'
export const FILE_SEARCH = 'fileSearch'

// Shell tools
export const EXECUTE_BASH = 'executeBash'

// Code analysis tools
export const CODE_REVIEW = 'codeReview'

// Tool use button IDs
export const BUTTON_RUN_SHELL_COMMAND = 'run-shell-command'
export const BUTTON_REJECT_SHELL_COMMAND = 'reject-shell-command'
export const BUTTON_REJECT_MCP_TOOL = 'reject-mcp-tool'
export const BUTTON_ALLOW_TOOLS = 'allow-tools'
export const BUTTON_UNDO_CHANGES = 'undo-changes'
export const BUTTON_UNDO_ALL_CHANGES = 'undo-all-changes'
export const BUTTON_STOP_SHELL_COMMAND = 'stop-shell-command'
export const BUTTON_PAIDTIER_UPGRADE_Q_LEARNMORE = 'paidtier-upgrade-q-learnmore'
export const BUTTON_PAIDTIER_UPGRADE_Q = 'paidtier-upgrade-q'

// Diagnostic error button IDs
export const BUTTON_FIX_DIAGNOSTIC_ERRORS = 'fix-diagnostic-errors'
export const BUTTON_FIX_ALL_DIAGNOSTIC_ERRORS = 'fix-all-diagnostic-errors'
export const BUTTON_FIX_SELECTED_DIAGNOSTIC_ERRORS = 'fix-selected-diagnostic-errors'
export const BUTTON_CONTINUE_WITH_ERRORS = 'continue-with-errors'

// Message ID suffixes
export const SUFFIX_PERMISSION = '_permission'
export const SUFFIX_UNDOALL = '_undoall'
export const SUFFIX_EXPLANATION = '_explanation'
