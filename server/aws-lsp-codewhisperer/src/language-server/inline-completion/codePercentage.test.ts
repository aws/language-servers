import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'
import { CodePercentageTracker } from './codePercentage'
import { TelemetryService } from '../../shared/telemetry/telemetryService'

describe('CodePercentage', () => {
    const LANGUAGE_ID = 'python'
    const OTHER_LANGUAGE_ID = 'typescript'

    // 10 characters each for easy math
    const SOME_CONTENT = 'some text\n'
    const SOME_ACCEPTED_CONTENT = 'accepted.\n'

    let tracker: CodePercentageTracker
    let telemetryService: StubbedInstance<TelemetryService>
    let clock: sinon.SinonFakeTimers

    beforeEach(() => {
        clock = sinon.useFakeTimers()
        telemetryService = stubInterface<TelemetryService>()
        tracker = new CodePercentageTracker(telemetryService)
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
        tracker.countTotalTokens(LANGUAGE_ID, SOME_CONTENT)
        tracker.countTotalTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
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
                credentialStartUrl: undefined,
            }
        )
    })

    it('emits no metrics without invocations', () => {
        tracker.countTotalTokens(OTHER_LANGUAGE_ID, SOME_CONTENT)

        clock.tick(5000 * 60 + 1)

        sinon.assert.notCalled(telemetryService.emitCodeCoverageEvent)
    })

    it('emits separate metrics for different languages', () => {
        tracker.countTotalTokens(LANGUAGE_ID, SOME_CONTENT)
        tracker.countTotalTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countAcceptedTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
        tracker.countInvocation(LANGUAGE_ID)
        tracker.countSuccess(LANGUAGE_ID)

        tracker.countTotalTokens(OTHER_LANGUAGE_ID, SOME_CONTENT)
        tracker.countTotalTokens(OTHER_LANGUAGE_ID, SOME_CONTENT)
        tracker.countTotalTokens(OTHER_LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
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
                credentialStartUrl: undefined,
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
                credentialStartUrl: undefined,
            }
        )
    })

    it('emits metrics with customizationArn value', () => {
        tracker.countTotalTokens(LANGUAGE_ID, SOME_CONTENT)
        tracker.countTotalTokens(LANGUAGE_ID, SOME_ACCEPTED_CONTENT)
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
                credentialStartUrl: undefined,
            }
        )
    })

    describe('countTotalTokens', () => {
        it('counts CodeWhisperer suggestions above threshold when fromCodeWhisperer = true', () => {
            const longCode = 'a'.repeat(51) // Above INSERT_CUTOFF_THRESHOLD
            tracker.countTotalTokens(LANGUAGE_ID, longCode, true)
            tracker.countInvocation(LANGUAGE_ID)

            clock.tick(5000 * 60)

            sinon.assert.calledWith(
                telemetryService.emitCodeCoverageEvent,
                {
                    languageId: LANGUAGE_ID,
                    totalCharacterCount: 51,
                    acceptedCharacterCount: 0,
                    customizationArn: undefined,
                },
                {
                    percentage: 0,
                    successCount: 0,
                    credentialStartUrl: undefined,
                }
            )
        })

        it('counts single character input when not from CodeWhisperer', () => {
            tracker.countTotalTokens(LANGUAGE_ID, 'a', false)
            tracker.countInvocation(LANGUAGE_ID)

            clock.tick(5000 * 60)

            sinon.assert.calledWith(
                telemetryService.emitCodeCoverageEvent,
                {
                    languageId: LANGUAGE_ID,
                    totalCharacterCount: 1,
                    acceptedCharacterCount: 0,
                    customizationArn: undefined,
                },
                {
                    percentage: 0,
                    successCount: 0,
                    credentialStartUrl: undefined,
                }
            )
        })

        it('counts single character input when not from CodeWhisperer', () => {
            tracker.countTotalTokens(LANGUAGE_ID, 'a', false)
            tracker.countInvocation(LANGUAGE_ID)

            clock.tick(5000 * 60)

            sinon.assert.calledWith(
                telemetryService.emitCodeCoverageEvent,
                {
                    languageId: LANGUAGE_ID,
                    totalCharacterCount: 1,
                    acceptedCharacterCount: 0,
                    customizationArn: undefined,
                },
                {
                    percentage: 0,
                    successCount: 0,
                    credentialStartUrl: undefined,
                }
            )
        })

        it('counts new line with indentation as 1 character input', () => {
            tracker.countTotalTokens(LANGUAGE_ID, '\n    ', false)
            tracker.countInvocation(LANGUAGE_ID)

            clock.tick(5000 * 60)

            sinon.assert.calledWith(
                telemetryService.emitCodeCoverageEvent,
                {
                    languageId: LANGUAGE_ID,
                    totalCharacterCount: 1,
                    acceptedCharacterCount: 0,
                    customizationArn: undefined,
                },
                {
                    percentage: 0,
                    successCount: 0,
                    credentialStartUrl: undefined,
                }
            )
        })

        it('counts auto closing pair of characters input as 2', () => {
            tracker.countTotalTokens(LANGUAGE_ID, '[]', false)
            tracker.countTotalTokens(LANGUAGE_ID, '{}', false)
            tracker.countTotalTokens(LANGUAGE_ID, '""', false)
            tracker.countTotalTokens(LANGUAGE_ID, "''", false)
            tracker.countTotalTokens(LANGUAGE_ID, '()', false)
            tracker.countInvocation(LANGUAGE_ID)

            clock.tick(5000 * 60)

            sinon.assert.calledWith(
                telemetryService.emitCodeCoverageEvent,
                {
                    languageId: LANGUAGE_ID,
                    totalCharacterCount: 10,
                    acceptedCharacterCount: 0,
                    customizationArn: undefined,
                },
                {
                    percentage: 0,
                    successCount: 0,
                    credentialStartUrl: undefined,
                }
            )
        })

        it('ignores large inputs when fromCodeWhisperer = false', () => {
            const largeInput = 'a'.repeat(51) // Above threshold
            tracker.countTotalTokens(LANGUAGE_ID, largeInput, false)

            clock.tick(5000 * 60)

            sinon.assert.notCalled(telemetryService.emitCodeCoverageEvent)
        })

        it('accumulates multiple inputs correctly', () => {
            tracker.countTotalTokens(LANGUAGE_ID, 'a') // 1 char
            tracker.countTotalTokens(LANGUAGE_ID, '\n    ') // 1 char
            tracker.countTotalTokens(LANGUAGE_ID, 'bc') // 2 chars
            tracker.countInvocation(LANGUAGE_ID)

            clock.tick(5000 * 60)

            sinon.assert.calledWith(
                telemetryService.emitCodeCoverageEvent,
                {
                    languageId: LANGUAGE_ID,
                    totalCharacterCount: 4,
                    acceptedCharacterCount: 0,
                    customizationArn: undefined,
                },
                {
                    percentage: 0,
                    successCount: 0,
                    credentialStartUrl: undefined,
                }
            )
        })

        it('handles whitespace-only input correctly', () => {
            tracker.countTotalTokens(LANGUAGE_ID, '    ', false)
            tracker.countInvocation(LANGUAGE_ID)

            clock.tick(5000 * 60)

            sinon.assert.calledWith(
                telemetryService.emitCodeCoverageEvent,
                {
                    languageId: LANGUAGE_ID,
                    totalCharacterCount: 0,
                    acceptedCharacterCount: 0,
                    customizationArn: undefined,
                },
                {
                    percentage: 0,
                    successCount: 0,
                    credentialStartUrl: undefined,
                }
            )
        })
    })
})
