import { CredentialsProvider, InitializeParams } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import * as sinon from 'sinon'
import { getBearerTokenFromProvider, getLoginTypeFromProvider } from './utils'
import { expect } from 'chai'
import { BUILDER_ID_START_URL } from './constants'

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

describe('getLoginTypeFromProvider', () => {
    it('should return loginType as builderId', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: BUILDER_ID_START_URL,
                },
            }),
        }
        const loginType = getLoginTypeFromProvider(mockCredentialsProvider)
        expect(loginType).to.equal('builderId')
    })

    it('should return loginType as identityCenter', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: 'idc-url',
                },
            }),
        }
        const loginType = getLoginTypeFromProvider(mockCredentialsProvider)
        expect(loginType).to.equal('identityCenter')
    })

    it('should return loginType as none when getConnectionMetadata returns undefined', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns(undefined),
        }
        const loginType = getLoginTypeFromProvider(mockCredentialsProvider)
        expect(loginType).to.equal('none')
    })

    it('should return loginType as none when getConnectionMetadata.sso returns undefined', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: undefined,
            }),
        }
        const loginType = getLoginTypeFromProvider(mockCredentialsProvider)
        expect(loginType).to.equal('none')
    })

    it('should return loginType as none when getConnectionMetadata.sso.startUrl is empty string', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: '',
                },
            }),
        }
        const loginType = getLoginTypeFromProvider(mockCredentialsProvider)
        expect(loginType).to.equal('none')
    })

    it('should return loginType as none when getConnectionMetadata.sso.startUrl returns undefined', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: undefined,
                },
            }),
        }
        const loginType = getLoginTypeFromProvider(mockCredentialsProvider)
        expect(loginType).to.equal('none')
    })
})
