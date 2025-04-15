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
