/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    CredentialsProvider,
    CredentialsType,
    Workspace,
    Logging,
    SDKInitializator,
    TextDocument,
    CancellationToken,
    CancellationTokenSource,
} from '@aws/language-server-runtimes/server-interface'
import { ConfigurationOptions } from 'aws-sdk'
import * as sinon from 'sinon'
import * as assert from 'assert'
import {
    CodeWhispererServiceBase,
    CodeWhispererServiceToken,
    CodeWhispererServiceIAM,
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    SuggestionType,
} from './codeWhispererService'

describe('CodeWhispererService', function () {
    let sandbox: sinon.SinonSandbox
    let mockCredentialsProvider: sinon.SinonStubbedInstance<CredentialsProvider>
    let mockWorkspace: sinon.SinonStubbedInstance<Workspace>
    let mockLogging: sinon.SinonStubbedInstance<Logging>
    let mockSDKInitializator: sinon.SinonStubbedInstance<SDKInitializator>

    beforeEach(function () {
        sandbox = sinon.createSandbox()

        mockCredentialsProvider = {
            getCredentials: sandbox.stub(),
            hasCredentials: sandbox.stub(),
            refresh: sandbox.stub(),
        } as any

        mockWorkspace = {
            getWorkspaceFolder: sandbox.stub(),
            getWorkspaceFolders: sandbox.stub(),
        } as any

        mockLogging = {
            debug: sandbox.stub(),
            error: sandbox.stub(),
            info: sandbox.stub(),
            warn: sandbox.stub(),
            log: sandbox.stub(),
        }

        mockSDKInitializator = {
            initialize: sandbox.stub(),
        } as any
    })

    afterEach(function () {
        sandbox.restore()
    })

    describe('CodeWhispererServiceBase', function () {
        let service: CodeWhispererServiceBase

        beforeEach(function () {
            // Create a concrete implementation for testing abstract class
            class TestCodeWhispererService extends CodeWhispererServiceBase {
                client: any = {}

                getCredentialsType(): CredentialsType {
                    return 'iam'
                }

                // Add public getters for protected properties
                get testCodeWhispererRegion() {
                    return this.codeWhispererRegion
                }

                get testCodeWhispererEndpoint() {
                    return this.codeWhispererEndpoint
                }

                async generateCompletionsAndEdits(): Promise<GenerateSuggestionsResponse> {
                    return {
                        suggestions: [],
                        suggestionType: SuggestionType.COMPLETION,
                        responseContext: { requestId: 'test', codewhispererSessionId: 'test' },
                    }
                }

                async generateSuggestions(): Promise<GenerateSuggestionsResponse> {
                    return {
                        suggestions: [],
                        suggestionType: SuggestionType.COMPLETION,
                        responseContext: { requestId: 'test', codewhispererSessionId: 'test' },
                    }
                }

                clearCachedSuggestions(): void {}
            }

            service = new TestCodeWhispererService('us-east-1', 'https://codewhisperer.us-east-1.amazonaws.com')
        })

        describe('constructor', function () {
            it('should initialize with region and endpoint', function () {
                assert.strictEqual((service as any).testCodeWhispererRegion, 'us-east-1')
                assert.strictEqual(
                    (service as any).testCodeWhispererEndpoint,
                    'https://codewhisperer.us-east-1.amazonaws.com'
                )
            })
        })

        describe('request tracking', function () {
            it('should track inflight requests', function () {
                const mockRequest = {
                    abort: sandbox.stub(),
                } as any

                service.trackRequest(mockRequest)
                assert.strictEqual(service.inflightRequests.size, 1)
                assert.strictEqual(service.inflightRequests.has(mockRequest), true)
            })

            it('should complete and remove tracked requests', function () {
                const mockRequest = {
                    abort: sandbox.stub(),
                } as any

                service.trackRequest(mockRequest)
                service.completeRequest(mockRequest)

                assert.strictEqual(service.inflightRequests.size, 0)
                assert.strictEqual(service.inflightRequests.has(mockRequest), false)
            })

            it('should abort all inflight requests', function () {
                const mockRequest1 = { abort: sandbox.stub() } as any
                const mockRequest2 = { abort: sandbox.stub() } as any

                service.trackRequest(mockRequest1)
                service.trackRequest(mockRequest2)

                service.abortInflightRequests()

                assert.strictEqual(mockRequest1.abort.calledOnce, true)
                assert.strictEqual(mockRequest2.abort.calledOnce, true)
                assert.strictEqual(service.inflightRequests.size, 0)
            })
        })

        describe('updateClientConfig', function () {
            it('should update client configuration', function () {
                const mockClient = {
                    config: {
                        update: sandbox.stub(),
                    },
                    // Add minimal required properties to satisfy the interface
                    createCodeScan: sandbox.stub(),
                    createCodeScanUploadUrl: sandbox.stub(),
                    createProfile: sandbox.stub(),
                    deleteProfile: sandbox.stub(),
                    generateCompletions: sandbox.stub(),
                    generateSuggestions: sandbox.stub(),
                    getCodeAnalysis: sandbox.stub(),
                    getCodeScan: sandbox.stub(),
                    listCodeAnalysisFindings: sandbox.stub(),
                    listCodeScans: sandbox.stub(),
                    listFeatureEvaluations: sandbox.stub(),
                    listProfiles: sandbox.stub(),
                    sendTelemetryEvent: sandbox.stub(),
                    startCodeAnalysis: sandbox.stub(),
                    stopCodeAnalysis: sandbox.stub(),
                    updateProfile: sandbox.stub(),
                } as any
                service.client = mockClient

                const options: ConfigurationOptions = { region: 'us-west-2' }
                service.updateClientConfig(options)

                assert.strictEqual(mockClient.config.update.calledOnceWith(options), true)
            })
        })

        describe('generateItemId', function () {
            it('should generate unique item IDs', function () {
                const id1 = service.generateItemId()
                const id2 = service.generateItemId()

                assert.strictEqual(typeof id1, 'string')
                assert.strictEqual(typeof id2, 'string')
                assert.notStrictEqual(id1, id2)
            })
        })
    })

    describe('CodeWhispererServiceIAM', function () {
        let service: CodeWhispererServiceIAM

        beforeEach(function () {
            // Mock the createCodeWhispererSigv4Client function to avoid real client creation
            const mockClient = {
                generateRecommendations: sandbox.stub().returns({
                    promise: sandbox.stub().resolves({
                        recommendations: [],
                        $response: {
                            requestId: 'test-request-id',
                            httpResponse: {
                                headers: { 'x-amzn-sessionid': 'test-session-id' },
                            },
                        },
                    }),
                }),
                setupRequestListeners: sandbox.stub(),
                config: {
                    update: sandbox.stub(),
                },
            }

            // Mock the client creation
            const createClientStub = sandbox.stub(
                require('../client/sigv4/codewhisperer'),
                'createCodeWhispererSigv4Client'
            )
            createClientStub.returns(mockClient)

            service = new CodeWhispererServiceIAM(
                mockCredentialsProvider as any,
                {} as any, // workspace parameter
                mockLogging as any,
                'us-east-1',
                'https://codewhisperer.us-east-1.amazonaws.com',
                mockSDKInitializator as any
            )
        })

        describe('getCredentialsType', function () {
            it('should return iam credentials type', function () {
                assert.strictEqual(service.getCredentialsType(), 'iam')
            })
        })

        describe('generateCompletionsAndEdits', function () {
            it('should delegate to generateSuggestions', async function () {
                const mockRequest: GenerateSuggestionsRequest = {
                    fileContext: {
                        filename: 'test.js',
                        programmingLanguage: { languageName: 'javascript' },
                        leftFileContent: 'const x = ',
                        rightFileContent: '',
                    },
                    maxResults: 5,
                }

                const mockTextDocument: TextDocument = {
                    uri: 'file:///test.js',
                    languageId: 'javascript',
                    version: 1,
                    getText: () => 'const x = ',
                    positionAt: sandbox.stub(),
                    offsetAt: sandbox.stub(),
                    lineCount: 1,
                }

                // Mock the generateSuggestions method
                const generateSuggestionsStub = sandbox.stub(service, 'generateSuggestions')
                const expectedResponse: GenerateSuggestionsResponse = {
                    suggestions: [],
                    suggestionType: SuggestionType.COMPLETION,
                    responseContext: { requestId: 'test', codewhispererSessionId: 'test' },
                }
                generateSuggestionsStub.resolves(expectedResponse)

                const result = await service.generateCompletionsAndEdits(mockTextDocument, mockRequest, {
                    enablePrefetch: false,
                })

                assert.strictEqual(generateSuggestionsStub.calledOnceWith(mockRequest), true)
                assert.deepStrictEqual(result, expectedResponse)
            })
        })

        describe('generateSuggestions', function () {
            it('should call client.generateRecommendations and process response', async function () {
                const mockRequest: GenerateSuggestionsRequest = {
                    fileContext: {
                        filename: 'test.js',
                        programmingLanguage: { languageName: 'javascript' },
                        leftFileContent: 'const x = ',
                        rightFileContent: '',
                    },
                    maxResults: 5,
                }

                const result = await service.generateSuggestions(mockRequest)

                assert.strictEqual(result.suggestionType, SuggestionType.COMPLETION)
                assert.strictEqual(Array.isArray(result.suggestions), true)
                assert.strictEqual(typeof result.responseContext.requestId, 'string')
                assert.strictEqual(typeof result.responseContext.codewhispererSessionId, 'string')
            })

            it('should add customizationArn to request if set', async function () {
                service.customizationArn = 'test-arn'

                const mockRequest: GenerateSuggestionsRequest = {
                    fileContext: {
                        filename: 'test.js',
                        programmingLanguage: { languageName: 'javascript' },
                        leftFileContent: 'const x = ',
                        rightFileContent: '',
                    },
                    maxResults: 5,
                }

                await service.generateSuggestions(mockRequest)

                // Verify that the client was called with the customizationArn
                const clientCall = (service.client.generateRecommendations as sinon.SinonStub).getCall(0)
                assert.strictEqual(clientCall.args[0].customizationArn, 'test-arn')
            })
        })

        describe('clearCachedSuggestions', function () {
            it('should not throw error (no-op for IAM)', function () {
                assert.doesNotThrow(() => {
                    service.clearCachedSuggestions()
                })
            })
        })
    })

    describe('CodeWhispererServiceToken', function () {
        let service: CodeWhispererServiceToken
        let mockClient: any

        beforeEach(function () {
            // Mock the token client
            mockClient = {
                generateCompletions: sandbox.stub().returns({
                    promise: sandbox.stub().resolves({
                        completions: [
                            {
                                content: 'console.log("hello");',
                                references: [],
                            },
                        ],
                        $response: {
                            requestId: 'test-request-id',
                            httpResponse: {
                                headers: { 'x-amzn-sessionid': 'test-session-id' },
                            },
                        },
                    }),
                }),
                config: {
                    update: sandbox.stub(),
                },
            }

            // Mock the client creation
            const createTokenClientStub = sandbox.stub(
                require('../client/token/codewhisperer'),
                'createCodeWhispererTokenClient'
            )
            createTokenClientStub.returns(mockClient)

            // Mock bearer credentials
            mockCredentialsProvider.getCredentials.returns({
                token: 'mock-bearer-token',
            })

            service = new CodeWhispererServiceToken(
                mockCredentialsProvider as any,
                mockWorkspace as any,
                mockLogging as any,
                'us-east-1',
                'https://codewhisperer.us-east-1.amazonaws.com',
                mockSDKInitializator as any
            )
        })

        describe('getCredentialsType', function () {
            it('should return bearer credentials type', function () {
                assert.strictEqual(service.getCredentialsType(), 'bearer')
            })
        })

        describe('generateCompletionsAndEdits', function () {
            it('should call generateSuggestions when prefetch is disabled', async function () {
                const mockRequest: GenerateSuggestionsRequest = {
                    fileContext: {
                        filename: 'test.js',
                        programmingLanguage: { languageName: 'javascript' },
                        leftFileContent: 'const x = ',
                        rightFileContent: '',
                    },
                    maxResults: 5,
                }

                const mockTextDocument: TextDocument = {
                    uri: 'file:///test.js',
                    languageId: 'javascript',
                    version: 1,
                    getText: () => 'const x = ',
                    positionAt: sandbox.stub(),
                    offsetAt: sandbox.stub(),
                    lineCount: 1,
                }

                const generateSuggestionsStub = sandbox.stub(service, 'generateSuggestions')
                const expectedResponse: GenerateSuggestionsResponse = {
                    suggestions: [],
                    suggestionType: SuggestionType.COMPLETION,
                    responseContext: { requestId: 'test', codewhispererSessionId: 'test' },
                }
                generateSuggestionsStub.resolves(expectedResponse)

                const result = await service.generateCompletionsAndEdits(mockTextDocument, mockRequest, {
                    enablePrefetch: false,
                })

                assert.strictEqual(generateSuggestionsStub.calledOnceWith(mockRequest), true)
                assert.deepStrictEqual(result, expectedResponse)
            })

            it('should call generateSuggestionsAndPrefetch when prefetch is enabled', async function () {
                const mockRequest: GenerateSuggestionsRequest = {
                    fileContext: {
                        filename: 'test.js',
                        programmingLanguage: { languageName: 'javascript' },
                        leftFileContent: 'const x = ',
                        rightFileContent: '',
                    },
                    maxResults: 5,
                }

                const mockTextDocument: TextDocument = {
                    uri: 'file:///test.js',
                    languageId: 'javascript',
                    version: 1,
                    getText: () => 'const x = ',
                    positionAt: sandbox.stub(),
                    offsetAt: sandbox.stub(),
                    lineCount: 1,
                }

                const generateSuggestionsAndPrefetchStub = sandbox.stub(
                    service,
                    'generateSuggestionsAndPrefetch' as any
                )
                const expectedResponse: GenerateSuggestionsResponse = {
                    suggestions: [],
                    suggestionType: SuggestionType.COMPLETION,
                    responseContext: { requestId: 'test', codewhispererSessionId: 'test' },
                }
                generateSuggestionsAndPrefetchStub.resolves(expectedResponse)

                const result = await service.generateCompletionsAndEdits(mockTextDocument, mockRequest, {
                    enablePrefetch: true,
                })

                assert.strictEqual(
                    generateSuggestionsAndPrefetchStub.calledOnceWith(mockTextDocument, mockRequest),
                    true
                )
                assert.deepStrictEqual(result, expectedResponse)
            })
        })

        describe('generateSuggestions', function () {
            it('should call client.generateCompletions and process response', async function () {
                const mockRequest: GenerateSuggestionsRequest = {
                    fileContext: {
                        filename: 'test.js',
                        programmingLanguage: { languageName: 'javascript' },
                        leftFileContent: 'const x = ',
                        rightFileContent: '',
                    },
                    maxResults: 5,
                }

                const result = await service.generateSuggestions(mockRequest)

                assert.strictEqual(mockClient.generateCompletions.calledOnce, true)
                assert.strictEqual(result.suggestionType, SuggestionType.COMPLETION)
                assert.strictEqual(Array.isArray(result.suggestions), true)
                assert.strictEqual(typeof result.responseContext.requestId, 'string')
                assert.strictEqual(typeof result.responseContext.codewhispererSessionId, 'string')
            })

            it('should add customizationArn to request if set', async function () {
                service.customizationArn = 'test-arn'

                const mockRequest: GenerateSuggestionsRequest = {
                    fileContext: {
                        filename: 'test.js',
                        programmingLanguage: { languageName: 'javascript' },
                        leftFileContent: 'const x = ',
                        rightFileContent: '',
                    },
                    maxResults: 5,
                }

                await service.generateSuggestions(mockRequest)

                const clientCall = mockClient.generateCompletions.getCall(0)
                assert.strictEqual(clientCall.args[0].customizationArn, 'test-arn')
            })

            it('should process profile ARN with withProfileArn method', async function () {
                const mockRequest: GenerateSuggestionsRequest = {
                    fileContext: {
                        filename: 'test.js',
                        programmingLanguage: { languageName: 'javascript' },
                        leftFileContent: 'const x = ',
                        rightFileContent: '',
                    },
                    maxResults: 5,
                }

                const withProfileArnStub = sandbox.stub(service, 'withProfileArn' as any)
                withProfileArnStub.returns(mockRequest)

                await service.generateSuggestions(mockRequest)

                assert.strictEqual(withProfileArnStub.calledOnceWith(mockRequest), true)
            })
        })

        describe('clearCachedSuggestions', function () {
            it('should clear prefetch suggestions', function () {
                // Add some mock suggestions to clear
                ;(service as any).prefetchSuggestions = [{ id: 'test' }]

                service.clearCachedSuggestions()

                assert.strictEqual((service as any).prefetchSuggestions.length, 0)
            })
        })

        describe('cancellation handling', function () {
            it('should handle token cancellation', function () {
                const tokenSrc = (service as any).tokenSrc as CancellationTokenSource
                const token = (service as any).token as CancellationToken

                assert.strictEqual(token.isCancellationRequested, false)

                tokenSrc.cancel()

                assert.strictEqual(token.isCancellationRequested, true)
            })
        })

        describe('prefetch configuration', function () {
            it('should have default prefetch configuration', function () {
                const config = (service as any).prefetchConfig

                assert.strictEqual(typeof config.duration, 'number')
                assert.strictEqual(typeof config.maxCacheSuggestionSize, 'number')
                assert.strictEqual(typeof config.maxRecursiveCallDepth, 'number')
                assert.strictEqual(config.duration, 100)
                assert.strictEqual(config.maxCacheSuggestionSize, 3)
                assert.strictEqual(config.maxRecursiveCallDepth, 5)
            })
        })
    })
})
