import { SSOToken } from '@smithy/shared-ini-file-loader'
import { DuckTyper } from '../../duckTyper'
import { SsoSession } from '@aws/language-server-runtimes/protocol'

// https://docs.aws.amazon.com/singlesignon/latest/OIDCAPIReference/API_RegisterClient.html
export interface SsoClientRegistration {
    // The returned ClientId from the RegisterClient call.
    clientId: string

    // The returned ClientSecret from the RegisterClient call.
    clientSecret: string

    // Indicates the time at which the clientId and clientSecret were issued.
    issuedAt?: string

    // The expiration time of the registration as an RFC 3339 formatted timestamp.
    expiresAt: string

    // If provided when generating the registration, the list of scopes should be cached alongside the token.
    scopes?: string[]
}

export interface SsoCache {
    getSsoClientRegistration(clientName: string, ssoSession: SsoSession): Promise<SsoClientRegistration | undefined>

    setSsoClientRegistration(
        clientName: string,
        ssoSession: SsoSession,
        clientRegistration: SsoClientRegistration
    ): Promise<void>

    removeSsoToken(ssoSessionName: string): Promise<void>

    getSsoToken(clientName: string, ssoSession: SsoSession): Promise<SSOToken | undefined>

    setSsoToken(clientName: string, ssoSession: SsoSession, ssoToken: SSOToken): Promise<void>
}

export const ssoClientRegistrationDuckTyper = new DuckTyper()
    .requireProperty('clientId')
    .requireProperty('clientSecret')
    .optionalProperty('issuedAt')
    .requireProperty('expiresAt')
    .optionalProperty('scopes')
    .optionalProperty('authorizationEndpoint')
    .optionalProperty('tokenEndpoint')

export const ssoTokenDuckTyper = new DuckTyper()
    .requireProperty('accessToken')
    .requireProperty('expiresAt')
    .optionalProperty('refreshToken')
    .optionalProperty('clientId')
    .optionalProperty('clientSecret')
    .optionalProperty('registrationExpiresAt')
    .optionalProperty('region')
    .optionalProperty('startUrl')
