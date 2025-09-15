import { SsoSession } from '@aws/language-server-runtimes/server-interface'
import { SSOToken } from '@smithy/shared-ini-file-loader'
import {
    SsoFlowParams,
    getSsoOidc,
    throwOnInvalidClientRegistration,
    throwOnInvalidSsoSession,
    UpdateSsoTokenFromCreateToken,
} from '../utils'
import { createHash, randomBytes } from 'crypto'
import { normalizeSettingList } from '../../language-server/profiles/profileService'
import { AuthorizationServer } from './authorizationServer'

export async function authorizationCodePkceFlow(params: SsoFlowParams): Promise<SSOToken> {
    throwOnInvalidClientRegistration(params.clientRegistration)
    throwOnInvalidSsoSession(params.ssoSession)

    const codeVerifier = randomBytes(32).toString('base64url')
    const codeChallenge = createHash('sha256').update(codeVerifier).digest().toString('base64url')

    using authServer = await AuthorizationServer.start(params.clientName, params.observability, undefined, params.token)

    // Create OIDC API Authorize URL and call showDocument back to destination
    const authorizeUrl = new URL(`https://oidc.${params.ssoSession.settings.sso_region}.amazonaws.com/authorize`)
    authorizeUrl.search = new URLSearchParams({
        response_type: 'code',
        client_id: params.clientRegistration.clientId,
        scopes: formatScopes(params.ssoSession),
        redirect_uri: authServer.redirectUri,
        state: authServer.csrfState,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    }).toString()

    // Wait for user in browser flow
    params.observability.logging.log(`Requesting ${params.clientName} to open SSO OIDC authorization login website.`)
    params.handlers.showUrl(authorizeUrl)

    params.observability.logging.log('Waiting for authorization code...')
    const authorizationCode = await authServer.authorizationCode()
    params.observability.logging.log('Authorization code returned.')

    // If success, call CreateToken
    using oidc = getSsoOidc(params.ssoSession.settings.sso_region)

    params.observability.logging.log('Calling SSO OIDC to create SSO token.')
    const result = await oidc.createToken({
        clientId: params.clientRegistration.clientId,
        clientSecret: params.clientRegistration.clientSecret,
        grantType: 'authorization_code',
        redirectUri: authServer.redirectUri,
        codeVerifier,
        code: authorizationCode,
    })

    params.observability.logging.log('Storing and returning created SSO token.')
    return UpdateSsoTokenFromCreateToken(result, params.clientRegistration, params.ssoSession)
}

function formatScopes(ssoSession: SsoSession): string {
    return normalizeSettingList(ssoSession?.settings?.sso_registration_scopes)?.join(',') ?? ''
}
