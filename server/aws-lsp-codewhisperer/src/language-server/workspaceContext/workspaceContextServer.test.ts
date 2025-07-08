import { InitializeParams, Server } from '@aws/language-server-runtimes/server-interface'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon from 'ts-sinon'
import { WorkspaceContextServer } from './workspaceContextServer'
import { AmazonQServiceManager } from '../../shared/amazonQServiceManager/AmazonQServiceManager'

describe('WorkspaceContext Server', () => {
    let features: TestFeatures
    let server: Server
    let disposeServer: () => void

    before(() => {
        features = new TestFeatures()
        server = WorkspaceContextServer()
        disposeServer = server(features)
    })

    afterEach(() => {
        sinon.restore()
        disposeServer()
        features.dispose()
    })

    describe('Initialization', () => {
        it('should generate a workspace identifier when none is provided', async () => {
            // Set up the test to simulate no workspaceIdentifier in initialization
            features.lsp.getClientInitializeParams.returns({
                initializationOptions: {
                    aws: {
                        clientInfo: {
                            name: 'AmazonQ-For-VSCode',
                            version: '0.0.1',
                            extension: {
                                name: 'AmazonQ-For-VSCode',
                                version: '0.0.1',
                            },
                        },
                    },
                },
            } as InitializeParams)

            await features.initialize(server)

            // Verify that a warning was logged (indicating the workspaceIdentifier was generated)
            sinon.assert.calledWith(features.logging.warn, sinon.match(/No workspaceIdentifier set/))
        })
    })
})
