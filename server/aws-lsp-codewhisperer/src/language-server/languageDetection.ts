import { TextDocument } from '@aws/language-server-runtimes/server-interface'

export type CodewhispererLanguage =
    | 'c'
    | 'cpp'
    | 'csharp'
    | 'dart'
    | 'go'
    | 'java'
    | 'javascript'
    | 'json'
    | 'jsx'
    | 'kotlin'
    | 'lua'
    | 'php'
    | 'plaintext'
    | 'powershell'
    | 'python'
    | 'r'
    | 'ruby'
    | 'rust'
    | 'scala'
    | 'shell'
    | 'sql'
    | 'swift'
    | 'systemverilog'
    | 'tf'
    | 'tsx'
    | 'typescript'
    | 'vue'
    | 'yaml'

// This will be extended as more language features
// are integrated into the language server and clients.
// See: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/specification/#textDocumentItem
const supportedFileTypes: CodewhispererLanguage[] = [
    'c',
    'cpp',
    'csharp',
    'dart',
    'go',
    'java',
    'javascript',
    'json',
    'jsx',
    'kotlin',
    'lua',
    'php',
    'powershell',
    'python',
    'r',
    'ruby',
    'rust',
    'scala',
    'shell',
    'sql',
    'swift',
    'systemverilog',
    'tf',
    'typescript',
    'vue',
    'yaml',
]

export const supportedSecurityScanLanguages: CodewhispererLanguage[] = ['csharp']

export const languageByExtension: { [key: string]: CodewhispererLanguage } = {
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.dart': 'dart',
    '.h': 'c',
    '.hcl': 'tf',
    '.hpp': 'cpp',
    '.go': 'go',
    '.java': 'java',
    '.js': 'javascript',
    '.json': 'json',
    '.jsx': 'jsx',
    '.kt': 'kotlin',
    '.kts': 'kotlin',
    '.lua': 'lua',
    '.php': 'php',
    '.ps1': 'powershell',
    '.psm1': 'powershell',
    '.py': 'python',
    '.r': 'r',
    '.rb': 'ruby',
    '.rs': 'rust',
    '.sc': 'scala',
    '.scala': 'scala',
    '.sh': 'shell',
    '.sql': 'sql',
    '.sv': 'systemverilog',
    '.svh': 'systemverilog',
    '.swift': 'swift',
    '.tf': 'tf',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.vh': 'systemverilog',
    '.vue': 'vue',
    '.wlua': 'lua',
    '.yaml': 'yaml',
    '.yml': 'yaml',
}

// some are exact match and some like javascriptreact and shellscript are not
export const qLanguageIdByDocumentLanguageId: { [key: string]: CodewhispererLanguage } = {
    c: 'c',
    cpp: 'cpp',
    csharp: 'csharp',
    dart: 'dart',
    go: 'go',
    java: 'java',
    javascript: 'javascript',
    javascriptreact: 'jsx',
    json: 'json',
    jsx: 'jsx',
    kotlin: 'kotlin',
    lua: 'lua',
    powershell: 'powershell',
    php: 'php',
    python: 'python',
    r: 'r',
    ruby: 'ruby',
    rust: 'rust',
    scala: 'scala',
    shell: 'shell',
    shellscript: 'shell',
    sql: 'sql',
    swift: 'swift',
    systemverilog: 'systemverilog',
    tf: 'tf',
    terraform: 'tf',
    typescript: 'typescript',
    typescriptreact: 'tsx',
    vue: 'vue',
    yaml: 'yaml',
    yml: 'yaml',
}

export const getSupportedLanguageId = (
    textDocument: TextDocument | undefined,
    supportedLanguageIds: CodewhispererLanguage[] = supportedFileTypes
): CodewhispererLanguage | undefined => {
    if (!textDocument) {
        return
    }

    const languageId = getLanguageId(textDocument)

    return languageId && supportedLanguageIds.includes(languageId) ? languageId : undefined
}

export const getLanguageId = (textDocument: TextDocument | undefined): CodewhispererLanguage | undefined => {
    if (!textDocument) {
        return undefined
    }

    return (
        getCodeWhispererLanguageIdByTextDocumentLanguageId(textDocument.languageId) ||
        getCodeWhispererLanguageIdByExtension(textDocument)
    )
}

/**
 * Used to map different IDE values for TextDocument languageIds to CodeWhisperer languageIds.
 * Examples of the CodeWhisperer defined language ids can be found in service-2.json, near "ProgrammingLanguageLanguageNameString"
 * @param textDocumentLanguageId Value of the TextDocument's language id, provided by the IDE
 * @returns Corresponding CodeWhisperer language id
 */
function getCodeWhispererLanguageIdByTextDocumentLanguageId(
    textDocumentLanguageId: CodewhispererLanguage | string
): CodewhispererLanguage | undefined {
    if (textDocumentLanguageId === undefined) {
        return undefined
    } else if (qLanguageIdByDocumentLanguageId[textDocumentLanguageId]) {
        return qLanguageIdByDocumentLanguageId[textDocumentLanguageId]
    }

    // IDEs can identify a file's languageId using non-standardized values
    // Eg: 'CSHARP', 'CSharp' => 'csharp'
    // Try to map case-insensitive matches to increase the likelihood of supporting the file in an IDE.
    for (const [languageId, cwprLanguageId] of Object.entries(qLanguageIdByDocumentLanguageId)) {
        if (textDocumentLanguageId.toLowerCase() === languageId.toLowerCase()) {
            return cwprLanguageId
        }
    }

    return undefined
}

function getCodeWhispererLanguageIdByExtension(textDocument: TextDocument) {
    for (const [extension, languageId] of Object.entries(languageByExtension)) {
        if (textDocument.uri.endsWith(extension)) {
            return languageId
        }
    }

    return undefined
}
