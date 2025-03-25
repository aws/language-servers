export interface Reference {
    licenseName?: string
    repository?: string
    url?: string
    recommendationContentSpan?: {
        start: number
        end: number
    }
}

// TODO: remove ShortAnswer because it will be deprecated
export interface ShortAnswer {
    testFilePath: string
    buildCommands: string[]
    planSummary: string
    sourceFilePath?: string
    testFramework?: string
    executionCommands?: string[]
    testCoverage?: number
    stopIteration?: string
    errorMessage?: string
    // TODO: from codewhisper model
    // codeReferences?: References
    numberOfTestMethods?: number
}
