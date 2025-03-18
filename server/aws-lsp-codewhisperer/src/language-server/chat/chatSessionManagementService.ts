import { CredentialsProvider, SDKInitializator } from '@aws/language-server-runtimes/server-interface'
import { Result } from '../types'
import { ChatSessionService, ChatSessionServiceConfig } from './chatSessionService'
import { AmazonQTokenServiceManager } from '../amazonQServiceManager/AmazonQTokenServiceManager'

export class ChatSessionManagementService {
    static #instance?: ChatSessionManagementService
    #sessionByTab: Map<string, ChatSessionService> = new Map<string, any>()
    #credentialsProvider?: CredentialsProvider
    #clientConfig?: ChatSessionServiceConfig | (() => ChatSessionServiceConfig) = {}
    #customUserAgent?: string = '%Amazon-Q-For-LanguageServers%'
    #codeWhispererRegion?: string
    #codeWhispererEndpoint?: string
    #sdkInitializator?: SDKInitializator
    #amazonQServiceManager?: AmazonQTokenServiceManager

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

    public withCodeWhispererRegion(codeWhispererRegion: string) {
        this.#codeWhispererRegion = codeWhispererRegion

        return this
    }

    public withCodeWhispererEndpoint(codeWhispererEndpoint: string) {
        this.#codeWhispererEndpoint = codeWhispererEndpoint

        return this
    }

    public withSdkRuntimeConfigurator(sdkInitializator: SDKInitializator) {
        this.#sdkInitializator = sdkInitializator

        return this
    }

    public withAmazonQServiceManager(amazonQServiceManager: AmazonQTokenServiceManager) {
        this.#amazonQServiceManager = amazonQServiceManager

        return this
    }

    public setCustomUserAgent(customUserAgent: string) {
        this.#customUserAgent = customUserAgent
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
        } else if (!this.#codeWhispererRegion) {
            return {
                success: false,
                error: 'CodeWhispererRegion is not set',
            }
        } else if (!this.#codeWhispererEndpoint) {
            return {
                success: false,
                error: 'CodeWhispererEndpoint is not set',
            }
        } else if (!this.#sdkInitializator) {
            return {
                success: false,
                error: 'SdkInitializator is not set',
            }
        } else if (this.#sessionByTab.has(tabId)) {
            return {
                success: true,
                data: this.#sessionByTab.get(tabId)!,
            }
        }

        const clientConfig = typeof this.#clientConfig === 'function' ? this.#clientConfig() : this.#clientConfig
        const newSession = new ChatSessionService(
            this.#credentialsProvider,
            this.#codeWhispererRegion,
            this.#codeWhispererEndpoint,
            this.#sdkInitializator,
            {
                ...clientConfig,
                customUserAgent: this.#customUserAgent,
            },
            this.#amazonQServiceManager
        )

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
