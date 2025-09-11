// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/ac9a78db90192fe13dcd82ac0b30e6f84c39b9c8/packages/core/src/codewhisperer/models/constants.ts

export enum UserGroup {
    Classifier = 'Classifier',
    CrossFile = 'CrossFile',
    Control = 'Control',
    RightContext = 'RightContext',
}

export const supplemetalContextFetchingTimeoutMsg = 'Amazon Q supplemental context fetching timeout'

export const supplementalContextMaxTotalLength = 20480

export const supplementalContextTimeoutInMs = 100

// reference: https://github.com/aws/aws-toolkit-vscode/blob/amazonq/v1.74.0/packages/core/src/codewhisperer/models/constants.ts#L827
export const crossFileContextConfig = {
    numberOfChunkToFetch: 60,
    topK: 3,
    numberOfLinesEachChunk: 50,
    maximumTotalLength: 20480,
    maxLengthEachChunk: 10240,
    maxContextCount: 5,
}

export const utgConfig = {
    maxSegmentSize: 10200,
}
