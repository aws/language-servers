import { CredentialsProvider } from '@aws/language-server-runtimes/server-interface'
import { Result } from '../types'
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

    public static reset() {
        ChatSessionManagementService.#instance = undefined
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

    public createSession(tabId: string): Result<ChatSessionService, string> {
        if (!this.#credentialsProvider) {
            return {
                success: false,
                error: 'Credentials provider is not set',
            }
        } else if (this.#sessionByTab.has(tabId)) {
            return {
                success: false,
                data: this.#sessionByTab.get(tabId),
                error: 'Session already exists',
            }
        }

        const clientConfig = typeof this.#clientConfig === 'function' ? this.#clientConfig() : this.#clientConfig
        const newSession = new ChatSessionService(this.#credentialsProvider, clientConfig)

        this.#sessionByTab.set(tabId, newSession)

        return {
            success: true,
            data: newSession,
        }
    }

    public getSession(tabId: string): Result<ChatSessionService, string> {
        const session = this.#sessionByTab.get(tabId)
        return session
            ? {
                  success: true,
                  data: session,
              }
            : {
                  success: false,
                  error: 'Session does not exist',
              }
    }

    public deleteSession(tabId: string): Result<void, string> {
        this.#sessionByTab.get(tabId)?.dispose()
        this.#sessionByTab.delete(tabId)

        return {
            success: true,
            data: undefined,
        }
    }

    public dispose() {
        this.#sessionByTab.forEach(session => session.dispose())
    }
}
