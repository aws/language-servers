import {
    IAMClient,
    IAMClientConfig,
    SimulatePrincipalPolicyCommand,
    SimulatePrincipalPolicyCommandOutput,
} from '@aws-sdk/client-iam'
import { GetCallerIdentityCommand, STSClient, STSClientConfig } from '@aws-sdk/client-sts'
import {
    AwsErrorCodes,
    CancellationToken,
    GetMfaCodeParams,
    GetMfaCodeResult,
    IamCredentials,
    Profile,
} from '@aws/language-server-runtimes/server-interface'
import { AwsError, Observability } from '@aws/lsp-core'
import { StsCache } from '../sts/cache/stsCache'
import { StsAutoRefresher } from '../sts/stsAutoRefresher'
import { ProfileStore } from '../language-server/profiles/profileService'
import { FromProcessInit } from '@aws-sdk/credential-provider-process'
import { AwsCredentialIdentityProvider, Provider, RuntimeConfigAwsCredentialIdentityProvider } from '@aws-sdk/types'
import { InstanceMetadataCredentials, RemoteProviderInit } from '@smithy/credential-provider-imds'
import { FromEnvInit } from '@aws-sdk/credential-provider-env'

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

export type CredentialProviders = {
    fromProcess: (init?: FromProcessInit) => RuntimeConfigAwsCredentialIdentityProvider
    fromContainerMetadata: (init?: RemoteProviderInit) => AwsCredentialIdentityProvider
    fromInstanceMetadata: (init?: RemoteProviderInit) => Provider<InstanceMetadataCredentials>
    fromEnv: (init?: FromEnvInit) => AwsCredentialIdentityProvider
}

export type AwsClientFactories = {
    IAM: (config: IAMClientConfig) => IAMClient
    STS: (config: STSClientConfig) => STSClient
}

export type SendGetMfaCode = (params: GetMfaCodeParams) => Promise<GetMfaCodeResult>

export type IamHandlers = {
    sendGetMfaCode: SendGetMfaCode
}

export type IamFlowParams = {
    profile: Profile
    callStsOnInvalidIamCredential: boolean
    profileStore: ProfileStore
    stsCache: StsCache
    stsAutoRefresher: StsAutoRefresher
    handlers: IamHandlers
    providers: CredentialProviders
    awsClientFactories: AwsClientFactories
    token: CancellationToken
    observability: Observability
}
