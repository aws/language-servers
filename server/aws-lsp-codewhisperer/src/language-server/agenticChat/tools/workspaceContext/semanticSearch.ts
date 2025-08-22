import { InvokeOutput } from '../toolShared'
import { BearerCredentials, CredentialsProvider, Logging } from '@aws/language-server-runtimes/server-interface'
import { WorkspaceFolderManager } from '../../../workspaceContext/workspaceFolderManager'
import { normalizeFileUri } from '../../../workspaceContext/util'
import axios from 'axios'

export interface SemanticSearchParams {
    query: string
    programmingLanguage?: 'java' | 'python' | 'javascript' | 'typescript'
}

export interface CodeChunkResult {
    fileUri: string
    content: string
    score?: number
}

export class SemanticSearch {
    static readonly toolName = 'semanticSearch'

    private readonly logging: Logging
    private readonly credentialsProvider: CredentialsProvider
    private readonly remoteEndpointSuffix: string
    constructor(logging: Logging, credentialsProvider: CredentialsProvider, region: string) {
        this.logging = logging
        this.credentialsProvider = credentialsProvider
        this.remoteEndpointSuffix = `--8080.wc.q.${region}.amazonaws.com`
    }

    public validate(params: SemanticSearchParams) {
        if (!params.query || params.query.trim().length === 0) {
            throw new Error('Semantic search query cannot be empty.')
        }
    }

    public async invoke(params: SemanticSearchParams): Promise<InvokeOutput> {
        const creds = this.credentialsProvider.getCredentials('bearer') as BearerCredentials
        if (!creds?.token) {
            throw new Error('Authorization failed, bearer token is not set')
        }

        const remoteWorkspaceState = WorkspaceFolderManager.getInstance()?.getWorkspaceState()
        if (!remoteWorkspaceState?.webSocketClient?.isConnected() || !remoteWorkspaceState.environmentId) {
            throw new Error('Remote workspace is not ready yet.')
        }

        const environmentId = remoteWorkspaceState.environmentId
        const endpoint = `https://${environmentId}${this.remoteEndpointSuffix}/getWorkspaceContext`
        const response = await axios.post(
            endpoint,
            {
                workspaceId: remoteWorkspaceState.workspaceId,
                contextParams: {
                    documentContextParams: {
                        query: params.query,
                        queryConfigurationMap: {
                            SEMANTIC: {
                                maxResult: 15,
                                includeDependencies: false,
                                ...(params.programmingLanguage && { programmingLanguage: params.programmingLanguage }),
                            },
                        },
                    },
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${creds.token}`,
                },
            }
        )

        return this.createOutput(response.data.contextResult?.documentContext?.queryOutputMap?.SEMANTIC)
    }

    private createOutput(semanticSearchResult: CodeChunkResult[] | undefined): InvokeOutput {
        const filteredResults =
            semanticSearchResult?.map(result => {
                return {
                    fileUri: normalizeFileUri(result.fileUri),
                    content: result.content,
                    ...(result.score !== undefined && { similarityScore: result.score }),
                }
            }) || []

        return {
            output: {
                kind: 'json',
                content: filteredResults,
            },
        }
    }

    public getSpec() {
        return {
            name: SemanticSearch.toolName,
            description:
                'A tool for finding semantically relevant code snippets in a codebase.\n\n' +
                '## Overview\n' +
                'This is a semantic search tool that understands the intent and context behind queries, helping you find code snippets most relevant to your search.\n\n' +
                '## When to use\n' +
                '- When you need to locate specific functionality in a codebase\n' +
                '- When looking for implementation patterns related to certain concepts\n' +
                '- When you want to understand how particular features are coded\n' +
                '- When exploring unfamiliar codebases to find relevant sections\n\n' +
                '## When not to use\n' +
                '- When you already know the exact file location\n\n' +
                '## Notes\n' +
                '- Before searching, identify the essential concepts and atomic information units in the query\n' +
                '- For complex questions, break down the query into core components or key facts to improve search relevance\n' +
                "- Unless there is a clear reason to modify the search query, extract the key concepts using the user's original wording\n" +
                "- The user's exact phrasing often contains critical contextual cues that enhance semantic matching\n",
            inputSchema: {
                type: 'object' as const,
                properties: {
                    query: {
                        type: 'string' as const,
                        description: 'The search query to find relevant code snippets.',
                    },
                    programmingLanguage: {
                        type: 'string' as const,
                        enum: ['java', 'python', 'javascript', 'typescript'],
                        description: 'Optional programming language to filter search results.',
                    },
                },
                required: ['query'] as const,
            },
        }
    }
}
