import { QRetryClassifier, RetryAction } from './retryClassifier'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { expect } from 'chai'
import * as sinon from 'sinon'

describe('QRetryClassifier', () => {
    let classifier: QRetryClassifier
    let mockLogging: any

    beforeEach(() => {
        mockLogging = {
            info: sinon.stub(),
            debug: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        }

        classifier = new QRetryClassifier(mockLogging)
    })

    describe('classifyRetry', () => {
        it('should classify usage limit errors as RetryForbidden', () => {
            const error = { code: 'AmazonQUsageLimitError' }
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should classify request aborted errors as RetryForbidden', () => {
            const error = { name: 'AbortError' }
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should classify input too long errors as RetryForbidden', () => {
            const error = { code: 'InputTooLong' }
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should classify AWS throttling errors as ThrottlingError', () => {
            // Create a proper AWS error that extends Error and has required properties
            const error = new Error('Request was throttled') as any
            error.code = 'ThrottlingException'
            error.time = new Date()
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.ThrottlingError)
        })

        it('should classify monthly limit errors as RetryForbidden', () => {
            const error = {
                cause: {
                    $response: {
                        body: 'Error: MONTHLY_REQUEST_COUNT exceeded',
                    },
                },
            }
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should classify service overloaded errors as ThrottlingError', () => {
            const error = {
                cause: {
                    $metadata: { httpStatusCode: 500 },
                },
                message: 'Encountered unexpectedly high load when processing the request, please try again.',
            }
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.ThrottlingError)
        })

        it('should classify ServiceUnavailableException as ThrottlingError', () => {
            const error = {
                $metadata: { httpStatusCode: 500 },
                message: 'ServiceUnavailableException: Service temporarily unavailable',
            }
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.ThrottlingError)
        })

        it('should classify insufficient model capacity as ThrottlingError', () => {
            const error = {
                cause: {
                    $metadata: { httpStatusCode: 429 },
                    reason: 'INSUFFICIENT_MODEL_CAPACITY',
                },
            }
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.ThrottlingError)
        })

        it('should classify 5xx errors as TransientError', () => {
            const error = {
                $metadata: { httpStatusCode: 502 },
            }
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.TransientError)
        })

        it('should return NoActionIndicated for unknown errors', () => {
            const error = {
                message: 'Unknown error',
                $metadata: { httpStatusCode: 400 },
            }
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.NoActionIndicated)
        })

        it('should handle errors without metadata', () => {
            const error = { message: 'Simple error' }
            const result = classifier.classifyRetry(error)
            expect(result).to.equal(RetryAction.NoActionIndicated)
        })

        it('should handle null/undefined errors', () => {
            expect(classifier.classifyRetry(null)).to.equal(RetryAction.NoActionIndicated)
            expect(classifier.classifyRetry(undefined)).to.equal(RetryAction.NoActionIndicated)
        })
    })

    describe('name', () => {
        it('should return classifier name', () => {
            expect(classifier.name()).to.equal('Q Language Server Custom Retry Classifier')
        })
    })

    describe('logging', () => {
        it('should log debug messages for monthly limit detection', () => {
            const error = {
                message: 'Error: MONTHLY_REQUEST_COUNT exceeded',
            }
            classifier.classifyRetry(error)

            sinon.assert.calledWith(mockLogging.debug, sinon.match(/Monthly limit error detected/))
        })
    })
})
