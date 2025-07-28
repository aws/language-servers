/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { CredentialsType } from '@aws/language-server-runtimes/server-interface'
import { AWSError, ConfigurationOptions } from 'aws-sdk'
import * as sinon from 'sinon'
import * as assert from 'assert'
import { PromiseResult } from 'aws-sdk/lib/request'
import {
    CodeWhispererServiceBase,
    GenerateSuggestionsResponse,
    CreateUploadUrlRequest,
    CreateUploadUrlResponse,
    StartTransformationRequest,
    StartTransformationResponse,
    StopTransformationRequest,
    StopTransformationResponse,
    GetTransformationRequest,
    GetTransformationResponse,
    GetTransformationPlanRequest,
    GetTransformationPlanResponse,
    StartCodeAnalysisRequest,
    StartCodeAnalysisResponse,
    GetCodeAnalysisRequest,
    GetCodeAnalysisResponse,
    ListCodeAnalysisFindingsRequest,
    ListCodeAnalysisFindingsResponse,
    ListAvailableCustomizationsRequest,
    ListAvailableCustomizationsResponse,
    ListAvailableProfilesRequest,
    SendTelemetryEventRequest,
    SendTelemetryEventResponse,
    CreateWorkspaceRequest,
    CreateWorkspaceResponse,
    ListWorkspaceMetadataRequest,
    ListWorkspaceMetadataResponse,
    DeleteWorkspaceRequest,
    DeleteWorkspaceResponse,
    ListFeatureEvaluationsRequest,
    ListFeatureEvaluationsResponse,
    CreateSubscriptionTokenRequest,
    CreateSubscriptionTokenResponse,
} from './codeWhispererServiceBase'

describe('CodeWhispererServiceBase', function () {
    // Create the environment
    let sandbox: sinon.SinonSandbox
    let service: CodeWhispererServiceBase

    beforeEach(function () {
        sandbox = sinon.createSandbox()

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
                    responseContext: { requestId: 'test', codewhispererSessionId: 'test' },
                }
            }

            async generateSuggestions(): Promise<GenerateSuggestionsResponse> {
                return {
                    suggestions: [],
                    responseContext: { requestId: 'test', codewhispererSessionId: 'test' },
                }
            }

            clearCachedSuggestions(): void {}

            override codeModernizerCreateUploadUrl(request: CreateUploadUrlRequest): Promise<CreateUploadUrlResponse> {
                throw new Error('Method not implemented.')
            }
            override codeModernizerStartCodeTransformation(
                request: StartTransformationRequest
            ): Promise<PromiseResult<StartTransformationResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override codeModernizerStopCodeTransformation(
                request: StopTransformationRequest
            ): Promise<PromiseResult<StopTransformationResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override codeModernizerGetCodeTransformation(
                request: GetTransformationRequest
            ): Promise<PromiseResult<GetTransformationResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override codeModernizerGetCodeTransformationPlan(
                request: GetTransformationPlanRequest
            ): Promise<PromiseResult<GetTransformationPlanResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override createUploadUrl(
                request: CreateUploadUrlRequest
            ): Promise<PromiseResult<CreateUploadUrlResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override startCodeAnalysis(
                request: StartCodeAnalysisRequest
            ): Promise<PromiseResult<StartCodeAnalysisResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override getCodeAnalysis(
                request: GetCodeAnalysisRequest
            ): Promise<PromiseResult<GetCodeAnalysisResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override listCodeAnalysisFindings(
                request: ListCodeAnalysisFindingsRequest
            ): Promise<PromiseResult<ListCodeAnalysisFindingsResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override listAvailableCustomizations(
                request: ListAvailableCustomizationsRequest
            ): Promise<PromiseResult<ListAvailableCustomizationsResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override listAvailableProfiles(
                request: ListAvailableProfilesRequest
            ): Promise<PromiseResult<ListAvailableProfilesRequest, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override sendTelemetryEvent(
                request: SendTelemetryEventRequest
            ): Promise<PromiseResult<SendTelemetryEventResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override createWorkspace(
                request: CreateWorkspaceRequest
            ): Promise<PromiseResult<CreateWorkspaceResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override listWorkspaceMetadata(
                request: ListWorkspaceMetadataRequest
            ): Promise<PromiseResult<ListWorkspaceMetadataResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override deleteWorkspace(
                request: DeleteWorkspaceRequest
            ): Promise<PromiseResult<DeleteWorkspaceResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override listFeatureEvaluations(
                request: ListFeatureEvaluationsRequest
            ): Promise<PromiseResult<ListFeatureEvaluationsResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
            override createSubscriptionToken(
                request: CreateSubscriptionTokenRequest
            ): Promise<PromiseResult<CreateSubscriptionTokenResponse, AWSError>> {
                throw new Error('Method not implemented.')
            }
        }

        service = new TestCodeWhispererService('us-east-1', 'https://codewhisperer.us-east-1.amazonaws.com')
    })

    afterEach(function () {
        sandbox.restore()
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
