import * as assert from 'assert'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { AmazonQTokenServiceManager } from './AmazonQTokenServiceManager'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererServiceToken, GenerateSuggestionsRequest } from '../codeWhispererService'
import {
    AmazonQServicePendingProfileError,
    AmazonQServicePendingProfileUpdateError,
    AmazonQServicePendingSigninError,
} from './errors'
import { CancellationToken, LSPErrorCodes, ResponseError } from '@aws/language-server-runtimes/protocol'
import { AWS_Q_ENDPOINTS, DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../constants'
import { SsoConnectionType } from '@aws/language-server-runtimes/server-interface'
// import * as listAvailableProfilesModule from './listAvailableProfilesMock'
import * as qDeveloperProfilesFetcherModule from './qDeveloperProfiles'

export const mockedProfiles: qDeveloperProfilesFetcherModule.AmazonQDeveloperProfile[] = [
    {
        arn: 'profile-iad',
        name: 'profile-iad',
        identityDetails: {
            region: 'us-east-1',
        },
    },
    {
        arn: 'profile-iad-2',
        name: 'profile-iad',
        identityDetails: {
            region: 'us-east-1',
        },
    },
    {
        arn: 'profile-fra',
        name: 'profile-fra',
        identityDetails: {
            region: 'eu-central-1',
        },
    },
]

const TEST_ENDPOINT_US_EAST_1 = 'amazon-q-in-us-east-1-endpoint'
const TEST_ENDPOINT_EU_CENTRAL_1 = 'amazon-q-in-eu-central-1-endpoint'

describe('AmazonQTokenServiceManager', () => {
    let codewhispererServiceStub: StubbedInstance<CodeWhispererServiceToken>
    let codewhispererStubFactory: sinon.SinonStub<any[], StubbedInstance<CodeWhispererServiceToken>>

    let amazonQTokenServiceManager: AmazonQTokenServiceManager
    let features: TestFeatures

    beforeEach(() => {
        // Override endpoints for testing
        AWS_Q_ENDPOINTS['us-east-1'] = TEST_ENDPOINT_US_EAST_1
        // @ts-ignore
        AWS_Q_ENDPOINTS['eu-central-1'] = TEST_ENDPOINT_EU_CENTRAL_1

        sinon
            .stub(qDeveloperProfilesFetcherModule, 'getListAllAvailableProfilesHandler')
            .returns(sinon.stub().resolves(mockedProfiles))

        AmazonQTokenServiceManager.resetInstance()

        features = new TestFeatures()
        // @ts-ignore
        features.logging = console

        codewhispererServiceStub = stubInterface<CodeWhispererServiceToken>()
        // @ts-ignore
        codewhispererServiceStub.client = sinon.stub()

        // Initialize the class with mocked dependencies
        codewhispererStubFactory = sinon.stub().returns(codewhispererServiceStub)
    })

    afterEach(() => {
        AmazonQTokenServiceManager.resetInstance()
        features.dispose()
        sinon.restore()
    })

    const setupServiceManager = (enableProfiles = false) => {
        amazonQTokenServiceManager = AmazonQTokenServiceManager.getInstance(features, enableProfiles)
        amazonQTokenServiceManager.setServiceFactory(codewhispererStubFactory)
    }

    const setCredentials = (connectionType: SsoConnectionType) => {
        features.credentialsProvider.hasCredentials.returns(true)
        features.credentialsProvider.getConnectionType.returns(connectionType)
        features.credentialsProvider.getCredentials.returns({
            token: 'test-token',
        })
    }

    const clearCredentials = () => {
        features.credentialsProvider.hasCredentials.returns(false)
        features.credentialsProvider.getCredentials.returns(undefined)
        features.credentialsProvider.getConnectionType.returns('none')
    }

    describe('Client is not connected', () => {
        it('should be in PENDING_CONNECTION state when bearer token is not set', () => {
            setupServiceManager()
            assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')
            clearCredentials()

            assert.throws(() => amazonQTokenServiceManager.getCodewhispererService(), AmazonQServicePendingSigninError)
            assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')
            assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'none')
        })
    })

    describe('BuilderId support', () => {
        const testRegion = 'some-region'
        const testEndpoint = 'some-endpoint-in-some-region'

        beforeEach(() => {
            setupServiceManager()
            assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

            setCredentials('builderId')

            // @ts-ignore
            AWS_Q_ENDPOINTS[testRegion] = testEndpoint

            features.lsp.getClientInitializeParams.reset()
        })

        afterEach(() => {
            AmazonQTokenServiceManager.resetInstance()
        })

        it('should be INITIALIZED with BuilderId Connection', async () => {
            const service = amazonQTokenServiceManager.getCodewhispererService()
            await service.generateSuggestions({} as GenerateSuggestionsRequest)

            assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
            assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'builderId')

            assert(codewhispererServiceStub.generateSuggestions.calledOnce)
        })

        it('should initialize service with region set by client', () => {
            features.lsp.getClientInitializeParams.returns({
                processId: 0,
                rootUri: 'some-root-uri',
                capabilities: {},
                initializationOptions: {
                    aws: {
                        region: testRegion,
                    },
                },
            })

            amazonQTokenServiceManager.getCodewhispererService()
            assert(codewhispererStubFactory.calledOnceWithExactly(testRegion, testEndpoint))
        })

        it('should initialize service with region set by runtime if not set by client', () => {
            features.runtime.getConfiguration.withArgs('AWS_Q_REGION').returns('eu-central-1')
            features.runtime.getConfiguration.withArgs('AWS_Q_ENDPOINT_URL').returns(TEST_ENDPOINT_EU_CENTRAL_1)

            amazonQTokenServiceManager.getCodewhispererService()
            assert(codewhispererStubFactory.calledOnceWithExactly('eu-central-1', TEST_ENDPOINT_EU_CENTRAL_1))
        })

        it('should initialize service with default region if not set by client and runtime', () => {
            amazonQTokenServiceManager.getCodewhispererService()
            assert(codewhispererStubFactory.calledOnceWithExactly(DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL))
        })
    })

    describe('IdentityCenter support', () => {
        describe('Developer Profiles Support is disabled', () => {
            it('should be INITIALIZED with IdentityCenter Connection', async () => {
                setupServiceManager()
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                const service = amazonQTokenServiceManager.getCodewhispererService()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')

                assert(codewhispererServiceStub.generateSuggestions.calledOnce)
            })
        })

        describe('Developer Profiles Support is enabled', () => {
            beforeEach(() => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')
            })

            it('should initialize to PENDING_Q_PROFILE state when IdentityCenter Connection is set', async () => {
                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileError
                )
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
            })

            it('handles Profile configuration request for valid profile and initializes to INITIALIZED state', async () => {
                await features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'profile-iad',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQTokenServiceManager.getCodewhispererService()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))
            })

            it('handles Profile configuration change to valid profile in same region', async () => {
                await features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'profile-iad',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQTokenServiceManager.getCodewhispererService()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), 'profile-iad')

                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                // Profile change

                await features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'profile-iad-2',
                        },
                    },
                    {} as CancellationToken
                )
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), 'profile-iad-2')

                // CodeWhisperer Service was not recreated
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))
            })

            it('handles Profile configuration change to valid profile in different region', async () => {
                await features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'profile-iad',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQTokenServiceManager.getCodewhispererService()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), 'profile-iad')
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                // Profile change

                await features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'profile-fra',
                        },
                    },
                    {} as CancellationToken
                )
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), 'profile-fra')

                // CodeWhisperer Service was not recreated
                assert(codewhispererStubFactory.calledTwice)
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, [
                    'eu-central-1',
                    TEST_ENDPOINT_EU_CENTRAL_1,
                ])
            })

            it('handles Profile configuration change from valid to invalid profile', async () => {
                await features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'profile-iad',
                        },
                    },
                    {} as CancellationToken
                )

                let service = amazonQTokenServiceManager.getCodewhispererService()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), 'profile-iad')
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                // Profile change to invalid profile

                await assert.rejects(
                    features.doUpdateConfiguration(
                        {
                            section: 'aws.q',
                            settings: {
                                profileArn: 'invalid-profile-arn',
                            },
                        },
                        {} as CancellationToken
                    ),
                    new ResponseError(LSPErrorCodes.RequestFailed, 'Requested Amazon Q Profile does not exist', {
                        awsErrorCode: 'E_AMAZON_Q_INVALID_PROFILE',
                    })
                )

                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileError
                )

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                // CodeWhisperer Service was not recreated
                assert(codewhispererStubFactory.calledOnce)
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, ['us-east-1', TEST_ENDPOINT_US_EAST_1])
            })

            it('handles invalid profile selection', async () => {
                await assert.rejects(
                    features.doUpdateConfiguration(
                        {
                            section: 'aws.q',
                            settings: {
                                profileArn: 'invalid-profile-arn',
                            },
                        },
                        {} as CancellationToken
                    ),
                    new ResponseError(LSPErrorCodes.RequestFailed, 'Requested Amazon Q Profile does not exist', {
                        awsErrorCode: 'E_AMAZON_Q_INVALID_PROFILE',
                    })
                )

                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileError
                )

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.notCalled)
            })

            it('prevents service usage while profile change is inflight', async () => {
                await features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'profile-iad',
                        },
                    },
                    {} as CancellationToken
                )

                const pendingProfileUpdate = features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'profile-fra',
                        },
                    },
                    {} as CancellationToken
                )
                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileUpdateError
                )

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE_UPDATE')

                await pendingProfileUpdate

                const service = amazonQTokenServiceManager.getCodewhispererService()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), 'profile-fra')
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, [
                    'eu-central-1',
                    TEST_ENDPOINT_EU_CENTRAL_1,
                ])
            })

            it.skip('cancels profile change request when new request comes in', async () => {
                // TODO - race condition during updating profiles
                const profileUpdate1 = features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'profile-iad',
                        },
                    },
                    {} as CancellationToken
                )

                const profileUpdate2 = await features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'profile-fra',
                        },
                    },
                    {} as CancellationToken
                )

                await assert.rejects(
                    profileUpdate1,
                    new ResponseError(LSPErrorCodes.ServerCancelled, 'Cancelled', {
                        awsErrorCode: 'E_AMAZON_Q_PROFILE_UPDATE_CANCELLED',
                    })
                )

                await profileUpdate2

                const service = amazonQTokenServiceManager.getCodewhispererService()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), 'profile-fra')
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, [
                    'eu-central-1',
                    TEST_ENDPOINT_EU_CENTRAL_1,
                ])
            })

            it.skip('cancels inflight API requests to CodeWhisperer when selected region changes')
        })
    })

    describe('Connection types with no Developer Profiles support', () => {
        it('returns error when profile update is requested and connection type is none', async () => {
            setupServiceManager(true)
            clearCredentials()

            assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

            await assert.rejects(
                features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'invalid-profile-arn',
                        },
                    },
                    {} as CancellationToken
                ),
                new ResponseError(LSPErrorCodes.RequestFailed, 'Amazon Q service is not signed in', {
                    awsErrorCode: 'E_AMAZON_Q_PENDING_CONNECTION',
                })
            )

            assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')
        })

        it('returns error when profile update is requested and connection type is builderId', async () => {
            setupServiceManager(true)
            setCredentials('builderId')

            await assert.rejects(
                features.doUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'invalid-profile-arn',
                        },
                    },
                    {} as CancellationToken
                ),
                new ResponseError(
                    LSPErrorCodes.RequestFailed,
                    'Connection type builderId does not support Developer Profiles feature.',
                    {
                        awsErrorCode: 'E_AMAZON_Q_CONNECTION_NO_PROFILE_SUPPORT',
                    }
                )
            )

            assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
            assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'builderId')
        })
    })

    describe('Handle connection type changes', () => {
        describe('connection changes from BuilderId to IdentityCenter', () => {
            it('should initialize service with default region when profile support is disabled', async () => {
                setupServiceManager(false)
                setCredentials('builderId')

                let service1 = amazonQTokenServiceManager.getCodewhispererService()
                await service1.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'builderId')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                setCredentials('identityCenter')
                let service2 = amazonQTokenServiceManager.getCodewhispererService()

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.calledTwice)
                console.log(codewhispererStubFactory.getCalls())
                assert(codewhispererStubFactory.calledWithExactly(DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL))
            })

            it('should initialize service to PENDING_Q_PROFILE state when profile support is enabled', async () => {
                setupServiceManager(true)
                setCredentials('builderId')

                let service1 = amazonQTokenServiceManager.getCodewhispererService()
                await service1.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'builderId')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                setCredentials('identityCenter')

                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileError
                )

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.calledOnce)
                assert(codewhispererStubFactory.calledWithExactly(DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL))
            })
        })

        describe('connection changes from IdentityCenter to BuilderId', () => {
            it('should initialize service in default IAD region', async () => {
                setupServiceManager(false)
                setCredentials('identityCenter')

                let service1 = amazonQTokenServiceManager.getCodewhispererService()
                await service1.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                setCredentials('builderId')
                let service2 = amazonQTokenServiceManager.getCodewhispererService()

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'builderId')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.calledTwice)
                assert(codewhispererStubFactory.calledWithExactly(DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL))
            })
        })

        describe('sign out event support', () => {
            it.skip('should handle sign out event and reset service connection')
        })
    })

    describe('handle LSP Configuration settings', () => {
        it('should initialize codewhisperer service with default configurations when not set by client', async () => {
            amazonQTokenServiceManager = AmazonQTokenServiceManager.getInstance(features, false)
            setCredentials('identityCenter')

            const service = amazonQTokenServiceManager.getCodewhispererService()

            assert.strictEqual(service.customizationArn, undefined)
            assert.strictEqual(service.shareCodeWhispererContentWithAWS, false)
            assert.strictEqual(service.client.config.customUserAgent, 'Amazon Q Language Server')
        })

        it('should returned configured codewhispererService with expected configuration values', async () => {
            const getConfigStub = features.lsp.workspace.getConfiguration
            getConfigStub.withArgs('aws.q').resolves({
                customization: 'test-customization-arn',
                optOutTelemetryPreference: true,
            })
            getConfigStub.withArgs('aws.codeWhisperer').resolves({
                includeSuggestionsWithCodeReferences: true,
                shareCodeWhispererContentWithAWS: true,
            })

            await features.start(sinon.stub().returns(sinon.stub()))

            amazonQTokenServiceManager = AmazonQTokenServiceManager.getInstance(features, false)
            setCredentials('identityCenter')
            const service = amazonQTokenServiceManager.getCodewhispererService()

            assert.strictEqual(service.customizationArn, undefined)
            assert.strictEqual(service.shareCodeWhispererContentWithAWS, false)
            assert.strictEqual(service.client.config.customUserAgent, 'Amazon Q Language Server')

            await amazonQTokenServiceManager.handleDidChangeConfiguration()

            // Force next tick to allow async work inside handleDidChangeConfiguration to complete
            await Promise.resolve()

            assert.strictEqual(service.customizationArn, 'test-customization-arn')
            assert.strictEqual(service.shareCodeWhispererContentWithAWS, true)
            assert.strictEqual(service.client.config.customUserAgent, 'Amazon Q Language Server')
        })
    })
})
