import type { Location } from '@aws/fully-qualified-names'
import type { WorkerPoolOptions } from 'workerpool'

export type FqnSupportedLanguages =
    | 'python'
    | 'java'
    | 'javascript'
    | 'javascriptreact'
    | 'typescript'
    | 'typescriptreact'

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

export type ExtractorResult = Result<FqnExtractorOutput, string>

export interface FullyQualifiedName {
    source: string[]
    symbol: string[]
}

export interface Logger {
    log: (message: string) => void
    error: (error: string) => void
}

export interface WorkerPoolConfig {
    logger?: Logger
    /**
     * time a task is allowed to run before terminated
     *
     * @default 5000ms
     */
    timeout?: number
    workerPoolOptions?: WorkerPoolOptions
}

export interface FqnExtractorOutput {
    fullyQualified: {
        declaredSymbols: FullyQualifiedName[]
        usedSymbols: FullyQualifiedName[]
    }
    simple: {
        declaredSymbols: FullyQualifiedName[]
        usedSymbols: FullyQualifiedName[]
    }
    externalSimple: {
        declaredSymbols: FullyQualifiedName[]
        usedSymbols: FullyQualifiedName[]
    }
}

export type Position = Pick<Location, 'character' | 'line'>

export type Range = {
    start: Position
    end: Position
}

export interface FqnExtractorInput {
    languageId: FqnSupportedLanguages
    fileText: string
    selection: Range
}

export interface IFqnWorkerPool {
    exec(input: FqnExtractorInput): Cancellable<Promise<ExtractorResult>>
    dispose(): void
}

export type CancelFn = () => void
export type Cancellable<T> = [T, CancelFn]
