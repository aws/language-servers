import { ExtractorResult, FqnExtractorInput, IFqnWorkerPool, Cancellable } from '../common/types'

// TODO: implement logic for browser/webworker environment
export class FqnWorkerPool implements IFqnWorkerPool {
    public exec(_input: FqnExtractorInput): Cancellable<Promise<ExtractorResult>> {
        return [
            Promise.resolve({
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
            }),
            () => {},
        ]
    }

    public dispose() {}
}
