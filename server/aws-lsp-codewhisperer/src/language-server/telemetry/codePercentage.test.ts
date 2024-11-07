import { Telemetry } from '@aws/language-server-runtimes/server-interface'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CodePercentageTracker } from './codePercentage'
import assert = require('assert')
import { TelemetryService } from '../telemetryService'

describe('CodePercentage', () => {
    const LANGUAGE_ID = 'python'
    const OTHER_LANGUAGE_ID = 'typescript'

    // 10 characters each for easy math
    const SOME_CONTENT = 'some text\n'
    const SOME_ACCEPTED_CONTENT = 'accepted.\n'

    let tracker: CodePercentageTracker
    let telemetry: StubbedInstance<Telemetry>
    let telemetryService: StubbedInstance<TelemetryService>
    let clock: sinon.SinonFakeTimers

    beforeEach(() => {
        clock = sinon.useFakeTimers()
        telemetry = stubInterface<Telemetry>()
        telemetryService = stubInterface<TelemetryService>()
        tracker = new CodePercentageTracker(telemetry, telemetryService)
    })

    afterEach(() => {
        tracker.dispose()
        clock.reset()
    })

    it('does not send telemetry without edits', () => {
        clock.tick(5000 * 60)
        sinon.assert.notCalled(telemetry.emitMetric)
        sinon.assert.notCalled(telemetryService.emitCodeCoverageEvent)
    })

    it('emits metrics every 5 minutes while editing', () => {
        tracker.countTokens(LANGUAGE_ID, SOME_CONTENT)
        tracker.countTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countAcceptedTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countInvocation(LANGUAGE_ID)
        tracker.countSuccess(LANGUAGE_ID)

        clock.tick(5000 * 60)

        sinon.assert.calledWith(
            telemetryService.emitCodeCoverageEvent,
            {
                languageId: LANGUAGE_ID,
                totalCharacterCount: 20,
                acceptedCharacterCount: 10,
                customizationArn: undefined,
            },
            {
                percentage: 50,
                successCount: 1,
            }
        )
    })

    it('emits no metrics without invocations', () => {
        tracker.countTokens(OTHER_LANGUAGE_ID, SOME_CONTENT)

        clock.tick(5000 * 60)

        sinon.assert.notCalled(telemetry.emitMetric)
        sinon.assert.notCalled(telemetryService.emitCodeCoverageEvent)
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

        sinon.assert.calledWith(
            telemetryService.emitCodeCoverageEvent,
            {
                languageId: LANGUAGE_ID,
                totalCharacterCount: 20,
                acceptedCharacterCount: 10,
                customizationArn: undefined,
            },
            {
                percentage: 50,
                successCount: 1,
            }
        )

        sinon.assert.calledWith(
            telemetryService.emitCodeCoverageEvent,
            {
                languageId: OTHER_LANGUAGE_ID,
                totalCharacterCount: 30,
                acceptedCharacterCount: 10,
                customizationArn: undefined,
            },
            {
                percentage: 33.33,
                successCount: 1,
            }
        )
    })

    it('emits metrics with customizationArn value', () => {
        tracker.countTokens(LANGUAGE_ID, SOME_CONTENT)
        tracker.countTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countAcceptedTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countInvocation(LANGUAGE_ID)
        tracker.countSuccess(LANGUAGE_ID)
        tracker.customizationArn = 'test-arn'

        clock.tick(5000 * 60)

        sinon.assert.calledWith(
            telemetryService.emitCodeCoverageEvent,
            {
                languageId: LANGUAGE_ID,
                totalCharacterCount: 20,
                acceptedCharacterCount: 10,
                customizationArn: 'test-arn',
            },
            {
                percentage: 50,
                successCount: 1,
            }
        )
    })
})
