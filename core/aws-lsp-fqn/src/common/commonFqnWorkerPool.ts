import { pool, Pool } from 'workerpool'
import { DEFAULT_MAX_QUEUE_SIZE, DEFAULT_MAX_WORKERS, DEFAULT_TIMEOUT, FQN_WORKER_ID } from './defaults'
import { ExtractorResult, FqnExtractorInput, IFqnWorkerPool, Logger, WorkerPoolConfig, Cancellable } from './types'

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

    public exec(input: FqnExtractorInput): Cancellable<Promise<ExtractorResult>> {
        this.#logger?.log(`Extracting fully qualified names for ${input.languageId}`)

        const execPromise = this.#workerPool.exec(FQN_WORKER_ID, [input]).timeout(this.#timeout)

        return [
            // have to wrap this in promise since exec promise is not a true promise
            new Promise<ExtractorResult>(resolve => {
                execPromise
                    .then(data => resolve(data as ExtractorResult))
                    .catch(error => {
                        const errorMessage = `Encountered error while extracting fully qualified names: ${
                            error instanceof Error ? error.message : 'Unknown'
                        }`

                        this.#logger?.error(errorMessage)

                        // using result pattern, so we will resolve with success: false
                        return resolve({
                            success: false,
                            error: errorMessage,
                        })
                    })
            }),
            () => execPromise.cancel(),
        ]
    }

    public dispose() {
        this.#workerPool.terminate(true)
    }
}
