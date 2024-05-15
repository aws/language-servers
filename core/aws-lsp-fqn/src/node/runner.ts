import { fork } from 'child_process'
import { FqnExtractor, FqnExtractorInput, FqnExtractorOutput, Result, RunnerConfig } from '../common/types'
import path = require('path')

export const fqnExtractor: FqnExtractor = (input: FqnExtractorInput, config?: RunnerConfig) => {
    const { logger, timeout = 5000 } = config ?? {}

    let hasFulfilled = false

    const abortController = new AbortController()

    // fork starts a separate nodejs process that has a separate memory space
    const childProcess = fork(
        path.resolve(__dirname, './fqnExtractorProcess.js'),
        [JSON.stringify(input)],
        // note: we either have to use silent or pipe through to a logger, otherwise,
        // the subprocess stdout will cause a length mismatch in logger that will crash the extension :(
        { silent: true, timeout, signal: abortController.signal, killSignal: 'SIGKILL' }
    )

    const childProcessPromise = new Promise<Result<FqnExtractorOutput, string>>((resolve, reject) => {
        childProcess.stdout?.on('data', data => {
            logger?.log(data)
        })

        childProcess.stderr?.on('data', data => {
            logger?.error(data)
        })

        childProcess.on('message', data => {
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

        childProcess.on('error', error => {
            logger?.error(`Error encountered when extracting fully qualified names: ${error.message}`)
            hasFulfilled = true

            reject({ success: false, error: error.message })
        })

        childProcess.on('close', code => {
            if (code !== 0 && !hasFulfilled) {
                hasFulfilled = true

                const error = `Fully qualified names extractor process exited with code ${code}`

                logger?.error(error)
                reject({ success: false, error })
            }
        })
    })

    return [
        childProcessPromise,
        () => {
            abortController.abort()
        },
    ]
}
