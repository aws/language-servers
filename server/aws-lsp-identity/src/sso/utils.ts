import {
    AwsErrorCodes,
    CancellationToken,
    MessageActionItem,
    ShowMessageRequestParams,
    SsoSession,
    Lsp,
} from '@aws/language-server-runtimes/server-interface'
import { CreateTokenCommandOutput, SSOOIDC, SSOOIDCClientConfig } from '@aws-sdk/client-sso-oidc'
import { SsoClientRegistration } from './cache'
import { SSOToken } from '@smithy/shared-ini-file-loader'
import { readFileSync } from 'fs'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { AwsError, Observability } from '@aws/lsp-core'

const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy
const certs = process.env.AWS_CA_BUNDLE ? readFileSync(process.env.AWS_CA_BUNDLE) : undefined

export function getSsoOidc(ssoRegion: string): SSOOIDC & Disposable {
    const config: SSOOIDCClientConfig = { region: ssoRegion }
    if (proxyUrl) {
        // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-configuring-proxies.html
        const agent = new HttpsProxyAgent(proxyUrl, { ca: certs })
        // If and when this server is ever used in a browser, need FetchHttpHandler instead, which means
        // client proxy initialization should be handled generically for all servers in language-server-runtimes
        // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/migrate-client-constructors.html
        config.requestHandler = new NodeHttpHandler({ httpAgent: agent, httpsAgent: agent })
    }

    const oidc = new SSOOIDC(config)

    return (
        Object.hasOwn(oidc, Symbol.dispose) ? oidc : Object.assign(oidc, { [Symbol.dispose]: () => oidc.destroy() })
    ) as SSOOIDC & Disposable
}

export function throwOnInvalidClientName(clientName?: string): asserts clientName is string {
    if (!clientName?.trim().length) {
        throw new AwsError(`Client name [${clientName}] is invalid.`, AwsErrorCodes.E_INVALID_SSO_CLIENT)
    }
}

export function throwOnInvalidClientRegistration(
    clientRegistration?: SsoClientRegistration
): asserts clientRegistration is SsoClientRegistration & { clientId: string; clientSecret: string; expiresAt: string } {
    if (
        !clientRegistration ||
        !clientRegistration.clientId?.trim() ||
        !clientRegistration.clientSecret?.trim() ||
        !clientRegistration.expiresAt?.trim() ||
        !clientRegistration.scopes ||
        !clientRegistration.scopes.length
    ) {
        throw new AwsError('Client registration is invalid.', AwsErrorCodes.E_INVALID_SSO_CLIENT)
    }
}

export function throwOnInvalidSsoSessionName(ssoSessionName?: string): asserts ssoSessionName is string {
    if (!ssoSessionName?.trim()) {
        throw new AwsError('SSO session name is invalid.', AwsErrorCodes.E_INVALID_SSO_SESSION)
    }
}

export function throwOnInvalidSsoSession(
    ssoSession?: SsoSession
): asserts ssoSession is SsoSession & { name: string; settings: { sso_region: string; sso_start_url: string } } {
    if (
        !ssoSession ||
        throwOnInvalidClientName(ssoSession.name) ||
        !ssoSession.settings ||
        !ssoSession.settings.sso_region?.trim() ||
        !ssoSession.settings.sso_start_url?.trim() ||
        !ssoSession.settings.sso_registration_scopes?.length
    ) {
        throw new AwsError('SSO session is invalid.', AwsErrorCodes.E_INVALID_SSO_SESSION)
    }
}

export function UpdateSsoTokenFromCreateToken(
    output: CreateTokenCommandOutput,
    clientRegistration: SsoClientRegistration,
    ssoSession: SsoSession,
    ssoToken?: SSOToken
): SSOToken {
    throwOnInvalidClientRegistration(clientRegistration)
    throwOnInvalidSsoSession(ssoSession)

    if (!output.accessToken || !output.expiresIn) {
        throw new AwsError('CreateToken returned invalid result.', AwsErrorCodes.E_CANNOT_CREATE_SSO_TOKEN)
    }

    if (!ssoToken) {
        ssoToken = {} as unknown as SSOToken
    }

    // Update SSO token with latest client registration and refreshed SSO token
    // https://docs.aws.amazon.com/singlesignon/latest/OIDCAPIReference/API_CreateToken.html#API_CreateToken_ResponseElements
    ssoToken.accessToken = output.accessToken
    ssoToken.clientId = clientRegistration.clientId
    ssoToken.clientSecret = clientRegistration.clientSecret
    ssoToken.expiresAt = new Date(Date.now() + output.expiresIn * 1000).toISOString()
    ssoToken.refreshToken = output.refreshToken
    ssoToken.region = ssoSession.settings.sso_region
    ssoToken.registrationExpiresAt = clientRegistration.expiresAt
    ssoToken.startUrl = ssoSession.settings.sso_start_url

    return ssoToken
}

export type ShowUrl = (url: URL) => void
export type ShowMessageRequest = (params: ShowMessageRequestParams) => Promise<MessageActionItem | null>
export type ShowProgress = Lsp['sendProgress']

export type SsoFlowParams = {
    clientName: string
    clientRegistration: SsoClientRegistration
    ssoSession: SsoSession
    handlers: {
        showUrl: ShowUrl
        showMessageRequest: ShowMessageRequest
        showProgress: ShowProgress
        // Add `showMsg: ShowMessage` if needed.
    }
    token: CancellationToken
    observability: Observability
}
