import { ProfileService } from './profiles/profileService'
import {
    CancellationToken,
    ListProfilesParams,
    SsoTokenChangedParams,
    UpdateProfileParams,
    IdentityManagement,
    Server,
    AwsResponseError,
    AwsErrorCodes,
} from '@aws/language-server-runtimes/server-interface'
import { SharedConfigProfileStore } from './profiles/sharedConfigProfileStore'
import { IdentityService } from './identityService'
import { AwsError, tryAsync } from '../awsError'

export const IdentityServerFactory =
    (identityService: IdentityService, profileService: ProfileService): Server =>
    (features: { identityManagement: IdentityManagement }) => {
        const { identityManagement: idMgmt } = features

        const ssoTokenChangedHandler = async (sender: object, e: SsoTokenChangedParams) => {
            idMgmt.sendSsoTokenChanged(e)
        }
        identityService.SsoTokenChanged.add(ssoTokenChangedHandler)

        idMgmt.onListProfiles(
            async (params: ListProfilesParams, token: CancellationToken) =>
                await tryAsync(
                    () => profileService.listProfiles(params, token),
                    error => awsResponseErrorWrap(error)
                )
        )
        idMgmt.onUpdateProfile(
            async (params: UpdateProfileParams, token: CancellationToken) =>
                await tryAsync(
                    () => profileService.updateProfile(params, token),
                    error => awsResponseErrorWrap(error)
                )
        )

        // disposable
        return () => {
            identityService.SsoTokenChanged.remove(ssoTokenChangedHandler)
        }
    }

const identityService = new IdentityService()
const profileService = new ProfileService(new SharedConfigProfileStore())

export const IdentityServer = IdentityServerFactory(identityService, profileService)

// AwsResponseError should only be instantied and used at the server class level.  All other code should use
// the LSP-agnostic AwsError class instead.  Each handler call should use this function to wrap the functional
// call and emit an AwsResponseError in all failure cases.  If a better awsErrorCode than E_UNKNOWN can be
// assumed at the call site, it can be provided as an arg, otherwise E_UNKNOWN as default is fine.
// Following the error pattern, the inner most error message and awsErrorCode should be returned.
function awsResponseErrorWrap(error: Error, awsErrorCode: string = AwsErrorCodes.E_UNKNOWN): AwsResponseError {
    return new AwsResponseError(error?.message ?? 'Unknown error', {
        awsErrorCode: error instanceof AwsError ? error.awsErrorCode : awsErrorCode,
    })
}
