/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    CredentialsProvider,
    Workspace,
    Logging,
    SDKInitializator,
} from '@aws/language-server-runtimes/server-interface'
import * as sinon from 'sinon'
import * as assert from 'assert'
import { CodeWhispererServiceToken } from './codeWhispererServiceToken'
import { GenerateSuggestionsRequest } from './codeWhispererServiceBase'

describe('CodeWhispererServiceToken', function () {
    let sandbox: sinon.SinonSandbox
    let mockCredentialsProvider: sinon.SinonStubbedInstance<CredentialsProvider>
    let mockWorkspace: sinon.SinonStubbedInstance<Workspace>
    let mockLogging: sinon.SinonStubbedInstance<Logging>
    let mockSDKInitializator: sinon.SinonStubbedInstance<SDKInitializator>
    let service: CodeWhispererServiceToken
    let mockClient: any

    beforeEach(function () {
        // Create the environment
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
            require('../../client/token/codewhisperer'),
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

    afterEach(function () {
        sandbox.restore()
    })

    describe('getCredentialsType', function () {
        it('should return bearer credentials type', function () {
            assert.strictEqual(service.getCredentialsType(), 'bearer')
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
})
