import { Server } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon from 'ts-sinon'
import { LocalProjectContextServer } from './localProjectContextServer'

describe('LocalProjectContextServer', () => {
    let features: TestFeatures
    let server: Server
    let disposeServer: () => void

    beforeEach(() => {
        features = new TestFeatures()
        server = LocalProjectContextServer()
        disposeServer = server(features)
    })

    afterEach(() => {
        sinon.restore()
        disposeServer()
        features.dispose()
    })

    it('should skip init when isDefaultConfig is true', async () => {
        // Mock the service manager methods
        const mockServiceManager = {
            addDidChangeConfigurationListener: sinon.stub().resolves(),
        }
        sinon
            .stub(
                require('../../shared/amazonQServiceManager/AmazonQTokenServiceManager'),
                'getOrThrowBaseTokenServiceManager'
            )
            .returns(mockServiceManager)
        sinon.stub(require('../../shared/utils'), 'isUsingIAMAuth').returns(false)

        await features.initialize(server)

        // Get the configuration listener that was registered
        const configListener = mockServiceManager.addDidChangeConfigurationListener.firstCall.args[0]

        // Call it with default config
        await configListener({ isDefaultConfig: true })

        sinon.assert.calledWith(
            features.logging.log,
            'Skipping local project context initialization for default config'
        )
    })

    it('should call init when isDefaultConfig is false', async () => {
        // Mock the service manager methods
        const mockServiceManager = {
            addDidChangeConfigurationListener: sinon.stub().resolves(),
        }
        sinon
            .stub(
                require('../../shared/amazonQServiceManager/AmazonQTokenServiceManager'),
                'getOrThrowBaseTokenServiceManager'
            )
            .returns(mockServiceManager)
        sinon.stub(require('../../shared/utils'), 'isUsingIAMAuth').returns(false)

        await features.initialize(server)

        // Get the configuration listener that was registered
        const configListener = mockServiceManager.addDidChangeConfigurationListener.firstCall.args[0]

        // Call it with non-default config
        await configListener({
            isDefaultConfig: false,
            projectContext: { enableLocalIndexing: true },
        })

        sinon.assert.calledWith(features.logging.log, sinon.match(/Setting project context indexing enabled to/))
    })
})
