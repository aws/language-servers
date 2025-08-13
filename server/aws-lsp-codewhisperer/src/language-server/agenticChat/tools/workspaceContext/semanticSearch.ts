import { InvokeOutput } from '../toolShared'
import { BearerCredentials, CredentialsProvider, Logging } from '@aws/language-server-runtimes/server-interface'
import { WorkspaceFolderManager } from '../../../workspaceContext/workspaceFolderManager'
import axios from 'axios'
import * as crypto from 'crypto'

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
    private static readonly REMOTE_WORKSPACE_ENDPOINT_SUFFIX = '--8080.wc.q.us-east-1.amazonaws.com'
    static readonly toolName = 'serverSideSemanticSearch'

    private readonly logging: Logging
    private readonly credentialsProvider: CredentialsProvider
    constructor(logging: Logging, credentialsProvider: CredentialsProvider) {
        this.logging = logging
        this.credentialsProvider = credentialsProvider
    }

    public async validate(params: SemanticSearchParams): Promise<void> {
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
        const endpoint = `https://${environmentId}${SemanticSearch.REMOTE_WORKSPACE_ENDPOINT_SUFFIX}/getWorkspaceContext`
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
                clientMetadata: {
                    requestIdentifier: crypto.randomUUID(),
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
                const normalizedUri = result.fileUri.startsWith('file://')
                    ? result.fileUri
                    : `file://${result.fileUri.startsWith('/') ? result.fileUri : '/' + result.fileUri}`

                return {
                    fileUri: normalizedUri,
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
            description: `A tool for finding semantically relevant code snippets in a codebase.

## Overview
This is a semantic search tool that understands the intent and context behind queries, helping you find code snippets most relevant to your search.

## When to use
- When you need to locate specific functionality in a codebase
- When looking for implementation patterns related to certain concepts
- When you want to understand how particular features are coded
- When exploring unfamiliar codebases to find relevant sections

## When not to use
- When you already know the exact file location
- When the codebase has not been indexed yet

## Notes
- Before searching, identify the essential concepts and atomic information units in the query
- For complex questions, break down the query into core components or key facts to improve search relevance
- If it makes sense to only search in particular directories, specify them in the target_directories field
- Unless there is a clear reason to modify the search query, extract the key concepts using the user's original wording
- The user's exact phrasing often contains critical contextual cues that enhance semantic matching`,
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
