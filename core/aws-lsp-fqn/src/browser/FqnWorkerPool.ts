import { CommonFqnWorkerPool } from '../common/CommonFqnWorkerPool'
import { ExtractorResult, FqnExtractorInput, WorkerPoolConfig } from '../common/types'

// TODO: implement logic for browser/webworker environment
export class FqnWorkerPool extends CommonFqnWorkerPool {
    constructor(options?: WorkerPoolConfig) {
        super('', options)
    }

    public async exec(_input: FqnExtractorInput): Promise<ExtractorResult> {
        return Promise.resolve({
            success: true,
            data: {
                fullyQualified: {
                    declaredSymbols: [],
                    usedSymbols: [],
                },
                simple: {
                    declaredSymbols: [],
                    usedSymbols: [],
                },
                externalSimple: {
                    declaredSymbols: [],
                    usedSymbols: [],
                },
            },
        })
    }
}
