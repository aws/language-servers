import { CanExecuteResult, ExtractorResult, FqnExtractorInput, IFqnWorkerPool, WorkerPoolConfig } from './common/types'

export * from './common/types'
export declare class FqnWorkerPool implements IFqnWorkerPool {
    static canExecute(): CanExecuteResult
    constructor(workerPoolConfig?: WorkerPoolConfig)
    exec(input: FqnExtractorInput): Promise<ExtractorResult>
    dispose(): void
}
