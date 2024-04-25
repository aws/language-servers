import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { ChatSessionService, ChatSessionServiceConfig } from './chatSessionService'

export class ChatSessionManagementService {
    static #instance?: ChatSessionManagementService
    #sessionByTab: Map<string, ChatSessionService> = new Map<string, any>()
    #credentialsProvider?: CredentialsProvider
    #clientConfig?: ChatSessionServiceConfig | (() => ChatSessionServiceConfig)

    public static getInstance() {
        if (!ChatSessionManagementService.#instance) {
            ChatSessionManagementService.#instance = new ChatSessionManagementService()
        }

        return ChatSessionManagementService.#instance
    }

    private constructor() {}

    public withConfig(clientConfig?: ChatSessionServiceConfig | (() => ChatSessionServiceConfig)) {
        this.#clientConfig = clientConfig

        return this
    }

    public withCredentialsProvider(credentialsProvider: CredentialsProvider) {
        this.#credentialsProvider = credentialsProvider

        return this
    }

    public hasSession(tabId: string): boolean {
        return this.#sessionByTab.has(tabId)
    }

    public createSession(tabId: string): ChatSessionService {
        if (!this.#credentialsProvider) {
            throw new Error('Credentials provider is not set')
        }
        const clientConfig = typeof this.#clientConfig === 'function' ? this.#clientConfig() : this.#clientConfig
        const newSession = new ChatSessionService(this.#credentialsProvider, clientConfig)

        this.#sessionByTab.set(tabId, newSession)

        return newSession
    }

    public getSession(tabId: string): ChatSessionService | undefined {
        return this.#sessionByTab.get(tabId)
    }

    public deleteSession(tabId: string): void {
        this.#sessionByTab.get(tabId)?.dispose()
        this.#sessionByTab.delete(tabId)
    }

    public dispose(): void {
        this.#sessionByTab.forEach(session => session.dispose())
    }
}
