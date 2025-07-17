import { AwsErrorCodes, IamCredentials, ProfileKind } from '@aws/language-server-runtimes/server-interface'
import { AwsError } from '@aws/lsp-core'
import { AssumeRoleCommand, AssumeRoleCommandInput, STSClient } from '@aws-sdk/client-sts'
import { IamFlowParams, simulatePermissions } from './utils'
import { StsCredential } from '../sts/cache/stsCache'

const sourceProfileRecursionMax = 5
const mfaTimeout = 2 * 60 * 1000 // 2 minutes

export class IamProvider {
    private sourceProfileRecursionCount = 0

    async getCredential(params: IamFlowParams): Promise<IamCredentials> {
        try {
            let credentials: IamCredentials
            // Assume the role matching the found ARN
            if (params.profile.kinds.includes(ProfileKind.IamSourceProfileProfile)) {
                credentials = await this.getAssumedRoleCredential(params)
            }
            // Get the credentials directly from the profile
            else if (params.profile.kinds.includes(ProfileKind.IamCredentialsProfile)) {
                credentials = {
                    accessKeyId: params.profile.settings!.aws_access_key_id!,
                    secretAccessKey: params.profile.settings!.aws_secret_access_key!,
                    sessionToken: params.profile.settings!.aws_session_token!,
                }
            } else {
                throw new AwsError(
                    'Credentials could not be found for provided profile kind',
                    AwsErrorCodes.E_INVALID_PROFILE
                )
            }

            return credentials
        } catch (e) {
            this.sourceProfileRecursionCount = 0
            throw e
        }
    }

    private async getAssumedRoleCredential(params: IamFlowParams): Promise<IamCredentials> {
        if (!params.profile.settings) {
            throw new AwsError('Profile settings not found when assuming role.', AwsErrorCodes.E_INVALID_PROFILE)
        }

        // Try to get the STS credentials from cache
        let result: IamCredentials
        const stsCredentials = await params.stsCache.getStsCredential(params.profile.name).catch(_ => undefined)

        if (stsCredentials?.Credentials) {
            result = {
                accessKeyId: stsCredentials.Credentials.AccessKeyId!,
                secretAccessKey: stsCredentials.Credentials.SecretAccessKey!,
                sessionToken: stsCredentials.Credentials.SessionToken!,
                expiration: stsCredentials.Credentials.Expiration!,
            }
        } else if (params.callStsOnInvalidIamCredential) {
            // Generate STS credentials
            const response = await this.generateStsCredential(params)
            if (!response.Credentials) {
                throw new AwsError(
                    'Failed to assume role: No credentials returned',
                    AwsErrorCodes.E_INVALID_STS_CREDENTIAL
                )
            }
            // Cache STS credentials
            await params.stsCache.setStsCredential(params.profile.name, response)
            result = {
                accessKeyId: response.Credentials.AccessKeyId!,
                secretAccessKey: response.Credentials.SecretAccessKey!,
                sessionToken: response.Credentials.SessionToken!, // Always present in STS response
                expiration: response.Credentials.Expiration!,
            }
        } else {
            // If we could not get the cached STS credential and cannot generate a new credential, give up
            params.observability.logging.log(
                'STS credential not found an generateOnInvalidStsCredential = false, returning no credential.'
            )
            throw new AwsError('STS credential not found.', AwsErrorCodes.E_INVALID_STS_CREDENTIAL)
        }

        // Set up auto-refresh if MFA is disabled
        if (!params.profile.settings.mfa_serial) {
            await params.stsAutoRefresher
                .watch(params.profile.name, () => this.generateStsCredential(params))
                .catch(reason => {
                    params.observability.logging.log(`Unable to auto-refresh STS credentials. ${reason}`)
                })
        }

        return result
    }

    private async getParentCredential(params: IamFlowParams): Promise<IamCredentials> {
        let parentCredentials: IamCredentials
        if (params.profile.kinds.includes(ProfileKind.IamSourceProfileProfile)) {
            // Get the source profile
            const profileData = await params.profileStore.load()
            const sourceProfile = profileData.profiles.find(p => p.name === params.profile.settings!.source_profile!)
            if (!sourceProfile) {
                params.observability.logging.log('Source profile not found.')
                throw new AwsError('Source profile not found.', AwsErrorCodes.E_PROFILE_NOT_FOUND)
            }
            // Obtain parent profile credentials if IamRoleSourceProfile chain isn't too long
            if (this.sourceProfileRecursionCount <= sourceProfileRecursionMax) {
                this.sourceProfileRecursionCount += 1
                parentCredentials = await this.getCredential({ ...params, profile: sourceProfile })
                this.sourceProfileRecursionCount = 0
            } else {
                throw new AwsError('Source profile chain exceeded max length.', AwsErrorCodes.E_INVALID_PROFILE)
            }
        } else {
            throw new AwsError('Source credentials not found', AwsErrorCodes.E_INVALID_PROFILE)
        }
        return parentCredentials
    }

    private async generateStsCredential(params: IamFlowParams): Promise<StsCredential> {
        try {
            const parentCredentials = await this.getParentCredential(params)
            const stsClient = new STSClient({
                region: params.profile.settings?.region || 'us-east-1',
                credentials: parentCredentials,
            })

            // Add MFA fields to assume role request if MultiFactorAuthPresent is required
            const assumeRoleInput: AssumeRoleCommandInput = {
                RoleArn: params.profile.settings?.role_arn,
                RoleSessionName: `session-${Date.now()}`,
                DurationSeconds: 3600,
            }
            const response = await simulatePermissions(
                parentCredentials,
                ['sts:AssumeRole'],
                params.profile.settings?.region
            )
            if (response.EvaluationResults?.[0]?.MissingContextValues?.includes('aws:MultiFactorAuthPresent')) {
                // Get the MFA device serial number from the profile
                if (!params.profile.settings?.mfa_serial) {
                    throw new AwsError(
                        'MFA serial required when assuming role with MultiFactorAuthPresent permission condition',
                        AwsErrorCodes.E_MFA_REQUIRED
                    )
                }
                assumeRoleInput.SerialNumber = params.profile.settings?.mfa_serial
                // Request an MFA code from the language client
                const timeout = new Promise<never>((_, reject) =>
                    setTimeout(
                        () => reject(new AwsError('MFA code request timed out', AwsErrorCodes.E_MFA_REQUIRED)),
                        mfaTimeout
                    )
                )
                const response = await Promise.race([
                    params.handlers.sendGetMfaCode({
                        mfaSerial: params.profile.settings?.mfa_serial,
                        profileName: params.profile.name,
                    }),
                    timeout,
                ])
                if (!response.code) {
                    throw new AwsError(
                        'MFA code required when assuming role with MultiFactorAuthPresent permission condition',
                        AwsErrorCodes.E_MFA_REQUIRED
                    )
                }
                assumeRoleInput.TokenCode = response.code
            }

            const command = new AssumeRoleCommand(assumeRoleInput)
            const { Credentials, AssumedRoleUser } = await stsClient.send(command)
            return { Credentials, AssumedRoleUser }
        } catch (e) {
            params.observability.logging.log(`Error generating STS credentials.`)
            throw e
        }
    }
}
