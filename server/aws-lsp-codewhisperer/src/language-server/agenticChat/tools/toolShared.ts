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
