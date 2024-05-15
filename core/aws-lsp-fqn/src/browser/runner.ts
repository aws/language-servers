import { FqnExtractor, FqnExtractorInput, RunnerConfig } from '../common/types'

/**
 * Wasm piece doesn't seem to work in web environment
 *
 * Returning empty results for now - this should start a web worker?
 */
export const fqnExtractor: FqnExtractor = (_input: FqnExtractorInput, _config?: RunnerConfig) => {
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
