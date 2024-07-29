import { Cancellable, ExtractorResult, FqnExtractorInput, IFqnWorkerPool, WorkerPoolConfig } from './common/types'

export * from './common/types'
export declare class FqnWorkerPool implements IFqnWorkerPool {
    constructor(workerPoolConfig?: WorkerPoolConfig)
    exec(input: FqnExtractorInput): Cancellable<Promise<ExtractorResult>>
    dispose(): void
}
