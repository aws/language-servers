import * as assert from 'assert'
import sinon from 'ts-sinon'
import { Suggestion } from '../../../shared/codeWhispererService'
import { CodeWhispererSession, SessionData, SessionManager } from './sessionManager'
import { TextDocument } from '@aws/language-server-runtimes/server-interface'
import { HELLO_WORLD_IN_CSHARP } from '../../../shared/testUtils'

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
        { content: 'recommendation without reference', itemId: 'id1' },
        { content: 'recommendation with reference', references: [EXPECTED_REFERENCE], itemId: 'id2' },
    ]

    const data: SessionData = {
        document: TextDocument.create('file:///rightContext.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP),
        startPosition: { line: 0, character: 0 },
        triggerType: 'OnDemand',
        language: 'csharp',
        requestContext: requestContext,
        autoTriggerType: 'Enter',
    }

    const sessionResultData = {
        completionSessionResult: {
            item_1: {
                seen: true,
                accepted: false,
                discarded: false,
            },
            item_2: {
                seen: true,
                accepted: true,
                discarded: false,
            },
        },
        firstCompletionDisplayLatency: 50,
        totalSessionDisplayTime: 1000,
        typeaheadLength: 20,
    }

    describe('constructor()', function () {
        it('should create a new session with the correct initial values', function () {
            const session = new CodeWhispererSession(data)

            assert.strictEqual(session.startPosition.line, 0)
            assert.strictEqual(session.startPosition.character, 0)
            assert.strictEqual(session.triggerType, 'OnDemand')
            assert.strictEqual(session.language, 'csharp')
            assert.deepStrictEqual(session.requestContext, data.requestContext)
            assert.strictEqual(session.state, 'REQUESTING')
        })
    })

    describe('activate()', function () {
        it('should set session state to ACTIVE if not already CLOSED', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            assert.strictEqual(session.state, 'ACTIVE')
        })

        it('should not change session state if already CLOSED', function () {
            const session = new CodeWhispererSession(data)
            session.close() // Set session state to CLOSED
            session.activate()
            assert.strictEqual(session.state, 'CLOSED')
        })

        it('should not change session state if session in DISCARD state', function () {
            const session = new CodeWhispererSession(data)
            session.discard() // Set session state to DISCARD
            session.activate()
            assert.strictEqual(session.state, 'DISCARD')
        })
    })

    describe('close()', function () {
        let clock: sinon.SinonFakeTimers

        beforeEach(async () => {
            clock = sinon.useFakeTimers({
                now: 1483228800000,
            })
        })

        afterEach(async () => {
            clock.restore()
        })

        it('should set session state to CLOSED', function () {
            const session = new CodeWhispererSession(data)
            session.close()
            assert.strictEqual(session.state, 'CLOSED')
        })

        it('should record closeTime', function () {
            const session = new CodeWhispererSession(data)
            assert(!session.closeTime)

            session.close()

            assert(session.closeTime)
            assert.strictEqual(session.state, 'CLOSED')
        })

        it('should not update closeTime for CLOSED session', function () {
            const session = new CodeWhispererSession(data)
            session.close()
            const closeTime = session.closeTime

            assert.strictEqual(session.state, 'CLOSED')
            assert(closeTime)

            clock.tick(5000)
            session.close()

            assert.equal(closeTime, session.closeTime)
        })

        it('should set suggestions states to Discard for stored suggestions without state', function () {
            const session = new CodeWhispererSession(data)
            session.suggestions = EXPECTED_SUGGESTION

            assert.equal(session.suggestionsStates.size, 0)

            session.close()

            assert.equal(session.suggestionsStates.size, 2)
            assert.equal(session.suggestionsStates.get(EXPECTED_SUGGESTION[0].itemId), 'Discard')
            assert.equal(session.suggestionsStates.get(EXPECTED_SUGGESTION[1].itemId), 'Discard')
        })

        it('should not rewrite suggestions states to Discard for stored suggestions states', function () {
            const session = new CodeWhispererSession(data)
            session.suggestions = EXPECTED_SUGGESTION
            session.setClientResultData({
                [EXPECTED_SUGGESTION[0].itemId]: {
                    accepted: true,
                    seen: true,
                    discarded: false,
                },
                [EXPECTED_SUGGESTION[1].itemId]: {
                    accepted: false,
                    seen: false,
                    discarded: false,
                },
            })

            assert.equal(session.suggestionsStates.size, 2)

            session.close()

            assert.equal(session.suggestionsStates.size, 2)
            assert.equal(session.suggestionsStates.get(EXPECTED_SUGGESTION[0].itemId), 'Accept')
            assert.equal(session.suggestionsStates.get(EXPECTED_SUGGESTION[1].itemId), 'Unseen')
        })
    })

    describe('discard()', function () {
        let clock: sinon.SinonFakeTimers

        beforeEach(async () => {
            clock = sinon.useFakeTimers({
                now: 1483228800000,
            })
        })

        afterEach(async () => {
            clock.restore()
        })

        it('should set session state to DISCARD', function () {
            const session = new CodeWhispererSession(data)
            session.discard()
            assert.strictEqual(session.state, 'DISCARD')
        })

        it('should record closeTime', function () {
            const session = new CodeWhispererSession(data)
            assert(!session.closeTime)

            session.discard()

            assert(session.closeTime)
            assert.strictEqual(session.state, 'DISCARD')
        })

        it('should not update closeTime for DISCARD session', function () {
            const session = new CodeWhispererSession(data)
            session.discard()
            const closeTime = session.closeTime

            assert.strictEqual(session.state, 'DISCARD')
            assert(closeTime)

            clock.tick(5000)
            session.discard()

            assert.equal(closeTime, session.closeTime)
        })

        it('should override suggestions states to Discard for stored suggestions', function () {
            const session = new CodeWhispererSession(data)
            session.suggestions = EXPECTED_SUGGESTION
            session.suggestionsStates.set(EXPECTED_SUGGESTION[0].itemId, 'Empty')
            session.suggestionsStates.set(EXPECTED_SUGGESTION[1].itemId, 'Filter')

            session.discard()

            assert.equal(session.suggestionsStates.size, 2)
            assert.equal(session.suggestionsStates.get(EXPECTED_SUGGESTION[0].itemId), 'Discard')
            assert.equal(session.suggestionsStates.get(EXPECTED_SUGGESTION[1].itemId), 'Discard')
        })
    })

    describe('setClientResultData()', function () {
        it('should set results of session from client with all relevant data available', function () {
            const { completionSessionResult, firstCompletionDisplayLatency, totalSessionDisplayTime, typeaheadLength } =
                sessionResultData
            const session = new CodeWhispererSession(data)
            session.activate()
            session.setClientResultData(
                completionSessionResult,
                firstCompletionDisplayLatency,
                totalSessionDisplayTime,
                typeaheadLength
            )
            assert.strictEqual(session.completionSessionResult, completionSessionResult)
            assert.strictEqual(session.firstCompletionDisplayLatency, firstCompletionDisplayLatency)
            assert.strictEqual(session.totalSessionDisplayTime, totalSessionDisplayTime)
        })

        it('should set results of session from client with only completion states available', function () {
            const { completionSessionResult } = sessionResultData
            const session = new CodeWhispererSession(data)
            session.activate()
            session.setClientResultData(completionSessionResult)
            assert.strictEqual(session.completionSessionResult, completionSessionResult)
        })

        it('should set correct suggestion states based on client-side results state data with 1 Accepted suggestion', function () {
            const SUGGESTIONS = [
                { itemId: 'id-discard', content: 'recommendation 1: Discard' },
                { itemId: 'id-unseen', content: 'recommendation 2: Unseen' },
                { itemId: 'id-accept', content: 'recommendation 3: Accept' },
                { itemId: 'id-ignore', content: 'recommendation 4: Ignore' },
            ]
            const SESSION_RESULTS = {
                'id-discard': {
                    accepted: false,
                    seen: false,
                    discarded: true,
                },
                'id-unseen': {
                    accepted: false,
                    seen: false,
                    discarded: false,
                },
                'id-accept': {
                    accepted: true,
                    seen: true,
                    discarded: false,
                },
                'id-ignore': {
                    accepted: false,
                    seen: true,
                    discarded: false,
                },
            }
            const session = new CodeWhispererSession(data)
            session.activate()

            assert.equal(session.suggestionsStates.size, 0)
            assert.equal(session.acceptedSuggestionId, undefined)

            session.suggestions = SUGGESTIONS
            session.setClientResultData(SESSION_RESULTS)

            assert.equal(session.suggestionsStates.size, 4)
            assert.equal(session.acceptedSuggestionId, 'id-accept')
            assert.equal(session.suggestionsStates.get('id-discard'), 'Discard')
            assert.equal(session.suggestionsStates.get('id-unseen'), 'Unseen')
            assert.equal(session.suggestionsStates.get('id-accept'), 'Accept')
            assert.equal(session.suggestionsStates.get('id-ignore'), 'Ignore')
        })

        it('should set correct suggestion states based on client-side results state data with 0 Accepted suggestions', function () {
            const SUGGESTIONS = [
                { itemId: 'id-discard', content: 'recommendation 1: Discard' },
                { itemId: 'id-unseen', content: 'recommendation 2: Unseen' },
                { itemId: 'id-reject1', content: 'recommendation 3: Reject' },
                { itemId: 'id-reject2', content: 'recommendation 4: Reject' },
            ]
            const SESSION_RESULTS = {
                'id-discard': {
                    accepted: false,
                    seen: false,
                    discarded: true,
                },
                'id-unseen': {
                    accepted: false,
                    seen: false,
                    discarded: false,
                },
                'id-reject1': {
                    accepted: false,
                    seen: true,
                    discarded: false,
                },
                'id-reject2': {
                    accepted: false,
                    seen: true,
                    discarded: false,
                },
            }
            const session = new CodeWhispererSession(data)
            session.activate()

            assert.equal(session.suggestionsStates.size, 0)
            assert.equal(session.acceptedSuggestionId, undefined)

            session.suggestions = SUGGESTIONS
            session.setClientResultData(SESSION_RESULTS)

            assert.equal(session.suggestionsStates.size, 4)
            assert.equal(session.acceptedSuggestionId, undefined)
            assert.equal(session.suggestionsStates.get('id-discard'), 'Discard')
            assert.equal(session.suggestionsStates.get('id-unseen'), 'Unseen')
            assert.equal(session.suggestionsStates.get('id-reject1'), 'Reject')
            assert.equal(session.suggestionsStates.get('id-reject2'), 'Reject')
        })

        it('should ignore setting suggestion states for not cached suggestion ids', function () {
            const SUGGESTIONS = [{ itemId: 'id-exists', content: 'recommendation 1: Discard' }]
            const SESSION_RESULTS = {
                'id-exists': {
                    accepted: false, // 'Discard'
                    seen: false,
                    discarded: true,
                },
                'id-does-not-exist': {
                    accepted: true, // 'Accept'
                    seen: true,
                    discarded: false,
                },
            }
            const session = new CodeWhispererSession(data)
            session.activate()

            assert.equal(session.suggestionsStates.size, 0)
            assert.equal(session.acceptedSuggestionId, undefined)

            session.suggestions = SUGGESTIONS
            session.setClientResultData(SESSION_RESULTS)

            assert.equal(session.suggestionsStates.size, 1)
            assert.equal(session.suggestionsStates.get('id-exists'), 'Discard')
            assert(!session.suggestionsStates.has('id-does-not-exist'))
        })
    })

    describe('getAggregatedUserTriggerDecision()', function () {
        const SUGGESTIONS = [
            { itemId: 'id1', content: 'recommendation 1' },
            { itemId: 'id2', content: 'recommendation 2' },
            { itemId: 'id3', content: 'recommendation 3' },
            { itemId: 'id4', content: 'recommendation 4' },
            { itemId: 'id5', content: 'recommendation 5' },
        ]

        it('should return Accept trigger decision', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            session.suggestions = SUGGESTIONS
            session.setSuggestionState('id1', 'Accept')
            session.setSuggestionState('id2', 'Ignore')
            session.setSuggestionState('id3', 'Ignore')
            session.setSuggestionState('id4', 'Unseen')
            session.setSuggestionState('id5', 'Unseen')
            session.close()

            assert.equal(session.getAggregatedUserTriggerDecision(), 'Accept')
        })

        it('should return Reject trigger decision', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            session.suggestions = SUGGESTIONS
            session.setSuggestionState('id1', 'Discard')
            session.setSuggestionState('id2', 'Discard')
            session.setSuggestionState('id3', 'Reject')
            session.setSuggestionState('id4', 'Empty')
            session.setSuggestionState('id5', 'Ignore')
            session.close()

            assert.equal(session.getAggregatedUserTriggerDecision(), 'Reject')
        })

        it('should return Discard trigger decision', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            session.suggestions = SUGGESTIONS
            session.setSuggestionState('id1', 'Discard')
            session.setSuggestionState('id2', 'Empty')
            session.setSuggestionState('id3', 'Filter')
            session.setSuggestionState('id4', 'Discard')
            session.setSuggestionState('id5', 'Empty')
            session.close()

            assert.equal(session.getAggregatedUserTriggerDecision(), 'Discard')
        })

        it('should return Empty trigger decision', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            session.suggestions = SUGGESTIONS
            session.setSuggestionState('id1', 'Empty')
            session.setSuggestionState('id2', 'Empty')
            session.setSuggestionState('id3', 'Empty')
            session.setSuggestionState('id4', 'Empty')
            session.setSuggestionState('id5', 'Empty')
            session.close()

            assert.equal(session.getAggregatedUserTriggerDecision(), 'Empty')
        })

        it('should return Empty trigger decision for empty list of suggestions', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            session.suggestions = []
            session.close()

            assert.equal(session.getAggregatedUserTriggerDecision(), 'Empty')
        })

        it('should return Discard trigger decision when all suggestions state is Filter', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            session.suggestions = SUGGESTIONS
            session.setSuggestionState('id1', 'Filter')
            session.setSuggestionState('id2', 'Filter')
            session.setSuggestionState('id3', 'Filter')
            session.setSuggestionState('id4', 'Filter')
            session.setSuggestionState('id5', 'Filter')
            session.close()

            assert.equal(session.getAggregatedUserTriggerDecision(), 'Discard')
        })

        it('should return undefined if session is not CLOSED', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            session.suggestions = SUGGESTIONS
            session.setSuggestionState('id1', 'Accept')
            session.setSuggestionState('id2', 'Ignore')
            session.setSuggestionState('id3', 'Ignore')
            session.setSuggestionState('id4', 'Unseen')
            session.setSuggestionState('id5', 'Unseen')

            assert.equal(session.getAggregatedUserTriggerDecision(), undefined)
        })

        it('should return Discard after session is closed with not complete session results', function () {
            const session = new CodeWhispererSession(data)
            session.suggestions = EXPECTED_SUGGESTION

            assert.equal(session.suggestionsStates.size, 0)

            session.close()

            assert.equal(session.getAggregatedUserTriggerDecision(), 'Discard')
        })

        it('should return Discard when session is in DISCARD state', function () {
            const session = new CodeWhispererSession(data)
            session.suggestions = EXPECTED_SUGGESTION

            assert.equal(session.suggestionsStates.size, 0)

            session.discard()

            assert.equal(session.getAggregatedUserTriggerDecision(), 'Discard')
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
        document: TextDocument.create('file:///rightContext.cs', 'csharp', 1, HELLO_WORLD_IN_CSHARP),
        startPosition: { line: 0, character: 0 },
        triggerType: 'OnDemand',
        language: 'csharp',
        requestContext: requestContext,
        autoTriggerType: 'Enter',
    }

    beforeEach(() => {
        SessionManager.reset()
    })

    describe('createSession()', function () {
        it('should create a new session and set it as the current session', function () {
            const manager = SessionManager.getInstance()
            const session = manager.createSession(data)
            assert.strictEqual(manager.getCurrentSession(), session)
            assert.strictEqual(manager.getCurrentSession()?.state, 'REQUESTING')
        })

        it('should deactivate previous session when creating a new session', function () {
            const manager = SessionManager.getInstance()
            const session = manager.createSession(data)
            session.activate()
            manager.createSession(data)
            assert.strictEqual(session.state, 'CLOSED')
        })

        it('should set previous active session trigger decision from discarded REQUESTING session', function () {
            const manager = SessionManager.getInstance()
            const session1 = manager.createSession(data)
            assert.strictEqual(session1?.state, 'REQUESTING')
            manager.discardSession(session1)

            const session2 = manager.createSession(data)
            assert.strictEqual(session1?.state, 'DISCARD')
            assert.strictEqual(session2.previousTriggerDecision, 'Discard')
        })

        it('should set previous active session trigger decision to new session object', function () {
            const manager = SessionManager.getInstance()
            const session1 = manager.createSession(data)
            assert.strictEqual(session1?.state, 'REQUESTING')

            session1.activate()

            const session2 = manager.createSession(data)

            assert.strictEqual(session1?.state, 'CLOSED')
            assert.strictEqual(session2.previousTriggerDecision, 'Empty')
        })
    })

    describe('closeCurrentSession()', function () {
        it('should add the current session to the sessions log if it is active', function () {
            const manager = SessionManager.getInstance()
            const session = manager.createSession(data)
            assert.strictEqual(session.state, 'REQUESTING')
            session.activate()
            assert.strictEqual(session.state, 'ACTIVE')
            manager.closeCurrentSession()
            assert.strictEqual(manager.getSessionsLog().length, 1)
            assert.strictEqual(manager.getSessionsLog()[0], session)
            assert.strictEqual(session.state, 'CLOSED')
        })
    })

    describe('discard()', function () {
        it('should set session to DISCARD state', function () {
            const manager = SessionManager.getInstance()
            const session = manager.createSession(data)
            assert.strictEqual(session.state, 'REQUESTING')
            session.activate()
            assert.strictEqual(session.state, 'ACTIVE')
            manager.discardSession(session)
            assert.strictEqual(manager.getSessionsLog().length, 1)
            assert.strictEqual(manager.getSessionsLog()[0], session)
            assert.strictEqual(session.state, 'DISCARD')
        })
    })

    describe('getPreviousSession()', function () {
        it('should return the last session in the sessions log', function () {
            const manager = SessionManager.getInstance()
            const session1 = manager.createSession(data)
            session1.activate()
            const session2 = manager.createSession(data)
            session2.activate()
            const session3 = manager.createSession(data)
            session3.activate()
            manager.closeCurrentSession()
            const result = manager.getPreviousSession()
            assert.strictEqual(result, session3)
            assert.strictEqual(manager.getSessionsLog().length, 3)
        })

        it('should record not-closed and not-active sessions in the sessions log', function () {
            const manager = SessionManager.getInstance()
            const session1 = manager.createSession(data)
            session1.activate()
            const session2 = manager.createSession(data)
            const session3 = manager.createSession(data)
            session3.activate()
            manager.closeCurrentSession()
            const result = manager.getPreviousSession()
            assert.strictEqual(result, session3)
            assert.strictEqual(manager.getSessionsLog().length, 3)
        })

        it('should return undefined if the sessions log is empty', function () {
            const manager = SessionManager.getInstance()
            const result = manager.getPreviousSession()
            assert.strictEqual(result, undefined)
        })
    })

    describe('getSessionById()', function () {
        it('should return the session with the associated ID', function () {
            const manager = SessionManager.getInstance()
            const session = manager.createSession(data)
            session.activate()
            const session2 = manager.createSession({ ...data, triggerType: 'AutoTrigger' })
            session2.activate()
            manager.closeCurrentSession()
            assert.strictEqual(manager.getSessionsLog().length, 2)

            const sessionId = session.id
            const resultSession = manager.getSessionById(sessionId)
            assert.strictEqual(resultSession, session)
        })

        it('should return undefined if no session has the associated ID', function () {
            const manager = SessionManager.getInstance()
            const session = manager.createSession(data)
            session.activate()
            manager.closeCurrentSession()
            assert.strictEqual(manager.getSessionsLog().length, 1)

            const sessionId = session.id + '1'
            const resultSession = manager.getSessionById(sessionId)
            assert.strictEqual(resultSession, undefined)
        })
    })

    describe('getSuggestionState()', function () {
        const SUGGESTIONS = [
            { itemId: 'id1', content: 'recommendation 1' },
            { itemId: 'id2', content: 'recommendation 2' },
            { itemId: 'id3', content: 'recommendation 3' },
            { itemId: 'id4', content: 'recommendation 4' },
        ]

        it('should return the state of suggestion with the associated ID', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            session.suggestions = SUGGESTIONS
            session.setSuggestionState('id1', 'Discard')
            session.setSuggestionState('id2', 'Empty')
            session.setSuggestionState('id3', 'Filter')
            session.setSuggestionState('id4', 'Discard')

            assert.equal(session.getSuggestionState('id1'), 'Discard')
            assert.equal(session.getSuggestionState('id2'), 'Empty')
            assert.equal(session.getSuggestionState('id3'), 'Filter')
            assert.equal(session.getSuggestionState('id4'), 'Discard')
        })

        it('should return the undefined if no suggestion has the associated ID', function () {
            const session = new CodeWhispererSession(data)
            session.activate()
            session.suggestions = SUGGESTIONS
            session.setSuggestionState('id1', 'Discard')
            session.setSuggestionState('id2', 'Empty')
            session.setSuggestionState('id3', 'Filter')
            session.setSuggestionState('id4', 'Discard')

            assert.equal(session.getSuggestionState('id1'), 'Discard')
            assert.equal(session.getSuggestionState('id2'), 'Empty')
            assert.equal(session.getSuggestionState('id3'), 'Filter')
            assert.equal(session.getSuggestionState('id4'), 'Discard')
        })
    })
})
