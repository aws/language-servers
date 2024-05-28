import path = require('path')
import { CommonFqnWorkerPool } from '../common/commonFqnWorkerPool'
import { WorkerPoolConfig } from '../common/types'

export class FqnWorkerPool extends CommonFqnWorkerPool {
    constructor(options?: WorkerPoolConfig) {
        super(path.resolve(__dirname, './aws-lsp-fqn-worker.js'), options)
    }
}
