export const maxToolResponseSize = 30720 // 30KB

export interface InvokeOutput {
    output: {
        kind: 'text' | 'json'
        content: string
    }
}
