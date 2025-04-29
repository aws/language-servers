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
    CancellationTokenSource,
    InitializeParams,
    LSPErrorCodes,
    ResponseError,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { AmazonQTokenServiceManager } from '../../shared/amazonQServiceManager/AmazonQTokenServiceManager'
import { setCredentialsForAmazonQTokenServiceManagerFactory } from '../../shared/testUtils'
import { Q_CONFIGURATION_SECTION } from '../../shared/constants'

const getInitializeParams = (developerProfiles = true): InitializeParams => {
    return {
        processId: 0,
        rootUri: 'some-root-uri',
        capabilities: {},
        initializationOptions: {
            aws: {
                awsClientCapabilities: {
                    q: {
                        developerProfiles,
                    },
                },
            },
        },
    }
}

describe('QConfigurationServerToken', () => {
    let testFeatures: TestFeatures
    let amazonQServiceManager: AmazonQTokenServiceManager
    let listAvailableProfilesStub: sinon.SinonStub
    let listAvailableCustomizationsStub: sinon.SinonStub

    beforeEach(async () => {
        testFeatures = new TestFeatures()
        testFeatures.setClientParams(getInitializeParams())

        AmazonQTokenServiceManager.resetInstance()
        AmazonQTokenServiceManager.initInstance(testFeatures)
        amazonQServiceManager = AmazonQTokenServiceManager.getInstance()

        const codeWhispererService = stubInterface<CodeWhispererServiceToken>()
        const configurationServer: Server = QConfigurationServerToken()

        amazonQServiceManager.setServiceFactory(sinon.stub().returns(codeWhispererService))

        listAvailableCustomizationsStub = sinon.stub(
            ServerConfigurationProvider.prototype,
            'listAvailableCustomizations'
        )
        listAvailableProfilesStub = sinon.stub(ServerConfigurationProvider.prototype, 'listAvailableProfiles')

        await testFeatures.initialize(configurationServer)
    })

    afterEach(() => {
        sinon.restore()
        testFeatures.dispose()
    })

    it(`calls all list methods when ${Q_CONFIGURATION_SECTION} is requested`, () => {
        testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg({
            section: Q_CONFIGURATION_SECTION,
        })

        sinon.assert.calledOnce(listAvailableCustomizationsStub)
        sinon.assert.calledOnce(listAvailableProfilesStub)
    })

    it(`only calls listAvailableCustomizations when ${Q_CUSTOMIZATIONS_CONFIGURATION_SECTION} is requested`, () => {
        testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg({
            section: Q_CUSTOMIZATIONS_CONFIGURATION_SECTION,
        })

        sinon.assert.calledOnce(listAvailableCustomizationsStub)
        sinon.assert.notCalled(listAvailableProfilesStub)
    })

    it(`only calls listAvailableProfiles when ${Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION} is requested`, () => {
        testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg({
            section: Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION,
        })

        sinon.assert.notCalled(listAvailableCustomizationsStub)
        sinon.assert.calledOnce(listAvailableProfilesStub)
    })
})

describe('ServerConfigurationProvider', () => {
    let serverConfigurationProvider: ServerConfigurationProvider
    let amazonQServiceManager: AmazonQTokenServiceManager
    let codeWhispererService: StubbedInstance<CodeWhispererServiceToken>
    let testFeatures: TestFeatures
    let listAvailableProfilesHandlerSpy: sinon.SinonSpy
    let tokenSource: CancellationTokenSource

    const setCredentials = setCredentialsForAmazonQTokenServiceManagerFactory(() => testFeatures)

    const setupServerConfigurationProvider = (developerProfiles = true) => {
        testFeatures.setClientParams(getInitializeParams(developerProfiles))

        AmazonQTokenServiceManager.resetInstance()
        AmazonQTokenServiceManager.initInstance(testFeatures)
        amazonQServiceManager = AmazonQTokenServiceManager.getInstance()

        amazonQServiceManager.setServiceFactory(sinon.stub().returns(codeWhispererService))
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
            customizations: [],
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
})
