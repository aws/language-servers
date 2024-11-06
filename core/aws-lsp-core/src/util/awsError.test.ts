import { AwsErrorCodes } from '@aws/language-server-runtimes/server-interface'
import { AwsError } from './awsError'
import { expect, use } from 'chai'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

describe('AwsError', () => {
    it('Wraps general error in AwsError with given awsErrorCode', () => {
        const actual = AwsError.wrap(new Error('actual'), AwsErrorCodes.E_INVALID_SSO_TOKEN)

        expect(actual).to.be.an.instanceof(AwsError)
        expect(actual).to.have.a.property('message').that.equals('actual')
        expect(actual).to.have.a.property('awsErrorCode').that.equals(AwsErrorCodes.E_INVALID_SSO_TOKEN)
    })

    it('Wraps null in an AwsError with "Unknown error"', () => {
        const actual = AwsError.wrap(null!, AwsErrorCodes.E_ENCRYPTION_REQUIRED)

        expect(actual).to.be.an.instanceof(AwsError)
        expect(actual).to.have.a.property('message').that.equals('Unknown error')
        expect(actual).and.a.property('awsErrorCode').that.equals(AwsErrorCodes.E_ENCRYPTION_REQUIRED)
    })

    it('Passes AwsError on as-is', () => {
        const awsError = new AwsError('I am me', 'any string works')
        const actual = AwsError.wrap(awsError, AwsErrorCodes.E_TIMEOUT)

        expect(actual).to.equal(awsError)
        expect(actual).to.have.a.property('message').that.equals('I am me')
        expect(actual).and.a.property('awsErrorCode').that.equals('any string works')
    })

    it('Passed in cause is retained', () => {
        const cause = new Error('I am the cause')
        const ctorActual = new AwsError('I am the AwsError', AwsErrorCodes.E_UNKNOWN, { cause })
        const wrapActual = AwsError.wrap(cause, AwsErrorCodes.E_INVALID_SSO_TOKEN)

        expect(ctorActual).to.be.instanceof(AwsError)

        expect(ctorActual.message).to.equal('I am the AwsError')
        expect(ctorActual.cause).to.equal(cause)
        expect((ctorActual.cause as Error).message).to.equal('I am the cause')

        expect(wrapActual.message).to.equal('I am the cause')
        expect(wrapActual.cause).to.equal(cause)
        expect((wrapActual.cause as Error).message).to.equal('I am the cause')
    })
})
