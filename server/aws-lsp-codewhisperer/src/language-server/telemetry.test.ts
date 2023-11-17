describe('Telemetry', () => {
    describe('User Trigger Decision telemetry', () => {
        describe('Case 1. Session is processed be server without sending results', () => {
            it(
                'should send Empty agregated user desicion when Codewhisperer returned all empty suggestions and close session'
            )

            it('should send Empty agregated user decision when Codewhisperer returned empty list of suggestions')

            it(
                'should send Discard agregated user decision when all suggestions are discarded after right context merge'
            )
        })

        describe('Case 2. Session is closed by LogInlineCompletionSessionResults notification', () => {
            it(
                'should emit agregated user decision event for active completion session when session results are received'
            )

            it('should not emit agregated user decision event for closed session when session results are received')

            it(
                'should emit Accept agregated user decision event for current active completion session when session results are received with accepted suggestion'
            )

            it(
                'should emit Reject agregated user decision event for current active completion session when session results are received without accepted suggestion'
            )

            it('should send Discard agregated user decision when all suggestions have Discard state')
        })

        describe('Case 3. Session is closed by subsequent trigger', function () {
            it('should close ACTIVE session and emit Discard user trigger decision event on Manual trigger')

            it('should close ACTIVE session and emit Discard user trigger decision event on Auto trigger')

            it('should attach previous session trigger decision')
        })

        describe('Case 4. Inflight session is closed by subsequent completion request', function () {
            it('should close REQUESTING session and not emit Discard user trigger decision event')

            it('should attach not use discarded REQUESTING session in previous user trigger decision values')
        })

        it('should report user trigger decision only once for a session')
    })
})
