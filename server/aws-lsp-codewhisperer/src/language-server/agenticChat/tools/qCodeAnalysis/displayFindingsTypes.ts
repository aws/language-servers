export type DisplayFinding = {
    filePath: string
    startLine: string
    endLine: string
    comment: string
    title: string
    description: string
    severity: string
    suggestedFixes: (string | undefined)[] | undefined
    language: string
}

export enum SuccessMetricName {
    DisplayFindingsSuccess = 'displayFindingsSuccess',
}

export enum FailedMetricName {
    DisplayFindingsFailed = 'displayFindingsFailed',
}

export type DisplayFindingsMetric =
    | {
          reason: SuccessMetricName
          result: 'Succeeded'
          metadata?: object
      }
    | {
          reason: FailedMetricName
          result: 'Failed'
          reasonDesc: string
          metadata?: object
      }
