import * as assert from 'assert'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { AmazonQServiceManager } from './AmazonQServiceManager'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererService, GenerateSuggestionsRequest } from '../codeWhispererService'
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
import {
    setTokenCredentialsForAmazonQServiceManagerFactory,
    setIamCredentialsForAmazonQServiceManagerFactory,
} from '../testUtils'
import { StreamingClientService } from '../streamingClientService'
import { generateSingletonInitializationTests } from './testUtils'
import * as utils from '../utils'

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

describe('Token', () => {
    let codewhispererServiceStub: StubbedInstance<CodeWhispererService>
    let codewhispererStubFactory: sinon.SinonStub<any[], StubbedInstance<CodeWhispererService>>
    let sdkInitializatorSpy: sinon.SinonSpy
    let getListAllAvailableProfilesHandlerStub: sinon.SinonStub

    let amazonQServiceManager: AmazonQServiceManager
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

        AmazonQServiceManager.resetInstance()

        features = new TestFeatures()

        sdkInitializatorSpy = Object.assign(sinon.spy(features.sdkInitializator), {
            v2: sinon.spy(features.sdkInitializator.v2),
        })

        codewhispererServiceStub = stubInterface<CodeWhispererService>()
        // @ts-ignore
        codewhispererServiceStub.client = sinon.stub()
        codewhispererServiceStub.customizationArn = undefined
        codewhispererServiceStub.shareCodeWhispererContentWithAWS = false
        codewhispererServiceStub.profileArn = undefined

        // Initialize the class with mocked dependencies
        codewhispererStubFactory = sinon.stub().returns(codewhispererServiceStub)
    })

    afterEach(() => {
        AmazonQServiceManager.resetInstance()
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

        AmazonQServiceManager.initInstance(features)
        amazonQServiceManager = AmazonQServiceManager.getInstance()
        amazonQServiceManager.setServiceFactory(codewhispererStubFactory)
    }

    const setCredentials = setTokenCredentialsForAmazonQServiceManagerFactory(() => features)

    const clearCredentials = () => {
        features.credentialsProvider.hasCredentials.returns(false)
        features.credentialsProvider.getCredentials.returns(undefined)
        features.credentialsProvider.getCredentialsType.returns(undefined)
        features.credentialsProvider.getConnectionType.returns('none')
    }

    const setupServiceManagerWithProfile = async (
        profileArn = 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ'
    ): Promise<CodeWhispererService> => {
        setupServiceManager(true)
        assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

        setCredentials('identityCenter')

        await amazonQServiceManager.handleOnUpdateConfiguration(
            {
                section: 'aws.q',
                settings: {
                    profileArn: profileArn,
                },
            },
            {} as CancellationToken
        )

        const service = amazonQServiceManager.getCodewhispererService()
        assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
        assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')

        return service
    }

    describe('Initialization process', () => {
        generateSingletonInitializationTests(AmazonQServiceManager)
    })

    describe('Client is not connected', () => {
        it('should be in PENDING_CONNECTION state when bearer token is not set', () => {
            setupServiceManager()
            assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')
            clearCredentials()

            assert.throws(() => amazonQServiceManager.getCodewhispererService(), AmazonQServicePendingSigninError)
            assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')
            assert.strictEqual(amazonQServiceManager.getConnectionType(), 'none')
        })
    })

    describe('Clear state upon bearer token deletion', () => {
        let cancelActiveProfileChangeTokenSpy: sinon.SinonSpy

        beforeEach(() => {
            setupServiceManager()
            assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

            cancelActiveProfileChangeTokenSpy = sinon.spy(
                amazonQServiceManager as any,
                'cancelActiveProfileChangeToken'
            )

            setCredentials('builderId')
        })

        it('should clear local state variables on receiving bearer token deletion event', () => {
            amazonQServiceManager.getCodewhispererService()

            amazonQServiceManager.handleOnCredentialsDeleted('bearer')

            assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')
            assert.strictEqual(amazonQServiceManager.getConnectionType(), 'none')
            assert.strictEqual((amazonQServiceManager as any)['cachedCodewhispererService'], undefined)
            assert.strictEqual((amazonQServiceManager as any)['cachedStreamingClient'], undefined)
            assert.strictEqual((amazonQServiceManager as any)['activeIdcProfile'], undefined)
            sinon.assert.calledOnce(cancelActiveProfileChangeTokenSpy)
        })

        it('should not clear local state variables on receiving iam token deletion event', () => {
            amazonQServiceManager.getCodewhispererService()

            amazonQServiceManager.handleOnCredentialsDeleted('iam')

            assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
            assert.strictEqual(amazonQServiceManager.getConnectionType(), 'builderId')
            assert(!(amazonQServiceManager['cachedCodewhispererService'] === undefined))
            assert.strictEqual((amazonQServiceManager as any)['activeIdcProfile'], undefined)
            sinon.assert.notCalled(cancelActiveProfileChangeTokenSpy)
        })
    })

    describe('BuilderId support', () => {
        const testRegion = 'some-region'
        const testEndpoint = 'http://some-endpoint-in-some-region'

        beforeEach(() => {
            setupServiceManager()
            assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

            setCredentials('builderId')

            AWS_Q_ENDPOINTS.set(testRegion, testEndpoint)

            features.lsp.getClientInitializeParams.reset()
        })

        it('should be INITIALIZED with BuilderId Connection', async () => {
            const service = amazonQServiceManager.getCodewhispererService()
            const streamingClient = amazonQServiceManager.getStreamingClient()

            await service.generateSuggestions({} as GenerateSuggestionsRequest)

            assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
            assert.strictEqual(amazonQServiceManager.getConnectionType(), 'builderId')

            assert(streamingClient instanceof StreamingClientService)
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

            amazonQServiceManager.getCodewhispererService()
            assert(codewhispererStubFactory.calledOnceWithExactly(testRegion, testEndpoint))

            const streamingClient = amazonQServiceManager.getStreamingClient()
            assert.strictEqual(await streamingClient.client.config.region(), testRegion)
            assert.strictEqual(
                (await streamingClient.client.config.endpoint()).hostname,
                'some-endpoint-in-some-region'
            )
        })

        it('should initialize service with region set by runtime if not set by client', async () => {
            features.runtime.getConfiguration.withArgs(AWS_Q_REGION_ENV_VAR).returns('eu-central-1')
            features.runtime.getConfiguration.withArgs(AWS_Q_ENDPOINT_URL_ENV_VAR).returns(TEST_ENDPOINT_EU_CENTRAL_1)

            amazonQServiceManager.getCodewhispererService()
            assert(codewhispererStubFactory.calledOnceWithExactly('eu-central-1', TEST_ENDPOINT_EU_CENTRAL_1))

            const streamingClient = amazonQServiceManager.getStreamingClient()
            assert.strictEqual(await streamingClient.client.config.region(), 'eu-central-1')
            assert.strictEqual(
                (await streamingClient.client.config.endpoint()).hostname,
                'amazon-q-in-eu-central-1-endpoint'
            )
        })

        it('should initialize service with default region if not set by client and runtime', async () => {
            amazonQServiceManager.getCodewhispererService()
            const streamingClient = amazonQServiceManager.getStreamingClient()

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
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                const service = amazonQServiceManager.getCodewhispererService()
                const streamingClient = amazonQServiceManager.getStreamingClient()

                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert(codewhispererServiceStub.generateSuggestions.calledOnce)

                assert(streamingClient instanceof StreamingClientService)
            })
        })

        describe('Developer Profiles Support is enabled', () => {
            it('should not throw when receiving null profile arn in PENDING_CONNECTION state', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                await assert.doesNotReject(
                    amazonQServiceManager.handleOnUpdateConfiguration(
                        {
                            section: 'aws.q',
                            settings: {
                                profileArn: null,
                            },
                        },
                        {} as CancellationToken
                    )
                )

                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')
            })

            it('should initialize to PENDING_Q_PROFILE state when IdentityCenter Connection is set', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                assert.throws(() => amazonQServiceManager.getCodewhispererService(), AmazonQServicePendingProfileError)
                assert.throws(() => amazonQServiceManager.getStreamingClient(), AmazonQServicePendingProfileError)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
            })

            it('handles Profile configuration request for valid profile and initializes to INITIALIZED state', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQServiceManager.getCodewhispererService()
                const streamingClient = amazonQServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                assert(streamingClient instanceof StreamingClientService)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')
            })

            it('handles Profile configuration request for valid profile & cancels the old in-flight update request', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')
                assert.strictEqual((amazonQServiceManager as any)['profileChangeTokenSource'], undefined)

                let firstRequestStarted = false
                const originalHandleProfileChange = amazonQServiceManager['handleProfileChange']
                amazonQServiceManager['handleProfileChange'] = async (...args) => {
                    firstRequestStarted = true
                    return originalHandleProfileChange.apply(amazonQServiceManager, args)
                }
                const firstUpdate = amazonQServiceManager.handleOnUpdateConfiguration(
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
                const secondUpdate = amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )
                const results = await Promise.allSettled([firstUpdate, secondUpdate])

                assert.strictEqual((amazonQServiceManager as any)['profileChangeTokenSource'], undefined)
                const service = amazonQServiceManager.getCodewhispererService()
                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')

                assert.strictEqual(results[0].status, 'fulfilled')
                assert.strictEqual(results[1].status, 'fulfilled')
            })

            it('handles Profile configuration change to valid profile in same region', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQServiceManager.getCodewhispererService()
                const streamingClient1 = amazonQServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ'
                )

                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))
                assert(streamingClient1 instanceof StreamingClientService)
                assert.strictEqual(await streamingClient1.client.config.region(), 'us-east-1')

                // Profile change

                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ-2',
                        },
                    },
                    {} as CancellationToken
                )
                await service.generateSuggestions({} as GenerateSuggestionsRequest)
                const streamingClient2 = amazonQServiceManager.getStreamingClient()

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ-2'
                )

                // CodeWhisperer Service was not recreated
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                assert(streamingClient2 instanceof StreamingClientService)
                assert.strictEqual(streamingClient1, streamingClient2)
                assert.strictEqual(await streamingClient2.client.config.region(), 'us-east-1')
            })

            it('handles Profile configuration change to valid profile in different region', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQServiceManager.getCodewhispererService()
                const streamingClient1 = amazonQServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ'
                )
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                assert(streamingClient1 instanceof StreamingClientService)
                assert.strictEqual(await streamingClient1.client.config.region(), 'us-east-1')

                // Profile change

                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )
                await service.generateSuggestions({} as GenerateSuggestionsRequest)
                const streamingClient2 = amazonQServiceManager.getStreamingClient()

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ'
                )

                // CodeWhisperer Service was recreated
                assert(codewhispererStubFactory.calledTwice)
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, [
                    'eu-central-1',
                    TEST_ENDPOINT_EU_CENTRAL_1,
                ])

                // Streaming Client was recreated
                assert(streamingClient2 instanceof StreamingClientService)
                assert.notStrictEqual(streamingClient1, streamingClient2)
                assert.strictEqual(await streamingClient2.client.config.region(), 'eu-central-1')
            })

            // As we're not validating profile at this moment, there is no "invalid" profile
            it.skip('handles Profile configuration change from valid to invalid profile', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                let service = amazonQServiceManager.getCodewhispererService()
                const streamingClient = amazonQServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ'
                )
                assert(codewhispererStubFactory.calledOnceWithExactly('us-east-1', TEST_ENDPOINT_US_EAST_1))

                assert(streamingClient instanceof StreamingClientService)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')

                // Profile change to invalid profile

                await assert.rejects(
                    amazonQServiceManager.handleOnUpdateConfiguration(
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

                assert.throws(() => amazonQServiceManager.getCodewhispererService(), AmazonQServicePendingProfileError)
                assert.throws(() => amazonQServiceManager.getStreamingClient(), AmazonQServicePendingProfileError)

                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)

                // CodeWhisperer Service was not recreated
                assert(codewhispererStubFactory.calledOnce)
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, ['us-east-1', TEST_ENDPOINT_US_EAST_1])
            })

            // As we're not validating profile at this moment, there is no "non-existing" profile
            it.skip('handles non-existing profile selection', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await assert.rejects(
                    amazonQServiceManager.handleOnUpdateConfiguration(
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

                assert.throws(() => amazonQServiceManager.getCodewhispererService(), AmazonQServicePendingProfileError)
                assert.throws(() => amazonQServiceManager.getStreamingClient(), AmazonQServicePendingProfileError)

                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.notCalled)
            })

            it('prevents service usage while profile change is inflight when profile was not set', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                assert.throws(() => amazonQServiceManager.getCodewhispererService(), AmazonQServicePendingProfileError)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE')

                amazonQServiceManager.setState('PENDING_Q_PROFILE_UPDATE')
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE_UPDATE')

                assert.throws(
                    () => amazonQServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileUpdateError
                )
                assert.throws(() => amazonQServiceManager.getStreamingClient(), AmazonQServicePendingProfileUpdateError)

                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQServiceManager.getCodewhispererService()
                const streamingClient = amazonQServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:eu-central-1:11111111111111:profile/QQQQQQQQQQQQ'
                )
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, [
                    'eu-central-1',
                    TEST_ENDPOINT_EU_CENTRAL_1,
                ])

                assert(streamingClient instanceof StreamingClientService)
                assert.strictEqual(await streamingClient.client.config.region(), 'eu-central-1')
            })

            it('prevents service usage while profile change is inflight when profile was set before', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                assert.throws(() => amazonQServiceManager.getCodewhispererService(), AmazonQServicePendingProfileError)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE')

                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                const service = amazonQServiceManager.getCodewhispererService()
                const streamingClient = amazonQServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(
                    amazonQServiceManager.getActiveProfileArn(),
                    'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ'
                )
                assert.deepStrictEqual(codewhispererStubFactory.lastCall.args, ['us-east-1', TEST_ENDPOINT_US_EAST_1])

                assert(streamingClient instanceof StreamingClientService)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')

                // Updaing profile
                amazonQServiceManager.setState('PENDING_Q_PROFILE_UPDATE')
                assert.throws(
                    () => amazonQServiceManager.getCodewhispererService(),
                    AmazonQServicePendingProfileUpdateError
                )
                assert.throws(() => amazonQServiceManager.getStreamingClient(), AmazonQServicePendingProfileUpdateError)

                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE_UPDATE')
            })

            it('resets to PENDING_PROFILE from INITIALIZED when receiving null profileArn', async () => {
                await setupServiceManagerWithProfile()

                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: null,
                        },
                    },
                    {} as CancellationToken
                )

                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)
                sinon.assert.calledOnce(codewhispererServiceStub.abortInflightRequests)
            })

            it('resets to PENDING_Q_PROFILE from PENDING_Q_PROFILE_UPDATE when receiving null profileArn', async () => {
                await setupServiceManagerWithProfile()

                amazonQServiceManager.setState('PENDING_Q_PROFILE_UPDATE')

                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE_UPDATE')

                // Null profile arn
                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: null,
                        },
                    },
                    {} as CancellationToken
                )

                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)
                sinon.assert.calledOnce(codewhispererServiceStub.abortInflightRequests)
                assert.throws(() => amazonQServiceManager.getCodewhispererService())
            })

            it('cancels on-going profile update when credentials are deleted', async () => {
                await setupServiceManagerWithProfile()

                amazonQServiceManager.setState('PENDING_Q_PROFILE_UPDATE')
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE_UPDATE')

                amazonQServiceManager.handleOnCredentialsDeleted('bearer')

                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)
                sinon.assert.calledOnce(codewhispererServiceStub.abortInflightRequests)
                assert.throws(() => amazonQServiceManager.getCodewhispererService())
            })

            // Due to service limitation, validation was removed for the sake of recovering API availability
            // When service is ready to take more tps, revert https://github.com/aws/language-servers/pull/1329 to add profile validation
            it('should not call service to validate profile and always assume its validness', async () => {
                setupServiceManager(true)
                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')

                setCredentials('identityCenter')

                await amazonQServiceManager.handleOnUpdateConfiguration(
                    {
                        section: 'aws.q',
                        settings: {
                            profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                        },
                    },
                    {} as CancellationToken
                )

                sinon.assert.notCalled(getListAllAvailableProfilesHandlerStub)
                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
            })
        })
    })

    describe('Connection types with no Developer Profiles support', () => {
        it('handles reauthentication scenario when connection type is none but profile ARN is provided', async () => {
            setupServiceManager(true)
            clearCredentials()

            assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')
            assert.strictEqual(amazonQServiceManager.getConnectionType(), 'none')

            await amazonQServiceManager.handleOnUpdateConfiguration(
                {
                    section: 'aws.q',
                    settings: {
                        profileArn: 'arn:aws:testprofilearn:us-east-1:11111111111111:profile/QQQQQQQQQQQQ',
                    },
                },
                {} as CancellationToken
            )

            assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
            assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
        })

        it('ignores null profile when connection type is none', async () => {
            setupServiceManager(true)
            clearCredentials()

            assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')
            assert.strictEqual(amazonQServiceManager.getConnectionType(), 'none')

            await amazonQServiceManager.handleOnUpdateConfiguration(
                {
                    section: 'aws.q',
                    settings: {
                        profileArn: null,
                    },
                },
                {} as CancellationToken
            )

            assert.strictEqual(amazonQServiceManager.getConnectionType(), 'none')
            assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_CONNECTION')
        })

        it('returns error when profile update is requested and connection type is builderId', async () => {
            setupServiceManager(true)
            setCredentials('builderId')

            await assert.rejects(
                amazonQServiceManager.handleOnUpdateConfiguration(
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

            assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
            assert.strictEqual(amazonQServiceManager.getConnectionType(), 'builderId')
        })
    })

    describe('Handle connection type changes', () => {
        describe('connection changes from BuilderId to IdentityCenter', () => {
            it('should initialize service with default region when profile support is disabled', async () => {
                setupServiceManager(false)
                setCredentials('builderId')

                let service1 = amazonQServiceManager.getCodewhispererService()
                const streamingClient = amazonQServiceManager.getStreamingClient()
                await service1.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'builderId')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)

                assert(streamingClient instanceof StreamingClientService)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')

                setCredentials('identityCenter')
                let service2 = amazonQServiceManager.getCodewhispererService()
                const streamingClient2 = amazonQServiceManager.getStreamingClient()

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.calledTwice)
                assert(codewhispererStubFactory.calledWithExactly(DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL))

                assert(streamingClient2 instanceof StreamingClientService)
                assert.strictEqual(await streamingClient2.client.config.region(), DEFAULT_AWS_Q_REGION)
            })

            it('should initialize service to PENDING_Q_PROFILE state when profile support is enabled', async () => {
                setupServiceManager(true)
                setCredentials('builderId')

                let service = amazonQServiceManager.getCodewhispererService()
                const streamingClient = amazonQServiceManager.getStreamingClient()
                await service.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'builderId')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)

                assert(streamingClient instanceof StreamingClientService)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')

                setCredentials('identityCenter')

                assert.throws(() => amazonQServiceManager.getCodewhispererService(), AmazonQServicePendingProfileError)
                assert.throws(() => amazonQServiceManager.getStreamingClient(), AmazonQServicePendingProfileError)

                assert.strictEqual(amazonQServiceManager.getState(), 'PENDING_Q_PROFILE')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.calledOnce)
                assert(codewhispererStubFactory.calledWithExactly(DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL))
            })
        })

        describe('connection changes from IdentityCenter to BuilderId', () => {
            it('should initialize service in default IAD region', async () => {
                setupServiceManager(false)
                setCredentials('identityCenter')

                let service1 = amazonQServiceManager.getCodewhispererService()
                const streamingClient = amazonQServiceManager.getStreamingClient()
                await service1.generateSuggestions({} as GenerateSuggestionsRequest)

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'identityCenter')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)

                assert(streamingClient instanceof StreamingClientService)
                assert.strictEqual(await streamingClient.client.config.region(), 'us-east-1')

                setCredentials('builderId')
                let service2 = amazonQServiceManager.getCodewhispererService()
                const streamingClient2 = amazonQServiceManager.getStreamingClient()

                assert.strictEqual(amazonQServiceManager.getState(), 'INITIALIZED')
                assert.strictEqual(amazonQServiceManager.getConnectionType(), 'builderId')
                assert.strictEqual(amazonQServiceManager.getActiveProfileArn(), undefined)

                assert(codewhispererStubFactory.calledTwice)
                assert(codewhispererStubFactory.calledWithExactly(DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL))

                assert(streamingClient2 instanceof StreamingClientService)
                assert.strictEqual(await streamingClient2.client.config.region(), 'us-east-1')
            })
        })
    })

    describe('handle LSP Configuration settings', () => {
        it('should initialize codewhisperer service with default configurations when not set by client', async () => {
            setupServiceManager()
            setCredentials('identityCenter')

            await amazonQServiceManager.handleDidChangeConfiguration()

            const service = amazonQServiceManager.getCodewhispererService()

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

            amazonQServiceManager = AmazonQServiceManager.getInstance()
            const service = amazonQServiceManager.getCodewhispererService()

            assert.strictEqual(service.customizationArn, undefined)
            assert.strictEqual(service.shareCodeWhispererContentWithAWS, false)

            await amazonQServiceManager.handleDidChangeConfiguration()

            // Force next tick to allow async work inside handleDidChangeConfiguration to complete
            await Promise.resolve()

            assert.strictEqual(service.customizationArn, 'test-customization-arn')
            assert.strictEqual(service.shareCodeWhispererContentWithAWS, true)
        })
    })

    describe('Initialize', () => {
        it('should throw when initialize is called before LSP has been initialized with InitializeParams', () => {
            features.resetClientParams()

            assert.throws(() => AmazonQServiceManager.initInstance(features), AmazonQServiceInitializationError)
        })
    })
})

