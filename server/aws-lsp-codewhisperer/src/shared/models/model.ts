// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/9d8ddbd85f4533e539a58e76f7c46883d8e50a79/packages/core/src/codewhisperer/models/model.ts

// TODO: consolidate these strategy ids
export type UtgStrategy = 'ByName' | 'ByContent' | 'NEW_UTG'

export type CrossFileStrategy = 'OpenTabs_BM25'

export type ProjectContextStrategy = 'codemap'

export type SupplementalContextStrategy = CrossFileStrategy | ProjectContextStrategy | UtgStrategy | 'Empty'

export interface CodeWhispererSupplementalContext {
    isUtg: boolean
    isProcessTimeout: boolean
    supplementalContextItems: CodeWhispererSupplementalContextItem[]
    contentsLength: number
    latency: number
    strategy: SupplementalContextStrategy
}

export interface CodeWhispererSupplementalContextItem {
    content: string
    filePath: string
    score?: number
}
