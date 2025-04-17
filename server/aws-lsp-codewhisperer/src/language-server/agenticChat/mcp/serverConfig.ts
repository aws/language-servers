// TODO: Current config is stdio-specific, we need to support both stdio and SSE
export type ServerConfig = {
    command: string
    args?: string[]
    env?: Record<string, string>
    timeout?: number
}
