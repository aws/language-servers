import { pool, Pool } from 'workerpool'
import { DEFAULT_MAX_QUEUE_SIZE, DEFAULT_MAX_WORKERS, DEFAULT_TIMEOUT, FQN_WORKER_ID } from './defaults'
import { ExtractorResult, FqnExtractorInput, IFqnWorkerPool, Logger, WorkerPoolConfig } from './types'

export class CommonFqnWorkerPool implements IFqnWorkerPool {
    #workerPool: Pool
    #logger?: Logger
    #timeout: number

    constructor(filePath: string, { timeout = DEFAULT_TIMEOUT, logger, workerPoolOptions }: WorkerPoolConfig = {}) {
        this.#timeout = timeout
        this.#logger = logger
        this.#workerPool = pool(filePath, {
            maxWorkers: DEFAULT_MAX_WORKERS,
            maxQueueSize: DEFAULT_MAX_QUEUE_SIZE,
            ...workerPoolOptions,
        })
    }

    public async exec(input: FqnExtractorInput): Promise<ExtractorResult> {
        this.#logger?.log(`Extracting fully qualified names for ${input.languageId}`)

        return this.#workerPool
            .exec(FQN_WORKER_ID, [input])
            .timeout(this.#timeout)
            .then(data => data as ExtractorResult)
            .catch(error => {
                const errorMessage = `Encountered error while extracting fully qualified names: ${
                    error instanceof Error ? error.message : 'Unknown'
                }`

                this.#logger?.error(errorMessage)

                return {
                    success: false,
                    error: errorMessage,
                }
            })
    }

    public dispose() {
        this.#workerPool.terminate(true)
    }
}
