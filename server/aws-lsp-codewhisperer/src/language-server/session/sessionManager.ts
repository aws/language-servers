import { InlineCompletionStates } from '@aws-placeholder/aws-language-server-runtimes/out/features/lsp/inline-completions/protocolExtensions'
import { v4 as uuidv4 } from 'uuid'
import { Position } from 'vscode-languageserver'
import { CodewhispererAutomatedTriggerType, CodewhispererTriggerType } from '../auto-trigger/autoTrigger'
import { GenerateSuggestionsRequest, ResponseContext, Suggestion } from '../codeWhispererService'
import { CodewhispererLanguage } from '../languageDetection'

// TODO, state tranisitions based on user action, also store user decision ('ACCEPTED' | 'DISCARDED' | 'REJECTED' | 'EMPTY' ) in session
type SessionState = 'REQUESTING' | 'ACTIVE' | 'CLOSED' | 'ERROR'
type UserDecision = 'Empty' | 'Filter' | 'Discard' | 'Accept' | 'Ignore' | 'Reject' | 'Unseen'
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
    lastInvocationTime: number
    credentialStartUrl?: string
    completionSessionResult?: {
        [itemId: string]: InlineCompletionStates
    }
    firstCompletionDisplayLatency?: number
    totalSessionDisplayTime?: number

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
        this.lastInvocationTime = new Date().getTime()
    }

    // This function makes it possible to stub uuidv4 calls in tests
    generateSessionId(): string {
        return uuidv4()
    }

    getFilteredSuggestions(includeSuggestionsWithCodeReferences: boolean = true): Suggestion[] {
        // Empty suggestion filter
        const nonEmptySuggestions = this.suggestions.filter(suggestion => {
            if (suggestion.content !== '') {
                return true
            }

            this.setSuggestionState(suggestion.itemId, 'Empty')
            return false
        })

        // References setting filter
        if (includeSuggestionsWithCodeReferences) {
            return nonEmptySuggestions
        }

        return nonEmptySuggestions.filter(suggestion => {
            // Discard suggestions that have empty string insertText after right context merge and can't be displayed anymore
            if (suggestion.references == null || suggestion.references.length === 0) {
                return true
            }

            this.setSuggestionState(suggestion.itemId, 'Filter')
            return false
        })
    }

    get lastSuggestionIndex(): number {
        return this.suggestions.length - 1
    }

    activate() {
        if (this.state !== 'CLOSED') {
            this.state = 'ACTIVE'
        }
    }

    close() {
        if (this.state === 'CLOSED') {
            return
        }

        // If completionSessionResult are not set on close, assume all suggestions were Discarded by default
        // We can't assume if they were seen or not to use Unseen state until completionSessionResult are provided.
        // In this implementation session will not wait for result request to close itself and will report Trigger Decision as soon as session is closed.
        if (!this.completionSessionResult) {
            for (const suggestion of this.suggestions) {
                if (!this.suggestionsStates.has(suggestion.itemId)) {
                    this.suggestionsStates.set(suggestion.itemId, 'Discard')
                }
            }
        }

        this.state = 'CLOSED'
    }

    setClientResultData(
        completionSessionResult: { [itemId: string]: InlineCompletionStates },
        firstCompletionDisplayLatency?: number,
        totalSessionDisplayTime?: number
    ) {
        this.completionSessionResult = completionSessionResult

        // TODO: Only 1 suggestion can have `accepted` = true, add a test and decide on the behaviour
        let hasAcceptedSuggestion = false
        for (let [itemId, states] of Object.entries(completionSessionResult)) {
            if (states.accepted) {
                this.acceptedSuggestionId = itemId
                hasAcceptedSuggestion = true
                continue
            }
        }

        for (let itemId in completionSessionResult) {
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
    }

    setSuggestionState(id: string, state: UserDecision) {
        this.suggestionsStates.set(id, state)
    }

    getSuggestionState(id: UserDecision) {
        return this.suggestionsStates.get(id)
    }

    getAggregatedUserTriggerDecision(): UserTriggerDecision {
        // From https://github.com/aws/aws-toolkit-vscode/blob/master/src/codewhisperer/util/telemetryHelper.ts#L447-L464
        // if there is any Accept within the session, mark the session as Accept
        // if there is any Reject within the session, mark the session as Reject
        // if all recommendations within the session are empty, mark the session as Empty
        // otherwise mark the session as Discard

        // TODO: fix the logic, it's incorrect if states are not set yet
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
        this.currentSession = session

        return session
    }

    closeCurrentSession() {
        // If current session is active (has received a response from CWSPR) add it to history
        if (this.currentSession?.state === 'ACTIVE') {
            this.sessionsLog.push(this.currentSession)
        }
        // Deactivate the current session regardles of the state
        this.currentSession?.close()
    }

    // Signal that we can emit telemetry events for this session.
    // There are 4 posibilities that can result in session becoming CLOSED:
    // 1. session was CLOSED server-side while in REQUESTING after processing response, it was discarded by server and we can report User Decision right away
    // 2. session was ACTIVE and LogInlineCompelitionSessionResults request was received: we can report telemetry
    // 3. session was CLOSED while still in REQUESTING by consequent request: ?? it will receive response later, but we will never send response to client, it is server-side Discard
    //    Shall we process responses still?
    // 4. session was ACTIVE and was CLOSED by subsequent completion request before LogInlineCompelitionSessionResults was received from client
    //    this cound happen if client allows sending completion requests before sending LogInlineCompelitionSessionResults
    //    or requests came not in order
    //
    // Implementation decision:
    // If 3 or 4 happens, assume default state for recommendations will be Discard.
    // Accept LogInlineCompelitionSessionResults, but do not resend telemetry if results come async after session was already closed.
    //
    // TODO: document this server behaviour and decide how to handle case when LogInlineCompelitionSessionResults comes later.
    closeSession(session: CodeWhispererSession) {
        if (this.currentSession == session) {
            this.closeCurrentSession()
        } else {
            session.close()
        }
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

    recordSessionResultsById(
        sessionId: string,
        sessionResult: {
            completionSessionResult: { [itemId: string]: InlineCompletionStates }
            firstCompletionDisplayLatency?: number
            totalSessionDisplayTime?: number
        }
    ) {
        const { completionSessionResult, firstCompletionDisplayLatency, totalSessionDisplayTime } = sessionResult
        const session = this.getSessionById(sessionId)

        if (!session) {
            return
        }

        session.setClientResultData(completionSessionResult, firstCompletionDisplayLatency, totalSessionDisplayTime)

        // Always close session when client-side results are received
        this.closeSession(session)
    }
}
