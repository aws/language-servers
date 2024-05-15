import type { Location } from '@aws/fully-qualified-names'

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

export interface FullyQualifiedName {
    source: string[]
    symbol: string[]
}

interface Logger {
    log: (message: string) => void
    error: (error: string) => void
}

export interface RunnerConfig {
    logger?: Logger
    /**
     * time out for graceful exit. SIGKILL will be sent 1000ms after
     *
     * @default 2000ms
     */
    timeout?: number
}

export type Dispose = () => void

export type FqnExtractor = (
    input: FqnExtractorInput,
    config?: RunnerConfig
) => [Promise<Result<FqnExtractorOutput, string>>, Dispose]

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
    languageId: 'java' | 'javascript' | 'javascriptreact' | 'python' | 'typescript' | 'typescriptreact'
    fileText: string
    selection: Range
}
