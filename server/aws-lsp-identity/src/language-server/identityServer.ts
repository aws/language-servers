import { ProfileService } from './profiles/profileService'
import {
    CancellationToken,
    ListProfilesParams,
    UpdateProfileParams,
    AwsResponseError,
    AwsErrorCodes,
    GetSsoTokenParams,
    InvalidateSsoTokenParams,
    InitializeParams,
    HandlerResult,
    PartialInitializeResult,
    InitializeError,
} from '@aws/language-server-runtimes/server-interface'
import { SharedConfigProfileStore } from './profiles/sharedConfigProfileStore'
import { IdentityService } from './identityService'
import { FileSystemSsoCache, RefreshingSsoCache } from '../sso/cache'
import { SsoTokenAutoRefresher } from './ssoTokenAutoRefresher'
import { ShowUrl } from '../sso'
import { ServerBase, ServerFeatures } from './utils'
import { AwsError } from '@aws/lsp-core'

export class IdentityServer extends ServerBase {
    constructor(features: ServerFeatures) {
        super(features)
    }

    static create(features: ServerFeatures): () => void {
        features.logging.log('Creating identity server.')
        return new IdentityServer(features)[Symbol.dispose]
    }

    protected override initialize(
        params: InitializeParams
    ): HandlerResult<PartialInitializeResult<any>, InitializeError> {
        // Callbacks for server->client JSON-RPC calls
        const showUrl: ShowUrl = (url: URL) =>
            this.features.lsp.window.showDocument({ uri: url.toString(), external: true })

        // Initialize dependencies
        const profileStore = new SharedConfigProfileStore(this.observability)

        const ssoCache = new RefreshingSsoCache(
            new FileSystemSsoCache(this.observability),
            this.features.identityManagement.sendSsoTokenChanged,
            this.observability
        )

        const autoRefresher = new SsoTokenAutoRefresher(ssoCache, this.observability)

        const identityService = new IdentityService(
            profileStore,
            ssoCache,
            autoRefresher,
            showUrl,
            this.getClientName(params),
            this.observability
        )

        const profileService = new ProfileService(profileStore, this.observability)

        // JSON-RPC request/notification handlers (client->server)
        this.features.identityManagement.onGetSsoToken(
            async (params: GetSsoTokenParams, token: CancellationToken) =>
                await identityService.getSsoToken(params, token).catch(reason => {
                    this.observability.logging.log(`GetSsoToken failed. ${reason}`)
                    throw awsResponseErrorWrap(reason)
                })
        )

        this.features.identityManagement.onInvalidateSsoToken(
            async (params: InvalidateSsoTokenParams, token: CancellationToken) =>
                await identityService.invalidateSsoToken(params, token).catch(reason => {
                    this.observability.logging.log(`InvalidateSsoToken failed. ${reason}`)
                    throw awsResponseErrorWrap(reason)
                })
        )

        this.features.identityManagement.onListProfiles(
            async (params: ListProfilesParams, token: CancellationToken) =>
                await profileService.listProfiles(params, token).catch(reason => {
                    this.observability.logging.log(`ListProfiles failed. ${reason}`)
                    throw awsResponseErrorWrap(reason)
                })
        )

        this.features.identityManagement.onUpdateProfile(
            async (params: UpdateProfileParams, token: CancellationToken) =>
                await profileService.updateProfile(params, token).catch(reason => {
                    this.observability.logging.log(`UpdateProfile failed. ${reason}`)
                    throw awsResponseErrorWrap(reason)
                })
        )

        this.disposables.push(autoRefresher)

        return { capabilities: {} }
    }

    private getClientName(params: InitializeParams): string {
        return (
            params.initializationOptions?.aws?.clientInfo?.extension?.name ??
            params.clientInfo?.name ??
            'AWS Development Tools'
        )
    }
}

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
