export const DEFAULT_AWS_Q_ENDPOINT_URL = 'https://rts.gamma-us-east-1.codewhisperer.ai.aws.dev/'
// export const DEFAULT_AWS_Q_ENDPOINT_URL = 'https://codewhisperer.us-east-1.amazonaws.com/'
export const DEFAULT_AWS_Q_REGION = 'us-east-1'

export const AWS_Q_ENDPOINTS = {
    [DEFAULT_AWS_Q_REGION]: DEFAULT_AWS_Q_ENDPOINT_URL,
    'us-west-2': 'https://rts.gamma-us-west-2.codewhisperer.ai.aws.dev/',
    'us-east-1': 'https://rts.gamma-us-east-1.codewhisperer.ai.aws.dev/',
    'eu-central-1': 'https://rts.prod-eu-central-1.codewhisperer.ai.aws.dev/',
}
