import { AmazonQBaseServiceManager } from '../../shared/amazonQServiceManager/BaseAmazonQServiceManager'
import { Result } from '../types'
import { ChatSessionService } from './chatSessionService'

export class ChatSessionManagementService {
    static #instance?: ChatSessionManagementService
    #sessionByTab: Map<string, ChatSessionService> = new Map<string, any>()
    #serviceManager?: AmazonQBaseServiceManager

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

    public withAmazonQServiceManager(serviceManager: AmazonQBaseServiceManager) {
        this.#serviceManager = serviceManager

        return this
    }

    public hasSession(tabId: string): boolean {
        return this.#sessionByTab.has(tabId)
    }

    public createSession(tabId: string): Result<ChatSessionService, string> {
        if (this.#sessionByTab.has(tabId)) {
            return {
                success: true,
                data: this.#sessionByTab.get(tabId)!,
            }
        }

        const newSession = new ChatSessionService(this.#serviceManager)

        this.#sessionByTab.set(tabId, newSession)

        return {
            success: true,
            data: newSession,
        }
    }

    public getSession(tabId: string): Result<ChatSessionService, string> {
        const session = this.#sessionByTab.get(tabId)

        return session ? { success: true, data: session } : this.createSession(tabId)
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
