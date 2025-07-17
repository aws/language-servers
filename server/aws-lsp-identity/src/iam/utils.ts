import { IAMClient, SimulatePrincipalPolicyCommand, SimulatePrincipalPolicyCommandOutput } from '@aws-sdk/client-iam'
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts'
import {
    AwsErrorCodes,
    GetMfaCodeParams,
    GetMfaCodeResult,
    IamCredentials,
} from '@aws/language-server-runtimes/server-interface'
import { AwsError } from '@aws/lsp-core'

// Simulate permissions on the identity associated with the credentials
export async function simulatePermissions(
    credentials: IamCredentials,
    permissions: string[],
    region?: string
): Promise<SimulatePrincipalPolicyCommandOutput> {
    // Convert the credentials into an identity
    const stsClient = new STSClient({ region: region || 'us-east-1', credentials: credentials })
    const identity = await stsClient.send(new GetCallerIdentityCommand({}))
    if (!identity.Arn) {
        throw new AwsError('Caller identity ARN not found.', AwsErrorCodes.E_INVALID_PROFILE)
    }

    // Simulate permissions on the identity
    const iamClient = new IAMClient({ region: region || 'us-east-1', credentials: credentials })
    return await iamClient.send(
        new SimulatePrincipalPolicyCommand({
            PolicySourceArn: identity.Arn,
            ActionNames: permissions,
        })
    )
}

export type SendGetMfaCode = (params: GetMfaCodeParams) => Promise<GetMfaCodeResult>

export type IamHandlers = {
    sendGetMfaCode: SendGetMfaCode
}
