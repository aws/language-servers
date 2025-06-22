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
export const TOOL_NAME = 'qCodeReview'

/**
 * Tool description for QCodeReview
 */
export const TOOL_DESCRIPTION = [
    'A tool for scanning code for security vulnerabilities and code quality issues. It can be used to scan code present in a file or multiple files or a folder or multiple folders.',
    '',
    'Amazon Q Review provides comprehensive code analysis with:',
    '- Static Application Security Testing (SAST): Identifies vulnerabilities in source code without execution',
    '- Secrets Detection: Finds hardcoded credentials, API keys, tokens, and other sensitive information',
    '- Infrastructure as Code (IaC) Analysis: Detects security issues in infrastructure definitions',
    '- Software Composition Analysis (SCA): Identifies vulnerabilities in dependencies and third-party components',
    '',
    'Key capabilities include detection of:',
    '- Security vulnerabilities: Injection flaws, XSS, CSRF, insecure authentication, data exposure risks',
    '- Code quality issues: Bugs, anti-patterns, and maintainability concerns',
    '- Best practice violations: Deviations from coding standards and recommended practices',
    '- Resource leaks: Potential memory leaks and unclosed resources',
    '- Input validation problems: Missing or improper validation of user inputs',
    '',
    'Findings include:',
    '- Issue severity classification (Critical, High, Medium, Low)',
    '- Specific code locations where issues were found',
    '- References to relevant security standards and best practices',
    '',
    'Supported programming languages:',
    '- Python, JavaScript/TypeScript, Java, C#, PHP, Ruby, Go, Rust, C/C++',
    '- Shell scripts, SQL, Kotlin, Scala, Swift',
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

export const FINDINGS_MESSAGE_SUFFIX = '_qCodeReviewFindings'
