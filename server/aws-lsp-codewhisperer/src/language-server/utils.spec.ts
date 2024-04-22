import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import * as sinon from 'sinon'
import { getBearerTokenFromProvider } from './utils'

describe('getBearerTokenFromProvider', () => {
    const mockToken = 'mockToken'
    it('returns the bearer token from the provider', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns(Promise.resolve({ token: mockToken })),
            getConnectionMetadata: sinon.stub(),
        }

        assert.strictEqual(getBearerTokenFromProvider(mockCredentialsProvider), mockToken)
    })

    it('throws an error if the credentials does not contain bearer credentials', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(false),
            getCredentials: sinon.stub().returns(Promise.resolve({ token: mockToken })),
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
            getCredentials: sinon.stub().returns(Promise.resolve({ token: '' })),
            getConnectionMetadata: sinon.stub(),
        }

        assert.throws(
            () => getBearerTokenFromProvider(mockCredentialsProvider),
            Error,
            'credentialsProvider does not have bearer token credentials'
        )
    })
})
