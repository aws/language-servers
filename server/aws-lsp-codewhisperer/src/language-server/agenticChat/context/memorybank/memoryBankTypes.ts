/**
 * Types for Memory Bank functionality
 */

export interface MemoryBankFile {
    name: string
    path: string
    content: string
    type: 'product' | 'structure' | 'tech' | 'guidelines'
}

export interface MemoryBankCreationResult {
    success: boolean
    filesCreated: MemoryBankFile[]
    error?: string
}

export interface MemoryBankProgress {
    step: string
    completed: boolean
    message: string
}

export interface ProjectAnalysis {
    fileCount: number
    directories: string[]
    configFiles: string[]
    packageJson?: any
    readmeContent?: string
    techStack: string[]
}

export interface FileStats {
    filePath: string // Semantic information about file responsibilities
    lineCount: number // Indicates code quantity and complexity
    lexicalDissimilarity: number // 0-1 score indicating uniqueness vs other files
    fileType: string // File extension and category
}

export const MEMORY_BANK_DIRECTORY = '.amazonq/rules/memory-bank'
export const MEMORY_BANK_FILES = {
    PRODUCT: 'product.md', // Contains a concise overview of the product, its purpose, and key features
    STRUCTURE: 'structure.md', // Comprehensive information about the project's organization, directory structures and architecture patterns
    TECH: 'tech.md', // Details the technology stack including programming languages, build systems, key dependencies, workflows
    GUIDELINES: 'guidelines.md', // Describes coding best practices and organizes frequent semantic code patterns discovered
} as const

export type MemoryBankFileType = keyof typeof MEMORY_BANK_FILES
