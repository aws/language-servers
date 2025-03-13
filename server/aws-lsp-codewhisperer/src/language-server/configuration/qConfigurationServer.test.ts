import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import {
    Q_CONFIGURATION_SECTION,
    Q_CUSTOMIZATIONS_CONFIGURATION_SECTION,
    Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION,
    QConfigurationServerToken,
} from './qConfigurationServer'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { Server } from '@aws/language-server-runtimes/server-interface'

describe('QConfigurationServer', () => {
    describe('OnGetConfigurationFromServer', () => {
        let testFeatures: TestFeatures
        let disposeServer: () => void
        let codeWhispererService: StubbedInstance<CodeWhispererServiceToken>

        beforeEach(() => {
            testFeatures = new TestFeatures()

            codeWhispererService = stubInterface<CodeWhispererServiceToken>()
            const configurationServerFactory: Server = QConfigurationServerToken(() => codeWhispererService)

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

            sinon.assert.calledOnce(codeWhispererService.listAvailableCustomizations)
            sinon.assert.notCalled(codeWhispererService.listAvailableProfiles)
        })

        it(`only calls listAvailableCustomizations when ${Q_CUSTOMIZATIONS_CONFIGURATION_SECTION} is requested`, () => {
            testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg({
                section: Q_CUSTOMIZATIONS_CONFIGURATION_SECTION,
            })

            sinon.assert.calledOnce(codeWhispererService.listAvailableCustomizations)
            sinon.assert.notCalled(codeWhispererService.listAvailableProfiles)
        })

        it(`only calls listAvailableProfiles when ${Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION} is requested`, () => {
            testFeatures.credentialsProvider.getConnectionType.returns('identityCenter')
            testFeatures.lsp.extensions.onGetConfigurationFromServer.firstCall.firstArg({
                section: Q_DEVELOPER_PROFILES_CONFIGURATION_SECTION,
            })

            sinon.assert.notCalled(codeWhispererService.listAvailableCustomizations)
            sinon.assert.called(codeWhispererService.listAvailableProfiles)
        })
    })
})
