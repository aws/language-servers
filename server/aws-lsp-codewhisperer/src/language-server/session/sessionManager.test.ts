import * as assert from 'assert'
import { Suggestion } from '../codeWhispererService'
import { CodeWhispererSession, SessionData, SessionManager } from './sessionManager'

describe('CodeWhispererSession', function () {
    const requestContext = {
        maxResults: 5,
        fileContext: {
            filename: 'SomeFile',
            programmingLanguage: { languageName: 'csharp' },
            leftFileContent: 'LeftFileContent',
            rightFileContent: 'RightFileContent',
        },
    }
    const EXPECTED_REFERENCE = {
        licenseName: 'test license',
        repository: 'test repository',
        url: 'test url',
        recommendationContentSpan: { start: 0, end: 1 },
    }
    const EXPECTED_SUGGESTION: Suggestion[] = [
        { content: 'recommendation without reference' },
        { content: 'recommendation with reference', references: [EXPECTED_REFERENCE] },
    ]

    const data: SessionData = {
        startPosition: { line: 0, character: 0 },
        triggerType: 'OnDemand',
        language: 'csharp',
        requestContext: requestContext,
        autoTriggerType: 'Enter',
    }
    describe('constructor()', function () {
        it('should create a new session with the correct initial values', function () {
            const session = new CodeWhispererSession(data)

            assert.strictEqual(session.startPosition.line, 0)
            assert.strictEqual(session.startPosition.character, 0)
            assert.strictEqual(session.triggerType, 'OnDemand')
            assert.strictEqual(session.language, 'csharp')
            assert.deepStrictEqual(session.requestContext, data.requestContext)
            assert.strictEqual(session.sessionState, 'REQUESTING')
        })
    })

    describe('activate()', function () {
        it('should set session state to ACTIVE if not already CLOSED', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            assert.strictEqual(session.sessionState, 'ACTIVE')
        })

        it('should not change session state if already CLOSED', function () {
            const session = new CodeWhispererSession(data)
            session.deactivate() // Set session state to CLOSED
            session.activate()
            assert.strictEqual(session.sessionState, 'CLOSED')
        })
    })

    describe('deactivate()', function () {
        it('should set session state to CLOSED', function () {
            const session = new CodeWhispererSession(data)
            session.deactivate()
            assert.strictEqual(session.sessionState, 'CLOSED')
        })
    })

    describe('getfilteredSuggestions()', function () {
        it('should return all suggestions if includeSuggestionsWithCodeReferences is true', function () {
            const session = new CodeWhispererSession(data)
            session.suggestions = EXPECTED_SUGGESTION // Mock suggestions
            const result = session.getfilteredSuggestions(true)
            assert.strictEqual(result.length, 2)
        })

        it('should return suggestions without code references if includeSuggestionsWithCodeReferences is false', function () {
            const session = new CodeWhispererSession(data)
            session.suggestions = EXPECTED_SUGGESTION // Mock suggestions
            const result = session.getfilteredSuggestions(false)
            assert.strictEqual(result.length, 1)
        })
    })
})

describe('SessionManager', function () {
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
        startPosition: { line: 0, character: 0 },
        triggerType: 'OnDemand',
        language: 'csharp',
        requestContext: requestContext,
        autoTriggerType: 'Enter',
    }
    describe('createSession()', function () {
        it('should create a new session and set it as the current session', function () {
            const manager = new SessionManager()
            const session = manager.createSession(data)
            assert.strictEqual(manager.getCurrentSession(), session)
            assert.strictEqual(manager.getCurrentSession()?.sessionState, 'REQUESTING')
        })

        it('should deactivate previous session when creating a new session', function () {
            const manager = new SessionManager()
            const session = manager.createSession(data)
            session.activate()
            manager.createSession(data)
            assert.strictEqual(session.sessionState, 'CLOSED')
        })
    })

    describe('discardCurrentSession()', function () {
        it('should add the current session to the sessions log if it is active', function () {
            const manager = new SessionManager()
            const session = manager.createSession(data)
            assert.strictEqual(session.sessionState, 'REQUESTING')
            session.activate()
            assert.strictEqual(session.sessionState, 'ACTIVE')
            manager.discardCurrentSession()
            assert.strictEqual(manager.getSessionsLog().length, 1)
            assert.strictEqual(manager.getSessionsLog()[0], session)
            assert.strictEqual(session.sessionState, 'CLOSED')
        })
    })

    describe('getPreviousSession()', function () {
        it('should return the last session in the sessions log', function () {
            const manager = new SessionManager()
            const session1 = manager.createSession(data)
            session1.activate()
            const session2 = manager.createSession(data)
            session2.activate()
            const session3 = manager.createSession(data)
            session3.activate()
            manager.discardCurrentSession()
            const result = manager.getPreviousSession()
            assert.strictEqual(result, session3)
            assert.strictEqual(manager.getSessionsLog().length, 3)
        })

        it('should return the last session in the sessions log', function () {
            const manager = new SessionManager()
            manager.createSession(data)
            manager.createSession(data)
            manager.createSession(data)
            manager.discardCurrentSession()
            const result = manager.getPreviousSession()
            assert.strictEqual(result, undefined)
            assert.strictEqual(manager.getSessionsLog().length, 0)
        })

        it('should return undefined if the sessions log is empty', function () {
            const manager = new SessionManager()
            const result = manager.getPreviousSession()
            assert.strictEqual(result, undefined)
        })
    })
})
