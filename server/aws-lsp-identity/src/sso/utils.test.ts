import { expect, use } from 'chai'
import {
    throwOnInvalidClientName,
    throwOnInvalidClientRegistration,
    throwOnInvalidSsoSession,
    UpdateSsoTokenFromCreateToken,
} from './utils'
import { SsoClientRegistration } from './cache'
import { SsoSession } from '@aws/language-server-runtimes/protocol'
import { CreateTokenCommandOutput } from '@aws-sdk/client-sso-oidc'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

const clientRegistration = {
    clientId: 'my-client-id',
    clientSecret: 'my-client-secret',
    expiresAt: new Date().toISOString(),
    issuedAt: new Date().toISOString(),
    scopes: ['sso:account:access'],
}

const ssoSession = {
    name: 'my-sso-session',
    settings: {
        sso_region: 'us-east-1',
        sso_registration_scopes: ['sso:account:access'],
        sso_start_url: 'https://nowhere',
    },
}

describe('utils', () => {
    describe('throwOnInvalidClientName', () => {
        it('Does nothing on valid client names.', () => {
            throwOnInvalidClientName('Valid client name')
        })

        for (const clientName of [undefined, null, '', '  ', ' \n ']) {
            it(`Throws on invalid client name [${clientName}].`, () => {
                expect(() => throwOnInvalidClientName(clientName!)).to.throw()
            })
        }
    })

    describe('throwOnInvalidClientRegistration', () => {
        it('Does nothing on valid client registrations.', () => {
            throwOnInvalidClientRegistration(clientRegistration)
        })

        for (const clientRegistration of [
            null as unknown as SsoClientRegistration,
            {
                clientId: null,
                clientSecret: 'my-client-secret',
                expiresAt: new Date().toISOString(),
                issuedAt: new Date().toISOString(),
                scopes: ['sso:account:access'],
            },
            {
                clientId: 'my-client-id',
                clientSecret: null,
                expiresAt: new Date().toISOString(),
                issuedAt: new Date().toISOString(),
                scopes: ['sso:account:access'],
            },
            {
                clientId: 'my-client-id',
                clientSecret: 'my-client-secret',
                expiresAt: null,
                issuedAt: new Date().toISOString(),
                scopes: ['sso:account:access'],
            },
            {
                clientId: 'my-client-id',
                clientSecret: 'my-client-secret',
                expiresAt: new Date().toISOString(),
                issuedAt: new Date().toISOString(),
                scopes: null,
            },
        ] as SsoClientRegistration[]) {
            it(`Throws on invalid client registrations [${JSON.stringify(clientRegistration)}].`, () => {
                expect(() => throwOnInvalidClientRegistration(clientRegistration)).to.throw()
            })
        }
    })

    describe('throwOnInvalidSsoSession', () => {
        it('Does nothing on valid SSO sessions.', () => {
            throwOnInvalidSsoSession(ssoSession)
        })

        for (const ssoSession of [
            null,
            {
                name: undefined,
                settings: {
                    sso_region: 'us-east-1',
                    sso_registration_scopes: ['sso:account:access'],
                    sso_start_url: 'https://nowhere',
                },
            },
            {
                name: 'my-sso-session',
                settings: undefined,
            },
            {
                name: 'my-sso-session',
                settings: {
                    sso_region: undefined,
                    sso_registration_scopes: ['sso:account:access'],
                    sso_start_url: 'https://nowhere',
                },
            },
            {
                name: 'my-sso-session',
                settings: {
                    sso_region: 'us-east-1',
                    sso_registration_scopes: ['sso:account:access'],
                    sso_start_url: undefined,
                },
            },
            {
                name: 'my-sso-session',
                settings: {
                    sso_region: 'us-east-1',
                    sso_start_url: undefined,
                },
            },
            {
                name: 'my-sso-session',
                settings: {
                    sso_region: 'us-east-1',
                    sso_registration_scopes: [],
                    sso_start_url: undefined,
                },
            },
        ] as SsoSession[]) {
            it(`Throws on invalid SSO sessions [${JSON.stringify(ssoSession)}].`, () => {
                expect(() => throwOnInvalidSsoSession(ssoSession)).to.throw()
            })
        }
    })

    describe('UpdateSsoTokenFromCreateToken', () => {
        it('Creates a new SSO token from the create token response.', () => {
            const actual = UpdateSsoTokenFromCreateToken(
                {
                    accessToken: 'my-access-token',
                    expiresIn: 60,
                    refreshToken: 'my-refresh-token',
                } as CreateTokenCommandOutput,
                clientRegistration,
                ssoSession
            )

            expect(actual).to.not.be.empty
            expect(actual.accessToken).to.equal('my-access-token')
            expect(actual.clientId).to.equal('my-client-id')
            expect(actual.clientSecret).to.equal('my-client-secret')
            expect(actual.expiresAt).to.not.be.empty
            expect(actual.refreshToken).to.equal('my-refresh-token')
            expect(actual.region).to.equal('us-east-1')
            expect(actual.registrationExpiresAt).to.not.be.empty
            expect(actual.startUrl).to.equal('https://nowhere')
        })

        it('Updates an existing SSO token from the create token response.', () => {
            const actual = UpdateSsoTokenFromCreateToken(
                {
                    accessToken: 'my-access-token',
                    expiresIn: 60,
                    refreshToken: 'my-refresh-token',
                } as CreateTokenCommandOutput,
                clientRegistration,
                ssoSession,
                {
                    accessToken: 'old-access-token',
                    clientId: 'old-client-id',
                    clientSecret: 'old-client-secret',
                    expiresAt: 'old-expires-at',
                    refreshToken: 'old-refresh-token',
                    region: 'old-region',
                    registrationExpiresAt: 'old-registration-expires-at',
                    startUrl: 'old-start-url',
                }
            )

            expect(actual).to.not.be.empty
            expect(actual.accessToken).to.equal('my-access-token')
            expect(actual.clientId).to.equal('my-client-id')
            expect(actual.clientSecret).to.equal('my-client-secret')
            expect(actual.expiresAt).to.not.be.empty
            expect(actual.refreshToken).to.equal('my-refresh-token')
            expect(actual.region).to.equal('us-east-1')
            expect(actual.registrationExpiresAt).to.not.be.empty
            expect(actual.startUrl).to.equal('https://nowhere')
        })

        for (const output of [
            null,
            {
                accessToken: '',
                expiresIn: 60,
            },
            {
                accessToken: 'my-access-token',
                expiresIn: null,
            },
        ] as CreateTokenCommandOutput[]) {
            it(`Throws on invalid create token response [${JSON.stringify(output)}].`, () => {
                expect(() => UpdateSsoTokenFromCreateToken(output, clientRegistration, ssoSession)).to.throw()
            })
        }
    })
})
