import {
    AuthorizationPendingException,
    CreateTokenRequest,
    RegisterClientRequest,
    SSOOIDC,
    SlowDownException,
    StartDeviceAuthorizationRequest,
} from '@aws-sdk/client-sso-oidc'
import { randomUUID } from 'crypto'
import { CancellationToken, ProgressLocation, window } from 'vscode'
import { RequiredProps, assertHasProps, hasProps, hasStringProps, selectFrom } from '../tsUtils'
import {
    SsoProfile as BaseSsoProfile,
    ClientRegistration,
    LoginType,
    SsoToken,
    builderIdStartUrl,
    idcStartUrl,
    isExpired,
    openSsoPortalLink,
} from './model'

// For the Proof of concept, this file's code was copied (and culled) from the AWS Toolkit for VS Code repo
// https://github.com/aws/aws-toolkit-vscode/blob/5d621c8405a8b20ffe571ad0ba10ae700178e051/src/auth/auth.ts
// https://github.com/aws/aws-toolkit-vscode/blob/5d621c8405a8b20ffe571ad0ba10ae700178e051/src/auth/connection.ts
// https://github.com/aws/aws-toolkit-vscode/blob/5d621c8405a8b20ffe571ad0ba10ae700178e051/src/auth/sso/cache.ts
// https://github.com/aws/aws-toolkit-vscode/blob/5d621c8405a8b20ffe571ad0ba10ae700178e051/src/auth/sso/clients.ts
// https://github.com/aws/aws-toolkit-vscode/blob/5d621c8405a8b20ffe571ad0ba10ae700178e051/src/auth/sso/ssoAccessTokenProvider.ts

export interface SsoAccess {
    readonly token: SsoToken
    readonly region: string
    readonly startUrl: string
    readonly registration?: ClientRegistration
}

export const ssoAccountAccessScopes = ['sso:account:access']
export const codewhispererScopes = [
    'codewhisperer:completions',
    'codewhisperer:analysis',
    'codewhisperer:conversations',
]
export const defaultSsoRegion = 'us-east-1'
const defaultScopes = [...ssoAccountAccessScopes, ...codewhispererScopes]
const clientRegistrationType = 'public'
const deviceGrantType = 'urn:ietf:params:oauth:grant-type:device_code'
const refreshGrantType = 'refresh_token'

export function sleep(duration: number = 0): Promise<void> {
    return new Promise(r => setTimeout(r, Math.max(duration, 0)))
}

function keyedDebounce<T, U extends any[], K extends string = string>(
    fn: (key: K, ...args: U) => Promise<T>
): typeof fn {
    const pending = new Map<K, Promise<T>>()

    return (key, ...args) => {
        if (pending.has(key)) {
            return pending.get(key)!
        }

        const promise = fn(key, ...args).finally(() => pending.delete(key))
        pending.set(key, promise)

        return promise
    }
}

const backoffDelayMs = 5000
async function pollForTokenWithProgress<T>(
    fn: () => Promise<T>,
    authorization: Awaited<ReturnType<OidcClient['startDeviceAuthorization']>>,
    interval = authorization.interval ?? backoffDelayMs
) {
    async function poll(token: CancellationToken) {
        while (authorization.expiresAt.getTime() - Date.now() > interval && !token.isCancellationRequested) {
            try {
                return await fn()
            } catch (err) {
                if (!hasStringProps(err, 'name')) {
                    throw err
                }

                if (err instanceof SlowDownException) {
                    interval += backoffDelayMs
                } else if (!(err instanceof AuthorizationPendingException)) {
                    throw err
                }
            }

            await sleep(interval)
        }

        throw new Error('Timed-out waiting for browser login flow to complete')
    }

    return window.withProgress(
        {
            title: `Login page opened in browser. When prompted, provide this code: ${authorization.userCode}`,
            cancellable: true,
            location: ProgressLocation.Notification,
        },
        (_, token) =>
            Promise.race([
                poll(token),
                new Promise<never>((_, reject) =>
                    token.onCancellationRequested(() => reject(new Error('user cancelled')))
                ),
            ])
    )
}

export interface SsoProfile extends BaseSsoProfile {
    readonly ssoRegion: string
}

export interface SsoConnection extends SsoProfile {
    readonly id: string

