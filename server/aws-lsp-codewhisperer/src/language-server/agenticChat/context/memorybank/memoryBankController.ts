import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { MemoryBankPrompts } from './prompts/memoryBankPrompts'
import { MemoryBankCreationResult, MEMORY_BANK_DIRECTORY, MEMORY_BANK_FILES } from './memoryBankTypes'
import * as path from 'path'

/**
 * Controller for Memory Bank functionality
 * Follows singleton pattern for consistent access
 */
export class MemoryBankController {
    private static instance: MemoryBankController | undefined

    constructor(private features: Features) {}

    /**
     * Get singleton instance of MemoryBankController
     */
    static getInstance(features: Features): MemoryBankController {
        if (!MemoryBankController.instance) {
            MemoryBankController.instance = new MemoryBankController(features)
        }
        return MemoryBankController.instance
    }

    /**
     * Check if memory bank files exist in the project
     */
    async memoryBankExists(workspaceFolder: string): Promise<boolean> {
        try {
            const memoryBankPath = path.join(workspaceFolder, MEMORY_BANK_DIRECTORY)
            const exists = await this.features.workspace.fs.exists(memoryBankPath)

            if (!exists) {
                return false
            }

            // Check if at least one memory bank file exists
            const files = Object.values(MEMORY_BANK_FILES)
            for (const file of files) {
                const filePath = path.join(memoryBankPath, file)
                const fileExists = await this.features.workspace.fs.exists(filePath)
                if (fileExists) {
                    return true
                }
            }

            return false
        } catch (error) {
            this.features.logging.error(`Error checking memory bank existence: ${error}`)
            return false
        }
    }

    /**
     * Get the comprehensive memory bank creation prompt
     */
    getMemoryBankCreationPrompt(): string {
        return MemoryBankPrompts.getMemoryBankCreationPrompt()
    }

    /**
     * Create memory bank directory structure
     */
    async createMemoryBankDirectory(workspaceFolder: string): Promise<boolean> {
        try {
            const memoryBankPath = path.join(workspaceFolder, MEMORY_BANK_DIRECTORY)

            // Create .amazonq directory if it doesn't exist
            const amazonqPath = path.join(workspaceFolder, '.amazonq')
            const amazonqExists = await this.features.workspace.fs.exists(amazonqPath)
            if (!amazonqExists) {
                await this.features.workspace.fs.mkdir(amazonqPath)
            }

            // Create rules directory if it doesn't exist
            const rulesPath = path.join(workspaceFolder, '.amazonq', 'rules')
            const rulesExists = await this.features.workspace.fs.exists(rulesPath)
            if (!rulesExists) {
                await this.features.workspace.fs.mkdir(rulesPath)
            }

            // Create memory-bank directory if it doesn't exist
            const memoryBankExists = await this.features.workspace.fs.exists(memoryBankPath)
            if (!memoryBankExists) {
                await this.features.workspace.fs.mkdir(memoryBankPath)
            }

            return true
        } catch (error) {
            this.features.logging.error(`Error creating memory bank directory: ${error}`)
            return false
        }
    }

    /**
     * Validate memory bank creation result
     */
    async validateMemoryBankCreation(workspaceFolder: string): Promise<MemoryBankCreationResult> {
        try {
            const memoryBankPath = path.join(workspaceFolder, MEMORY_BANK_DIRECTORY)
            const filesCreated = []
            const errors = []

            // Check each expected file
            for (const [type, fileName] of Object.entries(MEMORY_BANK_FILES)) {
                const filePath = path.join(memoryBankPath, fileName)
                const exists = await this.features.workspace.fs.exists(filePath)

                if (exists) {
                    try {
                        const content = await this.features.workspace.fs.readFile(filePath)
                        filesCreated.push({
                            name: fileName,
                            path: filePath,
                            content: content.toString(),
                            type: type.toLowerCase() as any,
                        })
                    } catch (readError) {
                        errors.push(`Failed to read ${fileName}: ${readError}`)
                    }
                } else {
                    errors.push(`File ${fileName} was not created`)
                }
            }

            return {
                success: filesCreated.length > 0,
                filesCreated,
                error: errors.length > 0 ? errors.join('; ') : undefined,
            }
        } catch (error) {
            return {
                success: false,
                filesCreated: [],
                error: `Validation failed: ${error}`,
            }
        }
    }

    /**
     * Get memory bank file paths for a workspace
     */
    getMemoryBankFilePaths(workspaceFolder: string): string[] {
        const memoryBankPath = path.join(workspaceFolder, MEMORY_BANK_DIRECTORY)
        return Object.values(MEMORY_BANK_FILES).map(fileName => path.join(memoryBankPath, fileName))
    }

    /**
     * Log progress update for memory bank creation
     */
    logProgress(step: string, message: string, completed: boolean = false): void {
        const status = completed ? '✅' : '🔄'
        this.features.logging.info(`[Memory Bank] ${status} ${step}: ${message}`)
    }

    /**
     * Check if a prompt is requesting memory bank creation
     */
    isMemoryBankCreationRequest(prompt: string): boolean {
        const normalizedPrompt = prompt.toLowerCase().trim()

        const triggers = [
            'create a memory bank',
            'create memory bank',
            'generate memory bank',
            'build memory bank',
            'make memory bank',
            'setup memory bank',
        ]

        return triggers.some(trigger => normalizedPrompt.includes(trigger))
    }

    /**
     * Get summary of memory bank files for user feedback
     */
    getMemoryBankSummary(): string {
        return `📁 Memory Bank files will be created in .amazonq/rules/memory-bank/:
   • ${MEMORY_BANK_FILES.PRODUCT} - Concise overview of the product, its purpose, and key features
   • ${MEMORY_BANK_FILES.STRUCTURE} - Project organization, directory structures and architecture patterns
   • ${MEMORY_BANK_FILES.TECH} - Technology stack, build systems, dependencies, and development workflows
   • ${MEMORY_BANK_FILES.GUIDELINES} - Coding best practices and frequent semantic code patterns discovered

🧠 These files will appear in your Rules UI and can be toggled on/off like other rules files!`
    }

    /**
     * Get the memory bank folder name for rules state management
     */
    getMemoryBankFolderName(): string {
        return '.amazonq/rules/memory-bank'
    }
}
