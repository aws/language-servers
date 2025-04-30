import * as assert from 'assert'
import * as sinon from 'sinon'
import { InitializeParams, Platform } from '@aws/language-server-runtimes/server-interface'
import { getUserAgent, makeUserContextObject } from './telemetryUtils'

describe('getUserAgent', () => {
    it('should return a default string when no parameters are provided', () => {
        const userAgent = getUserAgent({} as InitializeParams)
        assert.strictEqual(userAgent, 'AWS-Language-Servers')
    })

    it('should return a complete string when all initializeParams are provided', () => {
        const initializeParams = {
            initializationOptions: {
                aws: {
                    clientInfo: {
                        name: 'Test Platform',
                        version: '2.3.4',
                        extension: {
                            name: 'Test Client Extension',
                            version: '1.2.3',
                        },
                        clientId: '1111-1111',
                    },
                },
            },
        } as InitializeParams
        const serverInfo = {
            name: 'Test Server Name',
            version: '0.1.2',
        }

        const userAgent = getUserAgent(initializeParams, serverInfo)

        assert.strictEqual(
            userAgent,
            'AWS-Language-Servers Test-Server-Name/0.1.2 Test-Client-Extension/1.2.3 Test-Platform/2.3.4 ClientId/1111-1111'
        )
    })

    it('should omit custom suffix if clientExtensionInfo is not passed', () => {
        const initializeParams = {} as InitializeParams
        const serverInfo = {
            name: 'Test Server Name',
            version: '0.1.2',
        }

        const userAgent = getUserAgent(initializeParams, serverInfo)

        assert.strictEqual(userAgent, 'AWS-Language-Servers Test-Server-Name/0.1.2')
    })

    it('should omit serverInfo if not passed', () => {
        const initializeParams = {
            initializationOptions: {
                aws: {
                    clientInfo: {
                        name: 'Test Platform',
                        version: '2.3.4',
                        extension: {
                            name: 'Test Client Extension',
                            version: '1.2.3',
                        },
                        clientId: '1111-1111',
                    },
                },
            },
        } as InitializeParams

        const userAgent = getUserAgent(initializeParams)

        assert.strictEqual(
            userAgent,
            'AWS-Language-Servers Test-Client-Extension/1.2.3 Test-Platform/2.3.4 ClientId/1111-1111'
        )
    })

    it('should replace missing clientExtensionInfo fields with UNKNOWN tokens', () => {
        const initializeParams = {
            initializationOptions: {
                aws: {
                    clientInfo: {
                        extension: {},
                    },
                },
            },
        } as InitializeParams
        const serverInfo = {
            name: 'Test Server Name',
            version: '0.1.2',
        }

        const userAgent = getUserAgent(initializeParams, serverInfo)

        assert.strictEqual(userAgent, 'AWS-Language-Servers Test-Server-Name/0.1.2 UNKNOWN/UNKNOWN UNKNOWN/UNKNOWN')
    })

    it('should fallback to standard InitializeParams.clientInfo when initializationOptions.aws is not passed', () => {
        const initializeParams = {
            clientInfo: {
                name: 'Test Client',
                version: '2.3.4',
            },
        } as InitializeParams
        const serverInfo = {
            name: 'Test Server Name',
            version: '0.1.2',
        }

        const userAgent = getUserAgent(initializeParams, serverInfo)

        assert.strictEqual(userAgent, 'AWS-Language-Servers Test-Server-Name/0.1.2 Test-Client/2.3.4')
    })
})

describe('makeUserContextObject', () => {
    let mockInitializeParams: InitializeParams
    // let osStub: sinon.SinonStubbedInstance<{ now: () => number }>

    beforeEach(() => {
        mockInitializeParams = {
            initializationOptions: {
                aws: {
                    clientInfo: {
                        name: 'test-custom-client-name',
                        version: '1.2.3',
                        extension: {
                            name: 'AmazonQ-For-VSCode',
                            version: '2.2.2',
                        },
                        clientId: 'test-client-id',
                    },
                },
            },
            clientInfo: {
                name: 'test-client-name',
                version: '1.1.1',
            },
        } as InitializeParams

        sinon.stub(process, 'platform').value('win32')
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should return a valid UserContext object', () => {
        const result = makeUserContextObject(mockInitializeParams, 'win32', 'TestProduct')
        assert(result)
        assert.ok('ideCategory' in result)
        assert.ok('operatingSystem' in result)
        assert.strictEqual(result.operatingSystem, 'WINDOWS')
        assert.strictEqual(result.product, 'TestProduct')
        assert.strictEqual(result.clientId, 'test-client-id')
        assert.strictEqual(result.ideVersion, '1.2.3')
    })

    it('should prefer initializationOptions.aws version over clientInfo version', () => {
        const result = makeUserContextObject(mockInitializeParams, 'linux', 'TestProduct')
        assert.strictEqual(result?.ideVersion, '1.2.3')
    })

    it('should use clientInfo version if initializationOptions.aws version is not available', () => {
        // @ts-ignore
        mockInitializeParams.initializationOptions.aws.clientInfo.version = undefined
        const result = makeUserContextObject(mockInitializeParams, 'linux', 'TestProduct')
        assert.strictEqual(result?.ideVersion, '1.1.1')
    })

    it('should return undefined if ideCategory is not in IDE_CATEGORY_MAP', () => {
        // @ts-ignore
        mockInitializeParams.initializationOptions.aws.clientInfo.extension.name = 'Unknown IDE'

        const result = makeUserContextObject(mockInitializeParams, 'linux', 'TestProduct')
        assert.strictEqual(result, undefined)
    })

    it('should handle all possible client name values to define ideCategory', () => {
        const clientNames = [
            'AmazonQ-For-VSCode',
            'Amazon Q For JetBrains',
            'AmazonQ-For-Eclipse',
            'AWS-Toolkit-For-VisualStudio',
        ]

        clientNames.forEach(clientName => {
            // @ts-ignore
            mockInitializeParams.initializationOptions.aws.clientInfo.extension.name = clientName

            const result = makeUserContextObject(mockInitializeParams, 'linux', 'TestProduct')
            switch (clientName) {
                case 'AmazonQ-For-VSCode':
                    assert.strictEqual(result?.ideCategory, 'VSCODE')
                    break
                case 'Amazon Q For JetBrains':
                    assert.strictEqual(result?.ideCategory, 'JETBRAINS')
                    break
                case 'AmazonQ-For-Eclipse':
                    assert.strictEqual(result?.ideCategory, 'ECLIPSE')
                    break
                case 'AWS-Toolkit-For-VisualStudio':
                    assert.strictEqual(result?.ideCategory, 'VISUAL_STUDIO')
                    break
                default:
                    assert.strictEqual(result, undefined)
            }
        })
    })

    it('should handle all possible process.platform values', () => {
        const platforms: Platform[] = [
            'aix',
            'android',
            'darwin',
            'freebsd',
            'linux',
            'openbsd',
            'sunos',
            'win32',
            'browser',
        ]

        platforms.forEach(platform => {
            const result = makeUserContextObject(mockInitializeParams, platform, 'TestProduct')
            switch (platform) {
                case 'win32':
                    assert.strictEqual(result?.operatingSystem, 'WINDOWS')
                    break
                case 'darwin':
                    assert.strictEqual(result?.operatingSystem, 'MAC')
                    break
                case 'linux':
                    assert.strictEqual(result?.operatingSystem, 'LINUX')
                    break
                default:
                    assert.strictEqual(result, undefined)
            }
        })
    })
})
