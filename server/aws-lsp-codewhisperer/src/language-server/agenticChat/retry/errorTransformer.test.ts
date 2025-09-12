import { QErrorTransformer } from './errorTransformer'
import { AgenticChatError } from '../errors'
import { expect } from 'chai'
import * as sinon from 'sinon'

describe('QErrorTransformer', () => {
    let transformer: QErrorTransformer
    let mockLogging: any

    beforeEach(() => {
        mockLogging = {
            log: sinon.spy(),
            debug: sinon.spy(),
        }
        transformer = new QErrorTransformer(mockLogging, false)
    })

    describe('transformFinalError', () => {
        it('should transform usage limit errors', () => {
            const error = new Error('Usage limit exceeded')
            ;(error as any).code = 'AmazonQUsageLimitError'
            error.message = 'MONTHLY_REQUEST_COUNT exceeded'

            const result = transformer.transformFinalError(error)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.include('Request failed after 3 attempts')
            expect((result as AgenticChatError).code).to.equal('AmazonQUsageLimitError')
        })

        it('should transform monthly limit errors from response body', () => {
            const error = new Error('Service error')
            ;(error as any).cause = {
                $response: {
                    body: 'Error: MONTHLY_REQUEST_COUNT exceeded for user',
                },
            }

            const result = transformer.transformFinalError(error)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect((result as AgenticChatError).code).to.equal('AmazonQUsageLimitError')
        })

        it('should transform abort errors', () => {
            const error = new Error('Request aborted')
            error.name = 'AbortError'

            const result = transformer.transformFinalError(error)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.equal('Request aborted')
            expect((result as AgenticChatError).code).to.equal('RequestAborted')
        })

        it('should transform input too long errors', () => {
            const error = new Error('input too long')
            ;(error as any).code = 'InputTooLong'

            const result = transformer.transformFinalError(error)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.include('Too much context loaded')
            expect((result as AgenticChatError).code).to.equal('InputTooLong')
        })

        it('should transform model unavailable errors with model selection enabled', () => {
            const transformerWithModelSelection = new QErrorTransformer(mockLogging, true)
            const error = new Error('Model unavailable')
            ;(error as any).statusCode = 429
            ;(error as any).cause = { reason: 'INSUFFICIENT_MODEL_CAPACITY' }

            const result = transformerWithModelSelection.transformFinalError(error)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.include('model you selected is temporarily unavailable')
            expect((result as AgenticChatError).code).to.equal('QModelResponse')
        })

        it('should transform model unavailable errors without model selection', () => {
            const error = new Error('High load')
            ;(error as any).statusCode = 500
            error.message = 'Encountered unexpectedly high load when processing the request, please try again.'

            const result = transformer.transformFinalError(error)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.include('experiencing high traffic')
            expect((result as AgenticChatError).code).to.equal('QModelResponse')
        })

        it('should transform throttling errors', () => {
            const error = new Error('Throttling')
            ;(error as any).code = 'ThrottlingException'
            ;(error as any).statusCode = 429

            const result = transformer.transformFinalError(error)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.include('Service is currently experiencing high traffic')
            expect((result as AgenticChatError).code).to.equal('RequestThrottled')
        })

        it('should transform service overloaded errors', () => {
            const error = new Error('Service error')
            ;(error as any).statusCode = 500
            ;(error as any).cause = {
                $response: {
                    body: 'ServiceUnavailableException: Service temporarily unavailable',
                },
            }

            const result = transformer.transformFinalError(error)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.include('Service is currently experiencing high traffic')
            expect((result as AgenticChatError).code).to.equal('RequestThrottled')
        })

        it('should handle unknown errors', () => {
            const error = new Error('Unknown error')

            const result = transformer.transformFinalError(error)

            expect(result).to.be.instanceOf(AgenticChatError)
            expect(result.message).to.equal('Unknown error')
            expect((result as AgenticChatError).code).to.equal('QModelResponse')
        })

        it('should use custom attempt count when provided', () => {
            const error = new Error('Throttling')
            ;(error as any).code = 'AmazonQUsageLimitError'

            const result = transformer.transformFinalError(error, 5)

            expect(result.message).to.include('Request failed after 5 attempts')
        })

        it('should extract request ID from error', () => {
            const error = new Error('Service error')
            ;(error as any).cause = {
                $metadata: { requestId: 'test-request-123' },
            }

            const result = transformer.transformFinalError(error) as AgenticChatError

            expect(result.requestId).to.equal('test-request-123')
        })
    })

    describe('extractResponseBody', () => {
        it('should extract body from different error formats', () => {
            const transformer = new QErrorTransformer()

            // Test cause.$response.body
            let error: any = {
                cause: { $response: { body: 'test body 1' } },
            }
            expect((transformer as any).extractResponseBody(error)).to.equal('test body 1')

            // Test $response.body
            error = {
                $response: { body: 'test body 2' },
            }
            expect((transformer as any).extractResponseBody(error)).to.equal('test body 2')

            // Test message
            error = {
                message: 'test body 3',
            }
            expect((transformer as any).extractResponseBody(error)).to.equal('test body 3')
        })

        it('should handle extraction errors gracefully', () => {
            const transformer = new QErrorTransformer()
            const error: any = {
                get cause() {
                    throw new Error('Access denied')
                },
            }

            const result = (transformer as any).extractResponseBody(error)

            expect(result).to.be.null
        })
    })

    describe('getStatusCode', () => {
        it('should extract status code from different error formats', () => {
            const transformer = new QErrorTransformer()

            // Test cause.$metadata.httpStatusCode
            let error: any = {
                cause: { $metadata: { httpStatusCode: 429 } },
            }
            expect((transformer as any).getStatusCode(error)).to.equal(429)

            // Test $metadata.httpStatusCode
            error = {
                $metadata: { httpStatusCode: 500 },
            }
            expect((transformer as any).getStatusCode(error)).to.equal(500)

            // Test statusCode
            error = {
                statusCode: 404,
            }
            expect((transformer as any).getStatusCode(error)).to.equal(404)

            // Test status
            error = {
                status: 503,
            }
            expect((transformer as any).getStatusCode(error)).to.equal(503)
        })

        it('should handle status code extraction errors', () => {
            const transformer = new QErrorTransformer()
            const error: any = {
                get cause() {
                    throw new Error('Access denied')
                },
            }

            const result = (transformer as any).getStatusCode(error)

            expect(result).to.be.undefined
        })
    })

    describe('isThrottlingError', () => {
        it('should identify throttling errors by status code', () => {
            const transformer = new QErrorTransformer()

            const error: any = { statusCode: 429 }
            expect((transformer as any).isThrottlingError(error)).to.be.true
        })

        it('should identify throttling errors by code', () => {
            const transformer = new QErrorTransformer()

            const error: any = { code: 'ThrottlingException' }
            expect((transformer as any).isThrottlingError(error)).to.be.true
        })

        it('should identify service overloaded errors', () => {
            const transformer = new QErrorTransformer()

            const error: any = {
                statusCode: 500,
                cause: {
                    $response: {
                        body: 'Encountered unexpectedly high load when processing the request, please try again.',
                    },
                },
            }
            expect((transformer as any).isThrottlingError(error)).to.be.true
        })

        it('should not identify non-throttling errors', () => {
            const transformer = new QErrorTransformer()

            const error: any = { statusCode: 404 }
            expect((transformer as any).isThrottlingError(error)).to.be.false
        })
    })
})
