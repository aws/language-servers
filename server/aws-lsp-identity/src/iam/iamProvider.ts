import {
    AwsErrorCodes,
    IamCredential,
    IamCredentialId,
    IamCredentials,
    ProfileKind,
} from '@aws/language-server-runtimes/server-interface'
import { AwsError } from '@aws/lsp-core'
import { AssumeRoleCommand, AssumeRoleCommandInput, STSClient } from '@aws-sdk/client-sts'
import { checkMfaRequired, IamFlowParams } from './utils'
import { createHash } from 'crypto'

const sourceProfileRecursionMax = 5
const mfaTimeout = 2 * 60 * 1000 // 2 minutes

export class IamProvider {
    readonly defaultRegion = 'us-east-1'

    async getCredential(params: IamFlowParams): Promise<IamCredential> {
        let id: IamCredentialId = ''
        let credentials: IamCredentials

        // Get the credentials directly from the profile
        if (params.profile.kinds.includes(ProfileKind.IamCredentialsProfile)) {
            credentials = {
                accessKeyId: params.profile.settings!.aws_access_key_id!,
                secretAccessKey: params.profile.settings!.aws_secret_access_key!,
                sessionToken: params.profile.settings?.aws_session_token,
            }
        }
        // Assume the role matching the found ARN
        else if (params.profile.kinds.includes(ProfileKind.IamSourceProfileProfile)) {
            const key = JSON.stringify({
                RoleArn: params.profile.settings?.role_arn,
                RoleSessionName: params.profile.settings?.role_session_name,
                SerialNumber: params.profile.settings?.mfa_serial,
            })
            id = createHash('sha1').update(key).digest('hex')
            credentials = await this.getAssumedRoleCredential(id, params)
        } else {
            throw new AwsError(
                'Credentials could not be found for provided profile kind',
                AwsErrorCodes.E_INVALID_PROFILE
            )
        }

        return { id: id, kinds: params.profile.kinds, credentials: credentials }
    }

    private async getAssumedRoleCredential(id: IamCredentialId, params: IamFlowParams): Promise<IamCredentials> {
        if (!params.profile.settings) {
            throw new AwsError('Profile settings not found when assuming role.', AwsErrorCodes.E_INVALID_PROFILE)
        }

        // Try to get the STS credentials from cache
        let result: IamCredentials
        const credential = await params.stsCache.getStsCredential(id).catch(_ => undefined)

        if (credential) {
            result = {
                accessKeyId: credential.accessKeyId,
                secretAccessKey: credential.secretAccessKey,
                sessionToken: credential.sessionToken,
                expiration: credential.expiration,
            }
        } else if (params.callStsOnInvalidIamCredential) {
            // Generate STS credentials
            const response = await this.generateStsCredential(params)
            // Cache STS credentials
            await params.stsCache.setStsCredential(id, response)
            result = {
                accessKeyId: response.accessKeyId,
                secretAccessKey: response.secretAccessKey,
                sessionToken: response.sessionToken,
                expiration: response.expiration,
            }
        } else {
            // If we could not get the cached STS credential and cannot generate a new credential, give up
            params.observability.logging.log(
                'STS credential not found an callStsOnInvalidIamCredential = false, returning no credential.'
            )
            throw new AwsError('STS credential not found.', AwsErrorCodes.E_INVALID_STS_CREDENTIAL)
        }

        // Set up auto-refresh if MFA is disabled
        if (!params.profile.settings.mfa_serial) {
            await params.stsAutoRefresher
                .watch(id, () => this.generateStsCredential(params))
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
            if (params.recursionCount <= sourceProfileRecursionMax) {
                const response = await this.getCredential({
                    ...params,
                    profile: sourceProfile,
                    recursionCount: params.recursionCount + 1,
                })
                parentCredentials = response.credentials
            } else {
                throw new AwsError('Source profile chain exceeded max length.', AwsErrorCodes.E_INVALID_PROFILE)
            }
        } else {
            throw new AwsError('Source credentials not found', AwsErrorCodes.E_INVALID_PROFILE)
        }
        return parentCredentials
    }

    private async generateStsCredential(params: IamFlowParams): Promise<IamCredentials> {
        try {
            const parentCredentials = await this.getParentCredential(params)
            const stsClient = new STSClient({
                region: params.profile.settings?.region || this.defaultRegion,
                credentials: parentCredentials,
            })

            // Add MFA fields to assume role request if MultiFactorAuthPresent is required
            const assumeRoleInput: AssumeRoleCommandInput = {
                RoleArn: params.profile.settings?.role_arn,
                RoleSessionName: params.profile.settings?.role_session_name || `session-${Date.now()}`,
                DurationSeconds: 3600,
            }
            const mfaRequired = await checkMfaRequired(
                parentCredentials,
                ['sts:AssumeRole'],
                params.profile.settings?.region
            )
            if (mfaRequired) {
                // Get the MFA device serial number from the profile
                if (!params.profile.settings?.mfa_serial) {
                    throw new AwsError(
                        'MFA serial required when assuming role with MultiFactorAuthPresent permission condition',
                        AwsErrorCodes.E_MFA_REQUIRED
                    )
                }
                assumeRoleInput.SerialNumber = params.profile.settings?.mfa_serial
                // Request an MFA code from the language client
                let timeoutId: NodeJS.Timeout | undefined
                const timeout = new Promise<never>(
                    (_, reject) =>
                        (timeoutId = setTimeout(
                            () => reject(new AwsError('MFA code request timed out', AwsErrorCodes.E_MFA_REQUIRED)),
                            mfaTimeout
                        ))
                )
                const response = await Promise.race([
                    params.handlers.sendGetMfaCode({
                        mfaSerial: params.profile.settings?.mfa_serial,
                        profileName: params.profile.name,
                    }),
                    timeout,
                ])
                clearTimeout(timeoutId)
                if (!response.code) {
                    throw new AwsError(
                        'MFA code required when assuming role with MultiFactorAuthPresent permission condition',
                        AwsErrorCodes.E_MFA_REQUIRED
                    )
                }
                assumeRoleInput.TokenCode = response.code
            }

            const command = new AssumeRoleCommand(assumeRoleInput)
            const { Credentials } = await stsClient.send(command)
            if (!Credentials?.AccessKeyId || !Credentials.SecretAccessKey) {
                throw new AwsError(
                    'Failed to generate credentials for assumed role',
                    AwsErrorCodes.E_CANNOT_CREATE_STS_CREDENTIAL
                )
            }
            return {
                accessKeyId: Credentials.AccessKeyId,
                secretAccessKey: Credentials.SecretAccessKey,
                sessionToken: Credentials.SessionToken,
                expiration: Credentials.Expiration,
            }
        } catch (e) {
            params.observability.logging.log(`Error generating STS credentials.`)
            throw e
        }
    }
}
