/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import * as sinon from 'sinon'
import { retryWithBackoff, DEFAULT_MAX_RETRIES, DEFAULT_BASE_DELAY } from './retryUtils'

describe('retryUtils', () => {
    let clock: sinon.SinonFakeTimers

    beforeEach(() => {
        clock = sinon.useFakeTimers()
    })

    afterEach(() => {
        clock.restore()
    })

    describe('retryWithBackoff', () => {
        it('should return result on first success', async () => {
            const fn = sinon.stub().resolves('success')

            const result = await retryWithBackoff(fn)

            expect(result).to.equal('success')
            expect(fn.callCount).to.equal(1)
        })

        it('should retry on retryable errors', async () => {
            const fn = sinon.stub()
            fn.onFirstCall().rejects({ code: 'ThrottlingException' })
            fn.onSecondCall().resolves('success')

            const promise = retryWithBackoff(fn)
            await clock.tickAsync(DEFAULT_BASE_DELAY)
            const result = await promise

            expect(result).to.equal('success')
            expect(fn.callCount).to.equal(2)
        })

        it('should not retry on non-retryable client errors', async () => {
            const error = { statusCode: 404 }
            const fn = sinon.stub().rejects(error)

            try {
                await retryWithBackoff(fn)
                expect.fail('Expected function to throw')
            } catch (e) {
                expect(e).to.equal(error)
            }
            expect(fn.callCount).to.equal(1)
        })

        it('should retry on server errors', async () => {
            const fn = sinon.stub()
            fn.onFirstCall().rejects({ statusCode: 500 })
            fn.onSecondCall().resolves('success')

            const promise = retryWithBackoff(fn)
            await clock.tickAsync(DEFAULT_BASE_DELAY)
            const result = await promise

            expect(result).to.equal('success')
            expect(fn.callCount).to.equal(2)
        })

        it('should use exponential backoff by default', async () => {
            const fn = sinon.stub()
            const error = { code: 'ThrottlingException' }
            fn.onFirstCall().rejects(error)
            fn.onSecondCall().rejects(error)

            const promise = retryWithBackoff(fn)

            // First retry after baseDelay * 1
            await clock.tickAsync(DEFAULT_BASE_DELAY)
            // Second retry after baseDelay * 2
            await clock.tickAsync(DEFAULT_BASE_DELAY * 2)

            try {
                await promise
                expect.fail('Expected function to throw')
            } catch (e) {
                expect(e).to.equal(error)
            }
            expect(fn.callCount).to.equal(DEFAULT_MAX_RETRIES)
        })

        it('should respect custom maxRetries', async () => {
            const error = { code: 'ThrottlingException' }
            const fn = sinon.stub().rejects(error)

            try {
                await retryWithBackoff(fn, { maxRetries: 1 })
                expect.fail('Expected function to throw')
            } catch (e) {
                expect(e).to.equal(error)
            }
            expect(fn.callCount).to.equal(1)
        })

        it('should use custom isRetryable function', async () => {
            const error = { custom: 'error' }
            const fn = sinon.stub().rejects(error)
            const isRetryable = sinon.stub().returns(false)

            try {
                await retryWithBackoff(fn, { isRetryable })
                expect.fail('Expected function to throw')
            } catch (e) {
                expect(e).to.equal(error)
            }
            expect(fn.callCount).to.equal(1)
            expect(isRetryable.calledWith(error)).to.equal(true)
        })
    })
})
