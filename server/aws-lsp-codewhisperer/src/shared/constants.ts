export const MISSING_BEARER_TOKEN_ERROR = 'credentialsProvider does not have bearer token credentials'
export const INVALID_TOKEN = 'The bearer token included in the request is invalid.'
export const GENERIC_UNAUTHORIZED_ERROR = 'User is not authorized to make this call'
export const BUILDER_ID_START_URL = 'https://view.awsapps.com/start'
export const DEFAULT_AWS_Q_ENDPOINT_URL = 'https://codewhisperer.us-east-1.amazonaws.com/'
export const DEFAULT_AWS_Q_REGION = 'us-east-1'

export const AWS_Q_ENDPOINTS = new Map([
    [DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL],
    ['us-east-1', 'https://codewhisperer.us-east-1.amazonaws.com/'],
    ['eu-central-1', 'https://q.eu-central-1.amazonaws.com/'],
])

export const AWS_Q_REGION_ENV_VAR = 'AWS_Q_REGION'
export const AWS_Q_ENDPOINT_URL_ENV_VAR = 'AWS_Q_ENDPOINT_URL'

export const Q_CONFIGURATION_SECTION = 'aws.q'
export const CODE_WHISPERER_CONFIGURATION_SECTION = 'aws.codeWhisperer'

/**
 * Names of directories relevant to the crash reporting functionality.
 *
 * Moved here to resolve circular dependency issues.
 */
export const crashMonitoringDirName = 'crashMonitoring'

/** Matches Windows drive letter ("C:"). */
export const driveLetterRegex = /^[a-zA-Z]\:/
