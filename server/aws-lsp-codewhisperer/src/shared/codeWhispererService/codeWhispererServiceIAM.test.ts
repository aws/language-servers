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
import { GenerateSuggestionsRequest } from './codeWhispererServiceBase'
import { CodeWhispererServiceIAM } from './codeWhispererServiceIAM'

describe('CodeWhispererServiceIAM', function () {
    let sandbox: sinon.SinonSandbox
    let mockCredentialsProvider: sinon.SinonStubbedInstance<CredentialsProvider>
    let mockWorkspace: sinon.SinonStubbedInstance<Workspace>
    let mockLogging: sinon.SinonStubbedInstance<Logging>
    let mockSDKInitializator: sinon.SinonStubbedInstance<SDKInitializator>
    let service: CodeWhispererServiceIAM

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
            require('../../client/sigv4/codewhisperer'),
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

    afterEach(function () {
        sandbox.restore()
    })

    describe('getCredentialsType', function () {
        it('should return iam credentials type', function () {
            assert.strictEqual(service.getCredentialsType(), 'iam')
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
})
