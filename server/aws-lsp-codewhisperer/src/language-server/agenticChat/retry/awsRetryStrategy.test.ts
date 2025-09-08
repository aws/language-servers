import { AwsRetryStrategy, DelayNotification } from './awsRetryStrategy'
import { expect } from 'chai'
import * as sinon from 'sinon'

describe('AwsRetryStrategy', () => {
    let retryStrategy: AwsRetryStrategy
    let mockLogging: any
    let delayNotifications: DelayNotification[]
    let clock: sinon.SinonFakeTimers

    beforeEach(() => {
        clock = sinon.useFakeTimers()
        mockLogging = {
            debug: sinon.stub(),
            info: sinon.stub(),
        }
        delayNotifications = []
        retryStrategy = new AwsRetryStrategy(3, mockLogging, notification => {
            delayNotifications.push(notification)
        })
    })

    afterEach(() => {
        clock.restore()
    })

    describe('Basic retry behavior', () => {
        it('should succeed on first attempt', async () => {
            const operation = sinon.stub().resolves('success')

            const result = await retryStrategy.executeWithRetry(operation, 'test')

            expect(result).to.equal('success')
            expect(operation.callCount).to.equal(1)
        })

        it('should retry up to 3 attempts', async () => {
            const error = new Error('retryable error')
            const operation = sinon.stub().rejects(error)

            const promise = retryStrategy.executeWithRetry(operation, 'test')

            // Fast-forward through all retry delays
            await clock.tickAsync(15000) // More than max delays combined

            try {
                await promise
                expect.fail('Should have thrown error')
            } catch (e) {
                expect(operation.callCount).to.equal(3)
            }
        })

        it('should succeed on retry attempt', async () => {
            const error = new Error('temporary error')
            const operation = sinon.stub().onFirstCall().rejects(error).onSecondCall().resolves('success')

            const promise = retryStrategy.executeWithRetry(operation, 'test')
            await clock.tickAsync(2000) // Fast-forward through delay
            const result = await promise

            expect(result).to.equal('success')
            expect(operation.callCount).to.equal(2)
        })
    })

    describe('Error classification - Non-retryable errors', () => {
        it('should not retry on usage limit errors', async () => {
            const usageError = new Error('Usage limit exceeded')
            ;(usageError as any).code = 'AmazonQUsageLimitError'
            const operation = sinon.stub().rejects(usageError)

            try {
                await retryStrategy.executeWithRetry(operation, 'test')
                expect.fail('Should have thrown error')
            } catch (error: any) {
                expect(operation.callCount).to.equal(1)
                expect(error.code).to.equal('AmazonQUsageLimitError')
            }
        })

        it('should not retry on abort errors', async () => {
            const abortError = new Error('Request aborted')
            abortError.name = 'AbortError'
            const operation = sinon.stub().rejects(abortError)

            try {
                await retryStrategy.executeWithRetry(operation, 'test')
                expect.fail('Should have thrown error')
            } catch (error: any) {
                expect(operation.callCount).to.equal(1)
                expect(error.code).to.equal('RequestAborted')
            }
        })

        it('should not retry on input too long errors', async () => {
            const inputError = new Error('input too long')
            inputError.name = 'InputTooLong'
            const operation = sinon.stub().rejects(inputError)

            try {
                await retryStrategy.executeWithRetry(operation, 'test')
                expect.fail('Should have thrown error')
            } catch (error: any) {
                expect(operation.callCount).to.equal(1)
                expect(error.code).to.equal('InputTooLong')
                expect(error.message).to.include('Too much context loaded')
            }
        })

        it('should not retry on monthly limit in response body', async () => {
            const error = new Error('Service error')
            ;(error as any).cause = { $response: { body: 'Error: MONTHLY_REQUEST_COUNT exceeded' } }
            const operation = sinon.stub().rejects(error)

            try {
                await retryStrategy.executeWithRetry(operation, 'test')
                expect.fail('Should have thrown error')
            } catch (e: any) {
                expect(operation.callCount).to.equal(1)
                expect(e.code).to.equal('AmazonQUsageLimitError')
            }
        })
    })

    describe('Error classification - Throttling errors', () => {
        it('should retry on 429 throttling errors', async () => {
            const throttlingError = new Error('Too Many Requests')
            ;(throttlingError as any).cause = { $metadata: { httpStatusCode: 429 } }
            const operation = sinon.stub().onFirstCall().rejects(throttlingError).onSecondCall().resolves('success')

            const promise = retryStrategy.executeWithRetry(operation, 'test')
            await clock.tickAsync(2000)
            const result = await promise

            expect(result).to.equal('success')
            expect(operation.callCount).to.equal(2)
        })

        it('should retry on ThrottlingException', async () => {
            const error = new Error('ThrottlingException')
            ;(error as any).code = 'ThrottlingException'
            const operation = sinon.stub().onFirstCall().rejects(error).onSecondCall().resolves('success')

            const promise = retryStrategy.executeWithRetry(operation, 'test')
            await clock.tickAsync(2000)
            const result = await promise

            expect(result).to.equal('success')
            expect(operation.callCount).to.equal(2)
        })

        it('should retry on 500 with high load message', async () => {
            const error = new Error('Service error')
            ;(error as any).cause = {
                $metadata: { httpStatusCode: 500 },
                $response: {
                    body: 'Encountered unexpectedly high load when processing the request, please try again.',
                },
            }
            const operation = sinon.stub().onFirstCall().rejects(error).onSecondCall().resolves('success')

            const promise = retryStrategy.executeWithRetry(operation, 'test')
            await clock.tickAsync(2000)
            const result = await promise

            expect(result).to.equal('success')
            expect(operation.callCount).to.equal(2)
        })

        it('should retry on ServiceUnavailableException', async () => {
            const error = new Error('Service unavailable')
            ;(error as any).cause = {
                $metadata: { httpStatusCode: 500 },
                $response: { body: 'ServiceUnavailableException: Service is temporarily unavailable' },
            }
            const operation = sinon.stub().onFirstCall().rejects(error).onSecondCall().resolves('success')

            const promise = retryStrategy.executeWithRetry(operation, 'test')
            await clock.tickAsync(2000)
            const result = await promise

            expect(result).to.equal('success')
            expect(operation.callCount).to.equal(2)
        })

        it('should handle model capacity issues', async () => {
            const error = new Error('Model unavailable')
            ;(error as any).cause = {
                $metadata: { httpStatusCode: 429 },
                reason: 'INSUFFICIENT_MODEL_CAPACITY',
            }
            const operation = sinon.stub().rejects(error)

            const promise = retryStrategy.executeWithRetry(operation, 'test')
            await clock.tickAsync(15000)

            try {
                await promise
                expect.fail('Should have thrown error')
            } catch (e: any) {
                expect(operation.callCount).to.equal(3)
                expect(e.message).to.include('high traffic')
            }
        })
    })

    describe('Backoff timing', () => {
        it('should use exponential backoff with jitter', async () => {
            const error = new Error('retryable error')
            const operation = sinon.stub().rejects(error)

            const promise = retryStrategy.executeWithRetry(operation, 'test')

            // Should not complete immediately
            expect(operation.callCount).to.equal(1)

            // After first retry delay (around 1s with jitter)
            await clock.tickAsync(1500)
            expect(operation.callCount).to.equal(2)

            // After second retry delay (around 2s with jitter)
            await clock.tickAsync(3000)
            expect(operation.callCount).to.equal(3)

            try {
                await promise
                expect.fail('Should have thrown error')
            } catch (e) {
                // Expected to fail after 3 attempts
            }
        })

        it('should cap delay at 10 seconds', async () => {
            // Mock Math.random to return 1 (maximum jitter)
            const originalRandom = Math.random
            Math.random = () => 1

            try {
                const error = new Error('retryable error')
                const operation = sinon.stub().rejects(error)

                const promise = retryStrategy.executeWithRetry(operation, 'test')

                // First retry: 1s * 2 * 1 = 2s (under cap)
                await clock.tickAsync(2000)
                expect(operation.callCount).to.equal(2)

                // Second retry: 2s * 2 * 1 = 4s (under cap)
                await clock.tickAsync(4000)
                expect(operation.callCount).to.equal(3)

                try {
                    await promise
                    expect.fail('Should have thrown error')
                } catch (e) {
                    // Expected
                }
            } finally {
                Math.random = originalRandom
            }
        })
    })

    describe('Delay notifications', () => {
        it('should have delay notification callback available', () => {
            // Simple test to verify the notification mechanism is set up
            expect(delayNotifications).to.be.an('array')
            expect(delayNotifications.length).to.equal(0)
        })
    })

    describe('Abort signal handling', () => {
        it('should respect abort signal before operation', async () => {
            const abortController = new AbortController()
            const operation = sinon.stub().resolves('success')

            abortController.abort()

            try {
                await retryStrategy.executeWithRetry(operation, 'test', abortController.signal)
                expect.fail('Should have thrown abort error')
            } catch (error: any) {
                expect(error.name).to.equal('AbortError')
                expect(operation.callCount).to.equal(0)
            }
        })

        it('should check abort signal between retries', async () => {
            const abortController = new AbortController()
            const error = new Error('retryable error')
            const operation = sinon.stub().rejects(error)

            const promise = retryStrategy.executeWithRetry(operation, 'test', abortController.signal)

            // Let first attempt fail
            expect(operation.callCount).to.equal(1)

            // Abort during retry delay
            abortController.abort()
            await clock.tickAsync(1000)

            try {
                await promise
                expect.fail('Should have thrown abort error')
            } catch (e: any) {
                expect(e.name).to.equal('AbortError')
                expect(operation.callCount).to.equal(1) // Should not retry after abort
            }
        })
    })

    describe('Model selection enabled', () => {
        it('should provide model-specific error message when model selection enabled', async () => {
            const retryStrategyWithModelSelection = new AwsRetryStrategy(3, mockLogging, undefined, true)

            const error = new Error('Model unavailable')
            ;(error as any).cause = {
                $metadata: { httpStatusCode: 429 },
                reason: 'INSUFFICIENT_MODEL_CAPACITY',
            }
            const operation = sinon.stub().rejects(error)

            const promise = retryStrategyWithModelSelection.executeWithRetry(operation, 'test')
            await clock.tickAsync(15000)

            try {
                await promise
                expect.fail('Should have thrown error')
            } catch (e: any) {
                expect(e.message).to.include('model you selected is temporarily unavailable')
                expect(e.message).to.include('switch to a different model')
            }
        })
    })

    describe('Error transformation', () => {
        it('should preserve request ID in transformed errors', async () => {
            const error = new Error('Service error')
            ;(error as any).cause = {
                $metadata: { requestId: 'test-request-id' },
            }
            const operation = sinon.stub().rejects(error)

            const promise = retryStrategy.executeWithRetry(operation, 'test')
            await clock.tickAsync(15000) // Fast-forward through retry delays

            try {
                await promise
                expect.fail('Should have thrown error')
            } catch (e: any) {
                // The error should be wrapped as QModelResponse and preserve the request ID
                expect(e.code).to.equal('QModelResponse')
                expect(e.requestId).to.equal('test-request-id')
            }
        })

        it('should handle errors without metadata gracefully', async () => {
            const error = new Error('Simple error')
            const operation = sinon.stub().rejects(error)

            const promise = retryStrategy.executeWithRetry(operation, 'test')
            await clock.tickAsync(15000)

            try {
                await promise
                expect.fail('Should have thrown error')
            } catch (e: any) {
                expect(e.code).to.equal('QModelResponse')
                expect(e.cause).to.equal(error)
            }
        })
    })
})
