/**
 * Copied from chat/contexts/triggerContext.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { MemoryBankPrompts } from './memoryBankPrompts'

// Memory Bank constants
const MEMORY_BANK_DIRECTORY = '.amazonq/rules/memory-bank'
const MEMORY_BANK_FILES = {
    PRODUCT: 'product.md',
    STRUCTURE: 'structure.md',
    TECH: 'tech.md',
    GUIDELINES: 'guidelines.md',
} as const

/**
 * Controller for Memory Bank functionality
 * Handles memory bank creation detection and prompt generation
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
     * Check if a prompt is requesting memory bank creation
     */
    isMemoryBankCreationRequest(prompt: string): boolean {
        const normalizedPrompt = prompt.toLowerCase().trim()

        const triggers = [
            'create a memory bank',
            'create memory bank',
            'generate a memory bank',
            'generate memory bank',
            'regenerate memory bank',
            'build memory bank',
            'make memory bank',
            'setup memory bank',
        ]

        return triggers.some(trigger => normalizedPrompt.includes(trigger))
    }

    /**
     * Prepare comprehensive memory bank creation prompt with all necessary input
     * This does all the programmatic work upfront and creates a single comprehensive prompt
     */
    async prepareComprehensiveMemoryBankPrompt(
        workspaceFolderUri: string,
        statusUpdateFunction: (message: string) => Promise<void>,
        llmCallFunction: (prompt: string) => Promise<string>
    ): Promise<string> {
        try {
            // Step 1: Clean directory
            await this.cleanMemoryBankDirectory(workspaceFolderUri)

            // Step 2: Send status update
            await statusUpdateFunction(
                '🔍 **Analyzing codebase structure...**\n\nScanning files and calculating similarity metrics.'
            )

            // Step 3: Execute deterministic analysis (TF-IDF)
            this.features.logging.info(`[Memory Bank] Running deterministic analysis for: ${workspaceFolderUri}`)
            const analysisResults = await this.executeGuidelinesGenerationPipeline(workspaceFolderUri)

            // Step 4: Send ranking status update
            await statusUpdateFunction(
                '📊 **Ranking important files...**\n\nUsing AI to identify the most representative files.'
            )

            // Step 5: Make LLM call for file ranking (PROMPT 1)
            this.features.logging.info(`[Memory Bank] Making LLM call for file ranking`)
            const rankingPrompt = MemoryBankPrompts.getFileRankingPrompt(analysisResults.formattedFilesString, 20)

            // Log the ranking prompt for debugging
            this.features.logging.info(`[Memory Bank] Ranking prompt created (${rankingPrompt.length} chars)`)
            this.features.logging.info(`[Memory Bank] Ranking prompt preview: ${rankingPrompt.substring(0, 300)}...`)

            const rankedFilesResponse = await llmCallFunction(rankingPrompt)

            // Log the raw LLM response
            this.features.logging.info(
                `[Memory Bank] LLM ranking response received (${rankedFilesResponse.length} chars)`
            )
            this.features.logging.info(`[Memory Bank] Raw LLM response: ${rankedFilesResponse.substring(0, 500)}...`)

            // Step 6: Parse ranked files
            let rankedFilesList: string[] = []
            try {
                // Clean the response - remove any markdown formatting or extra text
                let cleanResponse = rankedFilesResponse.trim()

                // Extract JSON array if it's wrapped in markdown or other text
                const jsonMatch = cleanResponse.match(/\[.*\]/s)
                if (jsonMatch) {
                    cleanResponse = jsonMatch[0]
                } else {
                    // Handle case where LLM returns comma-separated quoted strings without brackets
                    if (cleanResponse.includes('",') && cleanResponse.includes('"')) {
                        // Add brackets to make it a valid JSON array
                        cleanResponse = `[${cleanResponse}]`
                        this.features.logging.info(`[Memory Bank] Added brackets to LLM response for JSON parsing`)
                    }
                }

                rankedFilesList = JSON.parse(cleanResponse)
                if (!Array.isArray(rankedFilesList)) {
                    throw new Error('Invalid ranking response format - not an array')
                }

                // Validate that all items are strings (file paths)
                rankedFilesList = rankedFilesList.filter(item => typeof item === 'string' && item.length > 0)

                if (rankedFilesList.length === 0) {
                    throw new Error('No valid file paths in ranking response')
                }

                this.features.logging.info(`[Memory Bank] Successfully parsed ${rankedFilesList.length} ranked files`)
                this.features.logging.info(`[Memory Bank] LLM ranked files: ${rankedFilesList.join(', ')}`)
            } catch (error) {
                this.features.logging.warn(`[Memory Bank] Failed to parse ranking response: ${error}`)
                this.features.logging.warn(`[Memory Bank] Raw response (full): ${rankedFilesResponse}`)
                this.features.logging.info(
                    `[Memory Bank] Using fallback ranking with top ${Math.min(20, analysisResults.rankedFilesList.length)} files`
                )
                rankedFilesList = analysisResults.rankedFilesList.slice(0, 20)
                this.features.logging.info(`[Memory Bank] Fallback ranked files: ${rankedFilesList.join(', ')}`)
            }

            this.features.logging.info(
                `[Memory Bank] Final ranked file list contains ${rankedFilesList.length} files for analysis`
            )

            // Step 7: Send final status update
            const totalChunks = Math.ceil(rankedFilesList.length / 4)
            await statusUpdateFunction(
                `📝 **Generating comprehensive documentation...**\n\nCreating all 4 Memory Bank files with iterative analysis.\n\n**Agent Processing:** Processes ${rankedFilesList.length} files in chunks of 4\n${Array.from({ length: totalChunks }, (_, i) => `- Iteration ${i + 1}: Files ${i * 4 + 1}-${Math.min((i + 1) * 4, rankedFilesList.length)}   (${Math.min(4, rankedFilesList.length - i * 4)} files)`).join('\n')}\n↓`
            )

            // Step 8: Create the comprehensive prompt with ranked files (PROMPT 2)
            // Agent will read file contents iteratively using tools
            const finalPrompt = MemoryBankPrompts.getCompleteMemoryBankPrompt(rankedFilesList)
            this.features.logging.info(`[Memory Bank] Final comprehensive prompt created (${finalPrompt.length} chars)`)
            this.features.logging.info(`[Memory Bank] Final prompt preview: ${finalPrompt.substring(0, 300)}...`)

            return finalPrompt
        } catch (error) {
            this.features.logging.error(`[Memory Bank] Error in preparation: ${error}`)
            throw error
        }
    }

    /**
     * Clean memory bank directory programmatically
     */
    async cleanMemoryBankDirectory(workspaceFolderUri: string): Promise<void> {
        try {
            const memoryBankPath = `${workspaceFolderUri}/${MEMORY_BANK_DIRECTORY}`

            this.features.logging.info(`[Memory Bank] Ensuring clean directory: ${memoryBankPath}`)

            // Remove all existing memory bank files to ensure clean recreation
            const filesToRemove = ['product.md', 'structure.md', 'tech.md', 'guidelines.md']
            let removedCount = 0
            for (const fileName of filesToRemove) {
                const filePath = `${memoryBankPath}/${fileName}`
                try {
                    const exists = await this.features.workspace.fs.exists(filePath)
                    if (exists) {
                        await this.features.workspace.fs.rm(filePath)
                        this.features.logging.info(`[Memory Bank] Removed existing file: ${fileName}`)
                        removedCount++
                    } else {
                        this.features.logging.info(`[Memory Bank] File ${fileName} does not exist, skipping removal`)
                    }
                } catch (error) {
                    // Ignore errors when removing files that don't exist
                    this.features.logging.debug(`[Memory Bank] Could not remove ${fileName}: ${error}`)
                }
            }

            this.features.logging.info(`[Memory Bank] Removed ${removedCount} existing files, directory is clean`)

            // Create the directory structure using mkdir with recursive option
            await this.features.workspace.fs.mkdir(memoryBankPath, { recursive: true })

            this.features.logging.info(`[Memory Bank] Directory ready: ${memoryBankPath}`)
        } catch (error) {
            this.features.logging.error(`[Memory Bank] Failed to create directory: ${error}`)
            throw error
        }
    }

    // All unused methods removed - only the above 3 methods are needed for the current flow

    /**
     * Execute deterministic analysis and provide status updates to chat
     */
    async executePipelineWithChatUpdates(
        workspaceFolder: string,
        chatResultStream: any,
        tabId: string
    ): Promise<{
        formattedFilesString: string
        rankedFilesList: string[]
    }> {
        // Send status update to chat
        await this.sendChatUpdate(
            chatResultStream,
            tabId,
            '🔍 **Analyzing project structure...**\nDiscovering source files and calculating statistics.'
        )

        const pipelineResults = await this.executeGuidelinesGenerationPipeline(workspaceFolder)

        // Send completion update to chat
        await this.sendChatUpdate(
            chatResultStream,
            tabId,
            `✅ **Analysis complete!**\nFound ${pipelineResults.filesWithDissimilarity.length} source files. Ready to generate Memory Bank files.`
        )

        return {
            formattedFilesString: pipelineResults.formattedFilesString,
            rankedFilesList: pipelineResults.rankedFilesList,
        }
    }

    /**
     * Send status update to chat stream
     */
    private async sendChatUpdate(chatResultStream: any, tabId: string, message: string): Promise<void> {
        try {
            await chatResultStream.writeResultBlock({
                tabId,
                messageId: `memory-bank-status-${Date.now()}`,
                messageType: 'assistant-message',
                body: message,
            })
        } catch (error) {
            this.features.logging.warn(`Failed to send chat update: ${error}`)
        }
    }

    /**
     * SCIENCE DOCUMENT METHOD 1: discoverAllSourceFiles() - Programmatic file discovery
     * Equivalent to: files = get_all_files(project_location, ".java")
     */
    async discoverAllSourceFiles(
        workspaceFolderUri: string,
        extensions: string[]
    ): Promise<Array<{ path: string; size: number }>> {
        const files: Array<{ path: string; size: number }> = []

        try {
            // Recursively discover all source files
            const sourceFiles = await this.discoverSourceFiles(workspaceFolderUri, extensions)

            // Get file size for each file
            for (const filePath of sourceFiles) {
                const size = await this.calculateFileLineCount(filePath)
                files.push({ path: filePath, size })
            }

            return files
        } catch (error) {
            this.features.logging.error(`Error in getAllFiles: ${error}`)
            return []
        }
    }

    /**
     * SCIENCE DOCUMENT METHOD 2: calculateFileLineCount() - Programmatic line counting
     * Equivalent to: def get_file_size(file): return len(f.readlines())
     */
    async calculateFileLineCount(filePath: string): Promise<number> {
        try {
            const content = await this.features.workspace.fs.readFile(filePath)
            return content.split('\n').length
        } catch (error) {
            this.features.logging.error(`Error reading file ${filePath}: ${error}`)
            return 0
        }
    }

    /**
     * EXACT IMPLEMENTATION of science document's get_lexical_dissimilarity()
     */
    async calculateLexicalDissimilarity(
        files: Array<{ path: string; size: number }>
    ): Promise<Array<{ path: string; size: number; dissimilarity: number }>> {
        try {
            this.features.logging.info(
                `[TF-IDF] Processing ${files.length} files for lexical dissimilarity calculation`
            )

            // Step 1: Get the contents of each file (like Python's file reading)
            const fileContents: string[] = []
            for (const file of files) {
                try {
                    const content = await this.features.workspace.fs.readFile(file.path)
                    fileContents.push(content)
                } catch (error) {
                    this.features.logging.warn(`[TF-IDF] Could not read file ${file.path}: ${error}`)
                    fileContents.push('') // Empty content for unreadable files
                }
            }

            // Step 2: Get the TF-IDF vectors for each file (equivalent to sklearn's TfidfVectorizer)
            const tfidfMatrix = this.createTfidfMatrix(fileContents)

            // Step 3: Get the cosine similarity of each file (equivalent to sklearn's cosine_similarity)
            const cosineSimilarities = this.calculateCosineSimilarityMatrix(tfidfMatrix)

            // Step 4: Get the lexical dissimilarity of each file (1 - similarity)
            const lexicalDissimilarities: Array<{ path: string; size: number; dissimilarity: number }> = []
            for (let i = 0; i < cosineSimilarities.length; i++) {
                // Calculate mean similarity for this file with all files (including itself)
                const meanSimilarity =
                    cosineSimilarities[i].reduce((sum, sim) => sum + sim, 0) / cosineSimilarities[i].length

                // Dissimilarity = 1 - mean_similarity (exactly like Python code)
                const dissimilarity = 1 - meanSimilarity

                lexicalDissimilarities.push({
                    path: files[i].path,
                    size: files[i].size,
                    dissimilarity: Math.max(0.0, Math.min(1.0, dissimilarity)), // Ensure bounds [0,1]
                })

                this.features.logging.debug(`[TF-IDF] ${files[i].path}: dissimilarity = ${dissimilarity.toFixed(6)}`)
            }

            // Log summary statistics
            const avgDissimilarity =
                lexicalDissimilarities.reduce((sum, f) => sum + f.dissimilarity, 0) / lexicalDissimilarities.length
            this.features.logging.info(`[TF-IDF] Completed. Average dissimilarity: ${avgDissimilarity.toFixed(6)}`)

            return lexicalDissimilarities
        } catch (error) {
            this.features.logging.error(`Error in calculateLexicalDissimilarity: ${error}`)
            // Fallback to reasonable defaults if TF-IDF calculation fails
            return files.map(f => ({ ...f, dissimilarity: 0.85 }))
        }
    }

    /**
     * Create TF-IDF matrix (equivalent to sklearn's TfidfVectorizer().fit_transform())
     * Returns array of TF-IDF vectors, where each vector is a Map<term, tfidf_score>
     */
    private createTfidfMatrix(documents: string[]): Map<string, number>[] {
        // Step 1: Tokenize all documents and build vocabulary
        const tokenizedDocs = documents.map(doc => this.tokenizeDocument(doc))
        const vocabulary = new Set<string>()
        tokenizedDocs.forEach(tokens => tokens.forEach(token => vocabulary.add(token)))

        const vocabArray = Array.from(vocabulary)
        const numDocs = documents.length

        // Step 2: Calculate document frequencies (DF)
        const documentFrequencies = new Map<string, number>()
        vocabArray.forEach(term => {
            const df = tokenizedDocs.filter(tokens => tokens.includes(term)).length
            documentFrequencies.set(term, df)
        })

        // Step 3: Calculate TF-IDF for each document
        const tfidfMatrix: Map<string, number>[] = []
        for (let docIndex = 0; docIndex < numDocs; docIndex++) {
            const tokens = tokenizedDocs[docIndex]
            const tfidfVector = new Map<string, number>()

            // Calculate term frequencies for this document
            const termFrequencies = new Map<string, number>()
            tokens.forEach(token => {
                termFrequencies.set(token, (termFrequencies.get(token) || 0) + 1)
            })

            // Calculate TF-IDF for each term in vocabulary
            vocabArray.forEach(term => {
                const tf = termFrequencies.get(term) || 0
                const df = documentFrequencies.get(term) || 1
                const idf = Math.log(numDocs / df)
                const tfidf = tf * idf
                tfidfVector.set(term, tfidf)
            })

            tfidfMatrix.push(tfidfVector)
        }

        return tfidfMatrix
    }

    /**
     * Calculate cosine similarity matrix (equivalent to sklearn's cosine_similarity)
     */
    private calculateCosineSimilarityMatrix(tfidfMatrix: Map<string, number>[]): number[][] {
        const numDocs = tfidfMatrix.length
        const similarities: number[][] = []

        for (let i = 0; i < numDocs; i++) {
            const row: number[] = []
            for (let j = 0; j < numDocs; j++) {
                const similarity = this.calculateCosineSimilarity(tfidfMatrix[i], tfidfMatrix[j])
                row.push(similarity)
            }
            similarities.push(row)
        }

        return similarities
    }

    /**
     * Calculate cosine similarity between two TF-IDF vectors
     */
    private calculateCosineSimilarity(vectorA: Map<string, number>, vectorB: Map<string, number>): number {
        let dotProduct = 0
        let normA = 0
        let normB = 0

        // Get all unique terms from both vectors
        const allTerms = new Set([...vectorA.keys(), ...vectorB.keys()])

        allTerms.forEach(term => {
            const valueA = vectorA.get(term) || 0
            const valueB = vectorB.get(term) || 0

            dotProduct += valueA * valueB
            normA += valueA * valueA
            normB += valueB * valueB
        })

        // Avoid division by zero
        if (normA === 0 || normB === 0) {
            return 0
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
    }

    /**
     * Tokenize document into terms (simple whitespace + punctuation splitting)
     */
    private tokenizeDocument(document: string): string[] {
        return document
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
            .split(/\s+/) // Split on whitespace
            .filter(token => token.length > 2) // Filter out very short tokens
    }

    /**
     * Execute the complete guidelines generation pipeline (Science Document Methods 1-3)
     */
    async executeGuidelinesGenerationPipeline(workspaceFolderUri: string): Promise<{
        discoveredFiles: Array<{ path: string; size: number }>
        filesWithDissimilarity: Array<{ path: string; size: number; dissimilarity: number }>
        formattedFilesString: string
        rankedFilesList: string[]
    }> {
        try {
            this.features.logging.info(`[Science Pipeline] Starting for workspace: ${workspaceFolderUri}`)

            // Step 1: Discover all source files (Science Document Method 1)
            const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.go', '.rs']
            const discoveredFiles = await this.discoverAllSourceFiles(workspaceFolderUri, extensions)

            this.features.logging.info(`[Science Pipeline] Discovered ${discoveredFiles.length} source files`)

            // Log discovered files for debugging
            this.features.logging.info(
                `[Science Pipeline] Discovered files: ${discoveredFiles.map(f => `${f.path} (${f.size} lines)`).join(', ')}`
            )

            if (discoveredFiles.length === 0) {
                throw new Error('No source files found in workspace')
            }

            // Step 2: Calculate lexical dissimilarity (Science Document Method 3)
            const filesWithDissimilarity = await this.calculateLexicalDissimilarity(discoveredFiles)

            // Log dissimilarity results
            const avgDissimilarity =
                filesWithDissimilarity.reduce((sum, f) => sum + f.dissimilarity, 0) / filesWithDissimilarity.length
            this.features.logging.info(
                `[Science Pipeline] Lexical dissimilarity calculated. Average: ${avgDissimilarity.toFixed(6)}`
            )
            this.features.logging.info(
                `[Science Pipeline] Top 5 most dissimilar files: ${filesWithDissimilarity
                    .sort((a, b) => b.dissimilarity - a.dissimilarity)
                    .slice(0, 5)
                    .map(f => `${f.path} (${f.dissimilarity.toFixed(3)})`)
                    .join(', ')}`
            )

            // Step 3: Format files string for LLM ranking (Science Document Method 4 prep)
            const formattedFilesString = this.formatFilesForRanking(filesWithDissimilarity)

            // Log formatted string preview
            this.features.logging.info(
                `[Science Pipeline] Formatted files string created (${formattedFilesString.length} chars)`
            )
            this.features.logging.info(
                `[Science Pipeline] Formatted string preview: ${formattedFilesString.substring(0, 200)}...`
            )

            // Step 4: Create fallback ranking (deterministic, for when LLM fails)
            const rankedFilesList = filesWithDissimilarity
                .sort((a, b) => b.dissimilarity - a.dissimilarity)
                .slice(0, 20)
                .map(f => f.path)

            this.features.logging.info(
                `[Science Pipeline] Fallback ranking created with ${rankedFilesList.length} files`
            )
            this.features.logging.info(`[Science Pipeline] Fallback ranking: ${rankedFilesList.join(', ')}`)

            this.features.logging.info(`[Science Pipeline] Completed successfully`)

            return {
                discoveredFiles,
                filesWithDissimilarity,
                formattedFilesString,
                rankedFilesList,
            }
        } catch (error) {
            this.features.logging.error(`[Science Pipeline] Error: ${error}`)
            throw error
        }
    }

    /**
     * Format files for science document pipeline (like Python's files_string)
     */
    formatFilesForRanking(files: Array<{ path: string; size: number; dissimilarity: number }>): string {
        return files
            .sort((a, b) => b.size - a.size) // Sort by size like science document
            .map(
                f =>
                    `${f.path} has ${f.size} lines and a mean lexical dissimilarity of ${f.dissimilarity.toFixed(6)} to the other files`
            )
            .join('\n')
    }

    /**
     * Recursively discover source files with given extensions
     */
    private async discoverSourceFiles(workspaceFolderUri: string, extensions: string[]): Promise<string[]> {
        const sourceFiles: string[] = []

        const traverseDirectory = async (dirPath: string): Promise<void> => {
            try {
                const entries = await this.features.workspace.fs.readdir(dirPath)

                for (const entry of entries) {
                    const fullPath = `${dirPath}/${entry.name}`

                    // Skip common directories that don't contain source code
                    if (entry.isDirectory() && this.shouldSkipDirectory(entry.name)) {
                        continue
                    }

                    if (entry.isDirectory()) {
                        // Directory - recurse
                        await traverseDirectory(fullPath)
                    } else {
                        // File - check if it's a source file
                        if (extensions.some(ext => entry.name.endsWith(ext))) {
                            sourceFiles.push(fullPath)
                        }
                    }
                }
            } catch (error) {
                this.features.logging.debug(`Could not read directory ${dirPath}: ${error}`)
            }
        }

        await traverseDirectory(workspaceFolderUri)
        return sourceFiles
    }

    /**
     * Check if a directory should be skipped during source file discovery
     */
    private shouldSkipDirectory(dirName: string): boolean {
        const skipDirs = [
            'node_modules',
            '.git',
            '.svn',
            '.hg',
            'build',
            'dist',
            'out',
            'target',
            'bin',
            'obj',
            '.vscode',
            '.idea',
            '__pycache__',
            '.pytest_cache',
            'coverage',
            '.nyc_output',
            'logs',
            'tmp',
            'temp',
        ]

        return skipDirs.includes(dirName) || dirName.startsWith('.')
    }

    /**
     * Check if memory bank exists in workspace
     */
    async memoryBankExists(workspaceFolderUri: string): Promise<boolean> {
        try {
            const memoryBankPath = `${workspaceFolderUri}/${MEMORY_BANK_DIRECTORY}`
            this.features.logging.info(`[Memory Bank] Checking directory: ${memoryBankPath}`)

            const exists = await this.features.workspace.fs.exists(memoryBankPath)
            this.features.logging.info(`[Memory Bank] Directory exists: ${exists}`)
            if (!exists) {
                return false
            }

            // Check if at least one memory bank file exists
            const files = Object.values(MEMORY_BANK_FILES)
            this.features.logging.info(`[Memory Bank] Checking files: ${files.join(', ')}`)

            for (const file of files) {
                const filePath = `${memoryBankPath}/${file}`
                const fileExists = await this.features.workspace.fs.exists(filePath)
                this.features.logging.info(`[Memory Bank] File ${file} exists: ${fileExists}`)
                if (fileExists) {
                    return true
                }
            }

            this.features.logging.info(`[Memory Bank] No files found`)
            return false
        } catch (error) {
            this.features.logging.error(`Error checking memory bank existence: ${error}`)
            return false
        }
    }
}
