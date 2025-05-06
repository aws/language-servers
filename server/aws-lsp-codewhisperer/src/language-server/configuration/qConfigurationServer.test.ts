import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import * as assert from 'assert'
import {
    Q_CUSTOMIZATIONS_CONFIGURATION_SECTION,
    Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION,
    QConfigurationServerToken,
    ServerConfigurationProvider,
} from './qConfigurationServer'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererServiceToken } from '../../shared/codeWhispererService'
import {
    CancellationToken,
    CancellationTokenSource,
    InitializeParams,
    LSPErrorCodes,
    ResponseError,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { setCredentialsForAmazonQTokenServiceManagerFactory } from '../../shared/testUtils'
import { Q_CONFIGURATION_SECTION, AWS_Q_ENDPOINTS } from '../../shared/constants'
import { AmazonQDeveloperProfile } from '../../shared/amazonQServiceManager/qDeveloperProfiles'

const getInitializeParams = (customizationsWithMetadata = false, developerProfiles = true): InitializeParams => {
    return {
        processId: 0,
        rootUri: 'some-root-uri',
        capabilities: {},
        initializationOptions: {
            aws: {
                awsClientCapabilities: {
                    q: {
                        developerProfiles,
                        customizationsWithMetadata,
                    },
                },
            },
        },
    }
}

// Mock data for tests
const mockProfiles: AmazonQDeveloperProfile[] = [
    {
        arn: 'arn:aws:codewhisperer:us-east-1:123456789012:profile/profile1',
        name: 'Profile 1',
        identityDetails: {
            region: 'us-east-1',
        },
    },
    {
        arn: 'arn:aws:codewhisperer:us-west-2:123456789012:profile/profile2',
        name: 'Profile 2',
        identityDetails: {
            region: 'us-west-2',
        },
    },
]

const mockCustomizations = [
    {
        arn: 'arn:aws:codewhisperer:us-east-1:123456789012:customization/customization1',
        name: 'Customization 1',
        createdAt: new Date(),
    },
    {
        arn: 'arn:aws:codewhisperer:us-east-1:123456789012:customization/customization2',
        name: 'Customization 2',
        createdAt: new Date(),
    },
]

describe('QConfigurationServerToken', () => {
    let testFeatures: TestFeatures
    let amazonQServiceManager: AmazonQTokenServiceManager
    let listAvailableProfilesStub: sinon.SinonStub
    let listAvailableCustomizationsStub: sinon.SinonStub
    let listAllAvailableCustomizationsWithMetadataStub: sinon.SinonStub
    let getEnableDeveloperProfileSupportStub: sinon.SinonStub

    const setupTest = async (customizationsWithMetadata = false, developerProfiles = true) => {
        testFeatures = new TestFeatures()
        testFeatures.setClientParams(getInitializeParams(customizationsWithMetadata, developerProfiles))

        AmazonQTokenServiceManager.resetInstance()
        AmazonQTokenServiceManager.initInstance(testFeatures)
        amazonQServiceManager = AmazonQTokenServiceManager.getInstance()

        const codeWhispererService = stubInterface<CodeWhispererServiceToken>()
        const configurationServer: Server = QConfigurationServerToken()

        amazonQServiceManager.setServiceFactory(sinon.stub().returns(codeWhispererService))
        getEnableDeveloperProfileSupportStub = sinon.stub(amazonQServiceManager, 'getEnableDeveloperProfileSupport')
        getEnableDeveloperProfileSupportStub.returns(developerProfiles)

        listAvailableCustomizationsStub = sinon.stub(
            ServerConfigurationProvider.prototype,
            'listAvailableCustomizations'
        )
        listAllAvailableCustomizationsWithMetadataStub = sinon.stub(
            ServerConfigurationProvider.prototype,
            'listAllAvailableCustomizationsWithMetadata'
        )
        listAvailableProfilesStub = sinon.stub(ServerConfigurationProvider.prototype, 'listAvailableProfiles')

        await testFeatures.initialize(configurationServer)
    }

    afterEach(() => {
        sinon.restore()
        if (testFeatures) {
            testFeatures.dispose()
        }
    })

    it(`calls all list methods when ${Q_CONFIGURATION_SECTION} is requested`, async () => {
        await setupTest()

        await testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg(
            { section: Q_CONFIGURATION_SECTION },
            new CancellationTokenSource().token
        )

        sinon.assert.calledOnce(listAvailableCustomizationsStub)
        sinon.assert.calledOnce(listAvailableProfilesStub)
        sinon.assert.notCalled(listAllAvailableCustomizationsWithMetadataStub)
    })

    it(`only calls listAvailableCustomizations when ${Q_CUSTOMIZATIONS_CONFIGURATION_SECTION} is requested`, async () => {
        await setupTest()

        await testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg(
            { section: Q_CUSTOMIZATIONS_CONFIGURATION_SECTION },
            new CancellationTokenSource().token
        )

        sinon.assert.calledOnce(listAvailableCustomizationsStub)
        sinon.assert.notCalled(listAvailableProfilesStub)
        sinon.assert.notCalled(listAllAvailableCustomizationsWithMetadataStub)
    })

    it(`only calls listAvailableProfiles when ${Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION} is requested`, async () => {
        await setupTest()

        await testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg(
            { section: Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION },
            new CancellationTokenSource().token
        )

        sinon.assert.notCalled(listAvailableCustomizationsStub)
        sinon.assert.calledOnce(listAvailableProfilesStub)
        sinon.assert.notCalled(listAllAvailableCustomizationsWithMetadataStub)
    })

    it('uses listAllAvailableCustomizationsWithMetadata when feature flag is enabled', async () => {
        await setupTest(true, true)
        listAvailableProfilesStub.resolves(mockProfiles)

        await testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg(
            { section: Q_CONFIGURATION_SECTION },
            new CancellationTokenSource().token
        )

        sinon.assert.notCalled(listAvailableCustomizationsStub)
        sinon.assert.calledOnce(listAllAvailableCustomizationsWithMetadataStub)
        sinon.assert.calledOnce(listAvailableProfilesStub)

        // Verify profiles are passed to the customizations method
        sinon.assert.calledWith(listAllAvailableCustomizationsWithMetadataStub, mockProfiles, sinon.match.any)
    })

    it('uses listAvailableCustomizations when feature flag is disabled', async () => {
        await setupTest(false, true)

        await testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg(
            { section: Q_CONFIGURATION_SECTION },
            new CancellationTokenSource().token
        )

        sinon.assert.calledOnce(listAvailableCustomizationsStub)
        sinon.assert.notCalled(listAllAvailableCustomizationsWithMetadataStub)
        sinon.assert.calledOnce(listAvailableProfilesStub)
    })

    it('uses listAvailableCustomizations when developer profiles are disabled', async () => {
        await setupTest(true, false)

        await testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg(
            { section: Q_CONFIGURATION_SECTION },
            new CancellationTokenSource().token
        )

        sinon.assert.calledOnce(listAvailableCustomizationsStub)
        sinon.assert.notCalled(listAllAvailableCustomizationsWithMetadataStub)
        sinon.assert.calledOnce(listAvailableProfilesStub)
    })

    it('uses listAllAvailableCustomizationsWithMetadata for customizations section when feature flag is enabled', async () => {
        await setupTest(true, true)
        listAvailableProfilesStub.resolves(mockProfiles)

        await testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg(
            { section: Q_CUSTOMIZATIONS_CONFIGURATION_SECTION },
            new CancellationTokenSource().token
        )

        sinon.assert.notCalled(listAvailableCustomizationsStub)
        sinon.assert.calledOnce(listAllAvailableCustomizationsWithMetadataStub)
        sinon.assert.calledOnce(listAvailableProfilesStub)

        // Verify profiles are passed to the customizations method
        sinon.assert.calledWith(listAllAvailableCustomizationsWithMetadataStub, mockProfiles, sinon.match.any)
    })
})

describe('ServerConfigurationProvider', () => {
    let serverConfigurationProvider: ServerConfigurationProvider
    let amazonQServiceManager: AmazonQTokenServiceManager
    let codeWhispererService: StubbedInstance<CodeWhispererServiceToken>
    let testFeatures: TestFeatures
    let listAvailableProfilesHandlerSpy: sinon.SinonSpy
    let tokenSource: CancellationTokenSource
    let serviceFactoryStub: sinon.SinonStub

    const setCredentials = setCredentialsForAmazonQTokenServiceManagerFactory(() => testFeatures)

    const setupServerConfigurationProvider = (developerProfiles = true) => {
        testFeatures.setClientParams(getInitializeParams(false, developerProfiles))

        AmazonQTokenServiceManager.resetInstance()
        AmazonQTokenServiceManager.initInstance(testFeatures)
        amazonQServiceManager = AmazonQTokenServiceManager.getInstance()

        serviceFactoryStub = sinon.stub().returns(codeWhispererService)
        amazonQServiceManager.setServiceFactory(serviceFactoryStub)

        serverConfigurationProvider = new ServerConfigurationProvider(
            amazonQServiceManager,
            testFeatures.credentialsProvider,
            testFeatures.logging
        )

        listAvailableProfilesHandlerSpy = sinon.spy(
            serverConfigurationProvider,
            'listAllAvailableProfilesHandler' as keyof ServerConfigurationProvider
        )
    }

    beforeEach(() => {
        tokenSource = new CancellationTokenSource()
        codeWhispererService = stubInterface<CodeWhispererServiceToken>()
        codeWhispererService.listAvailableCustomizations.resolves({
            customizations: mockCustomizations,
            $response: {} as any,
        })
        codeWhispererService.listAvailableProfiles.resolves({
            profiles: [],
            $response: {} as any,
        })

        testFeatures = new TestFeatures()

        setCredentials('identityCenter')

        setupServerConfigurationProvider()
    })

    afterEach(() => {
        sinon.restore()
        testFeatures.dispose()
    })

    it(`calls corresponding API when listAvailableCustomizations is invoked`, async () => {
        setCredentials('builderId')

        await serverConfigurationProvider.listAvailableCustomizations()

        sinon.assert.calledOnce(codeWhispererService.listAvailableCustomizations)
    })

    it(`does not use listAvailableProfiles handler when developer profiles is disabled`, async () => {
        setupServerConfigurationProvider(false)

        const result = await serverConfigurationProvider.listAvailableProfiles(tokenSource.token)

        sinon.assert.notCalled(listAvailableProfilesHandlerSpy)
        assert.deepStrictEqual(result, [])
    })

    it(`uses listAvailableProfiles handler when developer profiles is enabled`, async () => {
        await serverConfigurationProvider.listAvailableProfiles(tokenSource.token)

        sinon.assert.calledOnce(listAvailableProfilesHandlerSpy)
    })

    it('records error code when listAvailableProfiles throws throttling error', async () => {
        const awsError = new Error('Throttling') as any
        awsError.code = 'ThrottlingException'
        awsError.name = 'ThrottlingException'
        codeWhispererService.listAvailableProfiles.rejects(awsError)

        try {
            await serverConfigurationProvider.listAvailableProfiles(tokenSource.token)
            assert.fail('Expected method to throw')
        } catch (error) {
            const responseError = error as ResponseError<{ awsErrorCode: string }>
            assert.strictEqual(responseError.code, LSPErrorCodes.RequestFailed)
            assert.strictEqual(responseError.data?.awsErrorCode, 'E_AMAZON_Q_PROFILE_THROTTLING')
            sinon.assert.calledOnce(listAvailableProfilesHandlerSpy)
        }
    })

    describe('listAvailableCustomizationsForProfileAndRegion', () => {
        it('fetches customizations for specified region and profile', async () => {
            const profileArn = 'arn:aws:codewhisperer:us-east-1:123456789012:profile/profile1'
            const region = 'us-east-1'

            await serverConfigurationProvider.listAvailableCustomizationsForProfileAndRegion(profileArn, region)

            sinon.assert.calledWith(serviceFactoryStub, region, AWS_Q_ENDPOINTS.get(region))
            sinon.assert.calledOnce(codeWhispererService.listAvailableCustomizations)
            assert.strictEqual(codeWhispererService.profileArn, profileArn)
        })

        it('throws an error when the API call fails', async () => {
            const profileArn = 'arn:aws:codewhisperer:us-east-1:123456789012:profile/profile1'
            const region = 'us-east-1'

            const error = new Error('API Error')
            codeWhispererService.listAvailableCustomizations.rejects(error)

            try {
                await serverConfigurationProvider.listAvailableCustomizationsForProfileAndRegion(profileArn, region)
                assert.fail('Expected method to throw')
            } catch (err) {
                const responseError = err as ResponseError<any>
                assert.strictEqual(responseError.code, LSPErrorCodes.RequestFailed)
            }
        })
    })

    describe('listAllAvailableCustomizationsWithMetadata', () => {
        let listAllAvailableProfilesHandlerStub: sinon.SinonStub

        beforeEach(() => {
            // We need to restore the spy before creating a stub on the same method
            if (listAvailableProfilesHandlerSpy) {
                listAvailableProfilesHandlerSpy.restore()
            }

            // Replace the listAllAvailableProfilesHandler with our stub
            listAllAvailableProfilesHandlerStub = sinon.stub(
                serverConfigurationProvider,
                'listAllAvailableProfilesHandler' as keyof ServerConfigurationProvider
            )
            listAllAvailableProfilesHandlerStub.resolves(mockProfiles)
        })

        it('fetches customizations for each profile and adds metadata', async () => {
            // Setup stub for listAvailableCustomizationsForProfileAndRegion
            const listAvailableCustomizationsForProfileAndRegionStub = sinon.stub(
                serverConfigurationProvider,
                'listAvailableCustomizationsForProfileAndRegion'
            )

            // Return different customizations for each profile
            listAvailableCustomizationsForProfileAndRegionStub
                .withArgs(mockProfiles[0].arn, mockProfiles[0].identityDetails!.region)
                .resolves([
                    { arn: 'customization1', name: 'Customization 1' },
                    { arn: 'customization2', name: 'Customization 2' },
                ])

            listAvailableCustomizationsForProfileAndRegionStub
                .withArgs(mockProfiles[1].arn, mockProfiles[1].identityDetails!.region)
                .resolves([{ arn: 'customization3', name: 'Customization 3' }])

            const result = await serverConfigurationProvider.listAllAvailableCustomizationsWithMetadata(
                mockProfiles,
                tokenSource.token
            )

            // Verify the results
            assert.strictEqual(result.length, 5)

            // Check that metadata was added correctly
            assert.deepStrictEqual(result[0], {
                arn: '',
                name: 'Amazon Q foundation (Default)',
                description: '',
                isDefault: true,
                profile: {
                    arn: mockProfiles[0].arn,
                    identityDetails: {
                        region: 'us-east-1',
                    },
                    name: 'Profile 1',
                },
            })

            assert.deepStrictEqual(result[1], {
                arn: 'customization1',
                name: 'Customization 1',
                isDefault: false,
                profile: {
                    arn: mockProfiles[0].arn,
                    identityDetails: {
                        region: 'us-east-1',
                    },
                    name: 'Profile 1',
                },
            })

            assert.deepStrictEqual(result[4], {
                arn: 'customization3',
                name: 'Customization 3',
                isDefault: false,
                profile: {
                    arn: mockProfiles[1].arn,
                    identityDetails: {
                        region: 'us-west-2',
                    },
                    name: 'Profile 2',
                },
            })

            // Verify the stubs were called correctly
            sinon.assert.notCalled(listAllAvailableProfilesHandlerStub)
            sinon.assert.calledTwice(listAvailableCustomizationsForProfileAndRegionStub)
        })

        it('add profile information and isDefault flag to true even for a profile with 0 customizations', async () => {
            // Setup stub for listAvailableCustomizationsForProfileAndRegion
            const listAvailableCustomizationsForProfileAndRegionStub = sinon.stub(
                serverConfigurationProvider,
                'listAvailableCustomizationsForProfileAndRegion'
            )

            // Return different customizations for each profile
            listAvailableCustomizationsForProfileAndRegionStub
                .withArgs(mockProfiles[0].arn, mockProfiles[0].identityDetails!.region)
                .resolves([])

            listAvailableCustomizationsForProfileAndRegionStub
                .withArgs(mockProfiles[1].arn, mockProfiles[1].identityDetails!.region)
                .resolves([{ arn: 'customization3', name: 'Customization 3' }])

            const result = await serverConfigurationProvider.listAllAvailableCustomizationsWithMetadata(
                mockProfiles,
                tokenSource.token
            )

            // Verify the results
            assert.strictEqual(result.length, 3)

            // Check that metadata was added correctly
            assert.deepStrictEqual(result[0], {
                arn: '',
                name: 'Amazon Q foundation (Default)',
                description: '',
                isDefault: true,
                profile: {
                    arn: mockProfiles[0].arn,
                    identityDetails: {
                        region: 'us-east-1',
                    },
                    name: 'Profile 1',
                },
            })

            assert.deepStrictEqual(result[1], {
                arn: '',
                name: 'Amazon Q foundation (Default)',
                description: '',
                isDefault: true,
                profile: {
                    arn: mockProfiles[1].arn,
                    identityDetails: {
                        region: 'us-west-2',
                    },
                    name: 'Profile 2',
                },
            })

            assert.deepStrictEqual(result[2], {
                arn: 'customization3',
                name: 'Customization 3',
                isDefault: false,
                profile: {
                    arn: mockProfiles[1].arn,
                    identityDetails: {
                        region: 'us-west-2',
                    },
                    name: 'Profile 2',
                },
            })

            // Verify the stubs were called correctly
            sinon.assert.notCalled(listAllAvailableProfilesHandlerStub)
            sinon.assert.calledTwice(listAvailableCustomizationsForProfileAndRegionStub)
        })

        it('uses provided profiles instead of fetching them', async () => {
            // Setup stub for listAvailableCustomizationsForProfileAndRegion
            const listAvailableCustomizationsForProfileAndRegionStub = sinon.stub(
                serverConfigurationProvider,
                'listAvailableCustomizationsForProfileAndRegion'
            )

            // Return different customizations for each profile
            listAvailableCustomizationsForProfileAndRegionStub
                .withArgs(mockProfiles[0].arn, mockProfiles[0].identityDetails!.region)
                .resolves([{ arn: 'customization1', name: 'Customization 1' }])

            // Call with provided profiles
            const result = await serverConfigurationProvider.listAllAvailableCustomizationsWithMetadata(
                [mockProfiles[0]], // Only pass the first profile
                tokenSource.token
            )

            // Verify the results
            assert.strictEqual(result.length, 2)
            assert.deepStrictEqual(result[0], {
                arn: '',
                name: 'Amazon Q foundation (Default)',
                description: '',
                isDefault: true,
                profile: {
                    arn: mockProfiles[0].arn,
                    identityDetails: {
                        region: 'us-east-1',
                    },
                    name: 'Profile 1',
                },
            })
            assert.deepStrictEqual(result[1], {
                arn: 'customization1',
                name: 'Customization 1',
                isDefault: false,
                profile: {
                    arn: mockProfiles[0].arn,
                    identityDetails: {
                        region: 'us-east-1',
                    },
                    name: 'Profile 1',
                },
            })

            // Verify the profile handler was NOT called
            sinon.assert.notCalled(listAllAvailableProfilesHandlerStub)
            // Verify only one customization call was made
            sinon.assert.calledOnce(listAvailableCustomizationsForProfileAndRegionStub)
        })

        it('continues processing if fetching customizations for one profile fails - expected to return the default even for case where fetch fails', async () => {
            // Setup stub for listAvailableCustomizationsForProfileAndRegion
            const listAvailableCustomizationsForProfileAndRegionStub = sinon.stub(
                serverConfigurationProvider,
                'listAvailableCustomizationsForProfileAndRegion'
            )

            // First profile succeeds
            listAvailableCustomizationsForProfileAndRegionStub
                .withArgs(mockProfiles[0].arn, mockProfiles[0].identityDetails!.region)
                .resolves([{ arn: 'customization1', name: 'Customization 1' }])

            // Second profile fails
            listAvailableCustomizationsForProfileAndRegionStub
                .withArgs(mockProfiles[1].arn, mockProfiles[1].identityDetails!.region)
                .rejects(new Error('Failed to fetch customizations'))

            const result = await serverConfigurationProvider.listAllAvailableCustomizationsWithMetadata(
                mockProfiles,
                tokenSource.token
            )

            // Should still have results from the first profile
            assert.strictEqual(result.length, 3)

            assert.deepStrictEqual(result[0], {
                arn: '',
                name: 'Amazon Q foundation (Default)',
                description: '',
                isDefault: true,
                profile: {
                    arn: mockProfiles[0].arn,
                    identityDetails: {
                        region: 'us-east-1',
                    },
                    name: 'Profile 1',
                },
            })

            assert.deepStrictEqual(result[1], {
                arn: 'customization1',
                name: 'Customization 1',
                isDefault: false,
                profile: {
                    arn: mockProfiles[0].arn,
                    identityDetails: {
                        region: 'us-east-1',
                    },
                    name: 'Profile 1',
                },
            })

            assert.deepStrictEqual(result[2], {
                arn: '',
                name: 'Amazon Q foundation (Default)',
                description: '',
                isDefault: true,
                profile: {
                    arn: mockProfiles[1].arn,
                    identityDetails: {
                        region: 'us-west-2',
                    },
                    name: 'Profile 2',
                },
            })

            // Verify error was logged
            sinon.assert.calledWith(
                testFeatures.logging.error as sinon.SinonStub,
                sinon.match(/Failed to fetch customizations for profile/)
            )
        })

        it('handles cancellation token', async () => {
            // Cancel the token
            tokenSource.cancel()

            try {
                await serverConfigurationProvider.listAllAvailableCustomizationsWithMetadata(
                    mockProfiles,
                    tokenSource.token
                )
                assert.fail('Expected method to throw')
            } catch (err) {
                const responseError = err as ResponseError<any>
                assert.strictEqual(responseError.code, LSPErrorCodes.RequestCancelled)
            }
        })
    })
})
