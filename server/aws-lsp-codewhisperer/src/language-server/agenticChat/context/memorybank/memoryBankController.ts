/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { MemoryBankPrompts } from './memoryBankPrompts'

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

    static getInstance(features: Features): MemoryBankController {
        if (!MemoryBankController.instance) {
            MemoryBankController.instance = new MemoryBankController(features)
        }
        return MemoryBankController.instance
    }

    /**
     * Check if a prompt is requesting memory bank creation
     * Can be expanded based on feedbacks
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
        llmCallFunction: (prompt: string) => Promise<string>
    ): Promise<string> {
        try {
            // Step 1: Clean directory
            await this.cleanMemoryBankDirectory(workspaceFolderUri)

            // Step 2: Execute deterministic analysis (TF-IDF)
            this.features.logging.info(`Memory Bank: running analysis for workspace`)
            const analysisResults = await this.executeGuidelinesGenerationPipeline(workspaceFolderUri)

            // Step 3: Make LLM call for file ranking
            const rankingPrompt = MemoryBankPrompts.getFileRankingPrompt(analysisResults.formattedFilesString, 10)
            const rankedFilesResponse = await llmCallFunction(rankingPrompt)

            // Step 4: Parse ranked files
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

                this.features.logging.info(
                    `Memory Bank: parsed ${rankedFilesList.length} ranked files from LLM response`
                )
            } catch (error) {
                this.features.logging.warn(
                    `Memory Bank: failed to parse LLM ranking response, using TF-IDF fallback: ${error}`
                )
                rankedFilesList = analysisResults.rankedFilesList.slice(0, 10)
            }

            this.features.logging.info(
                `Memory Bank: using ${rankedFilesList.length} files for documentation generation`
            )

            // Step 5: Create the comprehensive prompt with ranked files
            const finalPrompt = MemoryBankPrompts.getCompleteMemoryBankPrompt(rankedFilesList)
            return finalPrompt
        } catch (error) {
            this.features.logging.error(`Memory Bank preparation failed: ${error}`)
            throw error
        }
    }

    /**
     * Clean and recreate memory bank directory
     */
    async cleanMemoryBankDirectory(workspaceFolderUri: string): Promise<void> {
        try {
            const memoryBankPath = `${workspaceFolderUri}/${MEMORY_BANK_DIRECTORY}`

            // Remove all existing memory bank files to ensure clean recreation
            const filesToRemove = ['product.md', 'structure.md', 'tech.md', 'guidelines.md']
            let removedCount = 0
            for (const fileName of filesToRemove) {
                const filePath = `${memoryBankPath}/${fileName}`
                try {
                    const exists = await this.features.workspace.fs.exists(filePath)
                    if (exists) {
                        await this.features.workspace.fs.rm(filePath)
                        removedCount++
                    }
                } catch (error) {
                    // Ignore errors when removing files that don't exist
                    this.features.logging.debug(`Could not remove ${fileName}: ${error}`)
                }
            }

            if (removedCount > 0) {
                this.features.logging.info(`Memory Bank: cleaned ${removedCount} existing files`)
            }

            // Create the directory structure using mkdir with recursive option
            await this.features.workspace.fs.mkdir(memoryBankPath, { recursive: true })
        } catch (error) {
            this.features.logging.error(`Memory Bank directory creation failed: ${error}`)
            throw error
        }
    }

    /**
     * files discovery
     */
    async discoverAllSourceFiles(
        workspaceFolderUri: string,
        extensions: string[]
    ): Promise<Array<{ path: string; size: number }>> {
        try {
            // Recursively discover all source files
            const workspaceFolders = this.features.workspace
                .getAllWorkspaceFolders()
                ?.map(({ uri }) => new URL(uri).pathname) ?? [workspaceFolderUri]

            // Collect files from all workspace folders
            let allSourceFiles: string[] = []

            for (const folder of workspaceFolders) {
                const sourceFiles = await this.discoverSourceFiles(folder, extensions)
                allSourceFiles.push(...sourceFiles)
            }

            // OPTIMIZATION: Parallel file size calculation with batching
            const batchSize = 10 // Process 10 files at a time
            const files: Array<{ path: string; size: number }> = []

            for (let i = 0; i < allSourceFiles.length; i += batchSize) {
                const batch = allSourceFiles.slice(i, i + batchSize)
                const batchResults = await Promise.all(
                    batch.map(async filePath => ({
                        path: filePath,
                        size: await this.calculateFileLineCount(filePath),
                    }))
                )
                files.push(...batchResults)
            }

            return files
        } catch (error) {
            this.features.logging.error(`Error in getAllFiles: ${error}`)
            return []
        }
    }

    /**
     * line counting
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
     * lexical dissimilarity calculation
     */
    async calculateLexicalDissimilarity(
        files: Array<{ path: string; size: number }>
    ): Promise<Array<{ path: string; size: number; dissimilarity: number }>> {
        try {
            // OPTIMIZATION: Parallel file reading with batching
            const batchSize = 20 // Process 20 files at a time to reduce I/O overhead
            const fileContents: string[] = []
            let hasReadErrors = false

            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize)
                const batchContents = await Promise.all(
                    batch.map(async file => {
                        try {
                            return await this.features.workspace.fs.readFile(file.path)
                        } catch (error) {
                            this.features.logging.warn(`Could not read file for TF-IDF analysis: ${file.path}`)
                            hasReadErrors = true
                            return '' // Empty content for unreadable files
                        }
                    })
                )
                fileContents.push(...batchContents)
            }

            // Check if all files are empty (no content to analyze)
            const hasContent = fileContents.some(content => content.trim().length > 0)
            if (!hasContent) {
                // If no files have content due to read errors, log as error
                if (hasReadErrors) {
                    this.features.logging.error(
                        'All files failed to read or are empty, using fallback dissimilarity values'
                    )
                }
                // If no files have content, return fallback values
                return files.map(f => ({ ...f, dissimilarity: 0.85 }))
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
            }

            return lexicalDissimilarities
        } catch (error) {
            this.features.logging.error(`Error in calculateLexicalDissimilarity: ${error}`)
            // Fallback to reasonable defaults if TF-IDF calculation fails
            return files.map(f => ({ ...f, dissimilarity: 0.85 }))
        }
    }

    /**
     * Create TF-IDF matrix, Returns array of TF-IDF vectors, where each vector is a Map<term, tfidf_score>
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
     * Calculate cosine similarity matrix
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
     * Execute the complete guidelines generation pipeline
     * https://code.amazon.com/packages/QIDEPersonalization/blobs/mainline/--/src/stylefile-gen.ipynb
     */
    async executeGuidelinesGenerationPipeline(workspaceFolderUri: string): Promise<{
        discoveredFiles: Array<{ path: string; size: number }>
        filesWithDissimilarity: Array<{ path: string; size: number; dissimilarity: number }>
        formattedFilesString: string
        rankedFilesList: string[]
    }> {
        try {
            // Step 1: Discover all source files
            // OPTIMIZATION: Prioritize common extensions first for faster discovery
            const extensions = [
                '.ts',
                '.js',
                '.tsx',
                '.jsx',
                '.py',
                '.java',
                '.cpp',
                '.c',
                '.h',
                '.cs',
                '.go',
                '.rs',
                '.php',
                '.rb',
                '.swift',
                '.kt',
                '.scala',
            ]

            const discoveredFiles = await this.discoverAllSourceFiles(workspaceFolderUri, extensions)

            this.features.logging.info(`Memory Bank analysis: discovered ${discoveredFiles.length} source files`)

            if (discoveredFiles.length === 0) {
                throw new Error('No source files found in workspace')
            }

            // Limit files to prevent memory exhaustion on large projects
            const MAX_FILES_FOR_ANALYSIS = 200
            let filesToAnalyze: Array<{ path: string; size: number }>

            if (discoveredFiles.length > MAX_FILES_FOR_ANALYSIS) {
                const shuffled = [...discoveredFiles].sort(() => Math.random() - 0.5)
                filesToAnalyze = shuffled.slice(0, MAX_FILES_FOR_ANALYSIS)
                this.features.logging.info(
                    `Memory Bank analysis: randomly selected ${filesToAnalyze.length} files (from ${discoveredFiles.length} discovered)`
                )
            } else {
                filesToAnalyze = discoveredFiles
            }

            // Step 2: Calculate lexical dissimilarity using TF-IDF
            const filesWithDissimilarity = await this.calculateLexicalDissimilarity(filesToAnalyze)

            // Step 3: Sort by size
            filesWithDissimilarity.sort((a, b) => b.size - a.size)

            // Step 4: Format files string for LLM ranking
            const formattedFilesString = this.formatFilesForRanking(filesWithDissimilarity)

            // Step 5: Create fallback ranking (deterministic, for when LLM fails)
            const rankedFilesList = filesWithDissimilarity
                .sort((a, b) => b.dissimilarity - a.dissimilarity)
                .slice(0, 10)
                .map(f => f.path)

            return {
                discoveredFiles: filesToAnalyze,
                filesWithDissimilarity,
                formattedFilesString,
                rankedFilesList,
            }
        } catch (error) {
            this.features.logging.error(`Memory Bank analysis pipeline failed: ${error}`)
            throw error
        }
    }

    /**
     * Format files for processing pipeline
     */
    formatFilesForRanking(files: Array<{ path: string; size: number; dissimilarity: number }>): string {
        // Files are already sorted by size in executeGuidelinesGenerationPipeline()
        return files
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
        // Comprehensive language-agnostic directory exclusions
        const skipDirs = [
            // Version Control Systems
            '.git',
            '.svn',
            '.hg',
            '.bzr',
            '.fossil-settings',

            // Package Managers & Dependencies
            'node_modules',
            'bower_components',
            'jspm_packages',
            'vendor',
            'packages',
            'deps',
            '_deps',
            'third_party',
            'external',
            'Pods',
            'Carthage',
            'DerivedData', // iOS/macOS
            'venv',
            'env',
            '.venv',
            '.env',
            'virtualenv',
            '__pycache__',
            '.tox', // Python
            'gems',
            '.bundle', // Ruby
            'composer', // PHP
            'node_modules',
            'elm-stuff', // Elm
            'target',
            'project/target',
            'project/project', // Scala/SBT

            // Build Outputs & Artifacts
            'build',
            'builds',
            'dist',
            'out',
            'output',
            'bin',
            'obj',
            'lib',
            'release',
            'debug',
            'Release',
            'Debug',
            'x64',
            'x86',
            'AnyCPU',
            '.next',
            '.nuxt',
            '.output',
            '.vercel',
            '.netlify', // Web frameworks
            'public/build',
            'static/build',
            'assets/build',
            'cmake-build-debug',
            'cmake-build-release', // CMake
            '_build',
            'ebin',
            'deps', // Erlang/Elixir
            'zig-cache',
            'zig-out', // Zig

            // IDE & Editor Directories
            '.vscode',
            '.idea',
            '.vs',
            '.vscode-test',
            '.eclipse',
            '.metadata',
            '.settings',
            '.project',
            '.classpath',
            '.atom',
            '.sublime-project',
            '.sublime-workspace',
            '__pycache__',
            '.mypy_cache',
            '.dmypy.json', // Python
            '.dart_tool',
            '.flutter-plugins',
            '.flutter-plugins-dependencies', // Dart/Flutter

            // Testing & Coverage
            'coverage',
            '.coverage',
            '.nyc_output',
            '.pytest_cache',
            '.cache',
            'htmlcov',
            'test-results',
            'test-reports',
            'allure-results',
            'junit',
            'xunit',
            'nunit',
            'TestResults',
            '.jest',
            'jest_html_reporters.html',

            // Logs & Temporary Files
            'logs',
            'log',
            'tmp',
            'temp',
            '.tmp',
            '.temp',
            'crash-reports',
            'error-reports',

            // Documentation Build Outputs
            '_site',
            '.jekyll-cache',
            '.jekyll-metadata', // Jekyll
            'docs/_build',
            'doc/_build',
            'documentation/_build', // Sphinx
            '.docusaurus',
            'website/build', // Docusaurus
            'book',
            '_book', // GitBook/mdBook

            // Language-Specific Caches & Artifacts
            '.gradle',
            'gradle', // Gradle
            '.m2',
            '.ivy2', // Maven/Ivy
            '.stack-work',
            '.cabal-sandbox',
            'cabal.sandbox.config', // Haskell
            '_opam',
            '.opam', // OCaml
            'Cargo.lock', // Rust (keep Cargo.toml but skip lock in some cases)
            '.cargo', // Rust cache
            '.mix',
            '_build', // Elixir
            'rebar3.crashdump',
            '_checkouts', // Erlang
            '.rebar',
            '.rebar3',
            'priv/static', // Phoenix framework

            // OS-Specific
            '.DS_Store',
            'Thumbs.db',
            'Desktop.ini',
            '$RECYCLE.BIN',
            '.Trash-*',
            '.fuse_hidden*',

            // Cloud & Deployment
            '.serverless',
            '.aws-sam',
            '.terraform',
            '.pulumi',
            'cdk.out',
            '.cdk.staging',
            'amplify',

            // Mobile Development
            'ios/build',
            'android/build',
            'android/.gradle',
            'ios/Pods',
            'android/app/build',

            // Game Development
            'Library',
            'Temp',
            'Obj',
            'Build',
            'Builds', // Unity
            'Intermediate',
            'Binaries',
            'DerivedDataCache', // Unreal

            // Database
            '*.db-journal',
            '*.sqlite-journal',

            // Backup & Archive
            'backup',
            'backups',
            '.backup',
            'archive',
            'archives',
        ]

        // Skip any directory starting with . (hidden directories) except some important ones
        if (dirName.startsWith('.')) {
            const allowedHiddenDirs = ['.github', '.gitlab', '.circleci', '.travis', '.azure', '.devcontainer']
            return !allowedHiddenDirs.includes(dirName)
        }

        return skipDirs.includes(dirName)
    }

    /**
     * Check if memory bank exists in workspace
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
}
