import { RetryErrorHandler } from './retryErrorHandler'
import { RetryAction } from './retryClassifier'
import { AgenticChatError } from '../errors'
import { expect } from 'chai'

describe('RetryErrorHandler', () => {
    let handler: RetryErrorHandler
    let handlerWithModelSelection: RetryErrorHandler

    beforeEach(() => {
        handler = new RetryErrorHandler(false)
        handlerWithModelSelection = new RetryErrorHandler(true)
    })

    describe('transformFinalError', () => {
        it('should transform usage limit errors', () => {
            const error = { code: 'AmazonQUsageLimitError' }
            const result = handler.transformFinalError(error, 3, RetryAction.RetryForbidden)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.contain('Request failed after 3 attempts')
            expect((result as AgenticChatError).code).to.equal('AmazonQUsageLimitError')
        })

        it('should transform request aborted errors', () => {
            const error = { name: 'AbortError' }
            const result = handler.transformFinalError(error, 2, RetryAction.RetryForbidden)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.equal('Request aborted')
            expect((result as AgenticChatError).code).to.equal('RequestAborted')
        })

        it('should transform input too long errors', () => {
            const error = { code: 'InputTooLong' }
            const result = handler.transformFinalError(error, 1, RetryAction.RetryForbidden)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.contain('Too much context loaded')
            expect((result as AgenticChatError).code).to.equal('InputTooLong')
        })

        it('should transform throttling errors', () => {
            const error = { code: 'Throttling' }
            const result = handler.transformFinalError(error, 3, RetryAction.ThrottlingError)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.contain('Service is currently experiencing high traffic')
            expect(result.message).to.contain('Request failed after 3 attempts')
            expect((result as AgenticChatError).code).to.equal('RequestThrottled')
        })

        it('should transform model unavailable errors without model selection', () => {
            const error = {
                cause: {
                    $metadata: { httpStatusCode: 429 },
                    reason: 'INSUFFICIENT_MODEL_CAPACITY',
                },
            }
            const result = handler.transformFinalError(error, 2, RetryAction.NoActionIndicated)

            expect(result.message).to.contain('I am experiencing high traffic after 2 attempts')
        })

        it('should transform model unavailable errors with model selection enabled', () => {
            const error = {
                cause: {
                    $metadata: { httpStatusCode: 429 },
                    reason: 'INSUFFICIENT_MODEL_CAPACITY',
                },
            }
            const result = handlerWithModelSelection.transformFinalError(error, 2, RetryAction.NoActionIndicated)

            expect(result.message).to.contain('The model you selected is temporarily unavailable after 2 attempts')
            expect(result.message).to.contain('Please switch to a different model')
        })

        it('should transform high load errors', () => {
            const error = {
                $metadata: { httpStatusCode: 500 },
                message: 'Encountered unexpectedly high load when processing the request, please try again.',
            }
            const result = handler.transformFinalError(error, 3, RetryAction.NoActionIndicated)

            expect(result.message).to.contain('I am experiencing high traffic after 3 attempts')
        })

        it('should handle errors with request IDs', () => {
            const error = {
                code: 'AmazonQUsageLimitError',
                requestId: 'test-request-id',
            }
            const result = handler.transformFinalError(error, 1, RetryAction.RetryForbidden)

            expect((result as AgenticChatError).requestId).to.equal('test-request-id')
        })

        it('should handle errors without status codes', () => {
            const error = { message: 'Generic error' }
            const result = handler.transformFinalError(error, 1, RetryAction.NoActionIndicated)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect((result as AgenticChatError).code).to.equal('QModelResponse')
        })

        it('should preserve original error as cause', () => {
            const originalError = new Error('Original error')
            const result = handler.transformFinalError(originalError, 1, RetryAction.NoActionIndicated)

            expect((result as AgenticChatError).cause).to.equal(originalError)
        })

        it('should handle non-Error objects', () => {
            const error = { message: 'String error', code: 'TEST_ERROR' }
            const result = handler.transformFinalError(error, 1, RetryAction.NoActionIndicated)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect((result as AgenticChatError).cause).to.be.undefined
        })
    })

    describe('private methods behavior', () => {
        it('should detect request aborted errors correctly', () => {
            const abortError = { name: 'AbortError' }
            const codeError = { code: 'RequestAborted' }

            expect(handler.transformFinalError(abortError, 1, RetryAction.NoActionIndicated)).to.be.instanceOf(
                AgenticChatError
            )
            expect(handler.transformFinalError(codeError, 1, RetryAction.NoActionIndicated)).to.be.instanceOf(
                AgenticChatError
            )
            expect(
                (handler.transformFinalError(abortError, 1, RetryAction.NoActionIndicated) as AgenticChatError).code
            ).to.equal('RequestAborted')
        })

        it('should detect input too long errors correctly', () => {
            const codeError = { code: 'InputTooLong' }
            const messageError = { message: 'Error: input too long for processing' }

            expect(
                (handler.transformFinalError(codeError, 1, RetryAction.NoActionIndicated) as AgenticChatError).code
            ).to.equal('InputTooLong')
            expect(
                (handler.transformFinalError(messageError, 1, RetryAction.NoActionIndicated) as AgenticChatError).code
            ).to.equal('InputTooLong')
        })
    })
})