    /**
     * Retrieves a bearer token, refreshing or re-authenticating as-needed.
     *
     * This should be called for each new API request sent. It is up to the caller to
     * handle cases where the service rejects the token.
     */
    getToken(): Promise<Pick<SsoToken, 'accessToken' | 'expiresAt'>>
}

export class OidcClient {
    public constructor(
        private readonly client: SSOOIDC,
        private readonly clock: { Date: typeof Date }
    ) {}

    public async registerClient(request: RegisterClientRequest) {
        const response = await this.client.registerClient(request)
        assertHasProps(response, 'clientId', 'clientSecret', 'clientSecretExpiresAt')

        return {
            scopes: request.scopes,
            clientId: response.clientId,
            clientSecret: response.clientSecret,
            expiresAt: new this.clock.Date(response.clientSecretExpiresAt * 1000),
        }
    }

    public async startDeviceAuthorization(request: StartDeviceAuthorizationRequest) {
        const response = await this.client.startDeviceAuthorization(request)
        assertHasProps(response, 'expiresIn', 'deviceCode', 'userCode', 'verificationUri')

        return {
            deviceCode: response.deviceCode,
            userCode: response.userCode,
            verificationUri: response.verificationUri,
            expiresAt: new this.clock.Date(response.expiresIn * 1000 + this.clock.Date.now()),
            interval: response.interval ? response.interval * 1000 : undefined,
        }
    }

    public async createToken(request: CreateTokenRequest) {
        const response = await this.client.createToken(request as CreateTokenRequest)
        assertHasProps(response, 'accessToken', 'expiresIn')

        return {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            tokenType: response.tokenType,
            expiresAt: new this.clock.Date(response.expiresIn * 1000 + this.clock.Date.now()),
        }
    }

    public static create(region: string) {
        const client = new SSOOIDC({
            region,
            // TODO : I don't know if we have to set endpoint for the PoC
            // endpoint: foo
        })

        return new this(client, { Date })
    }
}

/**
 *  SSO flow (RFC: https://tools.ietf.org/html/rfc8628)
 *    1. Get a client id (SSO-OIDC identifier, formatted per RFC6749).
 *       - Toolkit code: {@link SsoAccessTokenProvider.registerClient}
 *          - Calls {@link OidcClient.registerClient}
 *       - RETURNS:
 *         - ClientSecret
 *         - ClientId
 *         - ClientSecretExpiresAt
 *       - Client registration is valid for potentially months and creates state
 *         server-side, so the client SHOULD cache them to disk.
 *    2. Start device authorization.
 *       - Toolkit code: {@link SsoAccessTokenProvider.authorize}
 *          - Calls {@link OidcClient.startDeviceAuthorization}
 *       - RETURNS (RFC: https://tools.ietf.org/html/rfc8628#section-3.2):
 *         - DeviceCode             : Device verification code
 *         - UserCode               : User verification code
 *         - VerificationUri        : User verification URI on the authorization server
 *         - VerificationUriComplete: User verification URI including the `user_code`
 *         - ExpiresIn              : Lifetime (seconds) of `device_code` and `user_code`
 *         - Interval               : Minimum time (seconds) the client SHOULD wait between polling intervals.
 *    3. Poll for the access token.
 *       - Toolkit code: {@link SsoAccessTokenProvider.authorize}
 *          - Calls {@link OidcClient.pollForToken}
 *       - RETURNS:
 *         - AccessToken
 *         - ExpiresIn
 *         - RefreshToken (optional)
 *    4. (Repeat) Tokens SHOULD be refreshed if expired and a refresh token is available.
 *        - Toolkit code: {@link SsoAccessTokenProvider.refreshToken}
 *          - Calls {@link OidcClient.createToken}
 *        - RETURNS:
 *         - AccessToken
 *         - ExpiresIn
 *         - RefreshToken (optional)
 */
export class SsoAccessTokenProvider {
    private cachedToken: SsoAccess | undefined
    private cachedRegistration: ClientRegistration | undefined

    public constructor(
        private readonly profile: Pick<SsoProfile, 'startUrl' | 'region' | 'scopes' | 'identifier'>,
        private readonly oidc = OidcClient.create(profile.region)
    ) {}

    public async invalidate(): Promise<void> {
        this.cachedToken = undefined
        this.cachedRegistration = undefined
    }

