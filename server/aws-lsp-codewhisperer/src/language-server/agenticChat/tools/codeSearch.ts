import { CommandValidation, InvokeOutput, requiresPathAcceptance, validatePath } from './toolShared'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { getWorkspaceFolderPaths } from '@aws/lsp-core/out/util/workspaceUtils'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'
import { Chunk } from 'local-indexing'
import { RelevantTextDocument } from '@amzn/codewhisperer-streaming'
import { LineInfo } from '../context/agenticChatTriggerContext'
import path = require('path')

export interface CodeSearchParams {
    query: string
    path?: string
}

export type CodeSearchOutput = RelevantTextDocument & LineInfo

export class CodeSearch {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']
    constructor(features: Pick<Features, 'logging' | 'workspace' | 'lsp'>) {
        this.logging = features.logging
        this.workspace = features.workspace
        this.lsp = features.lsp
    }

    public async validate(params: CodeSearchParams): Promise<void> {
        if (!params.query || params.query.trim().length === 0) {
            throw new Error('Code search query cannot be empty.')
        }
        const searchPath = this.getOrSetSearchPath(params.path)

        if (searchPath) {
            await validatePath(searchPath, this.workspace.fs.exists)
        }
    }

    public async queueDescription(params: CodeSearchParams, updates: WritableStream, requiresAcceptance: boolean) {
        const writer = updates.getWriter()
        const closeWriter = async (w: WritableStreamDefaultWriter) => {
            await w.close()
            w.releaseLock()
        }
        if (!requiresAcceptance) {
            await writer.write('')
            await closeWriter(writer)
            return
        }

        const path = this.getOrSetSearchPath(params.path)
        await writer.write(`Performing code search for "${params.query}" in ${path}`)
        await closeWriter(writer)
    }

    public async requiresAcceptance(params: CodeSearchParams): Promise<CommandValidation> {
        if (!params.path) {
            return { requiresAcceptance: false }
        }
        return requiresPathAcceptance(params.path, this.lsp, this.logging)
    }

    public async invoke(params: CodeSearchParams): Promise<InvokeOutput> {
        const path = this.getOrSetSearchPath(params.path)

        try {
            const results = await this.executeCodeSearch(params.query, path)
            return this.createOutput(
                !results || results.length === 0 ? 'No code matches found for code search.' : results
            )
        } catch (error: any) {
            this.logging.error(
                `Failed to perform code search for "${params.query}" in "${path}": ${error.message || error}`
            )
            throw new Error(
                `Failed to perform code search for "${params.query}" in "${path}": ${error.message || error}`
            )
        }
    }

    private getOrSetSearchPath(path?: string): string {
        let searchPath = ''
        if (path && path.trim().length !== 0) {
            searchPath = path
        } else {
            // Handle optional path parameter
            // Use current workspace folder as default if path is not provided
            const workspaceFolders = getWorkspaceFolderPaths(this.lsp)
            if (workspaceFolders && workspaceFolders.length !== 0) {
                this.logging.debug(`Using default workspace folder: ${workspaceFolders[0]}`)
                searchPath = workspaceFolders[0]
            }
        }
        return searchPath
    }

    private async executeCodeSearch(query: string, path: string): Promise<CodeSearchOutput[]> {
        this.logging.info(`Executing code search for "${query}" in "${path}"`)
        const localProjectContextController = await LocalProjectContextController.getInstance()

        if (!localProjectContextController.isEnabled) {
            this.logging.warn(`Error during code search: local project context controller is disable`)
            return []
        }
        try {
            // Use the localProjectContextController to query the vector index
            const searchResults = await localProjectContextController.queryVectorIndex({ query: query })
            const sanitizedSearchResults = this.parseChunksToCodeSearchOutput(searchResults)
            this.logging.info(`Code searched succeed with num of results: "${sanitizedSearchResults.length}"`)
            return sanitizedSearchResults
        } catch (error: any) {
            this.logging.error(`Error during code search: ${error.message || error}`)
            throw error
        }
    }

    /**
     * Parses chunks from vector index search into CodeSearchOutput format
     * Based on the queryRelevantDocuments method pattern
     */
    private parseChunksToCodeSearchOutput(chunks: Chunk[]): CodeSearchOutput[] {
        const codeSearchResults: CodeSearchOutput[] = []
        if (!chunks) {
            return codeSearchResults
        }

        for (const chunk of chunks) {
            // Extract content and context
            const content = chunk.content || ''
            const relativeFilePath = chunk.relativePath ?? path.basename(chunk.filePath)

            // Extract line information
            const startLine = chunk.startLine ?? -1
            const endLine = chunk.endLine ?? -1

            // Create the base search result
            const baseSearchResult = {
                content,
                relativeFilePath,
                startLine,
                endLine,
            }

            // Add programming language information if available
            if (chunk.programmingLanguage && chunk.programmingLanguage !== 'unknown') {
                codeSearchResults.push({
                    ...baseSearchResult,
                    programmingLanguage: {
                        languageName: chunk.programmingLanguage,
                    },
                })
            } else {
                codeSearchResults.push(baseSearchResult)
            }
        }

        return codeSearchResults
    }

    private createOutput(content: string | any[]): InvokeOutput {
        if (typeof content === 'string') {
            return {
                output: {
                    kind: 'text',
                    content: content,
                },
            }
        } else {
            return {
                output: {
                    kind: 'json',
                    content: content,
                },
            }
        }
    }

    public getSpec() {
        return {
            name: 'codeSearch',
            description:
                "Find snippets of code from the codebase most relevant to the search query.\nThis is a semantic search tool, so the query should ask for something semantically matching what is needed.\nIf it makes sense to only search in particular directories, please specify them in the target_directories field.\nUnless there is a clear reason to use your own search query, please just reuse the user's exact query with their wording.\nTheir exact wording/phrasing can often be helpful for the semantic search query. Keeping the same exact question format can also be helpful.",
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query to find relevant code.',
                    },
                    path: {
                        type: 'string',
                        description:
                            'Optional absolute path to a directory to search in, e.g., `/repo`. If not provided, the current workspace folder will be used.',
                    },
                    explanatio: {
                        type: 'string',
                        description:
                            'One sentence explanation as to why this tool is being used, and how it contributes to the goal',
                    },
                },
                required: ['query'],
            },
        } as const
    }
}
