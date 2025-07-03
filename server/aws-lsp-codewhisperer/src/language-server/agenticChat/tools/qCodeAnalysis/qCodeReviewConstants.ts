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
export const Q_CODE_REVIEW_TOOL_NAME = 'qCodeReview'

/**
 * Tool description for QCodeReview
 */
export const Q_CODE_REVIEW_TOOL_DESCRIPTION = [
    'The primary tool for comprehensive code analysis and review. This tool should be used by default whenever a customer requests code review, file analysis, or code examination unless explicitly instructed otherwise.',
    '',
    'Amazon Q Code Review is your go-to solution for all code analysis needs, providing:',
    '',
    '**Default Use Cases - Use this tool when customers ask to:**',
    '- "Code review / review this file/folder/workspace" or "Review my code" or "Review my changes"',
    '- "Check this code" or "Analyze this file/folder/workspace"',
    '- "Look at my implementation" or "Examine this code"',
    '- "What do you think of this code?"',
    '- Any general code review or analysis request',
    '',
    '**Comprehensive Analysis Capabilities:**',
    '- Static Application Security Testing (SAST): Identifies vulnerabilities in source code without execution',
    '- Secrets Detection: Finds hardcoded credentials, API keys, tokens, and other sensitive information',
    '- Infrastructure as Code (IaC) Analysis: Detects security issues in infrastructure definitions',
    '- Software Composition Analysis (SCA): Identifies vulnerabilities in dependencies and third-party components',
    '',
    '**Advanced Detection Features:**',
    '- Security vulnerabilities: Injection flaws, XSS, CSRF, insecure authentication, data exposure risks',
    '- Code quality issues: Bugs, anti-patterns, and maintainability concerns',
    '- Best practice violations: Deviations from coding standards and recommended practices',
    '- Resource leaks: Potential memory leaks and unclosed resources',
    '- Input validation problems: Missing or improper validation of user inputs',
    '- Performance optimization opportunities',
    '- Code complexity and readability assessment',
    '',
    '**Supported Programming Languages:**',
    '- Python, JavaScript/TypeScript, Java, C#, PHP, Ruby, Go, Rust, C/C++, Shell scripts, SQL, Kotlin, Scala, Swift',
    '',
    '**Usage Priority:**',
    'This tool should be the DEFAULT choice for any code review request. ',
    '',
    '**Tool Output**',
    'Tool output will contain a json output containing fields - ',
    '- codeReviewId - internal code review job id ',
    '- status - code review status (Completed, Failed)',
    '- result - if the scan completes successfully, there will be message and findingsByFile',
    '  - findingsByFile - contains findings grouped by impacted file path',
    '- errorMessage - if there is any failure, it will contain cause of failure',
    '',
    '**Format to display output**',
    'Use the following format strictly to display the result of the tool for different scenarios :',
    '- When findings are present, "I have completed the review of {file name / folder name / workspace} and found several issues that need attention. To inspect the details, and get fixes for these issues use the Code Issues panel above."',
    '  - Do not provide any summary for the findings',
    '- When no findings, "I have completed the review of {file name / folder name / workspace} and found no issues. Great Job!"',
].join('\n')

/**
 * Finding severity levels
 */
export const FINDING_SEVERITY = ['Info', 'Low', 'Medium', 'High', 'Critical']

/**
 * Scope of code review based on customers prompt
 */
export const FULL_REVIEW = 'FULL_REVIEW'
export const PARTIAL_REVIEW = 'PARTIAL_REVIEW'
export const SCOPE_OF_CODE_REVIEW = [FULL_REVIEW, PARTIAL_REVIEW]

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

export const FINDINGS_MESSAGE_SUFFIX = '_qCodeReviewFindings'
