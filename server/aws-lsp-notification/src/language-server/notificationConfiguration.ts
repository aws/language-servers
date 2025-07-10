/**
 * NotificationConfiguration represents the client state and contexts that the server uses to filter notifications.
 * This interface is IDE-agnostic and used by multiple IDE clients (e.g. VSCode, Eclipse, JetBrains, Visual Studio).
 */
export interface NotificationConfiguration {
    /**
     * Contexts are opaque strings that represent different locations, times, states, etc.
     * in the client that notifications can be targeted for (e.g., 'extension/startup', 'q/transform')
     */
    contexts: string[]

    /**
     * Client state represents runtime state values that notifications can be filtered by
     * Examples: extension/version, compute/type, ide/name, etc.
     */
    clientState: Record<string, string>
}
