import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { ChatSessionService } from './chatSessionService'

export class ChatSessionManagementService {
    #sessionByTab: Map<string, ChatSessionService>
    #credentialsProvider: CredentialsProvider

    constructor(credentialsProvider: CredentialsProvider) {
        this.#credentialsProvider = credentialsProvider
        this.#sessionByTab = new Map<string, any>()
    }

    hasSession(tabId: string): boolean {
        return this.#sessionByTab.has(tabId)
    }

    getSession(tabId: string): ChatSessionService {
        const maybeSession = this.#sessionByTab.get(tabId)

        if (!maybeSession) {
            const newSession = new ChatSessionService(this.#credentialsProvider)

            this.#sessionByTab.set(tabId, newSession)

            return newSession
        }

        return maybeSession
    }

    deleteSession(tabId: string): void {
        this.#sessionByTab.get(tabId)?.dispose()
        this.#sessionByTab.delete(tabId)
    }

    dispose(): void {
        this.#sessionByTab.forEach(session => session.dispose())
    }
}
