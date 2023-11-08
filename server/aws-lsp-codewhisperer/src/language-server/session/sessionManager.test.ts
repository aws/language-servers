import * as assert from 'assert'
import { stubInterface } from 'ts-sinon'
import { CodeWhispererServiceBase, ResponseContext, Suggestion } from '../codeWhispererService'
import { CodeWhispererSession, SessionData, SessionManager } from './sessionManager'

describe('CodeWhispererSession', () => {
    describe('initializeSession', () => {
        const codeWhispererService = stubInterface<CodeWhispererServiceBase>()
        const requestContext = {
            maxResults: 5,
            fileContext: {
                filename: 'SomeFile',
                programmingLanguage: { languageName: 'csharp' },
                leftFileContent: 'LeftFileContent',
                rightFileContent: 'RightFileContent',
            },
        }
        const EXPECTED_SUGGESTION: Suggestion[] = [{ content: 'recommendation' }]
        const EXPECTED_RESPONSE_CONTEXT: ResponseContext = {
            requestId: 'cwspr-request-id',
            codewhispererSessionId: 'cwspr-session-id',
        }

        it('should set session state to ACTIVE and emit ACTIVE event', async () => {
            codeWhispererService.generateSuggestions.returns(
                Promise.resolve({
                    suggestions: EXPECTED_SUGGESTION,
                    responseContext: EXPECTED_RESPONSE_CONTEXT,
                })
            )
            const session = new CodeWhispererSession({
                codeWhispererService,
                startPosition: { line: 0, character: 0 },
                triggerType: 'OnDemand',
                language: 'csharp',
                requestContext: requestContext,
            })
            assert.strictEqual(session.sessionState, 'REQUESTING')

            let isActiveEventEmitted = false
            session.on('ACTIVE', () => {
                isActiveEventEmitted = true
            })

            await session.initializeSession()

            assert.strictEqual(session.sessionState, 'ACTIVE')
            assert.strictEqual(isActiveEventEmitted, true)
        })

        it('should handle errors and set session state to ERROR', async () => {
            codeWhispererService.generateSuggestions.throws(Error('Test error'))
            const session = new CodeWhispererSession({
                codeWhispererService,
                startPosition: { line: 0, character: 0 },
                triggerType: 'OnDemand',
                language: 'javascript',
                requestContext: requestContext,
            })

            let isErrorEventEmitted = false
            session.on('ERROR', err => {
                isErrorEventEmitted = true
                assert.strictEqual(err.message, 'Test error')
            })

            await session.initializeSession()

            assert.strictEqual(session.sessionState, 'ERROR')
            assert.strictEqual(isErrorEventEmitted, true)
        })
    })
})

describe('SessionManager', () => {
    describe('createSession', () => {
        const codeWhispererService = stubInterface<CodeWhispererServiceBase>()
        const EXPECTED_SUGGESTION: Suggestion[] = [{ content: 'recommendation' }]
        const EXPECTED_RESPONSE_CONTEXT: ResponseContext = {
            requestId: 'cwspr-request-id',
            codewhispererSessionId: 'cwspr-session-id',
        }
        codeWhispererService.generateSuggestions.returns(
            Promise.resolve({
                suggestions: EXPECTED_SUGGESTION,
                responseContext: EXPECTED_RESPONSE_CONTEXT,
            })
        )
        const requestContext = {
            maxResults: 5,
            fileContext: {
                filename: 'SomeFile',
                programmingLanguage: { languageName: 'csharp' },
                leftFileContent: 'LeftFileContent',
                rightFileContent: 'RightFileContent',
            },
        }
        const data: SessionData = {
            codeWhispererService: codeWhispererService,
            startPosition: { line: 0, character: 0 },
            triggerType: 'OnDemand',
            language: 'csharp',
            requestContext: requestContext,
            autoTriggerType: 'Enter',
        }
        it('should create a new session and deactivate the current session if it is active', async () => {
            const sessionManager = new SessionManager()

            const initialSession = sessionManager.createSession(data)
            await initialSession.initializeSession()

            let isActiveEventEmitted = false
            initialSession.on('ACTIVE', () => {
                isActiveEventEmitted = true
            })

            await initialSession.initializeSession()

            assert.strictEqual(initialSession.sessionState, 'ACTIVE')
            assert.strictEqual(isActiveEventEmitted, true)
            assert.strictEqual(sessionManager.getActiveSession(), initialSession)

            // Create a new session, which should deactivate the initial session
            const newSession = sessionManager.createSession(data)
            await newSession.initializeSession()

            assert.strictEqual(initialSession.sessionState, 'CLOSED')
            assert.strictEqual(newSession.sessionState, 'ACTIVE')
            assert.strictEqual(sessionManager.getActiveSession(), newSession)
            assert.strictEqual(sessionManager.getPreviousSession(), initialSession)
        })

        it('should limit the number of sessions in the sessionsLog', async () => {
            const sessionManager = new SessionManager()

            // Create six sessions, which should result in removing the oldest session from the log
            const session1 = sessionManager.createSession(data)
            await session1.initializeSession()

            // Create sessions 2, 3 and 4
            for (let i = 0; i < 3; i++) {
                const session = sessionManager.createSession(data)
                await session.initializeSession()
            }

            const session5 = sessionManager.createSession(data)
            await session5.initializeSession()

            const session6 = sessionManager.createSession(data)
            await session6.initializeSession()

            assert.strictEqual(sessionManager.getActiveSession(), session6)
            assert.strictEqual(sessionManager.getPreviousSession(), session5)
            assert.strictEqual(sessionManager.getSessionsLog().length, 5)
            assert.strictEqual(sessionManager.getSessionsLog().includes(session1), true)

            const session7 = sessionManager.createSession(data)
            await session7.initializeSession()

            assert.strictEqual(sessionManager.getActiveSession(), session7)
            assert.strictEqual(sessionManager.getPreviousSession(), session6)
            assert.strictEqual(sessionManager.getSessionsLog().length, 5)
            assert.strictEqual(sessionManager.getSessionsLog().includes(session1), false)
        })
    })
})
