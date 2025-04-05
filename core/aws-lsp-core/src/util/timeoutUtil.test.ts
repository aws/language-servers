import * as timeoutUtils from './timeoutUtils'
import * as sinon from 'sinon'
import * as assert from 'assert'

describe('waitUntil', async function () {
    let clock: sinon.SinonFakeTimers
    const testSettings = {
        callCounter: 0,
        callGoal: 0,
        functionDelay: 10,
        clockInterval: 1,
        clockSpeed: 5,
    }

    // Test function, increments a counter every time it is called
    async function testFunction(): Promise<number | undefined> {
        if (++testSettings.callCounter >= testSettings.callGoal) {
            return testSettings.callGoal
        } else {
            return undefined
        }
    }

    // Simple wrapper that waits until calling testFunction
    async function slowTestFunction(): Promise<number | undefined> {
        await timeoutUtils.sleep(testSettings.functionDelay)
        return testFunction()
    }

    before(function () {
        clock = sinon.useFakeTimers()
    })

    after(function () {
        clock.restore()
    })

    beforeEach(function () {
        testSettings.callCounter = 0
        testSettings.functionDelay = 10
    })

    it('returns value after multiple function calls', async function () {
        testSettings.callGoal = 4
        const returnValue = timeoutUtils.waitUntil(testFunction, {
            timeout: 10000,
            interval: 10,
            truthy: false,
        })
        await clock.tickAsync(100)
        assert.strictEqual(await returnValue, testSettings.callGoal)
    })

    it('returns value after multiple function calls WITH backoff', async function () {
        testSettings.callGoal = 4
        const returnValue = timeoutUtils.waitUntil(testFunction, {
            timeout: 10000,
            interval: 10,
            truthy: false,
            backoff: 2,
        })
        await clock.tickAsync(100)
        assert.strictEqual(await returnValue, testSettings.callGoal)
    })

    it('timeout before function returns defined value', async function () {
        testSettings.callGoal = 7
        const returnValue = timeoutUtils.waitUntil(testFunction, {
            timeout: 30,
            interval: 10,
            truthy: false,
        })
        await clock.tickAsync(100)
        assert.strictEqual(await returnValue, undefined)
    })

    it('returns true/false values correctly', async function () {
        assert.strictEqual(
            true,
            await timeoutUtils.waitUntil(async () => true, { timeout: 10000, interval: 10, truthy: false })
        )
        assert.strictEqual(
            false,
            await timeoutUtils.waitUntil(async () => false, { timeout: 10000, interval: 10, truthy: false })
        )
    })

    it('timeout when function takes longer than timeout parameter', async function () {
        testSettings.functionDelay = 100
        const returnValue = timeoutUtils.waitUntil(slowTestFunction, {
            timeout: 50,
            interval: 10,
            truthy: false,
        })
        await clock.tickAsync(1000)
        assert.strictEqual(await returnValue, undefined)
    })

    it('timeout from slow function calls', async function () {
        testSettings.callGoal = 10
        const returnValue = timeoutUtils.waitUntil(slowTestFunction, {
            timeout: 50,
            interval: 10,
            truthy: false,
        })
        await clock.tickAsync(1000)
        assert.strictEqual(await returnValue, undefined)
    })

    it('returns value with after multiple calls and function delay ', async function () {
        testSettings.callGoal = 3
        testSettings.functionDelay = 5
        const returnValue = timeoutUtils.waitUntil(slowTestFunction, {
            timeout: 10000,
            interval: 5,
            truthy: false,
        })
        await clock.tickAsync(1000)
        assert.strictEqual(await returnValue, testSettings.callGoal)
    })

    it('returns value after setting truthy parameter to true', async function () {
        let counter: number = 0
        const result = timeoutUtils.waitUntil(async () => counter++ === 5, {
            timeout: 1000,
            interval: 5,
            truthy: true,
        })
        await clock.tickAsync(1000)
        assert.strictEqual(await result, true)
    })

    it('timeout after setting truthy parameter to true', async function () {
        let counter: number = 0
        const result = timeoutUtils.waitUntil(async () => counter++ === 5, {
            timeout: 15,
            interval: 5,
            truthy: true,
        })
        await clock.tickAsync(1000)
        assert.strictEqual(await result, undefined)
    })
})

