import { IAMClient, SimulatePrincipalPolicyCommand, SimulatePrincipalPolicyCommandOutput } from '@aws-sdk/client-iam'
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts'
import {
    AwsErrorCodes,
    CancellationToken,
    GetMfaCodeParams,
    GetMfaCodeResult,
    IamCredentials,
    Profile,
    StsCredentialChangedParams,
} from '@aws/language-server-runtimes/server-interface'
import { AwsError, Observability } from '@aws/lsp-core'
import { StsCache } from '../sts/cache/stsCache'
import { StsAutoRefresher } from '../sts/stsAutoRefresher'
import { ProfileStore } from '../language-server/profiles/profileService'

export async function validatePermissions(
    credentials: IamCredentials,
    permissions: string[],
    region?: string
): Promise<boolean> {
    const response = await simulatePermissions(credentials, permissions, region)
    // If evaluation results are missing, assume caller does not have sufficient permissions
    if (!response.EvaluationResults) {
        return false
    }
    return response.EvaluationResults.every(result => result.EvalDecision === 'allowed')
}

export async function checkMfaRequired(
    credentials: IamCredentials,
    permissions: string[],
    region?: string
): Promise<boolean> {
    const response = await simulatePermissions(credentials, permissions, region)
    // If evaluation results are missing, assume caller does not need MFA
    if (!response.EvaluationResults) {
        return false
    }
    return response.EvaluationResults?.some(result =>
        result?.MissingContextValues?.includes('aws:MultiFactorAuthPresent')
    )
}

export function throwOnInvalidCredentialId(iamCredentialId?: string): asserts iamCredentialId is string {
    if (typeof iamCredentialId?.trim !== 'function' || !iamCredentialId?.trim()) {
        throw new AwsError('IAM credential id is invalid.', AwsErrorCodes.E_INVALID_STS_CREDENTIAL)
    }
}

// Simulate permissions on the identity associated with the credentials
async function simulatePermissions(
    credentials: IamCredentials,
    permissions: string[],
    region: string = 'us-east-1'
): Promise<SimulatePrincipalPolicyCommandOutput> {
    // Convert the credentials into an identity
    const stsClient = new STSClient({ region: region, credentials: credentials })
    const identity = await stsClient.send(new GetCallerIdentityCommand({}))
    if (!identity.Arn) {
        throw new AwsError('Caller identity ARN not found.', AwsErrorCodes.E_CALLER_IDENTITY_NOT_FOUND)
    }

    // Simulate permissions on the identity
    const iamClient = new IAMClient({ region: region, credentials: credentials })
    return await iamClient.send(
        new SimulatePrincipalPolicyCommand({
            PolicySourceArn: convertToIamArn(identity.Arn),
            ActionNames: permissions,
        })
    )
}

// Converts an assumed role ARN into an IAM role ARN
function convertToIamArn(arn: string) {
    if (arn.includes(':assumed-role/')) {
        const parts = arn.split(':')
        const roleName = parts[5].split('/')[1]
        return `arn:aws:iam::${parts[4]}:role/${roleName}`
    } else {
        return arn
    }
}

export type SendGetMfaCode = (params: GetMfaCodeParams) => Promise<GetMfaCodeResult>
export type SendStsCredentialChanged = (params: StsCredentialChangedParams) => void

export type IamHandlers = {
    sendGetMfaCode: SendGetMfaCode
}

export type IamFlowParams = {
    profile: Profile
    callStsOnInvalidIamCredential: boolean
    recursionCount: number
    profileStore: ProfileStore
    stsCache: StsCache
    stsAutoRefresher: StsAutoRefresher
    handlers: IamHandlers
    token: CancellationToken
    observability: Observability
}
