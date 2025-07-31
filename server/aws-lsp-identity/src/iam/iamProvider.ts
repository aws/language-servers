import {
    AwsErrorCodes,
    GetMfaCodeResult,
    IamCredential,
    IamCredentials,
    ProfileKind,
} from '@aws/language-server-runtimes/server-interface'
import { AwsError } from '@aws/lsp-core'
import { AssumeRoleCommand, AssumeRoleCommandInput, STSClient } from '@aws-sdk/client-sts'
import { checkMfaRequired, IamFlowParams } from './utils'
import { convertProfileToId } from '../sts/cache/fileSystemStsCache'

const sourceProfileRecursionMax = 5

export class IamProvider {
    readonly defaultRegion = 'us-east-1'

    async getCredential(params: IamFlowParams): Promise<IamCredential> {
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
            credentials = await this.getAssumedRoleCredential(params)
        } else {
            throw new AwsError(
                'Credentials could not be found for provided profile kind',
                AwsErrorCodes.E_INVALID_PROFILE
            )
        }

        return { id: convertProfileToId(params.profile), kinds: params.profile.kinds, credentials: credentials }
    }

    private async getAssumedRoleCredential(params: IamFlowParams): Promise<IamCredentials> {
        if (!params.profile.settings) {
            throw new AwsError('Profile settings not found when assuming role.', AwsErrorCodes.E_INVALID_PROFILE)
        }

        // Try to get the STS credentials from cache
        let result: IamCredentials
        const credential = await params.stsCache
            .getStsCredential(convertProfileToId(params.profile))
            .catch(_ => undefined)

        if (credential) {
            result = credential
        } else if (params.callStsOnInvalidIamCredential) {
            // Generate STS credentials
            result = await this.generateStsCredential(params)
            // Cache STS credentials
            await params.stsCache.setStsCredential(convertProfileToId(params.profile), result)
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
                .watch(convertProfileToId(params.profile), () => this.generateStsCredential(params))
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
            const sourceName = params.profile.settings!.source_profile!
            const sourceProfile = profileData.profiles.find(p => p.name === sourceName)
            if (!sourceProfile) {
                params.observability.logging.log(`Source profile ${sourceName} not found.`)
                throw new AwsError(`Source profile ${sourceName} not found.`, AwsErrorCodes.E_PROFILE_NOT_FOUND)
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
            // Set up AssumeRole input
            const parentCredentials = await this.getParentCredential(params)
            const stsClient = new STSClient({
                region: params.profile.settings?.region || this.defaultRegion,
                credentials: parentCredentials,
            })
            const assumeRoleInput: AssumeRoleCommandInput = {
                RoleArn: params.profile.settings?.role_arn,
                RoleSessionName: params.profile.settings?.role_session_name || `session-${Date.now()}`,
                DurationSeconds: 3600,
            }

            // Add MFA fields to assume role request if MultiFactorAuthPresent is required
            const mfaRequired = await checkMfaRequired(
                parentCredentials,
                ['sts:AssumeRole'],
                params.profile.settings?.region
            )
            if (mfaRequired) {
                const response = await this.requestMfa(params)
                assumeRoleInput.SerialNumber = response.mfaSerial
                assumeRoleInput.TokenCode = response.code

                // Add the MFA serial number to the profile
                const updatedProfile = {
                    ...params.profile,
                    settings: { ...params.profile.settings, mfa_serial: response.mfaSerial },
                }
                params.profileStore.save({ profiles: [updatedProfile], ssoSessions: [] })
                // Update params.profile to ensure STS cache key is generated with updated MFA serial number
                params.profile = updatedProfile
            }

            // Call AssumeRole API
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

    // Request an MFA code from the language client
    private async requestMfa(params: IamFlowParams): Promise<GetMfaCodeResult> {
        const response = await params.handlers.sendGetMfaCode({
            profileName: params.profile.name,
            mfaSerial: params.profile.settings?.mfa_serial,
        })

        if (!response.code) {
            throw new AwsError(
                'MFA code required when assuming role with MultiFactorAuthPresent permission condition',
                AwsErrorCodes.E_MFA_REQUIRED
            )
        }
        if (!response.mfaSerial) {
            throw new AwsError(
                'MFA serial required when assuming role with MultiFactorAuthPresent permission condition',
                AwsErrorCodes.E_MFA_REQUIRED
            )
        }

        return response
    }
}
