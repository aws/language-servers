import { EventEmitter } from 'eventemitter3'
import { v4 as uuidv4 } from 'uuid'
import { Position } from 'vscode-languageserver'
import { CodewhispererAutomatedTriggerType, CodewhispererTriggerType } from '../auto-trigger/autoTrigger'
import {
    CodeWhispererServiceBase,
    GenerateSuggestionsRequest,
    ResponseContext,
    Suggestion,
} from '../codeWhispererService'

// TODO, state tranisitions based on user action, also store user decision ('ACCEPTED' | 'DISCARDED' | 'REJECTED' | 'EMPTY' ) in session
type SessionState = 'REQUESTING' | 'ACTIVE' | 'CLOSED' | 'ERROR'

export interface SessionData {
    codeWhispererService: CodeWhispererServiceBase
    startPosition: Position
    triggerType: CodewhispererTriggerType
    autoTriggerType?: CodewhispererAutomatedTriggerType
    language: string
    requestContext: GenerateSuggestionsRequest
}

export class CodeWhispererSession extends EventEmitter {
    id: string
    codewhispererSessionId?: string
    codeWhispererService: CodeWhispererServiceBase
    startPosition: Position = {
        line: 0,
        character: 0,
    }
    suggestions: Suggestion[] = []
    responseContext?: ResponseContext
    triggerType: CodewhispererTriggerType
    autoTriggerType?: CodewhispererAutomatedTriggerType
    language: string
    requestContext: GenerateSuggestionsRequest
    lastInvocationTime?: number
    sessionState: SessionState
    // TODO: userDecision field

    constructor(data: SessionData) {
        super()
        this.id = uuidv4()
        this.startPosition = data.startPosition
        this.triggerType = data.triggerType
        this.language = data.language
        this.requestContext = data.requestContext
        this.autoTriggerType = data.autoTriggerType || undefined
        this.codeWhispererService = data.codeWhispererService
        this.sessionState = 'REQUESTING'

        this.initializeSession()
    }

    async initializeSession() {
        try {
            // Get first list of suggestions and set the session to active
            const { suggestions, responseContext } = await this.codeWhispererService.generateSuggestions(
                this.requestContext
            )
            this.suggestions = suggestions
            this.responseContext = responseContext
            this.requestContext.nextToken = responseContext?.nextToken
            this.codewhispererSessionId = responseContext?.codewhispererSessionId

            this.sessionState = 'ACTIVE'
            this.emit('ACTIVE')

            // Once session becomes active, it continues polling for further responses
            // TODO, this is crude pagination implementation, needs to be verified
            while (
                this.requestContext.nextToken !== undefined &&
                this.requestContext.nextToken !== '' &&
                this.suggestions.length < this.requestContext.maxResults &&
                this.sessionState === 'ACTIVE'
            ) {
                const response = await this.codeWhispererService.generateSuggestions(this.requestContext)

                this.requestContext.nextToken = response?.responseContext?.nextToken

                if (response.suggestions) {
                    this.suggestions.push(...response.suggestions)
                }
            }
        } catch (err) {
            this.sessionState = 'ERROR'
            this.emit('ERROR', err)
        }
    }

    get lastRecommendationIndex(): number {
        return this.suggestions.length - 1
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
        // If current session is active (has received a response from CWSPR) add it to history
        if (this.currentSession?.sessionState === 'ACTIVE') {
            this.currentSession.deactivate()
            this.sessionsLog.push(this.currentSession)
        }
        // Remove oldest session from log
        if (this.sessionsLog.length > this.maxHistorySize) {
            this.sessionsLog.shift()
        }
        // Create new session
        const session = new CodeWhispererSession(data)
        this.currentSession = session
        return session
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
}
