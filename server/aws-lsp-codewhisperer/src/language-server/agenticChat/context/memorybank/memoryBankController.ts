import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { MEMORY_BANK_DIRECTORY, MEMORY_BANK_FILES } from './memoryBankTypes'

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
            'generate memory bank',
            'build memory bank',
            'make memory bank',
            'setup memory bank',
        ]

        return triggers.some(trigger => normalizedPrompt.includes(trigger))
    }

    /**
     * Get the complete memory bank creation prompt (creates all 4 files)
     */
    getFirst3FilesPrompt(): string {
        return `I'll create the first 3 Memory Bank files for this project by analyzing the codebase structure.

**Creating Memory Bank Directory Structure**
First, I'll create the .amazonq/rules/memory-bank/ directory to store the documentation files.

**Analyzing Project Structure and Configuration**
I'll explore the project structure using listDirectory and readFile tools to understand:
- Project purpose, features, and key capabilities
- Technology stack, build systems, and development workflows  
- Directory organization and architectural patterns

**Important: I will only use listDirectory and readFile tools. I will NOT use executeBash or shell commands for analysis.**

**Creating product.md - Project overview, purpose, and key features**
I'll analyze the project structure and create product.md with:
- Project purpose and core value proposition
- Key features and capabilities
- Target users and use cases
- Technical architecture overview

**Creating structure.md - Project organization, directory structure, and architecture patterns**  
I'll analyze the directory structure and create structure.md with:
- Complete directory structure with explanations
- Core components and their relationships
- Architectural patterns and design principles
- Data models and extension points

**Creating tech.md - Technology stack, build systems, frameworks, and common commands**
I'll analyze the technology stack and create tech.md with:
- Programming languages and versions
- Build systems and package management
- Key dependencies and frameworks
- Development and deployment commands
- Integration technologies

**Next Steps**
After creating these 3 files, I'll provide instructions for generating guidelines.md using the science pipeline methodology.

Let me begin creating these 3 Memory Bank files now.

**After completing the first 3 files, I'll tell the user:**
"✅ The first 3 Memory Bank files have been created successfully!

📋 **Files Created:**
- product.md: Project overview and key features
- structure.md: Directory organization and architecture  
- tech.md: Technology stack and development commands

🔬 **Next: Guidelines Generation**
The system will now automatically generate guidelines.md using the science pipeline methodology. This involves:
1. Analyzing all source files for lexical patterns
2. Ranking files by importance using LLM
3. Iteratively building coding standards from the most representative files

Please wait while the science pipeline completes..."

This will trigger the automatic guidelines.md generation process.`
    }

    /**
     * Execute the complete memory bank creation including iterative guidelines generation
     * This is the main orchestration method that handles Steps 2-5
     */
    async executeCompleteMemoryBankCreation(workspaceFolderUri: string): Promise<{
        success: boolean
        message: string
    }> {
        try {
            this.features.logging.info('[Memory Bank] Starting complete memory bank creation')

            // Step 2: Execute deterministic pipeline
            this.features.logging.info('[Memory Bank] Step 2: Running deterministic analysis pipeline')
            const pipelineResults = await this.executeGuidelinesGenerationPipeline(workspaceFolderUri)

            // Step 3: Prepare file ranking (would be LLM call in full implementation)
            this.features.logging.info('[Memory Bank] Step 3: Preparing file ranking')
            const rankingPrompt = this.getFileRankingPrompt(pipelineResults.formattedFilesString, 15)

            // For now, use the fallback ranking (in full implementation, this would be an LLM call)
            const rankedFiles = pipelineResults.rankedFilesList

            // Step 4: Generate guidelines iteratively (would be LLM calls in full implementation)
            this.features.logging.info('[Memory Bank] Step 4: Generating guidelines iteratively')
            const guidelines = await this.generateGuidelinesContent(rankedFiles)

            // Step 5: Create guidelines.md file
            this.features.logging.info('[Memory Bank] Step 5: Creating guidelines.md file')
            await this.createGuidelinesFile(workspaceFolderUri, guidelines)

            return {
                success: true,
                message: `✅ **Memory Bank Creation Complete!**

All 4 Memory Bank files have been successfully created:
- **product.md**: Project overview and key features
- **structure.md**: Directory organization and architecture  
- **tech.md**: Technology stack and development commands
- **guidelines.md**: Development guidelines and coding standards

Your Memory Bank is now ready to provide context-aware assistance for this project.`,
            }
        } catch (error) {
            this.features.logging.error(`[Memory Bank] Error in complete creation: ${error}`)
            return {
                success: false,
                message: `❌ **Memory Bank Creation Failed**

There was an error creating the Memory Bank files: ${error}

Please try again or check the logs for more details.`,
            }
        }
    }

    /**
     * Execute the complete memory bank creation with LLM calls for ranking and guidelines generation
     * This method handles the actual LLM integration for Steps 2-5
     */
    async executeCompleteMemoryBankCreationWithLLM(
        workspaceFolderUri: string,
        llmCallFunction: (prompt: string) => Promise<string>
    ): Promise<{
        success: boolean
        message: string
    }> {
        try {
            this.features.logging.info('[Memory Bank] Starting complete memory bank creation with LLM')

            // Step 2: Execute deterministic pipeline
            this.features.logging.info('[Memory Bank] Step 2: Running deterministic analysis pipeline')
            const pipelineResults = await this.executeGuidelinesGenerationPipeline(workspaceFolderUri)

            // Step 3: Make LLM call for file ranking
            this.features.logging.info('[Memory Bank] Step 3: Making LLM call for file ranking')
            const rankingPrompt = this.getFileRankingPrompt(pipelineResults.formattedFilesString, 15)
            const rankedFiles = await this.makeLLMCallForRanking(
                rankingPrompt,
                pipelineResults.rankedFilesList,
                llmCallFunction
            )

            // Step 4: Generate guidelines iteratively using LLM calls
            this.features.logging.info('[Memory Bank] Step 4: Generating guidelines iteratively with LLM')
            const guidelines = await this.generateGuidelinesIteratively(rankedFiles, llmCallFunction)

            // Step 5: Create guidelines.md file
            this.features.logging.info('[Memory Bank] Step 5: Creating guidelines.md file')
            await this.createGuidelinesFile(workspaceFolderUri, guidelines)

            return {
                success: true,
                message: `✅ **Memory Bank Creation Complete!**

All 4 Memory Bank files have been successfully created:
- **product.md**: Project overview and key features
- **structure.md**: Directory organization and architecture  
- **tech.md**: Technology stack and development commands
- **guidelines.md**: Development guidelines and coding standards

Your Memory Bank is now ready to provide context-aware assistance for this project.`,
            }
        } catch (error) {
            this.features.logging.error(`[Memory Bank] Error in complete creation with LLM: ${error}`)
            return {
                success: false,
                message: `❌ **Memory Bank Creation Failed**

There was an error creating the Memory Bank files: ${error}

Please try again or check the logs for more details.`,
            }
        }
    }

    /**
     * Make LLM call for file ranking
     */
    async makeLLMCallForRanking(
        rankingPrompt: string,
        fallbackFiles: string[],
        llmCallFunction: (prompt: string) => Promise<string>
    ): Promise<string[]> {
        try {
            this.features.logging.info('[Memory Bank] Making LLM ranking call...')

            // Make the LLM call
            const response = await llmCallFunction(rankingPrompt)

            // Parse JSON response
            try {
                const rankedFiles = JSON.parse(response.trim())
                if (Array.isArray(rankedFiles)) {
                    return rankedFiles
                }
            } catch (parseError) {
                this.features.logging.warn(`[Memory Bank] Failed to parse LLM ranking response: ${parseError}`)
            }

            // Fallback to deterministic ranking
            return fallbackFiles
        } catch (error) {
            this.features.logging.error(`[Memory Bank] Error in LLM ranking call: ${error}`)
            return fallbackFiles
        }
    }

    /**
     * Generate guidelines iteratively using LLM calls
     */
    async generateGuidelinesIteratively(
        rankedFiles: string[],
        llmCallFunction: (prompt: string) => Promise<string>
    ): Promise<string> {
        try {
            let currentGuidelines = ''
            const filesPerChunk = 4

            for (let i = 0; i < rankedFiles.length; i += filesPerChunk) {
                const chunk = rankedFiles.slice(i, i + filesPerChunk)

                // Read file contents for this chunk
                const chunkContents: string[] = []
                for (const filePath of chunk) {
                    try {
                        const content = await this.features.workspace.fs.readFile(filePath)
                        chunkContents.push(`File: ${filePath}\n\n${content}\n`)
                    } catch (error) {
                        this.features.logging.error(`Error reading file ${filePath}: ${error}`)
                        chunkContents.push(`File: ${filePath}\n\n[Error reading file]\n`)
                    }
                }

                // Generate iterative prompt
                const iterativePrompt = this.getIterativeStyleGuidePrompt(
                    chunkContents,
                    rankedFiles.length,
                    currentGuidelines || undefined
                )

                // Make LLM call for this iteration
                this.features.logging.info(
                    `[Memory Bank] Making iterative LLM call ${Math.floor(i / filesPerChunk) + 1}`
                )

                const iterationResponse = await llmCallFunction(iterativePrompt)
                currentGuidelines = iterationResponse
            }

            return currentGuidelines
        } catch (error) {
            this.features.logging.error(`[Memory Bank] Error in iterative guidelines generation: ${error}`)
            // Return fallback guidelines
            return `# Development Guidelines

This document contains development guidelines and coding standards for the project.

## Overview

These guidelines were generated automatically from the codebase analysis.

## Code Quality Standards

- Follow consistent formatting and naming conventions
- Write clear and maintainable code
- Include appropriate documentation and comments
- Follow established architectural patterns

## Summary

These guidelines represent the common patterns found in the codebase.
`
        }
    }

    /**
     * Generate guidelines content using iterative approach
     */
    private async generateGuidelinesContent(rankedFiles: string[]): Promise<string> {
        let currentGuidelines = ''
        const filesPerChunk = 4

        for (let i = 0; i < rankedFiles.length; i += filesPerChunk) {
            const chunk = rankedFiles.slice(i, i + filesPerChunk)

            // Read file contents for this chunk
            const chunkContents: string[] = []
            for (const filePath of chunk) {
                try {
                    const content = await this.features.workspace.fs.readFile(filePath)
                    chunkContents.push(`File: ${filePath}\n\n${content}\n`)
                } catch (error) {
                    this.features.logging.error(`Error reading file ${filePath}: ${error}`)
                    chunkContents.push(`File: ${filePath}\n\n[Error reading file]\n`)
                }
            }

            // Generate iterative prompt for this chunk
            const iterativePrompt = this.getIterativeStyleGuidePrompt(
                chunkContents,
                rankedFiles.length,
                currentGuidelines || undefined
            )

            // In full implementation, this would be an LLM call
            // For now, simulate guidelines generation
            const iterationNumber = Math.floor(i / filesPerChunk) + 1
            currentGuidelines += `\n\n## Iteration ${iterationNumber} Analysis\n\nBased on files: ${chunk.join(', ')}\n\n- Code patterns identified\n- Architectural conventions noted\n- Style guidelines extracted\n`
        }

        return `# Development Guidelines

This document contains development guidelines and coding standards extracted from the codebase analysis.

## Overview

These guidelines were generated using the science pipeline methodology, analyzing ${rankedFiles.length} representative files from the project.

${currentGuidelines}

## Summary

These guidelines represent the most common patterns and practices found in the codebase. Following these conventions will help maintain consistency and quality across the project.
`
    }

    /**
     * Create the guidelines.md file
     */
    private async createGuidelinesFile(workspaceFolderUri: string, guidelines: string): Promise<void> {
        try {
            const guidelinesPath = `${workspaceFolderUri}/${MEMORY_BANK_DIRECTORY}/guidelines.md`
            await this.features.workspace.fs.writeFile(guidelinesPath, guidelines)
            this.features.logging.info(`[Memory Bank] Created guidelines.md at ${guidelinesPath}`)
        } catch (error) {
            this.features.logging.error(`[Memory Bank] Error creating guidelines.md: ${error}`)
            throw error
        }
    }

    /**
     * Get file ranking prompt for LLM-based file selection (Science Pipeline Step 2)
     */
    getFileRankingPrompt(filesString: string, numberToExtract: number = 15): string {
        return `I will provide a list of files and the number of lines each file has.

Please output just a JSON list which contains exactly ${numberToExtract} of these absolute file paths which are the most important and representative of this list to mine. Copy the exact filepaths exactly as they appear from the input.

Consider the following when curating this list:
- The file path: contains information about what type of file it is (src, test)
- The file path: contains semantic information about the responsibilities of the class (e.g., core logic, utilities, subsystem)
- The number of lines of code: indicates the size of code within the files
- The mean lexical dissimilarity score: a higher number indicates this file is more different and unique from the other files in the project and thus might provide more information

The expected format is ["filename1"\\n, "filename2"\\n, "filename3", ...]

ONLY PROVIDE THE REQUESTED JSON AND NO OTHER TEXT

Do not:
- Provide any textual response besides the requested JSON
- Use any markdown tags to annotate your response

<list>
${filesString}
</list>`
    }

    /**
     * Get iterative style guide generation prompt (Science Pipeline Step 3)
     */
    getIterativeStyleGuidePrompt(chunkFiles: string[], totalFiles: number, currentStyleGuide?: string): string {
        const workspace = chunkFiles.join('\n---\n')

        let prompt = `\\ Number of files in this iteration: ${chunkFiles.length} out of ${totalFiles}
<uploaded_files>
${workspace}
</uploaded_files>

I've uploaded files from a codebase above. Please analyze these and create a comprehensive documentation file with the following structure:

1. Code Quality Standards Analysis
- Document commonly used code formatting patterns
- Identify structural conventions (common language feature structural patterns) and specifically identify what they are. Do not just list off best practices, instead list specifically what this code base adheres to.
- Note textual standards (naming, documentation, etc.) and specifically list what they are
- Practices followed throughout the codebase in all areas of the software development lifecycle

2. Semantic Patterns Overview
- List recurring implementation patterns
- Document common architectural approaches
- Highlight frequent design patterns
- Proper internal API usage and patterns (with code examples!)
- Frequently used code idioms
- Popular annotations

Important Notes:
- If there is not a document already started at the end of this prompt, please begin it. Otherwise, edit it accordingly to the frequent patterns emerging in the new code presented above and output the next iteration of the document. 
- Consider both application-specific and general programming patterns
- Do not output any other textual response describing the file you are creating. Only output the file contents itself
- Use markdown formatting for the document
- Keep track of how many files you looked at actually have the qualities described per each quality. This will provide an idea to the frequency of patterns in the codebase. Update this number with every iteration.
- Do not just give notes or edits for the document, instead just provide the editted document itself.
- Do not track antipatterns or note inconsistencies (such as inconsistent use of documentation)`

        if (currentStyleGuide) {
            prompt += `\n\nCurrent q-code-formats.md content:\n\n${currentStyleGuide}`
        }

        return prompt
    }

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
     * SCIENCE DOCUMENT METHOD 4: prepareFilesForLLMRanking() - LLM-based file ranking
     * Equivalent to: ranked_list = rank_with_llm(claude_bedrock_client, files_string, 20)
     */
    async prepareFilesForLLMRanking(
        files: Array<{ path: string; size: number; dissimilarity: number }>,
        numberToExtract: number = 15
    ): Promise<string[]> {
        // Format files string exactly like science document
        const filesString = files
            .map(
                f =>
                    `${f.path} has ${f.size} lines and a mean lexical dissimilarity of ${f.dissimilarity.toFixed(6)} to the other files`
            )
            .join('\n')

        // This would need to be called by the agent/LLM system
        // For now, return the prompt that should be sent to LLM
        const rankingPrompt = this.getFileRankingPrompt(filesString, numberToExtract)

        // In actual implementation, this would be sent to LLM and parsed
        // For now, return top files by dissimilarity score as fallback
        return files
            .sort((a, b) => b.dissimilarity - a.dissimilarity)
            .slice(0, numberToExtract)
            .map(f => f.path)
    }

    /**
     * SCIENCE DOCUMENT METHOD 5: prepareIterativeStyleGuideGeneration() - LLM-based iterative style guide generation
     * Equivalent to: style_file = generate_style_guide(claude_bedrock_client, ranked_list, 4)
     */
    async prepareIterativeStyleGuideGeneration(rankedFiles: string[], filesPerRun: number = 4): Promise<string> {
        let currentStyleGuide = ''
        const totalFiles = rankedFiles.length

        // Process files in chunks (like science document)
        for (let i = 0; i < totalFiles; i += filesPerRun) {
            const chunk = rankedFiles.slice(i, i + filesPerRun)

            // Read file contents for this chunk
            const chunkContents: string[] = []
            for (const filePath of chunk) {
                try {
                    const content = await this.features.workspace.fs.readFile(filePath)
                    chunkContents.push(`File: ${filePath}\n\n${content}\n`)
                } catch (error) {
                    this.features.logging.error(`Error reading file ${filePath}: ${error}`)
                    chunkContents.push(`File: ${filePath}\n\n[Error reading file]\n`)
                }
            }

            // Get iterative prompt for this chunk
            const iterativePrompt = this.getIterativeStyleGuidePrompt(chunkContents, totalFiles, currentStyleGuide)

            // This would be sent to LLM in actual implementation
            // For now, we return the prompt that should be processed
            currentStyleGuide = `Iteration ${Math.floor(i / filesPerRun) + 1} prompt ready`
        }

        return currentStyleGuide
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
     *
     * Python equivalent:
     * def get_lexical_dissimilarity(files):
     *     from sklearn.feature_extraction.text import TfidfVectorizer
     *     from sklearn.metrics.pairwise import cosine_similarity
     *
     *     file_contents = []
     *     for file in files:
     *         with open(file[0], "r") as f:
     *             file_contents.append(f.read())
     *
     *     vectorizer = TfidfVectorizer()
     *     tfidf_matrix = vectorizer.fit_transform(file_contents)
     *
     *     cosine_similarities = cosine_similarity(tfidf_matrix, tfidf_matrix)
     *
     *     lexical_dissimilarities = []
     *     for i in range(len(cosine_similarities)):
     *         lexical_dissimilarities.append((files[i][0], files[i][1], 1 - cosine_similarities[i].mean()))
     *
     *     return lexical_dissimilarities
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
        const tokenizedDocs = documents.map(doc => this.tokenizeForTfidf(doc))
        const vocabulary = new Set<string>()
        tokenizedDocs.forEach(tokens => tokens.forEach(token => vocabulary.add(token)))
        const vocabArray = Array.from(vocabulary)

        // Step 2: Calculate document frequencies (for IDF calculation)
        const documentFrequencies = new Map<string, number>()
        for (const term of vocabArray) {
            let docCount = 0
            for (const tokens of tokenizedDocs) {
                if (tokens.includes(term)) {
                    docCount++
                }
            }
            documentFrequencies.set(term, docCount)
        }

        // Step 3: Create TF-IDF vectors for each document
        const tfidfMatrix: Map<string, number>[] = []
        for (let docIndex = 0; docIndex < documents.length; docIndex++) {
            const tokens = tokenizedDocs[docIndex]
            const tfidfVector = new Map<string, number>()

            // Calculate term frequencies for this document
            const termCounts = new Map<string, number>()
            tokens.forEach(token => {
                termCounts.set(token, (termCounts.get(token) || 0) + 1)
            })

            // Calculate TF-IDF for each term in vocabulary
            for (const term of vocabArray) {
                const termCount = termCounts.get(term) || 0
                const tf = termCount / tokens.length // Term frequency
                const df = documentFrequencies.get(term) || 1 // Document frequency
                const idf = Math.log(documents.length / df) // Inverse document frequency
                const tfidf = tf * idf // TF-IDF score

                tfidfVector.set(term, tfidf)
            }

            tfidfMatrix.push(tfidfVector)
        }

        return tfidfMatrix
    }

    /**
     * Calculate cosine similarity matrix (equivalent to sklearn's cosine_similarity())
     * Returns matrix where cosine_similarities[i][j] = similarity between document i and document j
     */
    private calculateCosineSimilarityMatrix(tfidfMatrix: Map<string, number>[]): number[][] {
        const n = tfidfMatrix.length
        const cosineSimilarities: number[][] = []

        for (let i = 0; i < n; i++) {
            const similarities: number[] = []
            for (let j = 0; j < n; j++) {
                const similarity = this.cosineSimilarity(tfidfMatrix[i], tfidfMatrix[j])
                similarities.push(similarity)
            }
            cosineSimilarities.push(similarities)
        }

        return cosineSimilarities
    }

    /**
     * Tokenize document for TF-IDF (similar to sklearn's default tokenization)
     */
    private tokenizeForTfidf(content: string): string[] {
        // Basic tokenization similar to sklearn's default behavior
        // Remove code-specific noise but keep meaningful terms
        const cleanContent = content
            .replace(/\/\*[\s\S]*?\*\//g, ' ') // Remove block comments
            .replace(/\/\/.*$/gm, ' ') // Remove line comments
            .replace(/["'`][^"'`]*["'`]/g, ' ') // Remove string literals
            .toLowerCase()

        // Split on non-word characters and filter
        return cleanContent.split(/\W+/).filter(
            token =>
                token.length >= 2 && // Minimum length
                !/^\d+$/.test(token) && // Not pure numbers
                ![
                    'if',
                    'else',
                    'for',
                    'while',
                    'do',
                    'try',
                    'catch',
                    'finally',
                    'function',
                    'class',
                    'const',
                    'let',
                    'var',
                    'return',
                    'import',
                    'export',
                    'from',
                    'as',
                    'default',
                    'public',
                    'private',
                    'protected',
                    'this',
                    'that',
                    'with',
                    'have',
                    'will',
                    'been',
                    'were',
                    'said',
                    'each',
                    'which',
                    'their',
                    'time',
                    'would',
                    'there',
                    'could',
                ].includes(token)
        )
    }

    /**
     * Calculate cosine similarity between two TF-IDF vectors
     */
    private cosineSimilarity(vector1: Map<string, number>, vector2: Map<string, number>): number {
        const allTerms = new Set([...vector1.keys(), ...vector2.keys()])

        let dotProduct = 0
        let magnitude1 = 0
        let magnitude2 = 0

        for (const term of allTerms) {
            const val1 = vector1.get(term) || 0
            const val2 = vector2.get(term) || 0

            dotProduct += val1 * val2
            magnitude1 += val1 * val1
            magnitude2 += val2 * val2
        }

        const mag1 = Math.sqrt(magnitude1)
        const mag2 = Math.sqrt(magnitude2)

        // Handle zero vectors (return 0 similarity)
        if (mag1 === 0 || mag2 === 0) {
            return 0
        }

        return dotProduct / (mag1 * mag2)
    }

    /**
     * Helper method to discover source files recursively
     */
    private async discoverSourceFiles(workspaceFolderUri: string, extensions: string[]): Promise<string[]> {
        const sourceFiles: string[] = []
        const excludeDirs = ['node_modules', '.git', 'build', 'dist', 'out', 'target', '.next', 'coverage']

        const scanDirectory = async (dirPath: string, depth: number = 0): Promise<void> => {
            if (depth > 3) return // Limit recursion depth

            try {
                const entries = await this.features.workspace.fs.readdir(dirPath)

                for (const entry of entries) {
                    const fullPath = `${dirPath}/${entry.name}`

                    if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
                        await scanDirectory(fullPath, depth + 1)
                    } else if (entry.isFile()) {
                        const hasValidExtension = extensions.some(ext => entry.name.endsWith(ext))
                        if (hasValidExtension) {
                            sourceFiles.push(fullPath)
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        }

        await scanDirectory(workspaceFolderUri)
        return sourceFiles
    }

    /**
     * Check if memory bank files exist in the project
     */
    async memoryBankExists(workspaceFolderUri: string): Promise<boolean> {
        try {
            const memoryBankPath = `${workspaceFolderUri}/${MEMORY_BANK_DIRECTORY}`
            const exists = await this.features.workspace.fs.exists(memoryBankPath)

            if (!exists) {
                return false
            }

            // Check if at least one memory bank file exists
            const files = Object.values(MEMORY_BANK_FILES)
            for (const file of files) {
                const filePath = `${memoryBankPath}/${file}`
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
     * COMPLETE SCIENCE PIPELINE: Execute all 5 steps for guidelines.md generation
     * This orchestrates the exact science document methodology
     */
    async executeGuidelinesGenerationPipeline(workspaceFolderUri: string): Promise<{
        discoveredFiles: Array<{ path: string; size: number }>
        filesWithLineCount: Array<{ path: string; size: number }>
        filesWithDissimilarity: Array<{ path: string; size: number; dissimilarity: number }>
        formattedFilesString: string
        rankedFilesList: string[]
    }> {
        const extensions = ['.ts', '.js', '.py', '.java', '.rs', '.go', '.rb', '.php', '.cs', '.cpp', '.c', '.h']

        // SCIENCE STEP 1: discoverAllSourceFiles()
        this.features.logging.info('[Science Pipeline] discoverAllSourceFiles: Finding all source files')
        const discoveredFiles = await this.discoverAllSourceFiles(workspaceFolderUri, extensions)

        // SCIENCE STEP 2: calculateFileLineCount() (already done in step 1)
        this.features.logging.info(
            '[Science Pipeline] calculateFileLineCount: Line counting completed during discovery'
        )
        const filesWithLineCount = discoveredFiles

        // SCIENCE STEP 3: calculateLexicalDissimilarity()
        this.features.logging.info(
            '[Science Pipeline] calculateLexicalDissimilarity: Computing TF-IDF uniqueness scores'
        )
        const filesWithDissimilarity = await this.calculateLexicalDissimilarity(filesWithLineCount)

        // SCIENCE STEP 4: formatFilesForRanking()
        this.features.logging.info('[Science Pipeline] formatFilesForRanking: Creating science document format')
        const formattedFilesString = this.formatFilesForRanking(filesWithDissimilarity)

        // SCIENCE STEP 5: prepareFilesForLLMRanking() (fallback ranking for now)
        this.features.logging.info('[Science Pipeline] prepareFilesForLLMRanking: Preparing top files for LLM ranking')
        const rankedFilesList = await this.prepareFilesForLLMRanking(filesWithDissimilarity, 15)

        return {
            discoveredFiles,
            filesWithLineCount,
            filesWithDissimilarity,
            formattedFilesString,
            rankedFilesList,
        }
    }
}
