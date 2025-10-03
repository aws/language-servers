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
        it('should forbid retry for AccessDeniedException', () => {
            const error = new Error('Access denied')
            error.name = 'AccessDeniedException'

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should forbid retry for SERVICE_QUOTA_EXCEPTION', () => {
            const error = new Error('Service quota exceeded')
            error.name = 'SERVICE_QUOTA_EXCEPTION'

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should forbid retry for abort errors', () => {
            const error = new Error('Request aborted')
            error.name = 'AbortError'

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should forbid retry for input too long errors', () => {
            const error = new Error('input too long')
            ;(error as any).reason = 'CONTENT_LENGTH_EXCEEDS_THRESHOLD'

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should forbid retry for invalid model ID errors', () => {
            const error = new Error('Invalid model')
            ;(error as any).reason = 'INVALID_MODEL_ID'

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should forbid retry for maximum chat content message', () => {
            const error = new Error('Exceeded max chat context length.')
            error.message = 'Exceeded max chat context length.'

            const result = classifier.classifyRetry({ error })

            expect(result).to.equal(RetryAction.RetryForbidden)
        })

        it('should forbid retry for monthly limit errors', () => {
            const error = new Error('Monthly limit exceeded')
            ;(error as any).reason = 'MONTHLY_REQUEST_COUNT'
            const context = {
                error,
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
            ;(error as any).$metadata = { httpStatusCode: 429 }
            ;(error as any).reason = 'INSUFFICIENT_MODEL_CAPACITY'

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

            // Test different body extraction paths - these should NOT trigger monthly limit errors
            // since monthly limit detection now uses error.reason instead of body content
            const context1 = {
                error: {
                    cause: { $metadata: { body: 'MONTHLY_REQUEST_COUNT' } },
                },
            }
            expect(classifier.classifyRetry(context1)).to.equal(RetryAction.NoActionIndicated)

            const context2 = {
                error: {
                    $metadata: { body: 'MONTHLY_REQUEST_COUNT' },
                },
            }
            expect(classifier.classifyRetry(context2)).to.equal(RetryAction.NoActionIndicated)

            const context3 = {
                error: {
                    message: 'MONTHLY_REQUEST_COUNT exceeded',
                },
            }
            expect(classifier.classifyRetry(context3)).to.equal(RetryAction.NoActionIndicated)
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

        it('should extract body from ArrayBuffer', () => {
            const classifier = new QRetryClassifier()
            const body = new TextEncoder().encode('test body').buffer
            const context = {
                error: { body },
            }

            const result = (classifier as any).extractResponseBody(context)

            expect(result).to.equal('test body')
        })

        it('should extract body from object', () => {
            const classifier = new QRetryClassifier()
            const body = { message: 'test' }
            const context = {
                error: { body },
            }

            const result = (classifier as any).extractResponseBody(context)

            expect(result).to.equal('{"message":"test"}')
        })

        it('should handle extraction errors gracefully', () => {
            const classifier = new QRetryClassifier()

            // Test extractTextFromBody error handling
            const bodyThatThrows = {
                get toString() {
                    throw new Error('Access denied')
                },
            }

            const result = (classifier as any).extractTextFromBody(bodyThatThrows)
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

    describe('isMonthlyLimitError', () => {
        it('should log debug messages for monthly limit detection', () => {
            const classifierWithLogging = new QRetryClassifier(mockLogging)
            const error = { reason: 'MONTHLY_REQUEST_COUNT' }

            const result = (classifierWithLogging as any).isMonthlyLimitError(error)

            expect(result).to.be.true
            expect(mockLogging.debug.called).to.be.true
        })
    })

    describe('isServiceOverloadedError', () => {
        it('should log debug messages for service overloaded detection', () => {
            const classifierWithLogging = new QRetryClassifier(mockLogging)
            const context = {
                error: { $metadata: { httpStatusCode: 500 } },
                response: { status: 500 },
            }

            const result = (classifierWithLogging as any).isServiceOverloadedError(
                context,
                'Encountered unexpectedly high load when processing the request, please try again.'
            )

            expect(result).to.be.true
            expect(mockLogging.debug.called).to.be.true
        })
    })
})
