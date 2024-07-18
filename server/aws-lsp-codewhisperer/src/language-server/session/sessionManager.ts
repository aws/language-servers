import { InlineCompletionStates, Position } from '@aws/language-server-runtimes/server-interface'
import { v4 as uuidv4 } from 'uuid'
import { CodewhispererAutomatedTriggerType, CodewhispererTriggerType } from '../auto-trigger/autoTrigger'
import { GenerateSuggestionsRequest, ResponseContext, Suggestion } from '../codeWhispererService'
import { CodewhispererLanguage } from '../languageDetection'

type SessionState = 'REQUESTING' | 'ACTIVE' | 'CLOSED' | 'ERROR' | 'DISCARD'
export type UserDecision = 'Empty' | 'Filter' | 'Discard' | 'Accept' | 'Ignore' | 'Reject' | 'Unseen'
type UserTriggerDecision = 'Accept' | 'Reject' | 'Empty' | 'Discard'

export interface SessionData {
    startPosition: Position
    triggerType: CodewhispererTriggerType
    autoTriggerType?: CodewhispererAutomatedTriggerType
    triggerCharacter?: string
    classifierResult?: number
    classifierThreshold?: number
    language: CodewhispererLanguage
    requestContext: GenerateSuggestionsRequest
    credentialStartUrl?: string
}

export class CodeWhispererSession {
    id: string
    startTime: number
    // Time when Session was closed and final state of user decisions is recorded in suggestionsStates
    closeTime?: number = 0
    state: SessionState
    codewhispererSessionId?: string
    startPosition: Position = {
        line: 0,
        character: 0,
    }
    suggestions: Suggestion[] = []
    suggestionsStates = new Map<string, UserDecision>()
    acceptedSuggestionId?: string = undefined
    responseContext?: ResponseContext
    triggerType: CodewhispererTriggerType
    autoTriggerType?: CodewhispererAutomatedTriggerType
    triggerCharacter?: string
    classifierResult?: number
    classifierThreshold?: number
    language: CodewhispererLanguage
    requestContext: GenerateSuggestionsRequest
    timeToFirstRecommendation: number = 0
    credentialStartUrl?: string
    completionSessionResult?: {
        [itemId: string]: InlineCompletionStates
    }
    firstCompletionDisplayLatency?: number
    totalSessionDisplayTime?: number
    typeaheadLength?: number
    previousTriggerDecision?: UserTriggerDecision
    previousTriggerDecisionTime?: number
    reportedUserDecision: boolean = false

    constructor(data: SessionData) {
        this.id = this.generateSessionId()
        this.credentialStartUrl = data.credentialStartUrl
        this.startPosition = data.startPosition
        this.triggerType = data.triggerType
        this.language = data.language
        this.requestContext = data.requestContext
        this.autoTriggerType = data.autoTriggerType || undefined
        this.triggerCharacter = data.triggerCharacter
        this.classifierResult = data.classifierResult
        this.classifierThreshold = data.classifierThreshold
        this.state = 'REQUESTING'
        this.startTime = new Date().getTime()
    }

    // This function makes it possible to stub uuidv4 calls in tests
    generateSessionId(): string {
        return uuidv4()
    }

    get lastSuggestionIndex(): number {
        return this.suggestions.length - 1
    }

    activate() {
        if (this.state !== 'CLOSED' && this.state !== 'DISCARD') {
            this.state = 'ACTIVE'
        }
    }

    close() {
        if (this.state === 'CLOSED' || this.state === 'DISCARD') {
            return
        }

        // If completionSessionResult are not set when session is closing, assume all suggestions were discarder by default.
        // We can't assume if they were seen or not to use Unseen state until completionSessionResult are provided.
        // In this implementation session will not wait for result request to close itself
        // and will record Trigger Decision only based on server known states.
        if (!this.completionSessionResult) {
            for (const suggestion of this.suggestions) {
                if (!this.suggestionsStates.has(suggestion.itemId)) {
                    this.suggestionsStates.set(suggestion.itemId, 'Discard')
                }
            }
        }

        this.closeTime = new Date().getTime()

        this.state = 'CLOSED'
    }

    discard() {
        if (this.state === 'DISCARD') {
            return
        }

        // Force Discard trigger decision on every suggestion, if available
        for (const suggestion of this.suggestions) {
            this.suggestionsStates.set(suggestion.itemId, 'Discard')
        }

        this.closeTime = new Date().getTime()

        this.state = 'DISCARD'
    }

