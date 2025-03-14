import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { OnGetConfigurationFromServerManager } from './onConfigurationFromServerManager'
import { TestFeatures } from '@aws/language-server-runtimes/testing'

describe('OnGetConfigurationFromServerManager', () => {
    let onConfigurationFromServerManager: OnGetConfigurationFromServerManager
    let codeWhispererService: StubbedInstance<CodeWhispererServiceToken>
    let testFeatures: TestFeatures

    beforeEach(() => {
        codeWhispererService = stubInterface<CodeWhispererServiceToken>()

        testFeatures = new TestFeatures()

        onConfigurationFromServerManager = new OnGetConfigurationFromServerManager(
            codeWhispererService,
            testFeatures.credentialsProvider,
            testFeatures.logging,
            () => codeWhispererService
        )
    })

    afterEach(() => {
        sinon.restore()
    })

    it(`calls corresponding API when listAvailableCustomizations is invoked`, () => {
        onConfigurationFromServerManager.listAvailableCustomizations()

        sinon.assert.calledOnce(codeWhispererService.listAvailableCustomizations)
    })

    it(`uses corresponding handler when listAvailableProfiles is invoked`, () => {
        const listProfilesSpy = sinon.spy(
            onConfigurationFromServerManager,
            'listAllAvailableProfilesHandler' as keyof OnGetConfigurationFromServerManager
        )

        onConfigurationFromServerManager.listAvailableProfiles()

        sinon.assert.calledOnce(listProfilesSpy)
    })
})
