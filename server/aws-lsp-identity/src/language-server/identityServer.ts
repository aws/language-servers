import { ProfileService } from './profiles/profileService'
import {
    CancellationToken,
    ListProfilesParams,
    SsoTokenChangedParams,
    UpdateProfileParams,
    IdentityManagement,
    Server,
} from '@aws/language-server-runtimes/server-interface'
import { SharedConfigProfileStore } from './profiles/sharedConfigProfileStore'
import { IdentityService } from './identityService'

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
                await profileService.listProfiles(params, token)
        )
        idMgmt.onUpdateProfile(
            async (params: UpdateProfileParams, token: CancellationToken) =>
                await profileService.updateProfile(params, token)
        )

        // disposable
        return () => {
            identityService.SsoTokenChanged.remove(ssoTokenChangedHandler)
        }
    }

const identityService = new IdentityService()
const profileService = new ProfileService(new SharedConfigProfileStore())

export const IdentityServer = IdentityServerFactory(identityService, profileService)
