import { CancellationToken, SsoSession } from '@aws/language-server-runtimes/server-interface'
import { SSOToken } from '@smithy/shared-ini-file-loader'
import {
    getSsoOidc,
    throwOnInvalidClientRegistration,
    throwOnInvalidSsoSession,
    UpdateSsoTokenFromCreateToken,
} from '../utils'
import { SsoClientRegistration } from '../cache'
import { createHash, randomBytes } from 'crypto'
import { normalizeSettingList } from '../../language-server/profiles/profileService'
import { AuthorizationServer } from './authorizationServer'
import { Observability } from '@aws/lsp-core'

export type ShowUrl = (url: URL) => void

export async function authorizationCodePkceFlow(
    clientName: string,
    clientRegistration: SsoClientRegistration,
    ssoSession: SsoSession,
    showUrl: ShowUrl,
    token: CancellationToken,
    observability: Observability
): Promise<SSOToken> {
    throwOnInvalidClientRegistration(clientRegistration)
    throwOnInvalidSsoSession(ssoSession)

    const codeVerifier = randomBytes(32).toString('base64url')
    const codeChallenge = createHash('sha256').update(codeVerifier).digest().toString('base64url')

    using authServer = await AuthorizationServer.start(clientName, observability, undefined, token)

    // Create OIDC API Authorize URL and call showDocument back to destination
    const authorizeUrl = new URL(`https://oidc.${ssoSession.settings.sso_region}.amazonaws.com/authorize`)
    authorizeUrl.search = new URLSearchParams({
        response_type: 'code',
        client_id: clientRegistration.clientId,
        scopes: formatScopes(ssoSession),
        redirect_uri: authServer.redirectUri,
        state: authServer.csrfState,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    }).toString()

    // Wait for user in browser flow
    observability.logging.log(`Requesting ${clientName} to open SSO OIDC authorization login website.`)
    showUrl(authorizeUrl)

    observability.logging.log('Waiting for authorization code...')
    const authorizationCode = await authServer.authorizationCode()
    observability.logging.log('Authorization code returned.')

    // If success, call CreateToken
    using oidc = getSsoOidc(ssoSession.settings.sso_region)

    observability.logging.log('Calling SSO OIDC to create SSO token.')
    const result = await oidc.createToken({
        clientId: clientRegistration.clientId,
        clientSecret: clientRegistration.clientSecret,
        grantType: 'authorization_code',
        redirectUri: authServer.redirectUri,
        codeVerifier,
        code: authorizationCode,
    })

    observability.logging.log('Storing and returning created SSO token.')
    return UpdateSsoTokenFromCreateToken(result, clientRegistration, ssoSession)
}

function formatScopes(ssoSession: SsoSession): string {
    return normalizeSettingList(ssoSession?.settings?.sso_registration_scopes)?.join(',') ?? ''
}
