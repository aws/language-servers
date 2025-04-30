import * as assert from 'assert'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { AmazonQTokenServiceManager } from './AmazonQTokenServiceManager'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererServiceToken, GenerateSuggestionsRequest } from '../codeWhispererService'
import {
    AmazonQServiceInitializationError,
    AmazonQServicePendingProfileError,
    AmazonQServicePendingProfileUpdateError,
    AmazonQServicePendingSigninError,
} from './errors'
import {
    CancellationToken,
    InitializeParams,
    LSPErrorCodes,
    ResponseError,
} from '@aws/language-server-runtimes/protocol'
import {
    AWS_Q_ENDPOINT_URL_ENV_VAR,
    AWS_Q_ENDPOINTS,
    AWS_Q_REGION_ENV_VAR,
    DEFAULT_AWS_Q_ENDPOINT_URL,
    DEFAULT_AWS_Q_REGION,
} from '../constants'
import * as qDeveloperProfilesFetcherModule from './qDeveloperProfiles'
import { setCredentialsForAmazonQTokenServiceManagerFactory } from '../testUtils'
import { StreamingClientServiceToken } from '../streamingClientService'
import { generateSingletonInitializationTests } from './testUtils'

export const mockedProfiles: qDeveloperProfilesFetcherModule.AmazonQDeveloperProfile[] = [
    {
        arn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
        name: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
        identityDetails: {
            region: 'us-east-1',
        },
    },
    {
        arn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ-2',
        name: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ-2',
        identityDetails: {
            region: 'us-east-1',
        },
    },
    {
        arn: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
        name: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
        identityDetails: {
            region: 'eu-central-1',
        },
    },
]

const TEST_ENDPOINT_US_EAST_1 = 'http://amazon-q-in-us-east-1-endpoint'
const TEST_ENDPOINT_EU_CENTRAL_1 = 'http://amazon-q-in-eu-central-1-endpoint'

