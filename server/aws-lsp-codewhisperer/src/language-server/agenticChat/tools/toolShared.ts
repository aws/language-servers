import * as path from 'path'

export const maxToolResponseSize = 30720 // 30KB

export enum OutputKind {
    Text = 'text',
    Json = 'json',
}

export interface InvokeOutput {
    output: {
        kind: OutputKind
        content: string
    }
}

export function sanitizePath(inputPath: string, homePath: string): string {
    let sanitized = inputPath.trim()

    if (sanitized.startsWith('~')) {
        sanitized = path.join(homePath, sanitized.slice(1))
    }

    if (!path.isAbsolute(sanitized)) {
        sanitized = path.resolve(sanitized)
    }
    return sanitized
}
