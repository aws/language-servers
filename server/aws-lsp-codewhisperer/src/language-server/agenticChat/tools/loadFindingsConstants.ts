/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Constants related to programming languages and findings for QCodeReview
 */

/**
 * Mapping of file extensions to programming languages
 */
export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.jsx': 'javascript',
    '.java': 'java',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp',
    '.sh': 'shell',
    '.bash': 'shell',
    '.sql': 'sql',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.swift': 'swift',
}

/**
 * List of supported programming languages in uppercase
 */
export const PROGRAMMING_LANGUAGES_CAPS = [
    'PYTHON',
    'JAVASCRIPT',
    'TYPESCRIPT',
    'JAVA',
    'CSHARP',
    'PHP',
    'RUBY',
    'GO',
    'RUST',
    'CPP',
    'C',
    'SHELL',
    'SQL',
    'KOTLIN',
    'SCALA',
    'SWIFT',
]

/**
 * List of supported programming languages in lowercase
 */
export const PROGRAMMING_LANGUAGES_LOWERCASE = PROGRAMMING_LANGUAGES_CAPS.map(lang => lang.toLowerCase())

/**
 * Tool name for QCodeReview
 */
export const TOOL_NAME = 'loadFindings'

/**
 * Tool description for QCodeReview
 */
export const TOOL_DESCRIPTION = [
    'A tool for retreiving context from the Code Issues panel. ' +
        'This tool should be used when the user wants to discuss Code issues (also called findings) with the agent. ' +
        'The agent should not return the information from this tool to the customer but should use the information to answer the question sent by the user.',
    '',
    'Sometimes the customer may provide information on specific findings they want to discuss:',
    '- Severity: The user may want to discuss only certain severities of code issues',
    '- File Path: The user may only want findings from a certain file',
    '- Title: The user may want to specify findings by a certain file',
    '',
    'This tool should be used first before any other tools about code findings or issues. Only if the relevant information is not found in the response of this tool should the QCodeReview tool be used',
].join('\n')

/**
 * Finding severity levels
 */
export const FINDING_SEVERITY = ['Info', 'Low', 'Medium', 'High', 'Critical']

/**
 * File extensions to skip during zip creation
 */
export const SKIP_FILE_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.ico',
    '.svg', // Images
    '.mp3',
    '.wav',
    '.ogg',
    '.mp4',
    '.avi',
    '.mov', // Media
    '.zip',
    '.tar',
    '.gz',
    '.rar',
    '.7z', // Archives
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx', // Documents
    '.ttf',
    '.otf',
    '.woff',
    '.woff2', // Fonts
    '.log',
    '.tmp',
    '.temp', // Temporary files
]

/**
 * Directories to skip during zip creation
 */
export const SKIP_DIRECTORIES = [
    'node_modules',
    'dist',
    'build',
    'target',
    '.git',
    '.svn',
    '.hg',
    '.vscode',
    '.idea',
    '.vs',
    '__pycache__',
    '.pytest_cache',
    'venv',
    'env',
    '.env',
    'virtualenv',
    'coverage',
    '.nyc_output',
    'tmp',
    'temp',
]
