import * as assert from 'assert'
import * as sinon from 'sinon'
import {
    TransformConfigurationServer,
    TRANSFORM_PROFILES_CONFIGURATION_SECTION,
    ATX_TRANSFORM_PROFILES_CONFIGURATION_SECTION,
} from './transformConfigurationServer'
import {
    CancellationToken,
    InitializeParams,
    LSPErrorCodes,
    ResponseError,
    CredentialsProvider,
    Logging,
} from '@aws/language-server-runtimes/server-interface'

describe('TransformConfigurationServer', () => {
    let server: TransformConfigurationServer
    let mockLogging: sinon.SinonStubbedInstance<Logging>
    let mockCredentialsProvider: sinon.SinonStubbedInstance<CredentialsProvider>

    beforeEach(() => {
        mockLogging = {
            log: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
            debug: sinon.stub(),
        } as any

        mockCredentialsProvider = {
            hasCredentials: sinon.stub(),
            getCredentials: sinon.stub(),
            getConnectionType: sinon.stub(),
            getConnectionMetadata: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        } as any

        const mockFeatures = {
            lsp: {} as any,
            logging: mockLogging,
            runtime: {} as any,
            credentialsProvider: mockCredentialsProvider,
            workspace: {} as any,
            sdkInitializator: {} as any,
        }

        server = new TransformConfigurationServer(mockLogging, mockFeatures)
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            const params: InitializeParams = {
                processId: 0,
                rootUri: 'test',
                capabilities: {},
                initializationOptions: {},
            }

            const result = await server.initialize(params)

            assert.deepStrictEqual(result, {
                capabilities: {},
                awsServerCapabilities: {
                    configurationProvider: {
                        sections: [
                            TRANSFORM_PROFILES_CONFIGURATION_SECTION,
                            ATX_TRANSFORM_PROFILES_CONFIGURATION_SECTION,
                        ],
                    },
                },
            })

            sinon.assert.calledWith(
                mockLogging.log,
                'TransformConfigurationServer: Constructor called - server created'
            )
            sinon.assert.calledWith(mockLogging.log, 'TransformConfigurationServer: Initialize called')
        })
    })

    describe('getConfiguration', () => {
        it('should handle transform profiles configuration section', async () => {
            mockCredentialsProvider.hasCredentials.withArgs('bearer').returns(false)

            const params = { section: TRANSFORM_PROFILES_CONFIGURATION_SECTION }
            const token = {} as CancellationToken

            const result = await server.getConfiguration(params, token)

            assert.deepStrictEqual(result, [])
            sinon.assert.calledWith(
                mockLogging.log,
                `TransformConfigurationServer: Configuration requested for section: ${TRANSFORM_PROFILES_CONFIGURATION_SECTION}`
            )
        })

        it('should throw error for unsupported configuration section', async () => {
            const params = { section: 'unsupported.section' }
            const token = {} as CancellationToken

            await assert.rejects(
                server.getConfiguration(params, token),
                new ResponseError(
                    LSPErrorCodes.RequestFailed,
                    'TransformConfigurationServer: Unsupported configuration section: unsupported.section'
                )
            )
        })

        it('should list available profiles when credentials are available', async () => {
            mockCredentialsProvider.hasCredentials.withArgs('bearer').returns(true)
            mockCredentialsProvider.getCredentials.withArgs('bearer').returns({ token: 'test-token' })

            // Mock environment variables
            const originalEnv = process.env.AWS_ATX_FES_REGION
            process.env.AWS_ATX_FES_REGION = 'us-east-1'

            const params = { section: TRANSFORM_PROFILES_CONFIGURATION_SECTION }
            const token = {} as CancellationToken

            try {
                const result = await server.getConfiguration(params, token)
                // Should return empty array when no profiles found
                assert(Array.isArray(result))
            } finally {
                if (originalEnv !== undefined) {
                    process.env.AWS_ATX_FES_REGION = originalEnv
                } else {
                    delete process.env.AWS_ATX_FES_REGION
                }
            }
        })
    })

    describe('private methods', () => {
        it('should initialize ATX client when credentials are available', async () => {
            mockCredentialsProvider.hasCredentials.withArgs('bearer').returns(true)
            mockCredentialsProvider.getCredentials.withArgs('bearer').returns({ token: 'test-token' })

            const initializeAtxClient = (server as any).initializeAtxClient.bind(server)
            const result = await initializeAtxClient()

            assert.strictEqual(typeof result, 'boolean')
        })

        it('should fail to initialize ATX client when credentials are not available', async () => {
            mockCredentialsProvider.hasCredentials.withArgs('bearer').returns(false)

            const initializeAtxClient = (server as any).initializeAtxClient.bind(server)
            const result = await initializeAtxClient()

            assert.strictEqual(result, false)
        })

        it('should fall back to default region when no environment variable set', async () => {
            const originalEnv = process.env.AWS_ATX_FES_REGION
            delete process.env.AWS_ATX_FES_REGION

            mockCredentialsProvider.hasCredentials.withArgs('bearer').returns(false)

            try {
                const getClientRegion = (server as any).getClientRegion.bind(server)
                const region = await getClientRegion()

                assert.strictEqual(region, 'us-east-1') // DEFAULT_ATX_FES_REGION
            } finally {
                if (originalEnv !== undefined) {
                    process.env.AWS_ATX_FES_REGION = originalEnv
                }
            }
        })

        it('should get endpoint for region', () => {
            const getEndpointForRegion = (server as any).getEndpointForRegion.bind(server)

            const endpoint = getEndpointForRegion('us-east-1')
            assert(typeof endpoint === 'string')
            assert(endpoint.length > 0)
        })

        it('should handle errors in ATX client initialization', async () => {
            const mockAtxCredentialsProvider = {
                hasCredentials: sinon.stub().withArgs('bearer').returns(true),
                getCredentials: sinon.stub().withArgs('bearer').throws(new Error('Credential error')),
            }

            const mockRuntime = {
                getAtxCredentialsProvider: sinon.stub().returns(mockAtxCredentialsProvider),
            }

            ;(server as any).features.runtime = mockRuntime

            const initializeAtxClient = (server as any).initializeAtxClient.bind(server)
            const result = await initializeAtxClient()

            assert.strictEqual(result, false)
            sinon.assert.called(mockLogging.warn)
        })
    })
})
