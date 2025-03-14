import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import * as assert from 'assert'
import {
    Q_CONFIGURATION_SECTION,
    Q_CUSTOMIZATIONS_CONFIGURATION_SECTION,
    Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION,
    QConfigurationServerToken,
    ServerConfigurationProvider,
} from './qConfigurationServer'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { Server } from '@aws/language-server-runtimes/server-interface'

describe('QConfigurationServer', () => {
    describe('OnGetConfigurationFromServer', () => {
        let testFeatures: TestFeatures
        let disposeServer: () => void
        let listAvailableProfilesStub: sinon.SinonStub
        let listAvailableCustomizationsStub: sinon.SinonStub

        beforeEach(() => {
            testFeatures = new TestFeatures()

            const codeWhispererService = stubInterface<CodeWhispererServiceToken>()
            const configurationServerFactory: Server = QConfigurationServerToken(() => codeWhispererService)

            listAvailableCustomizationsStub = sinon.stub(
                ServerConfigurationProvider.prototype,
                'listAvailableCustomizations'
            )
            listAvailableProfilesStub = sinon.stub(ServerConfigurationProvider.prototype, 'listAvailableProfiles')

            disposeServer = configurationServerFactory(testFeatures)
        })

        afterEach(() => {
            sinon.restore()
        })

        // WIP: temporary test case until client can signal they support developer profiles
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

        // WIP: alter test case when client can signal they support developer profiles
        it(`does not use corresponding handler when listAvailableProfiles is invoked`, async () => {
            const result = await serverConfigurationProvider.listAvailableProfiles()

            sinon.assert.notCalled(listAvailableProfilesHandlerSpy)
            assert.deepStrictEqual(result, [])
        })
    })
})
