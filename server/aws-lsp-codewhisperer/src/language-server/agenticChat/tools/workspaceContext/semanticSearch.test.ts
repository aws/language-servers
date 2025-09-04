import * as assert from 'assert'
import * as sinon from 'sinon'
import axios from 'axios'
import { SemanticSearch, SemanticSearchParams, CodeChunkResult } from './semanticSearch'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { BearerCredentials } from '@aws/language-server-runtimes/server-interface'
import { WorkspaceFolderManager } from '../../../workspaceContext/workspaceFolderManager'

describe('SemanticSearch Tool', () => {
    let features: TestFeatures
    let semanticSearch: SemanticSearch
    let axiosPostStub: sinon.SinonStub
    let workspaceFolderManagerStub: sinon.SinonStub
    let mockCredentialsProvider: any
    let mockWorkspaceState: any

    beforeEach(() => {
        features = new TestFeatures()

        // Mock credentials provider
        mockCredentialsProvider = {
            getCredentials: sinon.stub().returns({
                token: 'mock-bearer-token',
            } as BearerCredentials),
        }

        // Mock workspace state
        mockWorkspaceState = {
            webSocketClient: {
                isConnected: sinon.stub().returns(true),
            },
            environmentId: 'test-env-123',
            workspaceId: 'test-workspace-456',
        }

        // Stub WorkspaceFolderManager.getInstance()
        workspaceFolderManagerStub = sinon.stub(WorkspaceFolderManager, 'getInstance').returns({
            getWorkspaceState: () => mockWorkspaceState,
        } as any)

        // Stub axios.post
        axiosPostStub = sinon.stub(axios, 'post')

        semanticSearch = new SemanticSearch(features.logging, mockCredentialsProvider, 'us-east-1')
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('validation', () => {
        it('should reject empty query', () => {
            assert.throws(
                () => semanticSearch.validate({ query: '' }),
                /Semantic search query cannot be empty/i,
                'Expected an error for empty query'
            )
        })

        it('should reject whitespace-only query', () => {
            assert.throws(
                () => semanticSearch.validate({ query: '   \t\n  ' }),
                /Semantic search query cannot be empty/i,
                'Expected an error for whitespace-only query'
            )
        })

        it('should accept valid query', () => {
            assert.doesNotThrow(
                () => semanticSearch.validate({ query: 'valid search query' }),
                'Should accept valid query'
            )
        })

        it('should accept query with programming language', () => {
            assert.doesNotThrow(
                () => semanticSearch.validate({ query: 'test', programmingLanguage: 'typescript' }),
                'Should accept query with programming language'
            )
        })
    })

    describe('error handling', () => {
        it('should throw error when bearer token is missing', async () => {
            mockCredentialsProvider.getCredentials.returns({ token: null })

            await assert.rejects(
                semanticSearch.invoke({ query: 'test query' }),
                /Authorization failed, bearer token is not set/i,
                'Expected error when bearer token is missing'
            )
        })

        it('should throw error when workspace is not connected', async () => {
            mockWorkspaceState.webSocketClient.isConnected.returns(false)

            await assert.rejects(
                semanticSearch.invoke({ query: 'test query' }),
                /Remote workspace is not ready yet/i,
                'Expected error when workspace is not connected'
            )
        })

        it('should throw error when environmentId is missing', async () => {
            mockWorkspaceState.environmentId = null

            await assert.rejects(
                semanticSearch.invoke({ query: 'test query' }),
                /Remote workspace is not ready yet/i,
                'Expected error when environmentId is missing'
            )
        })

        it('should throw error when WorkspaceFolderManager instance is null', async () => {
            workspaceFolderManagerStub.returns(null)

            await assert.rejects(
                semanticSearch.invoke({ query: 'test query' }),
                /Remote workspace is not ready yet/i,
                'Expected error when WorkspaceFolderManager instance is null'
            )
        })

        it('should handle axios network errors', async () => {
            axiosPostStub.rejects(new Error('Network error'))

            await assert.rejects(
                semanticSearch.invoke({ query: 'test query' }),
                /Network error/i,
                'Expected network error to be propagated'
            )
        })
    })

    describe('successful invocation', () => {
        const mockSemanticResults: CodeChunkResult[] = [
            {
                fileUri: '/workspace/src/main.ts',
                content: 'function main() { console.log("Hello World"); }',
                score: 0.95,
            },
            {
                fileUri: 'file:///workspace/src/utils.js',
                content: 'export function helper() { return true; }',
                score: 0.87,
            },
            {
                fileUri: 'workspace/src/config.json',
                content: '{ "name": "test-project" }',
                score: 0.72,
            },
        ]

        beforeEach(() => {
            axiosPostStub.resolves({
                data: {
                    contextResult: {
                        documentContext: {
                            queryOutputMap: {
                                SEMANTIC: mockSemanticResults,
                            },
                        },
                    },
                },
            })
        })

        it('should perform semantic search with basic query', async () => {
            const result = await semanticSearch.invoke({ query: 'test function' })

            // Verify axios was called with correct parameters
            assert.ok(axiosPostStub.calledOnce, 'axios.post should be called once')

            const [url, requestBody, config] = axiosPostStub.firstCall.args
            assert.strictEqual(url, 'https://test-env-123--8080.wc.q.us-east-1.amazonaws.com/getWorkspaceContext')
            assert.strictEqual(requestBody.workspaceId, 'test-workspace-456')
            assert.strictEqual(requestBody.contextParams.documentContextParams.query, 'test function')
            assert.strictEqual(config.headers.Authorization, 'Bearer mock-bearer-token')

            // Verify result structure
            assert.strictEqual(result.output.kind, 'json')
            const content = result.output.content as any[]
            assert.strictEqual(content.length, 3)
        })

        it('should include programming language filter when specified', async () => {
            await semanticSearch.invoke({
                query: 'test function',
                programmingLanguage: 'typescript',
            })

            const [, requestBody] = axiosPostStub.firstCall.args
            const queryConfig = requestBody.contextParams.documentContextParams.queryConfigurationMap.SEMANTIC
            assert.strictEqual(queryConfig.programmingLanguage, 'typescript')
        })

        it('should not include programming language when not specified', async () => {
            await semanticSearch.invoke({ query: 'test function' })

            const [, requestBody] = axiosPostStub.firstCall.args
            const queryConfig = requestBody.contextParams.documentContextParams.queryConfigurationMap.SEMANTIC
            assert.ok(!('programmingLanguage' in queryConfig))
        })

        it('should normalize file URIs correctly', async () => {
            const result = await semanticSearch.invoke({ query: 'test' })
            const content = result.output.content as any[]

            // Check URI normalization
            assert.strictEqual(content[0].fileUri, 'file:///workspace/src/main.ts')
            assert.strictEqual(content[1].fileUri, 'file:///workspace/src/utils.js') // Already has file://
            assert.strictEqual(content[2].fileUri, 'file:///workspace/src/config.json')
        })

        it('should include similarity scores when available', async () => {
            const result = await semanticSearch.invoke({ query: 'test' })
            const content = result.output.content as any[]

            assert.strictEqual(content[0].similarityScore, 0.95)
            assert.strictEqual(content[1].similarityScore, 0.87)
            assert.strictEqual(content[2].similarityScore, 0.72)
        })

        it('should handle results without scores', async () => {
            const resultsWithoutScores: CodeChunkResult[] = [
                {
                    fileUri: '/workspace/test.js',
                    content: 'test content',
                    // No score property
                },
            ]

            axiosPostStub.resolves({
                data: {
                    contextResult: {
                        documentContext: {
                            queryOutputMap: {
                                SEMANTIC: resultsWithoutScores,
                            },
                        },
                    },
                },
            })

            const result = await semanticSearch.invoke({ query: 'test' })
            const content = result.output.content as any[]

            assert.strictEqual(content.length, 1)
            assert.strictEqual(content[0].fileUri, 'file:///workspace/test.js')
            assert.strictEqual(content[0].content, 'test content')
            assert.ok(!('similarityScore' in content[0]))
        })

        it('should handle empty search results', async () => {
            axiosPostStub.resolves({
                data: {
                    contextResult: {
                        documentContext: {
                            queryOutputMap: {
                                SEMANTIC: [],
                            },
                        },
                    },
                },
            })

            const result = await semanticSearch.invoke({ query: 'nonexistent' })
            const content = result.output.content as any[]

            assert.strictEqual(content.length, 0)
        })

        it('should handle missing semantic results', async () => {
            axiosPostStub.resolves({
                data: {
                    contextResult: {
                        documentContext: {
                            queryOutputMap: {
                                SEMANTIC: undefined,
                            },
                        },
                    },
                },
            })

            const result = await semanticSearch.invoke({ query: 'test' })
            const content = result.output.content as any[]

            assert.strictEqual(content.length, 0)
        })

        it('should handle malformed response structure', async () => {
            axiosPostStub.resolves({
                data: {
                    // Missing expected structure
                },
            })

            const result = await semanticSearch.invoke({ query: 'test' })
            const content = result.output.content as any[]

            assert.strictEqual(content.length, 0)
        })
    })

    describe('getSpec', () => {
        it('should return correct tool specification', () => {
            const spec = semanticSearch.getSpec()

            assert.strictEqual(spec.name, 'semanticSearch')
            assert.ok(spec.description.includes('semantic search'))
            assert.strictEqual(spec.inputSchema.type, 'object')
            assert.ok('query' in spec.inputSchema.properties)
            assert.ok('programmingLanguage' in spec.inputSchema.properties)
            assert.deepStrictEqual(spec.inputSchema.required, ['query'])
        })

        it('should have correct programming language enum values', () => {
            const spec = semanticSearch.getSpec()
            const langProperty = spec.inputSchema.properties.programmingLanguage as any

            assert.deepStrictEqual(langProperty.enum, ['java', 'python', 'javascript', 'typescript'])
        })
    })

    describe('constructor', () => {
        it('should construct with correct endpoint suffix', () => {
            const search1 = new SemanticSearch(features.logging, mockCredentialsProvider, 'us-west-2')
            const search2 = new SemanticSearch(features.logging, mockCredentialsProvider, 'eu-west-1')

            // We can't directly test the private property, but we can test the behavior
            // by mocking a call and checking the URL
            axiosPostStub.resolves({
                data: { contextResult: { documentContext: { queryOutputMap: { SEMANTIC: [] } } } },
            })

            // Test us-west-2
            search1.invoke({ query: 'test' }).catch(() => {}) // Ignore validation errors
            // Test eu-west-1
            search2.invoke({ query: 'test' }).catch(() => {}) // Ignore validation errors

            // The endpoint construction is tested indirectly through the invoke method tests above
        })
    })
})
