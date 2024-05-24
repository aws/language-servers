import type { ExtractorResult, FqnExtractorInput } from './types'

export interface IFqnWorkerPool {
    exec(input: FqnExtractorInput): Promise<ExtractorResult>
    dispose(): void
}
