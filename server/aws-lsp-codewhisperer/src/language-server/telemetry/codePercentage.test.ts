import { Telemetry } from '@aws/language-server-runtimes/server-interface'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CodePercentageTracker } from './codePercentage'
import assert = require('assert')

describe('CodePercentage', () => {
    const LANGUAGE_ID = 'python'
    const OTHER_LANGUAGE_ID = 'typescript'

    // 10 characters each for easy math
    const SOME_CONTENT = 'some text\n'
    const SOME_ACCEPTED_CONTENT = 'accepted.\n'

    let tracker: CodePercentageTracker
    let telemetry: StubbedInstance<Telemetry>
    let clock: sinon.SinonFakeTimers

    beforeEach(() => {
        clock = sinon.useFakeTimers()
        telemetry = stubInterface<Telemetry>()
        tracker = new CodePercentageTracker(telemetry)
    })

    afterEach(() => {
        tracker.dispose()
        clock.reset()
    })

    it('does not send telemetry without edits', () => {
        clock.tick(5000 * 60)
        sinon.assert.notCalled(telemetry.emitMetric)
    })

    it('emits metrics every 5 minutes while editing', () => {
        tracker.countTokens(LANGUAGE_ID, SOME_CONTENT)
        tracker.countTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countAcceptedTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countInvocation(LANGUAGE_ID)
        tracker.countSuccess(LANGUAGE_ID)

        clock.tick(5000 * 60)

        sinon.assert.calledWith(telemetry.emitMetric, {
            name: 'codewhisperer_codePercentage',
            data: {
                codewhispererTotalTokens: 20,
                codewhispererLanguage: LANGUAGE_ID,
                codewhispererAcceptedTokens: 10,
                codewhispererPercentage: 50.0,
                successCount: 1,
            },
        })
    })

    it('emits no metrics without invocations', () => {
        tracker.countTokens(OTHER_LANGUAGE_ID, SOME_CONTENT)

        clock.tick(5000 * 60)

        sinon.assert.notCalled(telemetry.emitMetric)
    })

    it('emits separate metrics for different languages', () => {
        tracker.countTokens(LANGUAGE_ID, SOME_CONTENT)
        tracker.countTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countAcceptedTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countInvocation(LANGUAGE_ID)
        tracker.countSuccess(LANGUAGE_ID)

        tracker.countTokens(OTHER_LANGUAGE_ID, SOME_CONTENT)
        tracker.countTokens(OTHER_LANGUAGE_ID, SOME_CONTENT)
        tracker.countTokens(OTHER_LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countAcceptedTokens(OTHER_LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countInvocation(OTHER_LANGUAGE_ID)
        tracker.countSuccess(OTHER_LANGUAGE_ID)

        clock.tick(5000 * 60)

        sinon.assert.calledWith(telemetry.emitMetric, {
            name: 'codewhisperer_codePercentage',
            data: {
                codewhispererTotalTokens: 20,
                codewhispererLanguage: LANGUAGE_ID,
                codewhispererAcceptedTokens: 10,
                codewhispererPercentage: 50.0,
                successCount: 1,
            },
        })

        sinon.assert.calledWith(telemetry.emitMetric, {
            name: 'codewhisperer_codePercentage',
            data: {
                codewhispererTotalTokens: 30,
                codewhispererLanguage: OTHER_LANGUAGE_ID,
                codewhispererAcceptedTokens: 10,
                codewhispererPercentage: 33.33,
                successCount: 1,
            },
        })
    })
})
