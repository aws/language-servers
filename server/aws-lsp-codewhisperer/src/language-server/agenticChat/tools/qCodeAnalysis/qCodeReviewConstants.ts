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
    // Java
    '.java': 'java',
    '.class': 'java',
    '.jar': 'java',
    '.war': 'java',
    '.ear': 'java',
    '.jsp': 'jsp',
    // JavaScript
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.jsx': 'javascript',
    // TypeScript
    '.ts': 'typescript',
    '.tsx': 'typescript',
    // C#
    '.cs': 'csharp',
    '.dll': 'dll',
    '.exe': 'exe',
    // Go
    '.go': 'go',
    // Ruby
    '.rb': 'ruby',
    // Scala
    '.scala': 'scala',
    '.sc': 'scala',
    // Python
    '.py': 'python',
    '.ipynb': 'ipynb',
    // PHP
    '.php': 'php',
    // Rust
    '.rs': 'rust',
    // Kotlin
    '.kt': 'kotlin',
    '.kts': 'kotlin',
    // SQL
    '.sql': 'sql',
    // C/C++
    '.c': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    // Shell
    '.sh': 'shell',
    '.zsh': 'shell',
    '.bash': 'shell',
    // Other languages
    '.css': 'css',
    '.lua': 'lua',
    '.m': 'objective_c',
    '.r': 'r',
    '.swift': 'swift',
    // Config files
    '.config': 'config',
    '.cfg': 'config',
    '.conf': 'config',
    '.cnf': 'config',
    '.cf': 'config',
    '.properties': 'properties',
    '.ini': 'ini',
    '.plist': 'plist',
    '.env': 'env',
    // Data formats
    '.json': 'json',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.xml': 'xml',
    '.toml': 'toml',
    // Markup
    '.md': 'markdown',
    '.rst': 'rst',
    '.html': 'html',
    '.txt': 'txt',
    '.text': 'txt',
    // Security
    '.pem': 'pem',
    '.key': 'key',
    // Infrastructure as Code
    '.tf': 'terraform',
    '.hcl': 'terraform',
}

/**
 * Tool name for QCodeReview
 */
export const Q_CODE_REVIEW_TOOL_NAME = 'qCodeReview'

/**
 * Tool description for QCodeReview
 */
export const Q_CODE_REVIEW_TOOL_DESCRIPTION = [
    'The primary tool for comprehensive code analysis and review. This tool should be used by default whenever a user requests code review, file analysis, or code examination unless explicitly instructed otherwise.',
    'This tool can be used to perform code review of full code or modified code. Modified code refers to the changes made that are not committed yet.',
    '',
    '**Use this tool when customers asks to:**',
    '- "Review this file" or "Review my code" or "Review my changes" or "Review this code" or any other similar prompt to review the code',
    '- "Examine this code" or "Check this code" or "Analyze this file/folder/workspace"',
    '- "Check my implementation" or "Look at my implementation" or "Examine this code"',
    '- "What do you think of this code?" or "Find issues in this code"',
    '- Any general code review or analysis request',
    '',
    '**Comprehensive Analysis Capabilities:**',
    '- SAST scanning — Detect security vulnerabilities in your source code, such as resource leaks, SQL injection, and cross-site scripting',
    '- Secrets detection — Prevent the exposure of sensitive or confidential information in your code',
    '- IaC issues — Evaluate the security posture of your infrastructure files',
    '- Code quality issues — Ensure your code is meeting quality, maintainability, and efficiency standards',
    '- Code deployment risks — Assess risks related to deploying code',
    '- Software composition analysis (SCA) — Evaluate third-party code',
    '',
    '**Supported Programming Languages:**',
    '- Java, Python, JavaScript, TypeScript, C#, CloudFormation, Terraform, Go, Ruby, C, C++, PHP, Rust, Kotlin, Scala, Shell, SQL',
    '',
    '**Supported File Extensions For Review**',
    `- "${Object.keys(EXTENSION_TO_LANGUAGE).join('", "')}"`,
    '',
    '**Tool start message**',
    'Before running the tool, you must inform the user that you will use Amazon Q Code Review tool for their request.',
    'Under no condition you will use the tool without informing the user.',
    '',
    '**Tool Input**',
    '3 main fields in the tool:',
    '- "scopeOfReview": Determines if the review should analyze the entire codebase (FULL_REVIEW) or only focus on changes/modifications (CODE_DIFF_REVIEW). This is a required field.',
    '- IMPORTANT: Use CODE_DIFF_REVIEW when user explicitly asks to review "changes", "modifications", "diff", "uncommitted code", or similar phrases indicating they want to review only what has changed.',
    '- Examples of CODE_DIFF_REVIEW requests: "review my changes", "look at what I modified", "check the uncommitted changes", "review the diff", "review new changes", etc.',
    '- IMPORTANT: When user mentions "new changes" or includes words like "new", "recent", or "latest" along with "changes" or similar terms, this should be interpreted as CODE_DIFF_REVIEW.',
    '- Use FULL_REVIEW for all other review requests.',
    '- "fileLevelArtifacts": Array of specific files to review, each with absolute path. Use this when reviewing individual files, not folders. Format: [{"path": "/absolute/path/to/file.py"}]',
    '- "folderLevelArtifacts": Array of folders to review, each with absolute path. Use this when reviewing entire directories, not individual files. Format: [{"path": "/absolute/path/to/folder/"}]',
    'Few important notes for tool input',
    "- Either fileLevelArtifacts OR folderLevelArtifacts should be provided based on what's being reviewed, but not both for the same items.",
    '- Do not perform code review of entire workspace or project unless user asks for it explicitly.',
    '- Ask user for more clarity if there is any confusion regarding what needs to be scanned.',
    '',
    '**Tool Output**',
    'Tool output will contain a json output containing fields - ',
    '- codeReviewId - internal code review job id ',
    '- status - code review status (Completed, Failed)',
    '- result - if the scan completes successfully, there will be message and findingsByFile',
    '  - message - contains information about the scan, can also contain some information that needs to be provided to the user',
    '  - findingsByFile - contains findings grouped by impacted file path, do not provide a summary of these findings',
    '- errorMessage - if there is any failure, it will contain cause of failure',
    '',
    '**Format to display output**',
    'The tool will generate some findings grouped by file, but you should NOT provide a summary of it to the user.',
    'UNDER NO CIRCUMSTANCE must you provide ANY summary of the tool output to the user.',
    'Use following format STRICTLY to display the result of this tool for different scenarios:',
    '- When findings are present, you must inform user that you have completed the review of {file name / folder name / workspace} and found several issues that need attention. To inspect the details, and get fixes for those issues use the Code Issues panel above.',
    '  - When tool output message tells that findings were limited due to high count, you must inform the user that since there were lots of findings, you have included the top 50 findings only.',
    '- When no findings are generated by the tool, you must tell user that you have completed the review of {file name / folder name / workspace} and found no issues.',
    '- CRITICAL: DO NOT list, enumerate, count, or summarize any findings from the tool output. The user must use the Code Issues panel to view the findings.',
].join('\n')

/**
 * Finding severity levels
 */
export const FINDING_SEVERITY = ['Info', 'Low', 'Medium', 'High', 'Critical']

/**
 * Scope of code review based on customers prompt
 */
export const FULL_REVIEW = 'FULL_REVIEW'
export const CODE_DIFF_REVIEW = 'CODE_DIFF_REVIEW'
export const SCOPE_OF_CODE_REVIEW = [FULL_REVIEW, CODE_DIFF_REVIEW]

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