describe('waitUntil w/ retries', function () {
    let fn: sinon.SinonStub<[], Promise<string | boolean>>
    let clock: sinon.SinonFakeTimers

    beforeEach(function () {
        fn = sinon.stub()
    })

    before(function () {
        clock = sinon.useFakeTimers()
    })

    after(function () {
        clock.restore()
    })

    it('should retry when retryOnFail callback returns true', async function () {
        fn.onCall(0).throws(new Error('Retry error'))
        fn.onCall(1).throws(new Error('Retry error'))
        fn.onCall(2).resolves('success')

        const res = timeoutUtils.waitUntil(fn, {
            retryOnFail: (error: Error) => {
                return error.message === 'Retry error'
            },
        })

        await clock.tickAsync(timeoutUtils.waitUntilDefaultInterval)
        assert.strictEqual(fn.callCount, 2)
        await clock.tickAsync(timeoutUtils.waitUntilDefaultInterval)
        assert.strictEqual(fn.callCount, 3)
        assert.strictEqual(await res, 'success')
    })

    it('should not retry when retryOnFail callback returns false', async function () {
        fn.onCall(0).throws(new Error('Retry error'))
        fn.onCall(1).throws(new Error('Retry error'))
        fn.onCall(2).throws(new Error('Last error'))
        fn.onCall(3).resolves('this is not hit')

        const res = assert.rejects(
            timeoutUtils.waitUntil(fn, {
                retryOnFail: (error: Error) => {
                    return error.message === 'Retry error'
                },
            }),
            e => e instanceof Error && e.message === 'Last error'
        )

        await clock.tickAsync(timeoutUtils.waitUntilDefaultInterval)
        assert.strictEqual(fn.callCount, 2)
        await clock.tickAsync(timeoutUtils.waitUntilDefaultInterval)
        assert.strictEqual(fn.callCount, 3)
        await res
    })

    it('retries the function until it succeeds', async function () {
        fn.onCall(0).throws()
        fn.onCall(1).throws()
        fn.onCall(2).resolves('success')

        const res = timeoutUtils.waitUntil(fn, { retryOnFail: true })

        await clock.tickAsync(timeoutUtils.waitUntilDefaultInterval)
        assert.strictEqual(fn.callCount, 2)
        await clock.tickAsync(timeoutUtils.waitUntilDefaultInterval)
        assert.strictEqual(fn.callCount, 3)
        assert.strictEqual(await res, 'success')
    })

    it('retryOnFail ignores truthiness', async function () {
        fn.resolves(false)
        const res = timeoutUtils.waitUntil(fn, { retryOnFail: true, truthy: true })
        assert.strictEqual(await res, false)
    })

    // This test causes the following error, cannot figure out why:
    // `rejected promise not handled within 1 second: Error: last`
    it('throws the last error if the function always fails, using defaults', async function () {
        fn.onCall(0).throws() // 0
        fn.onCall(1).throws() // 500
        fn.onCall(2).throws(new Error('second last')) // 1000
        fn.onCall(3).throws(new Error('last')) // 1500
        fn.onCall(4).resolves('this is not hit')

        // We must wrap w/ assert.rejects() here instead of at the end, otherwise Mocha raise a
        // `rejected promise not handled within 1 second: Error: last`
        const res = assert.rejects(
            timeoutUtils.waitUntil(fn, { retryOnFail: true }),
            e => e instanceof Error && e.message === 'last'
        )

        await clock.tickAsync(timeoutUtils.waitUntilDefaultInterval) // 500
        assert.strictEqual(fn.callCount, 2)
        await clock.tickAsync(timeoutUtils.waitUntilDefaultInterval) // 1000
        assert.strictEqual(fn.callCount, 3)
        await clock.tickAsync(timeoutUtils.waitUntilDefaultInterval) // 1500
        assert.strictEqual(fn.callCount, 4)

        await res
    })

    it('honors retry delay + backoff multiplier', async function () {
        fn.onCall(0).throws(Error('0')) // 0ms
        fn.onCall(1).throws(Error('1')) // 100ms
        fn.onCall(2).throws(Error('2')) // 200ms
        fn.onCall(3).resolves('success') // 400ms

        // Note 701 instead of 700 for timeout. The 1 millisecond allows the final call to execute
        // since the timeout condition is >= instead of >
        const res = timeoutUtils.waitUntil(fn, { timeout: 701, interval: 100, backoff: 2, retryOnFail: true })

        // Check the call count after each iteration, ensuring the function is called
        // after the correct delay between retries.
        await clock.tickAsync(99)
        assert.strictEqual(fn.callCount, 1)
        await clock.tickAsync(1)
        assert.strictEqual(fn.callCount, 2)

        await clock.tickAsync(199)
        assert.strictEqual(fn.callCount, 2)
        await clock.tickAsync(1)
        assert.strictEqual(fn.callCount, 3)

        await clock.tickAsync(399)
        assert.strictEqual(fn.callCount, 3)
        await clock.tickAsync(1)
        assert.strictEqual(fn.callCount, 4)

        assert.strictEqual(await res, 'success')
    })
})
