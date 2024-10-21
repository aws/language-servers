import { InitializeParams } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import { getUserAgent } from './telemetryUtils'

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
