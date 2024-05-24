import { IFqnWorkerPool } from './common/IFqnWorkerPool'
import { ExtractorResult, FqnExtractorInput, WorkerPoolConfig } from './common/types'

export * from './common/types'
export declare class FqnWorkerPool implements IFqnWorkerPool {
    constructor(_workerPoolConfig?: WorkerPoolConfig)
    exec(input: FqnExtractorInput): Promise<ExtractorResult>
    dispose(): void
}