    public async getToken(): Promise<SsoToken | undefined> {
        const data = this.cachedToken

        if (!data || !isExpired(data.token)) {
            return data?.token
        }

        if (data.registration && !isExpired(data.registration) && hasProps(data.token, 'refreshToken')) {
            const refreshed = await this.refreshToken(data.token, data.registration)

            return refreshed.token
        } else {
            await this.invalidate()
        }
    }

    public async createToken(): Promise<SsoToken> {
        const access = await this.runFlow()
        const identity = this.tokenCacheKey
        this.cachedToken = access

        return { ...access.token, identity }
    }

    private async runFlow() {
        if (this.cachedRegistration === undefined) {
            this.cachedRegistration = await this.registerClient()
        }

        return await this.authorize(this.cachedRegistration)
    }

    private async refreshToken(token: RequiredProps<SsoToken, 'refreshToken'>, registration: ClientRegistration) {
        try {
            const clientInfo = selectFrom(registration, 'clientId', 'clientSecret')
            const response = await this.oidc.createToken({ ...clientInfo, ...token, grantType: refreshGrantType })
            const refreshed = this.formatToken(response as SsoToken, registration)
            this.cachedToken = refreshed

            return refreshed
        } catch (err) {
            throw err
        }
    }

    private formatToken(token: SsoToken, registration: ClientRegistration) {
        return { token, registration, region: this.profile.region, startUrl: this.profile.startUrl }
    }

    protected get tokenCacheKey() {
        return this.profile.identifier ?? this.profile.startUrl
    }

    private async authorize(registration: ClientRegistration) {
        const authorization = await this.oidc.startDeviceAuthorization({
            startUrl: this.profile.startUrl,
            clientId: registration.clientId,
            clientSecret: registration.clientSecret,
        })

        if (!(await openSsoPortalLink(this.profile.startUrl, authorization))) {
            throw new Error('user cancelled')
        }

        const tokenRequest = {
            clientId: registration.clientId,
            clientSecret: registration.clientSecret,
            deviceCode: authorization.deviceCode,
            grantType: deviceGrantType,
        }

        const token = await pollForTokenWithProgress(() => this.oidc.createToken(tokenRequest), authorization)
        return this.formatToken(token, registration)
    }

    private async registerClient(): Promise<ClientRegistration> {
        return this.oidc.registerClient({
            clientName: 'Sample VS Code Extension',
            clientType: clientRegistrationType,
            scopes: this.profile.scopes,
        })
    }

    public static create(profile: Pick<SsoProfile, 'startUrl' | 'region' | 'scopes' | 'identifier'>) {
        return new this(profile)
    }
}

/**
 * SSO connection builder for Builder ID & Identity Center
 */
export class SSOConnectionBuilder {
    private static readonly getToken = keyedDebounce(SSOConnectionBuilder._getToken.bind(this))

    public static async build(loginType: LoginType = 'builderId'): Promise<SsoConnection> {
        const ssoProfile = {
            scopes: defaultScopes,
            region: 'foo',
            ssoRegion: defaultSsoRegion,
            startUrl: loginType === 'builderId' ? builderIdStartUrl : idcStartUrl,
            loginType: loginType,
        }
        const connection = await SSOConnectionBuilder.createConnection(ssoProfile)
        return connection
    }

    private static async createConnection(profile: SsoProfile): Promise<SsoConnection> {
        const id = randomUUID()
        const tokenProvider = SSOConnectionBuilder.getTokenProvider(id, {
            ...profile,
        })

        ;(await tokenProvider.getToken()) ?? (await tokenProvider.createToken())

        return SSOConnectionBuilder.getSsoConnection(id, profile, tokenProvider)
    }

    private static getTokenProvider(id: string, profile: SsoProfile): SsoAccessTokenProvider {
        const provider = new SsoAccessTokenProvider({
            identifier: id,
            startUrl: profile.startUrl,
            scopes: profile.scopes,
            region: profile.ssoRegion,
        })

        return provider
    }

    private static getSsoConnection(id: string, profile: SsoProfile, provider: SsoAccessTokenProvider): SsoConnection {
        return {
            id,
            ...profile,
            getToken: () => SSOConnectionBuilder.getToken(id, provider),
        }
    }

    private static async _getToken(id: string, provider: SsoAccessTokenProvider): Promise<SsoToken> {
        const token = await provider.getToken()
        return token ?? provider.createToken()
    }
}
