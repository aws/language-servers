import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { TelemetryService } from './telemetry/telemetryService'
import { UserWrittenCodeTracker } from './userWrittenCodeTracker'

describe('UserWrittenCodeTracker', () => {
    const LANGUAGE_ID = 'python'
    const OTHER_LANGUAGE_ID = 'typescript'
    const SOME_CONTENT = 'some text\n'

    let tracker: UserWrittenCodeTracker
    let telemetryService: StubbedInstance<TelemetryService> = stubInterface<TelemetryService>()
    let clock: sinon.SinonFakeTimers

    beforeEach(() => {
        clock = sinon.useFakeTimers()
        telemetryService = stubInterface<TelemetryService>()
        tracker = UserWrittenCodeTracker.getInstance(telemetryService)
    })

    afterEach(() => {
        tracker.dispose()
        clock.reset()
        clock.restore()
    })

    it('does not send telemetry without edits', () => {
        clock.tick(5000 * 60)
        sinon.assert.notCalled(telemetryService.emitCodeCoverageEvent)
    })

    it('emits metrics every 5 minutes while editing', () => {
        tracker.countUserWrittenTokens(LANGUAGE_ID, SOME_CONTENT)
        tracker.recordUsageCount(LANGUAGE_ID)

        clock.tick(5000 * 60)

        sinon.assert.calledWith(
            telemetryService.emitCodeCoverageEvent,
            {
                languageId: LANGUAGE_ID,
                totalCharacterCount: 0,
                acceptedCharacterCount: 0,
                customizationArn: undefined,
                userWrittenCodeCharacterCount: 10,
                userWrittenCodeLineCount: 1,
            },
            {}
        )
    })

    it('emits no metrics without invocations', () => {
        tracker.countUserWrittenTokens(LANGUAGE_ID, SOME_CONTENT)

        clock.tick(5000 * 60 + 1)

        sinon.assert.notCalled(telemetryService.emitCodeCoverageEvent)
    })

    it('emits separate metrics for different languages', () => {
        tracker.recordUsageCount(LANGUAGE_ID)
        tracker.countUserWrittenTokens(LANGUAGE_ID, SOME_CONTENT)
        tracker.recordUsageCount(OTHER_LANGUAGE_ID)
        tracker.countUserWrittenTokens(OTHER_LANGUAGE_ID, SOME_CONTENT)

        clock.tick(5000 * 60)

        sinon.assert.calledWith(
            telemetryService.emitCodeCoverageEvent,
            {
                languageId: LANGUAGE_ID,
                totalCharacterCount: 0,
                acceptedCharacterCount: 0,
                customizationArn: undefined,
                userWrittenCodeCharacterCount: 10,
                userWrittenCodeLineCount: 1,
            },
            {}
        )

        sinon.assert.calledWith(
            telemetryService.emitCodeCoverageEvent,
            {
                languageId: OTHER_LANGUAGE_ID,
                totalCharacterCount: 0,
                acceptedCharacterCount: 0,
                customizationArn: undefined,
                userWrittenCodeCharacterCount: 10,
                userWrittenCodeLineCount: 1,
            },
            {}
        )
    })

    it('emits metrics with customizationArn value', () => {
        tracker.recordUsageCount(LANGUAGE_ID)
        tracker.customizationArn = 'test-arn'
        tracker.countUserWrittenTokens(LANGUAGE_ID, SOME_CONTENT)

        clock.tick(5000 * 60)

        sinon.assert.calledWith(
            telemetryService.emitCodeCoverageEvent,
            {
                languageId: LANGUAGE_ID,
                totalCharacterCount: 0,
                acceptedCharacterCount: 0,
                customizationArn: 'test-arn',
                userWrittenCodeCharacterCount: 10,
                userWrittenCodeLineCount: 1,
            },
            {}
        )
    })
})
