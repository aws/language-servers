interface Output<Kind, Content> {
    kind: Kind
    content: Content
    success?: boolean
}

export interface InvokeOutput {
    output: Output<'text', string> | Output<'json', object>
}
