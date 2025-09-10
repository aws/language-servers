import { QRetryClassifier, RetryAction } from './retryClassifier'
import { expect } from 'chai'
import * as sinon from 'sinon'

describe('QRetryClassifier', () => {
    let classifier: QRetryClassifier
    let mockLogging: any

    beforeEach(() => {
        mockLogging = {
            log: sinon.spy(),
            debug: sinon.spy(),
        }
        classifier = new QRetryClassifier(mockLogging)
    })

    describe('classifyRetry', () => {
        it('should forbid retry for abort errors', () => {
            const error = new Error('Request aborted')
            error.name = 'AbortError'

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should forbid retry for input too long errors', () => {
            const error = new Error('input too long')
            ;(error as any).code = 'InputTooLong'

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should forbid retry for monthly limit errors', () => {
            const context = {
                error: new Error('Monthly limit exceeded'),
                response: {
                    status: 400,
                    body: 'Error: MONTHLY_REQUEST_COUNT exceeded',
                },
            }

            const result = classifier.classifyRetry(context)

            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should classify throttling for service overloaded errors', () => {
            const context = {
                error: new Error('Service unavailable'),
                response: {
                    status: 500,
                    body: 'Encountered unexpectedly high load when processing the request, please try again.',
                },
            }

            const result = classifier.classifyRetry(context)

            expect(result).to.equal(RetryAction.ThrottlingError)
        })

        it('should classify throttling for 429 status with model capacity', () => {
            const error = new Error('Model unavailable')
            ;(error as any).statusCode = 429
            ;(error as any).cause = { reason: 'INSUFFICIENT_MODEL_CAPACITY' }

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.ThrottlingError)
        })

        it('should return no action for unknown errors', () => {
            const error = new Error('Unknown error')

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.NoActionIndicated)
        })

        it('should handle errors without response body', () => {
            const error = new Error('Network error')

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.NoActionIndicated)
        })

        it('should extract response body from different error formats', () => {
            const classifier = new QRetryClassifier()

            // Test different body extraction paths
            const context1 = {
                error: {
                    cause: { $response: { body: 'MONTHLY_REQUEST_COUNT' } },
                },
            }
            expect(classifier.classifyRetry(context1)).to.equal(RetryAction.RetryForbidden)

            const context2 = {
                error: {
                    $response: { body: 'MONTHLY_REQUEST_COUNT' },
                },
            }
            expect(classifier.classifyRetry(context2)).to.equal(RetryAction.RetryForbidden)

            const context3 = {
                error: {
                    message: 'MONTHLY_REQUEST_COUNT exceeded',
                },
            }
            expect(classifier.classifyRetry(context3)).to.equal(RetryAction.RetryForbidden)
        })
    })

    describe('extractResponseBody', () => {
        it('should extract body from Uint8Array', () => {
            const classifier = new QRetryClassifier()
            const body = new TextEncoder().encode('test body')
            const context = {
                error: {},
                response: { body },
            }

            const result = (classifier as any).extractResponseBody(context)

            expect(result).to.equal('test body')
        })

        it('should handle extraction errors gracefully', () => {
            const classifier = new QRetryClassifier()
            const context = {
                error: {
                    cause: {
                        $response: {
                            get body() {
                                throw new Error('Access denied')
                            },
                        },
                    },
                },
            }

            const result = (classifier as any).extractResponseBody(context)

            expect(result).to.be.null
        })
    })

    describe('name and priority', () => {
        it('should return correct name', () => {
            expect(classifier.name()).to.equal('Q Language Server Retry Classifier')
        })

        it('should return correct priority', () => {
            expect(classifier.priority().value).to.equal(100)
            expect(QRetryClassifier.priority().value).to.equal(100)
        })
    })
})
