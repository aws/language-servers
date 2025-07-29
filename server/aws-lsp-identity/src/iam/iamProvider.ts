import { AwsErrorCodes, IamCredentials, Profile, ProfileKind } from '@aws/language-server-runtimes/server-interface'
import { AwsError, Observability } from '@aws/lsp-core'
import { ProfileStore } from '../language-server/profiles/profileService'

export class IamProvider {
    constructor(
        private readonly observability: Observability, // In case we need telemetry and logging in the future
        private readonly profileStore: ProfileStore // Will be used when assuming role with source_profile
    ) {}

    async getCredential(profile: Profile, callStsOnInvalidIamCredential: boolean): Promise<IamCredentials> {
        let credentials: IamCredentials
        // Get the credentials directly from the profile
        if (profile.kinds.includes(ProfileKind.IamCredentialsProfile)) {
            credentials = {
                accessKeyId: profile.settings!.aws_access_key_id!,
                secretAccessKey: profile.settings!.aws_secret_access_key!,
                sessionToken: profile.settings!.aws_session_token!,
            }
        } else {
            throw new AwsError(
                'Credentials could not be found for provided profile kind',
                AwsErrorCodes.E_INVALID_PROFILE
            )
        }

        return credentials
    }
}
