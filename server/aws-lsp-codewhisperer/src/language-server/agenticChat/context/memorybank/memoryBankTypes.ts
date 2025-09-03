/**
 * Types and constants for Memory Bank functionality
 */

export const MEMORY_BANK_DIRECTORY = '.amazonq/rules/memory-bank'
export const MEMORY_BANK_FILES = {
    PRODUCT: 'product.md', // Contains a concise overview of the product, its purpose, and key features
    STRUCTURE: 'structure.md', // Comprehensive information about the project's organization, directory structures and architecture patterns
    TECH: 'tech.md', // Details the technology stack including programming languages, build systems, key dependencies, workflows
    GUIDELINES: 'guidelines.md', // Describes coding best practices and organizes frequent semantic code patterns discovered
} as const