describe('AmazonQTokenServiceManager', () => {
    let codewhispererServiceStub: StubbedInstance<CodeWhispererServiceToken>
    let codewhispererStubFactory: sinon.SinonStub<any[], StubbedInstance<CodeWhispererServiceToken>>
    let sdkInitializatorSpy: sinon.SinonSpy
    let getListAllAvailableProfilesHandlerStub: sinon.SinonStub

    let amazonQTokenServiceManager: AmazonQTokenServiceManager
    let features: TestFeatures

    beforeEach(() => {
        // Override endpoints for testing
        AWS_Q_ENDPOINTS.set('us-east-1', TEST_ENDPOINT_US_EAST_1)
        AWS_Q_ENDPOINTS.set('eu-central-1', TEST_ENDPOINT_EU_CENTRAL_1)

        getListAllAvailableProfilesHandlerStub = sinon
            .stub()
            .resolves(
                Promise.resolve(mockedProfiles).then(() =>
                    new Promise(resolve => setTimeout(resolve, 1)).then(() => mockedProfiles)
                )
            )

        sinon
            .stub(qDeveloperProfilesFetcherModule, 'getListAllAvailableProfilesHandler')
            .returns(getListAllAvailableProfilesHandlerStub)

        AmazonQTokenServiceManager.resetInstance()

        features = new TestFeatures()

        sdkInitializatorSpy = Object.assign(sinon.spy(features.sdkInitializator), {
            v2: sinon.spy(features.sdkInitializator.v2),
        })

        codewhispererServiceStub = stubInterface<CodeWhispererServiceToken>()
        // @ts-ignore
        codewhispererServiceStub.client = sinon.stub()
        codewhispererServiceStub.customizationArn = undefined
        codewhispererServiceStub.shareCodeWhispererContentWithAWS = false
        codewhispererServiceStub.profileArn = undefined

        // Initialize the class with mocked dependencies
        codewhispererStubFactory = sinon.stub().returns(codewhispererServiceStub)
    })

    afterEach(() => {
        AmazonQTokenServiceManager.resetInstance()
        features.dispose()
        sinon.restore()
    })

    const setupServiceManager = (enableProfiles = false) => {
        // @ts-ignore
        const cachedInitializeParams: InitializeParams = {
            initializationOptions: {
                aws: {
                    awsClientCapabilities: {
                        q: {
                            developerProfiles: enableProfiles,
                        },
                    },
                },
            },
        }
        features.setClientParams(cachedInitializeParams)

        AmazonQTokenServiceManager.initInstance(features)
        amazonQTokenServiceManager = AmazonQTokenServiceManager.getInstance()
        amazonQTokenServiceManager.setServiceFactory(codewhispererStubFactory)
    }

    const setCredentials = setCredentialsForAmazonQTokenServiceManagerFactory(() => features)

    const clearCredentials = () => {
        features.credentialsProvider.hasCredentials.returns(false)
        features.credentialsProvider.getCredentials.returns(undefined)
        features.credentialsProvider.getConnectionType.returns('none')
    }

    const setupServiceManagerWithProfile = async (
        profileArn = 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ'
    ): Promise<CodeWhispererServiceToken> => {
        setupServiceManager(true)
        assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

        setCredentials('identityCenter')

        await amazonQTokenServiceManager.handleOnUpdateConfiguration(
            {
                section: 'aws.q',
                settings: {
                    profileArn: profileArn,
                },
            },
            {} as CancellationToken
        )

        const service = amazonQTokenServiceManager.getCodewhispererService()
        assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
        assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')

        return service
    }

    describe('Initialization process', () => {
        generateSingletonInitializationTests(AmazonQTokenServiceManager)
    })

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

    describe('Clear state upon bearer token deletion', () => {
        let cancelActiveProfileChangeTokenSpy: sinon.SinonSpy

        beforeEach(() => {
            setupServiceManager()
            assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

            cancelActiveProfileChangeTokenSpy = sinon.spy(
                amazonQTokenServiceManager as any,
                'cancelActiveProfileChangeToken'
            )

            setCredentials('builderId')
        })

        it('should clear local state variables on receiving bearer token deletion event', () => {
            amazonQTokenServiceManager.getCodewhispererService()

            amazonQTokenServiceManager.handleOnCredentialsDeleted('bearer')

            assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')
            assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'none')
            assert.strictEqual((amazonQTokenServiceManager as any)['cachedCodewhispererService'], undefined)
            assert.strictEqual((amazonQTokenServiceManager as any)['cachedStreamingClient'], undefined)
            assert.strictEqual((amazonQTokenServiceManager as any)['activeIdcProfile'], undefined)
            sinon.assert.calledOnce(cancelActiveProfileChangeTokenSpy)
        })

        it('should not clear local state variables on receiving iam token deletion event', () => {
            amazonQTokenServiceManager.getCodewhispererService()

            amazonQTokenServiceManager.handleOnCredentialsDeleted('iam')

            assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
            assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'builderId')
            assert(!(amazonQTokenServiceManager['cachedCodewhispererService'] === undefined))
            assert.strictEqual((amazonQTokenServiceManager as any)['activeIdcProfile'], undefined)
            sinon.assert.notCalled(cancelActiveProfileChangeTokenSpy)
        })
    })

    describe('BuilderId support', () => {
        const testRegion = 'some-region'
        const testEndpoint = 'http://some-endpoint-in-some-region'

        beforeEach(() => {
            setupServiceManager()
            assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

            setCredentials('builderId')

            AWS_Q_ENDPOINTS.set(testRegion, testEndpoint)

            features.lsp.getClientInitializeParams.reset()
        })

        it('should be INITIALIZED with BuilderId Connection', async () => {
            const service = amazonQTokenServiceManager.getCodewhispererService()
            const streamingClient = amazonQTokenServiceManager.getStreamingClient()

            await service.generateSuggestions({} as GenerateSuggestionsRequest)

            assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
            assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'builderId')

            assert(streamingClient instanceof StreamingClientServiceToken)
            assert(codewhispererServiceStub.generateSuggestions.calledOnce)
        })

        it('should initialize service with region set by client', async () => {
            features.setClientParams({
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

            const streamingClient = amazonQTokenServiceManager.getStreamingClient()
            assert.strictEqual(await streamingClient.client.config.region(), testRegion)
            assert.strictEqual(
                (await streamingClient.client.config.endpoint()).hostname,
                'some-endpoint-in-some-region'
            )
        })

        it('should initialize service with region set by runtime if not set by client', async () => {
            features.runtime.getConfiguration.withArgs(AWS_Q_REGION_ENV_VAR).returns('eu-central-1')
            features.runtime.getConfiguration.withArgs(AWS_Q_ENDPOINT_URL_ENV_VAR).returns(TEST_ENDPOINT_EU_CENTRAL_1)

            amazonQTokenServiceManager.getCodewhispererService()
            assert(codewhispererStubFactory.calledOnceWithExactly('eu-central-1', TEST_ENDPOINT_EU_CENTRAL_1))

            const streamingClient = amazonQTokenServiceManager.getStreamingClient()
            assert.strictEqual(await streamingClient.client.config.region(), 'eu-central-1')
            assert.strictEqual(
                (await streamingClient.client.config.endpoint()).hostname,
                'amazon-q-in-eu-central-1-endpoint'
            )
        })

        it('should initialize service with default region if not set by client and runtime', async () => {
            amazonQTokenServiceManager.getCodewhispererService()
            const streamingClient = amazonQTokenServiceManager.getStreamingClient()

            assert(codewhispererStubFactory.calledOnceWithExactly(DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL))

            assert.strictEqual(await streamingClient.client.config.region(), DEFAULT_AWS_Q_REGION)
            assert.strictEqual(
                (await streamingClient.client.config.endpoint()).hostname,
                'codewhisperer.us-east-1.amazonaws.com'
            )
        })
    })

    describe('IdentityCenter support', () => {
        describe('Developer Profiles Support is disabled', () => {
            it('should be INITIALIZED with IdentityCenter Connection', async () => {
                setupServiceManager()
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                const service = amazonQTokenServiceManager.getCodewhispererService()
                const streamingClient = amazonQTokenServiceManager.getStreamingClient()

                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert(codewhispererServiceStub.generateSuggestions.calledOnce)

                assert(streamingClient instanceof StreamingClientServiceToken)
            })
        })

        describe('Developer Profiles Support is enabled', () => {
            it('should not throw when receiving null profile arn in PENDING_CONNECTION state', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                await assert.doesNotReject(
                    amazonQTokenServiceManager.handleOnUpdateConfiguration(
                        {
                            section: 'aws.q',
                            settings: {
                                profileArn: null,
                            },
                        },
                        {} as CancellationToken
                    )
                )

                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')
            })

            it('should initialize to PENDING_Q_PROFILE state when IdentityCenter Connection is set', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileError
                )
                assert.throws(() => amazonQTokenServiceManager.getStreamingClient(), AmazonQServicePendingProfileError)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
            })

            it('handles Profile configuration request for valid profile and initializes to INITIALIZED state', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQTokenServiceManager.getCodewhispererService()
                const streamingClient = amazonQTokenServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                assert(streamingClient instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')
            })

            it('handles Profile configuration request for valid profile & cancels the old in-flight update request', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')
                assert.strictEqual((amazonQTokenServiceManager as any)['profileChangeTokenSource'], undefined)

                let firstRequestStarted = false
                const originalHandleProfileChange = amazonQTokenServiceManager['handleProfileChange']
                amazonQTokenServiceManager['handleProfileChange'] = async (...args) => {
                    firstRequestStarted = true
                    return originalHandleProfileChange.apply(amazonQTokenServiceManager, args)
                }
                const firstUpdate = amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )
                while (!firstRequestStarted) {
                    await new Promise(resolve => setTimeout(resolve, 1))
                }
                const secondUpdate = amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )
                const results = await Promise.allSettled([firstUpdate, secondUpdate])

                assert.strictEqual((amazonQTokenServiceManager as any)['profileChangeTokenSource'], undefined)
                const service = amazonQTokenServiceManager.getCodewhispererService()
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert(codewhispererStubFactory.calledOnceWithExactly('eu-central-1', TEST_ENDPOINT_EU_CENTRAL_1))

                assert.strictEqual(results[0].status, 'rejected')
                assert(results[0].reason.message, 'Requested profile update got cancelled')
                assert.strictEqual(results[1].status, 'fulfilled')
            })

            it('handles Profile configuration change to valid profile in same region', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQTokenServiceManager.getCodewhispererService()
                const streamingClient1 = amazonQTokenServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQTokenServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ'
                )

                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))
                assert(streamingClient1 instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient1.client.config.region(), 'us-east-1')

                // Profile change

                await amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ-2',
                        },
                    },
                    {} as CancellationToken
                )
                await service.generateSuggestions({} as GenerateSuggestionsRequest)
                const streamingClient2 = amazonQTokenServiceManager.getStreamingClient()

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQTokenServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ-2'
                )

                // CodeWhisperer Service was not recreated
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                assert(streamingClient2 instanceof StreamingClientServiceToken)
                assert.strictEqual(streamingClient1, streamingClient2)
                assert.strictEqual(await streamingClient2.client.config.region(), 'us-east-1')
            })

            it('handles Profile configuration change to valid profile in different region', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQTokenServiceManager.getCodewhispererService()
                const streamingClient1 = amazonQTokenServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQTokenServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ'
                )
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                assert(streamingClient1 instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient1.client.config.region(), 'us-east-1')

                // Profile change

                await amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )
                await service.generateSuggestions({} as GenerateSuggestionsRequest)
                const streamingClient2 = amazonQTokenServiceManager.getStreamingClient()

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQTokenServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ'
                )

                // CodeWhisperer Service was recreated
                assert(codewhispererStubFactory.calledTwice)
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, [
                    'eu-central-1',
                    TEST_ENDPOINT_EU_CENTRAL_1,
                ])

                // Streaming Client was recreated
                assert(streamingClient2 instanceof StreamingClientServiceToken)
                assert.notStrictEqual(streamingClient1, streamingClient2)
                assert.strictEqual(await streamingClient2.client.config.region(), 'eu-central-1')
            })

            it('handles Profile configuration change from valid to invalid profile', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                let service = amazonQTokenServiceManager.getCodewhispererService()
                const streamingClient = amazonQTokenServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQTokenServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ'
                )
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                assert(streamingClient instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')

                // Profile change to invalid profile

                await assert.rejects(
                    amazonQTokenServiceManager.handleOnUpdateConfiguration(
                        {
                            section: 'aws.q',
                            settings: {
                                profileArn:
                                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/invalid-profile-arn',
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
                assert.throws(() => amazonQTokenServiceManager.getStreamingClient(), AmazonQServicePendingProfileError)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                // CodeWhisperer Service was not recreated
                assert(codewhispererStubFactory.calledOnce)
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, ['us-east-1', TEST_ENDPOINT_US_EAST_1])
            })

            it('handles non-existing profile selection', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await assert.rejects(
                    amazonQTokenServiceManager.handleOnUpdateConfiguration(
                        {
                            section: 'aws.q',
                            settings: {
                                profileArn:
                                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/invalid-profile-arn',
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
                assert.throws(() => amazonQTokenServiceManager.getStreamingClient(), AmazonQServicePendingProfileError)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.notCalled)
            })

            it('prevents service usage while profile change is inflight when profile was not set', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileError
                )
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')

                await amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                const pendingProfileUpdate = amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )
                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileUpdateError
                )
                assert.throws(
                    () => amazonQTokenServiceManager.getStreamingClient(),
                    AmazonQServicePendingProfileUpdateError
                )

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE_UPDATE')

                await pendingProfileUpdate

                const service = amazonQTokenServiceManager.getCodewhispererService()
                const streamingClient = amazonQTokenServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQTokenServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ'
                )
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, [
                    'eu-central-1',
                    TEST_ENDPOINT_EU_CENTRAL_1,
                ])

                assert(streamingClient instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient.client.config.region(), 'eu-central-1')
            })

            it('prevents service usage while profile change is inflight when profile was set before', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileError
                )
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')

                await amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQTokenServiceManager.getCodewhispererService()
                const streamingClient = amazonQTokenServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQTokenServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ'
                )
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, ['us-east-1', TEST_ENDPOINT_US_EAST_1])

                assert(streamingClient instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')

                // Updaing profile
                const pendingProfileUpdate = amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )
                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileUpdateError
                )
                assert.throws(
                    () => amazonQTokenServiceManager.getStreamingClient(),
                    AmazonQServicePendingProfileUpdateError
                )

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE_UPDATE')

                await pendingProfileUpdate
            })

            it('resets to PENDING_PROFILE from INITIALIZED when receiving null profileArn', async () => {
                await setupServiceManagerWithProfile()

                await amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: null,
                        },
                    },
                    {} as CancellationToken
                )

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)
                sinon.assert.calledOnce(codewhispererServiceStub.abortInflightRequests)
            })

            it('resets to PENDING_Q_PROFILE from PENDING_Q_PROFILE_UPDATE when receiving null profileArn', async () => {
                await setupServiceManagerWithProfile()

                const pendingUpdate = amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE_UPDATE')

                const nullRequest = amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: null,
                        },
                    },
                    {} as CancellationToken
                )

                await Promise.allSettled([pendingUpdate, nullRequest])

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)
                sinon.assert.calledOnce(codewhispererServiceStub.abortInflightRequests)
                assert.throws(() => amazonQTokenServiceManager.getCodewhispererService())
            })

            it('cancels on-going profile update when credentials are deleted', async () => {
                await setupServiceManagerWithProfile()

                const pendingUpdate = amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_Q_PROFILE_UPDATE')

                amazonQTokenServiceManager.handleOnCredentialsDeleted('bearer')

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                await assert.rejects(() => pendingUpdate)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)
                sinon.assert.calledOnce(codewhispererServiceStub.abortInflightRequests)
                assert.throws(() => amazonQTokenServiceManager.getCodewhispererService())
            })

            it('fetches profiles only from 1 region associated with requested profileArn', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                sinon.assert.calledOnceWithMatch(getListAllAvailableProfilesHandlerStub, {
                    endpoints: new Map([['us-east-1', TEST_ENDPOINT_US_EAST_1]]),
                })
            })
        })
    })

    describe('Connection types with no Developer Profiles support', () => {
        it('returns error when profile update is requested and connection type is none', async () => {
            setupServiceManager(true)
            clearCredentials()

            assert.strictEqual(amazonQTokenServiceManager.getState(), 'PENDING_CONNECTION')

            await assert.rejects(
                amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
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
                amazonQTokenServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
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
                const streamingClient = amazonQTokenServiceManager.getStreamingClient()
                await service1.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'builderId')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                assert(streamingClient instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')

                setCredentials('identityCenter')
                let service2 = amazonQTokenServiceManager.getCodewhispererService()
                const streamingClient2 = amazonQTokenServiceManager.getStreamingClient()

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.calledTwice)
                assert(codewhispererStubFactory.calledWithExactly(DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL))

                assert(streamingClient2 instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient2.client.config.region(), DEFAULT_AWS_Q_REGION)
            })

            it('should initialize service to PENDING_Q_PROFILE state when profile support is enabled', async () => {
                setupServiceManager(true)
                setCredentials('builderId')

                let service = amazonQTokenServiceManager.getCodewhispererService()
                const streamingClient = amazonQTokenServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'builderId')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                assert(streamingClient instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')

                setCredentials('identityCenter')

                assert.throws(
                    () => amazonQTokenServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileError
                )
                assert.throws(() => amazonQTokenServiceManager.getStreamingClient(), AmazonQServicePendingProfileError)

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
                const streamingClient = amazonQTokenServiceManager.getStreamingClient()
                await service1.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                assert(streamingClient instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')

                setCredentials('builderId')
                let service2 = amazonQTokenServiceManager.getCodewhispererService()
                const streamingClient2 = amazonQTokenServiceManager.getStreamingClient()

                assert.strictEqual(amazonQTokenServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQTokenServiceManager.getConnectionType(), 'builderId')
                assert.strictEqual(amazonQTokenServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.calledTwice)
                assert(codewhispererStubFactory.calledWithExactly(DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL))

                assert(streamingClient2 instanceof StreamingClientServiceToken)
                assert.strictEqual(await streamingClient2.client.config.region(), 'us-east-1')
            })
        })
    })

    describe('handle LSP Configuration settings', () => {
        it('should initialize codewhisperer service with default configurations when not set by client', async () => {
            setupServiceManager()
            setCredentials('identityCenter')

            await amazonQTokenServiceManager.handleDidChangeConfiguration()

            const service = amazonQTokenServiceManager.getCodewhispererService()

            assert.strictEqual(service.customizationArn, undefined)
            assert.strictEqual(service.shareCodeWhispererContentWithAWS, false)
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

            // Initialize mock server
            setupServiceManager()
            setCredentials('identityCenter')

            amazonQTokenServiceManager = AmazonQTokenServiceManager.getInstance()
            const service = amazonQTokenServiceManager.getCodewhispererService()

            assert.strictEqual(service.customizationArn, undefined)
            assert.strictEqual(service.shareCodeWhispererContentWithAWS, false)

            await amazonQTokenServiceManager.handleDidChangeConfiguration()

            // Force next tick to allow async work inside handleDidChangeConfiguration to complete
            await Promise.resolve()

            assert.strictEqual(service.customizationArn, 'test-customization-arn')
            assert.strictEqual(service.shareCodeWhispererContentWithAWS, true)
        })
    })

    describe('Initialize', () => {
        it('should throw when initialize is called before LSP has been initialized with InitializeParams', () => {
            features.resetClientParams()

            assert.throws(() => AmazonQTokenServiceManager.initInstance(features), AmazonQServiceInitializationError)
        })
    })
})
