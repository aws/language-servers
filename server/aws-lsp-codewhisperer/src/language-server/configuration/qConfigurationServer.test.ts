import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import * as assert from 'assert'
import {
    Q_CONFIGURATION_SECTION,
    Q_CUSTOMIZATIONS_CONFIGURATION_SECTION,
    Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION,
    QConfigurationServerToken,
    ServerConfigurationProvider,
    signalsAWSQDeveloperProfilesEnabled,
} from './qConfigurationServer'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { AWSInitializationOptions, Server } from '@aws/language-server-runtimes/server-interface'

describe('QConfigurationServerToken', () => {
    let testFeatures: TestFeatures
    let disposeServer: () => void
    let listAvailableProfilesStub: sinon.SinonStub
    let listAvailableCustomizationsStub: sinon.SinonStub
    let qDeveloperProfilesEnabledPropertyStub: sinon.SinonStub
    let qDeveloperProfilesEnabledSetterSpy: sinon.SinonSpy

    beforeEach(() => {
        testFeatures = new TestFeatures()

        const codeWhispererService = stubInterface<CodeWhispererServiceToken>()
        const configurationServerFactory: Server = QConfigurationServerToken(() => codeWhispererService)

        listAvailableCustomizationsStub = sinon.stub(
            ServerConfigurationProvider.prototype,
            'listAvailableCustomizations'
        )
        listAvailableProfilesStub = sinon.stub(ServerConfigurationProvider.prototype, 'listAvailableProfiles')
        qDeveloperProfilesEnabledSetterSpy = sinon.spy()
        qDeveloperProfilesEnabledPropertyStub = sinon
            .stub(ServerConfigurationProvider.prototype, 'qDeveloperProfilesEnabled')
            .set(qDeveloperProfilesEnabledSetterSpy)

        disposeServer = configurationServerFactory(testFeatures)
    })

    afterEach(() => {
        sinon.restore()
    })

    it(`enables Q developer profiles when signalled by client`, () => {
        const initialize = (developerProfiles: boolean) => {
            testFeatures.lsp.addInitializer.firstCall.firstArg({
                initializationOptions: {
                    aws: {
                        awsClientCapabilities: {
                            q: {
                                developerProfiles,
                            },
                        },
                    },
                },
            })
        }

        initialize(false)
        sinon.assert.calledWith(qDeveloperProfilesEnabledSetterSpy.firstCall, false)

        initialize(true)
        sinon.assert.calledWith(qDeveloperProfilesEnabledSetterSpy.secondCall, true)
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
    let codeWhispererService: StubbedInstance<CodeWhispererServiceToken>
    let testFeatures: TestFeatures
    let listAvailableProfilesHandlerSpy: sinon.SinonSpy

    beforeEach(() => {
        codeWhispererService = stubInterface<CodeWhispererServiceToken>()
        codeWhispererService.listAvailableCustomizations.resolves({
            customizations: [],
            $response: {} as any,
        })

        testFeatures = new TestFeatures()

        serverConfigurationProvider = new ServerConfigurationProvider(
            codeWhispererService,
            testFeatures.credentialsProvider,
            testFeatures.logging,
            () => codeWhispererService
        )

        listAvailableProfilesHandlerSpy = sinon.spy(
            serverConfigurationProvider,
            'listAllAvailableProfilesHandler' as keyof ServerConfigurationProvider
        )
    })

    afterEach(() => {
        sinon.restore()
    })

    it(`calls corresponding API when listAvailableCustomizations is invoked`, async () => {
        await serverConfigurationProvider.listAvailableCustomizations()

        sinon.assert.calledOnce(codeWhispererService.listAvailableCustomizations)
    })

    it(`does not use listAvailableProfiles handler when developer profiles is disabled`, async () => {
        const result = await serverConfigurationProvider.listAvailableProfiles()

        sinon.assert.notCalled(listAvailableProfilesHandlerSpy)
        assert.deepStrictEqual(result, [])
    })

    it(`uses listAvailableProfiles handler when developer profiles is enabled`, async () => {
        serverConfigurationProvider.qDeveloperProfilesEnabled = true
        await serverConfigurationProvider.listAvailableProfiles()

        sinon.assert.called(listAvailableProfilesHandlerSpy)
    })
})

describe('signalsAWSQDeveloperProfilesEnabled', () => {
    const makeQCapability = (value?: any) => {
        return value !== undefined ? { developerProfiles: value } : {}
    }

    const makeInitOptions = (value?: any): AWSInitializationOptions => {
        return { awsClientCapabilities: { q: makeQCapability(value) } }
    }

    const TEST_CASES: { input: AWSInitializationOptions; expected: boolean }[] = [
        { input: {}, expected: false },
        { input: { awsClientCapabilities: {} }, expected: false },
        { input: makeInitOptions(), expected: false },
        { input: makeInitOptions([]), expected: false },
        { input: makeInitOptions({}), expected: false },
        { input: makeInitOptions(42), expected: false },
        { input: makeInitOptions('some-string'), expected: false },
        { input: makeInitOptions(false), expected: false },
        { input: makeInitOptions(true), expected: true },
    ]

    TEST_CASES.forEach(testCase => {
        it(`should return: ${testCase.expected} when passed: ${JSON.stringify(testCase.input)}`, () => {
            assert.strictEqual(signalsAWSQDeveloperProfilesEnabled(testCase.input), testCase.expected)
        })
    })
})
