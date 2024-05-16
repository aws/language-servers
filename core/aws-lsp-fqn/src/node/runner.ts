import { Worker } from 'worker_threads'
import { FqnExtractor, FqnExtractorInput, FqnExtractorOutput, Result, RunnerConfig } from '../common/types'
import path = require('path')

export const fqnExtractor: FqnExtractor = (input: FqnExtractorInput, config?: RunnerConfig) => {
    const { logger, timeout = 5000 } = config ?? {}

    let hasFulfilled = false

    let timer: NodeJS.Timeout
    const worker = new Worker(path.resolve(__dirname, './fqnExtractorWorker.js'), {
        workerData: { input },
        // allow us to intercept the logs, otherwise, the output will cause vscode extensions to crash
        stdout: true,
        stderr: true,
    })

    const workerJobPromise = new Promise<Result<FqnExtractorOutput, string>>((resolve, reject) => {
        worker.stdout?.on('data', data => {
            logger?.log(data)
        })

        worker.stderr?.on('data', data => {
            logger?.error(data)
        })

        worker.once('message', data => {
            clearTimeout(timer)
            const result = data as Result<FqnExtractorOutput, string>

            hasFulfilled = true

            if (result.success) {
                logger?.log(`Successfully extracted fully qualified names`)
                resolve(result)
            } else {
                logger?.error(result.error)
                resolve({ success: false, error: result.error })
            }
        })

        worker.once('error', error => {
            clearTimeout(timer)
            logger?.error(`Error encountered when extracting fully qualified names: ${error.message}`)
            hasFulfilled = true

            reject({ success: false, error: error.message })
        })

        timer = setTimeout(() => {
            if (!hasFulfilled) {
                logger?.log('Fully qualified names extraction timed out')

                // this is able to terminate worker that has event loop blocked
                worker.terminate().then(() => {
                    logger?.log('Terminated fully qualified names extraction')
                })

                reject({ success: false, error: 'Fully qualified names extraction timed out' })
            }
        }, timeout)
    })

    return [
        workerJobPromise,
        () => {
            clearTimeout(timer)
            worker.terminate()
        },
    ]
}
