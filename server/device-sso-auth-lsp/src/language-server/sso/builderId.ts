import {
    AuthorizationPendingException,
    CreateTokenRequest,
    RegisterClientRequest,
    SSOOIDC,
    SlowDownException,
    StartDeviceAuthorizationRequest,
} from '@aws-sdk/client-sso-oidc'
import { randomUUID } from 'crypto'
import { RequiredProps, assertHasProps, hasProps, hasStringProps, selectFrom } from '../tsUtils'
import { SsoProfile as BaseSsoProfile, ClientRegistration, SsoToken, isExpired } from './model'

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export const DEFAULT_TOKEN_CACHE_DIR = path.join(os.homedir(), '.aws/sso/cache')

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

export const builderIdStartUrl = 'https://view.awsapps.com/start'
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
    async function poll() {
        while (authorization.expiresAt.getTime() - Date.now() > interval) {
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

    return await poll()
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
    private readonly TOKEN_CACHE_FILE
    private readonly REGISTRATION_CACHE_FILE

    public constructor(
        private readonly profile: Pick<SsoProfile, 'startUrl' | 'region' | 'scopes' | 'identifier'>,
        private readonly uiHandler: UiHandler | undefined = undefined,
        private readonly tokenCacheDir: string = DEFAULT_TOKEN_CACHE_DIR,
        private readonly oidc = OidcClient.create(profile.region)
    ) {
        this.TOKEN_CACHE_FILE = path.join(this.tokenCacheDir, 'device-sso-lsp-token.json')
        this.REGISTRATION_CACHE_FILE = path.join(this.tokenCacheDir, 'device-sso-lsp-registration.json')
    }

    public async invalidate(): Promise<void> {
        await fs.promises.unlink(this.TOKEN_CACHE_FILE)
        await fs.promises.unlink(this.REGISTRATION_CACHE_FILE)
    }

    public async getToken(): Promise<SsoToken | undefined> {
        const data = await this.loadCachedToken()

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

    private async loadCachedToken(): Promise<SsoAccess | undefined> {
        try {
            const tokenData = await fs.promises.readFile(this.TOKEN_CACHE_FILE, 'utf8')

            const parsedToken = JSON.parse(tokenData)
            parsedToken.token.expiresAt = new Date(parsedToken.token.expiresAt)
            parsedToken.registration.expiresAt = new Date(parsedToken.registration.expiresAt)

            return parsedToken
        } catch (err) {
            // Todo: handle errors
        }
    }

    private async loadCachedRegistrationData(): Promise<ClientRegistration | undefined> {
        try {
            const registrationData = await fs.promises.readFile(this.REGISTRATION_CACHE_FILE, 'utf8')

            const parsedData = JSON.parse(registrationData)
            parsedData.token.expiresAt = new Date(parsedData.expiresAt)

            return JSON.parse(registrationData)
        } catch (err) {
            // Todo: handle errors
        }
    }

    private async saveCachedToken(data: SsoAccess): Promise<void> {
        await fs.promises.mkdir(this.tokenCacheDir, { recursive: true })
        await fs.promises.writeFile(this.TOKEN_CACHE_FILE, JSON.stringify(data))
    }

    private async saveRegistrationData(data: ClientRegistration): Promise<void> {
        await fs.promises.mkdir(this.tokenCacheDir, { recursive: true })
        await fs.promises.writeFile(this.REGISTRATION_CACHE_FILE, JSON.stringify(data))
    }

    public async createToken(): Promise<SsoToken> {
        const access = await this.runFlow()
        const identity = this.tokenCacheKey
        await this.saveCachedToken(access)

        return { ...access.token, identity }
    }

    private async runFlow() {
        let cachedRegistration = await this.loadCachedRegistrationData()
        if (cachedRegistration === undefined) {
            cachedRegistration = await this.registerClient()
            await this.saveRegistrationData(cachedRegistration)
        }

        return await this.authorize(cachedRegistration)
    }

    private async refreshToken(token: RequiredProps<SsoToken, 'refreshToken'>, registration: ClientRegistration) {
        try {
            const clientInfo = selectFrom(registration, 'clientId', 'clientSecret')
            const response = await this.oidc.createToken({ ...clientInfo, ...token, grantType: refreshGrantType })
            const refreshed = this.formatToken(response as SsoToken, registration)
            await this.saveCachedToken(refreshed)

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

        if (!this.uiHandler) {
            throw new Error('UI handler is not provided')
        }

        if (!(await this.uiHandler?.openSsoPortalLink(this.profile.startUrl, authorization))) {
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
            clientName: 'AWS SSO Language Server',
            clientType: clientRegistrationType,
            scopes: this.profile.scopes,
        })
    }

    public static create(profile: Pick<SsoProfile, 'startUrl' | 'region' | 'scopes' | 'identifier'>) {
        return new this(profile)
    }
}

interface UiHandler {
    openSsoPortalLink(
        startUrl: string,
        authorization: { readonly verificationUri: string; readonly userCode: string }
    ): Promise<boolean>
}

export class BuilderIdConnectionBuilder {
    private static readonly getToken = keyedDebounce(BuilderIdConnectionBuilder._getToken.bind(this))
    public static uiHandler: UiHandler
    private static tokenCacheDir: string

    public static async build(
        uiHandler: UiHandler,
        startUrl: string = builderIdStartUrl,
        tokenCacheDir: string = DEFAULT_TOKEN_CACHE_DIR
    ): Promise<SsoConnection> {
        BuilderIdConnectionBuilder.uiHandler = uiHandler
        BuilderIdConnectionBuilder.tokenCacheDir = tokenCacheDir

        const awsBuilderIdSsoProfile = BuilderIdConnectionBuilder.createBuilderIdProfile(defaultScopes, startUrl)
        const connection = await BuilderIdConnectionBuilder.createConnection(awsBuilderIdSsoProfile)
        return connection
    }

    private static createBuilderIdProfile(scopes = [...ssoAccountAccessScopes], startUrl: string): SsoProfile {
        return {
            scopes,
            region: 'foo',
            ssoRegion: defaultSsoRegion,
            startUrl,
        }
    }

    private static async createConnection(profile: SsoProfile): Promise<SsoConnection> {
        const id = randomUUID()
        const tokenProvider = BuilderIdConnectionBuilder.getTokenProvider(id, {
            ...profile,
        })

        ;(await tokenProvider.getToken()) ?? (await tokenProvider.createToken())

        return BuilderIdConnectionBuilder.getSsoConnection(id, profile, tokenProvider)
    }

    private static getTokenProvider(id: string, profile: SsoProfile): SsoAccessTokenProvider {
        const provider = new SsoAccessTokenProvider(
            {
                identifier: id,
                startUrl: profile.startUrl,
                scopes: profile.scopes,
                region: profile.ssoRegion,
            },
            BuilderIdConnectionBuilder.uiHandler,
            BuilderIdConnectionBuilder.tokenCacheDir
        )

        return provider
    }

    private static getSsoConnection(id: string, profile: SsoProfile, provider: SsoAccessTokenProvider): SsoConnection {
        return {
            id,
            ...profile,
            getToken: () => BuilderIdConnectionBuilder.getToken(id, provider),
        }
    }

    private static async _getToken(id: string, provider: SsoAccessTokenProvider): Promise<SsoToken> {
        const token = await provider.getToken()
        return token ?? provider.createToken()
    }
}
