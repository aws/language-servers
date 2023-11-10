import { v4 as uuidv4 } from 'uuid'
import { Position } from 'vscode-languageserver'
import { CodewhispererAutomatedTriggerType, CodewhispererTriggerType } from '../auto-trigger/autoTrigger'
import { GenerateSuggestionsRequest, ResponseContext, Suggestion } from '../codeWhispererService'
import { CodewhispererLanguage } from '../languageDetection'

// TODO, state tranisitions based on user action, also store user decision ('ACCEPTED' | 'DISCARDED' | 'REJECTED' | 'EMPTY' ) in session
type SessionState = 'REQUESTING' | 'ACTIVE' | 'CLOSED' | 'ERROR'

export interface SessionData {
    startPosition: Position
    triggerType: CodewhispererTriggerType
    autoTriggerType?: CodewhispererAutomatedTriggerType
    language: CodewhispererLanguage
    requestContext: GenerateSuggestionsRequest
}

export class CodeWhispererSession {
    id: string
    codewhispererSessionId?: string
    startPosition: Position = {
        line: 0,
        character: 0,
    }
    suggestions: Suggestion[] = []
    responseContext?: ResponseContext
    triggerType: CodewhispererTriggerType
    autoTriggerType?: CodewhispererAutomatedTriggerType
    language: CodewhispererLanguage
    requestContext: GenerateSuggestionsRequest
    lastInvocationTime?: number
    sessionState: SessionState
    // TODO: userDecision field

    constructor(data: SessionData) {
        this.id = uuidv4()
        this.startPosition = data.startPosition
        this.triggerType = data.triggerType
        this.language = data.language
        this.requestContext = data.requestContext
        this.autoTriggerType = data.autoTriggerType || undefined
        this.sessionState = 'REQUESTING'
        this.lastInvocationTime = new Date().getTime()
    }

    getfilteredSuggestions(includeSuggestionsWithCodeReferences: boolean = true): Suggestion[] {
        if (this.sessionState !== 'ACTIVE') {
            return []
        }

        if (includeSuggestionsWithCodeReferences) {
            return this.suggestions
        } else {
            // TODO, set the status of filtered references
            return this.suggestions.filter(
                suggestion => suggestion.references == null || suggestion.references.length === 0
            )
        }
    }

    get lastSuggestionIndex(): number {
        return this.suggestions.length - 1
    }
    activate() {
        if (this.sessionState !== 'CLOSED') this.sessionState = 'ACTIVE'
    }

    deactivate() {
        this.sessionState = 'CLOSED'
    }
}

export class SessionManager {
    private currentSession?: CodeWhispererSession
    private sessionsLog: CodeWhispererSession[] = []
    private maxHistorySize = 5
    // TODO, for user decision telemetry: accepted suggestions (not necessarily the full corresponding session) should be stored for 5 minutes

    createSession(data: SessionData): CodeWhispererSession {
        this.discardCurrentSession()
        // Remove oldest session from log
        if (this.sessionsLog.length > this.maxHistorySize) {
            this.sessionsLog.shift()
        }
        // Create new session
        const session = new CodeWhispererSession(data)
        this.currentSession = session
        return session
    }

    discardCurrentSession() {
        // If current session is active (has received a response from CWSPR) add it to history
        if (this.currentSession?.sessionState === 'ACTIVE') {
            this.sessionsLog.push(this.currentSession)
        }
        // Deactivate the current session regardles of the state
        this.currentSession?.deactivate()
    }

    discardSession(session: CodeWhispererSession | undefined) {
        if (session == this.currentSession) {
            this.discardCurrentSession()
        }
    }

    getCurrentSession(): CodeWhispererSession | undefined {
        return this.currentSession
    }

    getActiveSession(): CodeWhispererSession | undefined {
        if (this.currentSession && this.currentSession.sessionState == 'ACTIVE') return this.currentSession
    }

    getPreviousSession(): CodeWhispererSession | undefined {
        if (this.sessionsLog.length > 0) return this.sessionsLog.at(-1)
    }

    getSessionsLog(): CodeWhispererSession[] {
        return this.sessionsLog
    }

    // If the session to be activated is the current session, activate it
    activateSession(session: CodeWhispererSession) {
        if (this.currentSession === session) {
            this.currentSession.activate()
        }
    }
}
