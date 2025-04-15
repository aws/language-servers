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
