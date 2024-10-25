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
    GetSsoTokenParams,
    Lsp,
    InvalidateSsoTokenParams,
} from '@aws/language-server-runtimes/server-interface'
import { SharedConfigProfileStore } from './profiles/sharedConfigProfileStore'
import { IdentityService } from './identityService'
import { AwsError } from '../awsError'
import { FileSystemSsoCache, RefreshingSsoCache } from '../sso/cache'
import { RaiseSsoTokenChanged, SsoTokenAutoRefresher } from './ssoTokenAutoRefresher'
import { ShowUrl } from '../sso'

export const IdentityServerFactory = (): Server => (features: { identityManagement: IdentityManagement; lsp: Lsp }) => {
    const { identityManagement: idMgmt, lsp } = features

    // Callbacks for server->client JSON-RPC calls
    const raiseSsoTokenChanged: RaiseSsoTokenChanged = (params: SsoTokenChangedParams) =>
        idMgmt.sendSsoTokenChanged(params)
    const showUrl: ShowUrl = (url: URL) => lsp.window.showDocument({ uri: url.toString(), external: true })

    // Initialize dependencies
    const profileStore = new SharedConfigProfileStore()
    const ssoCache = new RefreshingSsoCache(new FileSystemSsoCache())
    const autoRefresher = new SsoTokenAutoRefresher(ssoCache, raiseSsoTokenChanged)

    const identityService = new IdentityService(profileStore, ssoCache, autoRefresher, showUrl)
    const profileService = new ProfileService(profileStore)

    // JSON-RPC request/notification handlers (client->server)
    idMgmt.onGetSsoToken(
        async (params: GetSsoTokenParams, token: CancellationToken) =>
            await identityService.getSsoToken(params, token).catch(reason => {
                throw awsResponseErrorWrap(reason)
            })
    )

    idMgmt.onInvalidateSsoToken(
        async (params: InvalidateSsoTokenParams, token: CancellationToken) =>
            await identityService.invalidateSsoToken(params, token).catch(reason => {
                throw awsResponseErrorWrap(reason)
            })
    )

    idMgmt.onListProfiles(
        async (params: ListProfilesParams, token: CancellationToken) =>
            await profileService.listProfiles(params, token).catch(reason => {
                throw awsResponseErrorWrap(reason)
            })
    )

    idMgmt.onUpdateProfile(
        async (params: UpdateProfileParams, token: CancellationToken) =>
            await profileService.updateProfile(params, token).catch(reason => {
                throw awsResponseErrorWrap(reason)
            })
    )

    // disposable
    return () => {}
}

export const IdentityServer = IdentityServerFactory()

// AwsResponseError should only be instantied and used at the server class level.  All other code should use
// the LSP-agnostic AwsError class instead.  Each handler call should use this function to wrap the functional
// call and emit an AwsResponseError in all failure cases.  If a better awsErrorCode than E_UNKNOWN can be
// assumed at the call site, it can be provided as an arg, otherwise E_UNKNOWN as default is fine.
// Following the error pattern, the inner most error message and awsErrorCode should be returned.
// NOTE In the future it may make sense to refactor this code as a static method of AwsResponseError in
// language-server-runtimes
function awsResponseErrorWrap(error: Error, awsErrorCode: string = AwsErrorCodes.E_UNKNOWN): AwsResponseError {
    return new AwsResponseError(error?.message ?? 'Unknown error', {
        awsErrorCode: error instanceof AwsError ? error.awsErrorCode : awsErrorCode,
    })
}
