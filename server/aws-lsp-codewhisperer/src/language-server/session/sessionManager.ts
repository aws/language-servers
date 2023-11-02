import { v4 as uuidv4 } from 'uuid'
import { Position } from 'vscode-languageserver'
import { GenerateSuggestionsRequest, Suggestion } from '../codeWhispererService'
import { CodewhispererAutomatedTriggerType, CodewhispererTriggerType } from '../telemetry/types'

type SessionId = string

interface SessionData {
    startPosition: Position
    triggerType: CodewhispererTriggerType
    autoTriggerType?: CodewhispererAutomatedTriggerType
    language: string
    requestContext: GenerateSuggestionsRequest
}

export class CodeWhispererSession {
    id: string
    codewhispererSessionId?: SessionId
    startPosition: Position = {
        line: 0,
        character: 0,
    }
    suggestions: Suggestion[] = []
    expires?: Date
    triggerType: CodewhispererTriggerType
    autoTriggerType?: CodewhispererAutomatedTriggerType
    language: string
    requestContext: GenerateSuggestionsRequest
    lastInvocationTime?: number

    constructor(data: SessionData) {
        this.id = uuidv4()
        this.startPosition = data.startPosition
        this.triggerType = data.triggerType
        this.language = data.language
        this.requestContext = data.requestContext
        this.autoTriggerType = data.autoTriggerType || undefined
    }

    get lastRecommendationIndex(): number {
        return this.suggestions.length - 1
    }
}

// TODO: PoC Session manager for maintaining recommendation sessions in server cache.
// It will be updated to store sessions information.
export class SessionManager {
    private sessions: Map<string, CodeWhispererSession> = new Map()
    private sessionsLog: SessionId[] = []
    private activeSessionId?: SessionId

    createSession(data: SessionData): CodeWhispererSession {
        const session = new CodeWhispererSession(data)

        this.sessions.set(session.id, session)
        this.sessionsLog.push(session.id)

        return session
    }

    removeSession(id: SessionId) {
        this.sessions.delete(id)
    }

    getSession(id: SessionId): CodeWhispererSession | undefined {
        return this.sessions.get(id)
    }

    setActiveSession(id: SessionId) {
        this.activeSessionId = id
    }

    getActiveSession(): CodeWhispererSession | undefined {
        if (this.activeSessionId) {
            return this.getSession(this.activeSessionId)
        }
    }
}
