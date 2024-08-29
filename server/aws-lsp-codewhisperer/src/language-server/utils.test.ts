import { CredentialsProvider, InitializeParams } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import * as sinon from 'sinon'
import { getBearerTokenFromProvider, getUserAgent } from './utils'

describe('getBearerTokenFromProvider', () => {
    const mockToken = 'mockToken'
    it('returns the bearer token from the provider', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: mockToken }),
            getConnectionMetadata: sinon.stub(),
        }

        assert.strictEqual(getBearerTokenFromProvider(mockCredentialsProvider), mockToken)
    })

    it('throws an error if the credentials does not contain bearer credentials', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(false),
            getCredentials: sinon.stub().returns({ token: mockToken }),
            getConnectionMetadata: sinon.stub(),
        }

        assert.throws(
            () => getBearerTokenFromProvider(mockCredentialsProvider),
            Error,
            'credentialsProvider does not have bearer token credentials'
        )
    })

    it('throws an error if token is empty in bearer token', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: '' }),
            getConnectionMetadata: sinon.stub(),
        }

        assert.throws(
            () => getBearerTokenFromProvider(mockCredentialsProvider),
            Error,
            'credentialsProvider does not have bearer token credentials'
        )
    })
})

describe('getUserAgent', () => {
    it('should return a default string when no parameters are provided', () => {
        const userAgent = getUserAgent()
        assert.strictEqual(userAgent, 'AWS-Language-Servers')
    })

    it('should return a complete string when all initializeParams are provided', () => {
        const initializeParams = {
            awsRuntimeMetadata: {
                serverInfo: {
                    name: 'Test Server Name',
                    version: '0.1.2',
                },
            },
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
            'AWS-Language-Servers Test-Server-Name/0.1.2 Test-Client-Extension/1.2.3 Test-Platform/2.3.4 ClientId/1111-1111'
        )
    })

    it('should omit custom suffix if clientExtensionInfo is not passed', () => {
        const initializeParams = {
            awsRuntimeMetadata: {
                serverInfo: {
                    name: 'Test Server Name',
                    version: '0.1.2',
                },
            },
        } as InitializeParams

        const userAgent = getUserAgent(initializeParams)

        assert.strictEqual(userAgent, 'AWS-Language-Servers Test-Server-Name/0.1.2')
    })

    it('should replace missing clientExtensionInfo fields with UNKNOWN tokens', () => {
        const initializeParams = {
            awsRuntimeMetadata: {
                serverInfo: {
                    name: 'Test Server Name',
                    version: '0.1.2',
                },
            },
            initializationOptions: {
                aws: {
                    clientInfo: {
                        extension: {},
                    },
                },
            },
        } as InitializeParams

        const userAgent = getUserAgent(initializeParams)

        assert.strictEqual(userAgent, 'AWS-Language-Servers Test-Server-Name/0.1.2 UNKNOWN/UNKNOWN UNKNOWN/UNKNOWN')
    })

    it('should fallback to standard InitializeParams.clientInfo when initializationOptions.aws is not passed', () => {
        const initializeParams = {
            clientInfo: {
                name: 'Test Client',
                version: '2.3.4',
            },
            awsRuntimeMetadata: {
                serverInfo: {
                    name: 'Test Server Name',
                    version: '0.1.2',
                },
            },
        } as InitializeParams

        const userAgent = getUserAgent(initializeParams)

        assert.strictEqual(userAgent, 'AWS-Language-Servers Test-Server-Name/0.1.2 Test-Client/2.3.4')
    })
})
