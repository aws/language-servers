// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/9d8ddbd85f4533e539a58e76f7c46883d8e50a79/packages/core/src/codewhisperer/models/model.ts

export type UtgStrategy = 'ByName' | 'ByContent'

export type CrossFileStrategy = 'OpenTabs_BM25'

export type ProjectContextStrategy = 'codemap'

export type RecentEdits = 'recentEdits'

export type SupplementalContextStrategy =
    | CrossFileStrategy
    | ProjectContextStrategy
    | UtgStrategy
    | RecentEdits
    | 'Empty'

export interface CodeWhispererSupplementalContext {
    isUtg: boolean
    isProcessTimeout: boolean
    supplementalContextItems: CodeWhispererSupplementalContextItem[]
    contentsLength: number
    latency: number
    strategy: SupplementalContextStrategy
    timeOffset?: number
}

export interface CodeWhispererSupplementalContextItem {
    content: string
    filePath: string
    score?: number
}