    setClientResultData(
        completionSessionResult: { [itemId: string]: InlineCompletionStates },
        firstCompletionDisplayLatency?: number,
        totalSessionDisplayTime?: number,
        typeaheadLength?: number
    ) {
        // Skip if session results were already recorded for session of session is closed
        if (this.state === 'CLOSED' || this.state === 'DISCARD' || this.completionSessionResult) {
            return
        }

        this.completionSessionResult = completionSessionResult

        let hasAcceptedSuggestion = false
        const sessionResults = Object.entries(completionSessionResult)
        for (let [itemId, states] of sessionResults) {
            if (states.accepted) {
                this.acceptedSuggestionId = itemId
                hasAcceptedSuggestion = true
                continue
            }
        }

        const validSuggestionIds = this.suggestions.map(s => s.itemId)

        for (let itemId in completionSessionResult) {
            // Skip suggestion ids that were not recorded for this session
            if (!validSuggestionIds.includes(itemId)) {
                continue
            }

            // Compute sugestion state based on fields.
            // State flags represent suggestions state in client UI at the moment when user made a decision about this siggestions
            const states = completionSessionResult[itemId]

            if (states.discarded) {
                this.setSuggestionState(itemId, 'Discard')
            } else if (!states.seen) {
                this.setSuggestionState(itemId, 'Unseen')
                // Seen suggestions:
            } else if (states.accepted) {
                this.setSuggestionState(itemId, 'Accept')
            } else if (hasAcceptedSuggestion && this.acceptedSuggestionId !== itemId) {
                // User accepted different suggestion
                this.setSuggestionState(itemId, 'Ignore')
            } else {
                // No recommendation was accepted, but user have seen this suggestion
                this.setSuggestionState(itemId, 'Reject')
            }
        }

        this.firstCompletionDisplayLatency = firstCompletionDisplayLatency
        this.totalSessionDisplayTime = totalSessionDisplayTime
        this.typeaheadLength = typeaheadLength
    }

    setSuggestionState(id: string, state: UserDecision) {
        this.suggestionsStates.set(id, state)
    }

    getSuggestionState(id: string): UserDecision | undefined {
        return this.suggestionsStates.get(id)
    }

    /**
     * Aggregate recommendation level user decision to trigger level user decision based on the following rule
     * - Accept if there is an Accept
     * - Reject if there is a Reject
     * - Empty if all decisions are Empty
     * - Discard otherwise
     */
    getAggregatedUserTriggerDecision(): UserTriggerDecision | undefined {
        // Force Discard trigger decision when session was explicitly discarded by server
        if (this.state === 'DISCARD') {
            return 'Discard'
        }

        // Can't report trigger decision until session is marked as closed
        if (this.state !== 'CLOSED') {
            return
        }

        let isEmpty = true
        for (const state of this.suggestionsStates.values()) {
            if (state === 'Accept') {
                return 'Accept'
            } else if (state === 'Reject') {
                return 'Reject'
            } else if (state !== 'Empty') {
                isEmpty = false
            }
        }
        return isEmpty ? 'Empty' : 'Discard'
    }
}

export class SessionManager {
    private static _instance?: SessionManager
    private currentSession?: CodeWhispererSession
    private sessionsLog: CodeWhispererSession[] = []
    private maxHistorySize = 5
    // TODO, for user decision telemetry: accepted suggestions (not necessarily the full corresponding session) should be stored for 5 minutes

    private constructor() {}

    /**
     * Singleton SessionManager class
     */
    public static getInstance(): SessionManager {
        if (!SessionManager._instance) {
            SessionManager._instance = new SessionManager()
        }

        return SessionManager._instance
    }

    // For unit tests
    public static reset() {
        SessionManager._instance = undefined
    }

    public createSession(data: SessionData): CodeWhispererSession {
        this.closeCurrentSession()

        // Remove oldest session from log
        if (this.sessionsLog.length > this.maxHistorySize) {
            this.sessionsLog.shift()
        }

        // Create new session
        const session = new CodeWhispererSession(data)

        const previousSession = this.getPreviousSession()
        if (previousSession) {
            session.previousTriggerDecision = previousSession.getAggregatedUserTriggerDecision()
            session.previousTriggerDecisionTime = previousSession.closeTime
        }

        this.currentSession = session
        this.sessionsLog.push(session)

        return session
    }

    closeCurrentSession() {
        if (this.currentSession) {
            this.closeSession(this.currentSession)
        }
    }

    closeSession(session: CodeWhispererSession) {
        session.close()
    }

    discardSession(session: CodeWhispererSession) {
        session.discard()
    }

    getCurrentSession(): CodeWhispererSession | undefined {
        return this.currentSession
    }

    getActiveSession(): CodeWhispererSession | undefined {
        if (this.currentSession && this.currentSession.state == 'ACTIVE') return this.currentSession
    }

    getPreviousSession(): CodeWhispererSession | undefined {
        if (this.sessionsLog.length > 0) return this.sessionsLog.at(-1)
    }

    getSessionsLog(): CodeWhispererSession[] {
        return this.sessionsLog
    }

    getSessionById(id: string): CodeWhispererSession | undefined {
        if (this.currentSession?.id === id) return this.currentSession
        for (const session of this.sessionsLog) {
            if (session.id === id) return session
        }
    }

    // If the session to be activated is the current session, activate it
    activateSession(session: CodeWhispererSession) {
        if (this.currentSession === session) {
            this.currentSession.activate()
        }
    }
}
