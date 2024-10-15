import { SSOToken } from '@smithy/shared-ini-file-loader'
import { DuckTyper } from '../../duckTyper'

// https://docs.aws.amazon.com/singlesignon/latest/OIDCAPIReference/API_RegisterClient.html
export interface SsoClientRegistration {
    // The returned ClientId from the RegisterClient call.
    clientId: string

    // The returned ClientSecret from the RegisterClient call.
    clientSecret: string

    // The expiration time of the registration as an RFC 3339 formatted timestamp.
    expiresAt: string

    // If provided when generating the registration, the list of scopes should be cached alongside the token.
    scopes?: string[]
}

export interface SsoCache {
    getSsoClientRegistration(
        clientName: string,
        ssoRegion: string,
        ssoStartUrl: string
    ): Promise<SsoClientRegistration | undefined>

    setSsoClientRegistration(
        clientName: string,
        ssoRegion: string,
        ssoStartUrl: string,
        clientRegistration: SsoClientRegistration
    ): Promise<void>

    getSsoToken(ssoSessionName: string): Promise<SSOToken | undefined>

    setSsoToken(ssoSessionName: string, ssoToken: SSOToken): Promise<void>
}

export const ssoClientRegistrationDuckTyper = new DuckTyper()
    .requireProperty('clientId')
    .requireProperty('clientSecret')
    .requireProperty('expiresAt')
    .optionalProperty('scopes')

export const ssoTokenDuckTyper = new DuckTyper()
    .requireProperty('accessToken')
    .requireProperty('expiresAt')
    .optionalProperty('refreshToken')
    .optionalProperty('clientId')
    .optionalProperty('clientSecret')
    .optionalProperty('registrationExpiresAt')
    .optionalProperty('region')
    .optionalProperty('startUrl')
