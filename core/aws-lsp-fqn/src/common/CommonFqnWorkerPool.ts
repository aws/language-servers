import { pool, Pool } from 'workerpool'
import { DEFAULT_MAX_WORKERS, DEFAULT_TIMEOUT } from './defaults'
import { IFqnWorkerPool } from './IFqnWorkerPool'
import { ExtractorResult, FqnExtractorInput, Logger, WorkerPoolConfig } from './types'

export class CommonFqnWorkerPool implements IFqnWorkerPool {
    #workerPool: Pool
    #logger?: Logger
    #timeout: number

    constructor(filePath: string, { timeout = DEFAULT_TIMEOUT, logger, workerPoolOptions }: WorkerPoolConfig = {}) {
        this.#timeout = timeout
        this.#logger = logger
        this.#workerPool = pool(filePath, {
            emitStdStreams: true,
            maxWorkers: DEFAULT_MAX_WORKERS,
            ...workerPoolOptions,
        })
    }

    public async exec(input: FqnExtractorInput): Promise<ExtractorResult> {
        return this.#workerPool
            .exec('fqn', [input])
            .timeout(this.#timeout)
            .then(data => data as ExtractorResult)
            .catch(error => {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                }
            })
    }

    public dispose() {
        this.#workerPool.terminate(true)
    }
}
