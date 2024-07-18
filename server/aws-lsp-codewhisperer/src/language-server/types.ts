import { Server } from '@aws/language-server-runtimes/server-interface'

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
