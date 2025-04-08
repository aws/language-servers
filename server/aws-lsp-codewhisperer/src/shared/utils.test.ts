import { CredentialsProvider, InitializeParams, Position } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import * as sinon from 'sinon'
import {
    getBearerTokenFromProvider,
    getSsoConnectionType,
    getUnmodifiedAcceptedTokens,
    getEndPositionForAcceptedSuggestion,
    safeGet,
    isStringOrNull,
} from './utils'
import { expect } from 'chai'
import { BUILDER_ID_START_URL } from './constants'

describe('getBearerTokenFromProvider', () => {
    const mockToken = 'mockToken'
    it('returns the bearer token from the provider', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: mockToken }),
            getConnectionMetadata: sinon.stub(),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        assert.strictEqual(getBearerTokenFromProvider(mockCredentialsProvider), mockToken)
    })

    it('throws an error if the credentials does not contain bearer credentials', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(false),
            getCredentials: sinon.stub().returns({ token: mockToken }),
            getConnectionMetadata: sinon.stub(),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
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
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        assert.throws(
            () => getBearerTokenFromProvider(mockCredentialsProvider),
            Error,
            'credentialsProvider does not have bearer token credentials'
        )
    })
})

describe('getSsoConnectionType', () => {
    const mockToken = 'mockToken'
    const mockCredsProvider: CredentialsProvider = {
        hasCredentials: sinon.stub().returns(true),
        getCredentials: sinon.stub().returns({ token: mockToken }),
        getConnectionMetadata: sinon.stub(),
        getConnectionType: sinon.stub(),
        onCredentialsDeleted: sinon.stub(),
    }
    it('should return ssoConnectionType as builderId', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: BUILDER_ID_START_URL,
                },
            }),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        const ssoConnectionType = getSsoConnectionType(mockCredentialsProvider)
        expect(ssoConnectionType).to.equal('builderId')
    })

    it('should return ssoConnectionType as identityCenter', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: 'idc-url',
                },
            }),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        const ssoConnectionType = getSsoConnectionType(mockCredentialsProvider)
        expect(ssoConnectionType).to.equal('identityCenter')
    })

    it('should return ssoConnectionType as none when getConnectionMetadata returns undefined', () => {
        const ssoConnectionType = getSsoConnectionType(mockCredsProvider)
        expect(ssoConnectionType).to.equal('none')
    })

    it('should return ssoConnectionType as none when getConnectionMetadata.sso returns undefined', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: undefined,
            }),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        const ssoConnectionType = getSsoConnectionType(mockCredentialsProvider)
        expect(ssoConnectionType).to.equal('none')
    })

    it('should return ssoConnectionType as none when getConnectionMetadata.sso.startUrl is empty string', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: '',
                },
            }),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        const ssoConnectionType = getSsoConnectionType(mockCredentialsProvider)
        expect(ssoConnectionType).to.equal('none')
    })

    it('should return ssoConnectionType as none when getConnectionMetadata.sso.startUrl returns undefined', () => {
        const mockCredentialsProvider: CredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
            getCredentials: sinon.stub().returns({ token: 'token' }),
            getConnectionMetadata: sinon.stub().returns({
                sso: {
                    startUrl: undefined,
                },
            }),
            getConnectionType: sinon.stub(),
            onCredentialsDeleted: sinon.stub(),
        }
        const ssoConnectionType = getSsoConnectionType(mockCredentialsProvider)
        expect(ssoConnectionType).to.equal('none')
    })
})

describe('getUnmodifiedAcceptedTokens', function () {
    it('Should return correct unmodified accepted tokens count', function () {
        assert.strictEqual(getUnmodifiedAcceptedTokens('foo', 'fou'), 2)
        assert.strictEqual(getUnmodifiedAcceptedTokens('foo', 'f11111oo'), 3)
        assert.strictEqual(getUnmodifiedAcceptedTokens('foo', 'fo'), 2)
        assert.strictEqual(getUnmodifiedAcceptedTokens('helloworld', 'HelloWorld'), 8)
        assert.strictEqual(getUnmodifiedAcceptedTokens('helloworld', 'World'), 4)
        assert.strictEqual(getUnmodifiedAcceptedTokens('CodeWhisperer', 'CODE'), 1)
        assert.strictEqual(getUnmodifiedAcceptedTokens('CodeWhisperer', 'CodeWhispererGood'), 13)
    })
})

describe('getEndPositionForAcceptedSuggestion', () => {
    it('should return correct end position for single-line content', () => {
        const content = 'console.log("Hello");'
        const startPosition: Position = { line: 5, character: 10 }

        const result = getEndPositionForAcceptedSuggestion(content, startPosition)

        assert.deepStrictEqual(result, { line: 5, character: 31 })
    })

    it('should return correct end position for multi-line content', () => {
        const content = 'if (condition) {\n  console.log("True");\n}'
        const startPosition: Position = { line: 10, character: 5 }

        const result = getEndPositionForAcceptedSuggestion(content, startPosition)

        assert.deepStrictEqual(result, { line: 12, character: 1 })
    })

    it('should handle empty content', () => {
        const content = ''
        const startPosition: Position = { line: 0, character: 0 }

        const result = getEndPositionForAcceptedSuggestion(content, startPosition)

        assert.deepStrictEqual(result, { line: 0, character: 0 })
    })

    it('should handle content with only newlines', () => {
        const content = '\n\n'
        const startPosition: Position = { line: 3, character: 0 }

        const result = getEndPositionForAcceptedSuggestion(content, startPosition)

        assert.deepStrictEqual(result, { line: 5, character: 0 })
    })

    it('should handle content ending with a newline', () => {
        const content = 'console.log("Hello");\n'
        const startPosition: Position = { line: 7, character: 2 }

        const result = getEndPositionForAcceptedSuggestion(content, startPosition)

        assert.deepStrictEqual(result, { line: 8, character: 0 })
    })
})

describe('safeGet', () => {
    const getStringOrUndefined = (defined: boolean) => {
        return defined ? 'some-string' : undefined
    }

    it('does not throw if argument is defined', () => {
        assert.doesNotThrow(() => safeGet(getStringOrUndefined(true)))
    })

    it('throws when argument is undefined', () => {
        assert.throws(() => safeGet(getStringOrUndefined(false)))
    })
})

describe('isStringOrNull', () => {
    const testCases = [
        { input: 0, expected: false },
        { input: false, expected: false },
        { input: [], expected: false },
        { input: {}, expected: false },
        { input: undefined, expected: false },
        { input: 'some-string', expected: true },
        { input: '', expected: true },
        { input: null, expected: true },
    ]

    testCases.forEach(testCase => {
        it(`should return: ${testCase.expected}, when passed: ${JSON.stringify(testCase.input)}`, () => {
            assert(isStringOrNull(testCase.input) === testCase.expected)
        })
    })
})
