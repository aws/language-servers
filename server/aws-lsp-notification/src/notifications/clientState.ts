/**
 * Represents the client state used for notification condition filtering
 */
export interface ClientState {
    /**
     * Context-specific state values
     * Each context can have multiple key-value pairs representing the client's current state
     */
    [context: string]: {
        [key: string]: string | string[]
    }
}
