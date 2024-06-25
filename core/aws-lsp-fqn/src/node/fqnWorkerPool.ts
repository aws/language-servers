import path = require('path')
import { CommonFqnWorkerPool } from '../common/commonFqnWorkerPool'
import { CanExecuteResult, WorkerPoolConfig } from '../common/types'
import { existsSync } from 'fs'

export class FqnWorkerPool extends CommonFqnWorkerPool {
    static canExecute(): CanExecuteResult {
        const workerFileExists = existsSync('./aws-lsp-fqn-worker.js')

        return {
            success: workerFileExists,
            error: !workerFileExists ? 'Worker file not found' : undefined,
        }
    }

    constructor(options?: WorkerPoolConfig) {
        super(path.resolve(__dirname, './aws-lsp-fqn-worker.js'), options)
    }
}
