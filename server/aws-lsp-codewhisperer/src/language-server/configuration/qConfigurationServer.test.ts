import sinon, { stubInterface } from 'ts-sinon'
import {
    Q_CONFIGURATION_SECTION,
    Q_CUSTOMIZATIONS_CONFIGURATION_SECTION,
    Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION,
    QConfigurationServerToken,
} from './qConfigurationServer'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { Server } from '@aws/language-server-runtimes/server-interface'
import { OnGetConfigurationFromServerManager } from './onConfigurationFromServerManager'

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
                OnGetConfigurationFromServerManager.prototype,
                'listAvailableCustomizations'
            )
            listAvailableProfilesStub = sinon.stub(
                OnGetConfigurationFromServerManager.prototype,
                'listAvailableProfiles'
            )

            disposeServer = configurationServerFactory(testFeatures)
        })

        afterEach(() => {
            sinon.restore()
        })

        // WIP: temporary test case until client can signal they support developer profiles
        it(`only calls listAvailableCustomizations when ${Q_CONFIGURATION_SECTION} is requested`, () => {
            testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg({
                section: Q_CONFIGURATION_SECTION,
            })

            sinon.assert.calledOnce(listAvailableCustomizationsStub)
            sinon.assert.notCalled(listAvailableProfilesStub)
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
})
