import {
    ServiceQuotaExceededException,
    ThrottlingException,
    ThrottlingExceptionReason,
} from '@amzn/codewhisperer-streaming'
import { CredentialsProvider, Position } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import { AWSError } from 'aws-sdk'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { BUILDER_ID_START_URL } from './constants'
import {
    getBearerTokenFromProvider,
    getEndPositionForAcceptedSuggestion,
    getSsoConnectionType,
    getUnmodifiedAcceptedTokens,
    isAwsThrottlingError,
    isFreeTierLimitError,
    isQuotaExceededError,
    isStringOrNull,
    safeGet,
} from './utils'

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

describe('isAwsThrottlingError', function () {
    it('false for non-error objects', function () {
        assert.strictEqual(isAwsThrottlingError(undefined), false)
        assert.strictEqual(isAwsThrottlingError(null), false)
        assert.strictEqual(isAwsThrottlingError('error string'), false)
        assert.strictEqual(isAwsThrottlingError({}), false)
        assert.strictEqual(isAwsThrottlingError(42), false)
    })

    it('false for regular Error objects', function () {
        const regularError = new Error('Some error')
        assert.strictEqual(isAwsThrottlingError(regularError), false)
    })

    it('false for non-throttling AWS errors', function () {
        const nonThrottlingError = {
            name: 'AWSError',
            message: 'Not a throttling error',
            code: 'SomeOtherError',
            time: new Date(),
        } as AWSError

        assert.strictEqual(isAwsThrottlingError(nonThrottlingError), false)
    })

    it('true for AWS throttling errors', function () {
        const sdkV2Error = new Error()
        ;(sdkV2Error as any).name = 'ThrottlingException'
        ;(sdkV2Error as any).message = 'Rate exceeded'
        ;(sdkV2Error as any).code = 'ThrottlingException'
        ;(sdkV2Error as any).time = new Date()
        assert.strictEqual(isAwsThrottlingError(sdkV2Error), true)

        const sdkV3Error = new ThrottlingException({
            message: 'Too many requests',
            $metadata: {},
        })
        assert.strictEqual(isAwsThrottlingError(sdkV3Error), true)
    })
})

describe('isFreeTierLimitError', function () {
    it('false for non-throttling errors', function () {
        const regularError = new Error('Some error')
        assert.strictEqual(isFreeTierLimitError(regularError), false)

        const e = new Error()
        ;(e as any).name = 'AWSError'
        ;(e as any).message = 'Not a throttling error'
        ;(e as any).code = 'SomeOtherError'
        ;(e as any).time = new Date()

        assert.strictEqual(isFreeTierLimitError(e), false)
    })

    it('false for throttling errors without MONTHLY_REQUEST_COUNT reason', function () {
        const throttlingError = new Error()
        ;(throttlingError as any).name = 'ThrottlingException'
        ;(throttlingError as any).message = 'Rate exceeded'
        ;(throttlingError as any).code = 'ThrottlingException'
        ;(throttlingError as any).time = new Date()
        ;(throttlingError as any).reason = 'SOME_OTHER_REASON'

        assert.strictEqual(isFreeTierLimitError(throttlingError), false)
    })

    it('true for throttling errors with MONTHLY_REQUEST_COUNT reason', function () {
        const freeTierLimitError = new Error()
        ;(freeTierLimitError as any).name = 'ThrottlingException'
        ;(freeTierLimitError as any).message = 'Free tier limit reached'
        ;(freeTierLimitError as any).code = 'ThrottlingException'
        ;(freeTierLimitError as any).time = new Date()
        ;(freeTierLimitError as any).reason = ThrottlingExceptionReason.MONTHLY_REQUEST_COUNT

        assert.strictEqual(isFreeTierLimitError(freeTierLimitError), true)
    })
})

describe('isQuotaExceededError', function () {
    it('false for non-AWS errors', function () {
        const regularError = new Error('Some error')
        assert.strictEqual(isQuotaExceededError(regularError), false)

        assert.strictEqual(isQuotaExceededError(undefined), false)
        assert.strictEqual(isQuotaExceededError(null), false)
        assert.strictEqual(isQuotaExceededError('error string'), false)
    })

    it('true for free tier limit errors', function () {
        const e = new ThrottlingException({
            message: 'Free tier limit reached',
            $metadata: {},
        })

        assert.strictEqual(isQuotaExceededError(e), true)
    })

    it('true for ServiceQuotaExceededException errors', function () {
        const e = new ServiceQuotaExceededException({
            message: 'Service quota exceeded',
            $metadata: {},
        })

        assert.strictEqual(isQuotaExceededError(e), true)
    })

    it('true for specific messages', function () {
        const reachedForThisMonth = new Error()
        ;(reachedForThisMonth as any).name = 'ThrottlingException'
        ;(reachedForThisMonth as any).message = 'You have reached the limit for this month'
        ;(reachedForThisMonth as any).code = 'ThrottlingException'
        ;(reachedForThisMonth as any).time = new Date()

        const limitForIterationsError = new ThrottlingException({
            message: 'You have reached the limit for number of iterations',
            $metadata: {},
        })

        assert.strictEqual(isQuotaExceededError(reachedForThisMonth), true)
        assert.strictEqual(isQuotaExceededError(limitForIterationsError), true)

        // Invalid cases
        reachedForThisMonth.message = 'some other messsage'
        assert.strictEqual(isQuotaExceededError(reachedForThisMonth), false)
        limitForIterationsError.message = 'foo bar'
        assert.strictEqual(isQuotaExceededError(limitForIterationsError), false)
    })
})