describe('IAM', () => {
    describe('Initialization process', () => {
        generateSingletonInitializationTests(AmazonQServiceManager)
    })

    describe('Service caching', () => {
        let serviceManager: AmazonQServiceManager
        let features: TestFeatures
        let updateCachedServiceConfigSpy: sinon.SinonSpy

        const setCredentials = setIamCredentialsForAmazonQServiceManagerFactory(() => features)

        beforeEach(() => {
            features = new TestFeatures()
            features.lsp.getClientInitializeParams.resolves({})

            updateCachedServiceConfigSpy = sinon.spy(
                AmazonQServiceManager.prototype,
                'updateCachedServiceConfig' as keyof AmazonQServiceManager
            )

            AmazonQServiceManager.resetInstance()
            serviceManager = AmazonQServiceManager.initInstance(features)
        })

        afterEach(() => {
            AmazonQServiceManager.resetInstance()
            features.dispose()
            sinon.restore()
        })

        it('should initialize the CodeWhisperer service only once', () => {
            setCredentials()
            const service = serviceManager.getCodewhispererService()
            sinon.assert.calledOnce(updateCachedServiceConfigSpy)

            assert.deepStrictEqual(serviceManager.getCodewhispererService(), service)
            sinon.assert.calledOnce(updateCachedServiceConfigSpy)
        })

        it('should initialize the streaming client only once', () => {
            setCredentials()
            // Mock getIAMCredentialsFromProvider to return dummy credentials
            const getIAMCredentialsStub = sinon.stub(utils, 'getIAMCredentialsFromProvider').returns({
                accessKeyId: 'dummy-access-key',
                secretAccessKey: 'dummy-secret-key',
                sessionToken: 'dummy-session-token',
            })

            const streamingClient = serviceManager.getStreamingClient()

            assert.deepStrictEqual(serviceManager.getStreamingClient(), streamingClient)

            getIAMCredentialsStub.restore()
        })
    })
})
