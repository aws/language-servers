import { Server } from '@aws/language-server-runtimes/server-interface'
import { RelevantTextDocument } from '@amzn/codewhisperer-streaming'

export type Features = Parameters<Server>[0]

export type Result<TData, TError> =
    | {
          success: true
          data: TData
      }
    | {
          success: false
          data?: TData
          error: TError
      }

export type LspHandlers<THandlerMap> = {
    [K in keyof THandlerMap]: THandlerMap[K] extends (...args: any[]) => any ? Parameters<THandlerMap[K]>[0] : never
}

export type KeysMatching<TMap extends object, TCriteria> = {
    [TKey in keyof TMap]: TMap[TKey] extends TCriteria ? TKey : never
}[keyof TMap]

// Amazon Q types from vscode toolkit
// https://github.com/aws/aws-toolkit-vscode/blob/0b2bccdc945b15d61ab5322205e3982ed8b7cc67/packages/core/src/codewhispererChat/controllers/chat/model.ts#L243
export type LineInfo = { startLine: number; endLine: number }

export type RelevantTextDocumentAddition = RelevantTextDocument & LineInfo
export interface DocumentReference {
    readonly relativeFilePath: string
    readonly lineRanges: Array<{ first: number; second: number }>
}
