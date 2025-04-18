export interface InvokeOutput {
    output:
        | {
              kind: 'text'
              content: string
          }
        | {
              kind: 'json'
              content: object
          }
}

export interface CommandValidation {
    requiresAcceptance: boolean
    warning?: string
}

export async function validatePath(path: string, exists: (p: string) => Promise<boolean>) {
    if (!path || path.trim().length === 0) {
        throw new Error('Path cannot be empty.')
    }
    const pathExists = await exists(path)
    if (!pathExists) {
        throw new Error(`Path "${path}" does not exist or cannot be accessed.`)
    }
}
