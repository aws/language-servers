import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { ChatSessionService, ChatSessionServiceConfig } from './chatSessionService'

export class ChatSessionManagementService {
    #sessionByTab: Map<string, ChatSessionService>
    #credentialsProvider: CredentialsProvider
    #clientConfig?: ChatSessionServiceConfig | (() => ChatSessionServiceConfig)

    constructor(
        credentialsProvider: CredentialsProvider,
        clientConfig?: ChatSessionServiceConfig | (() => ChatSessionServiceConfig)
    ) {
        this.#credentialsProvider = credentialsProvider
        this.#sessionByTab = new Map<string, any>()
        this.#clientConfig = clientConfig
    }

    public hasSession(tabId: string): boolean {
        return this.#sessionByTab.has(tabId)
    }

    public getSession(tabId: string): ChatSessionService {
        const maybeSession = this.#sessionByTab.get(tabId)

        if (!maybeSession) {
            const clientConfig = typeof this.#clientConfig === 'function' ? this.#clientConfig() : this.#clientConfig
            const newSession = new ChatSessionService(this.#credentialsProvider, clientConfig)

            this.#sessionByTab.set(tabId, newSession)

            return newSession
        }

        return maybeSession
    }

    public deleteSession(tabId: string): void {
        this.#sessionByTab.get(tabId)?.dispose()
        this.#sessionByTab.delete(tabId)
    }

    public dispose(): void {
        this.#sessionByTab.forEach(session => session.dispose())
    }
}
