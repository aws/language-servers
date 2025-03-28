import { expect, use } from 'chai'
import { stub, restore } from 'sinon'
import { stubInterface } from 'ts-sinon'
import { SsoCache, SsoClientRegistration } from './ssoCache'
import * as ssoUtils from '../utils'
import { RefreshingSsoCache } from './refreshingSsoCache'
import { SSOOIDC } from '@aws-sdk/client-sso-oidc'
import { SSOToken } from '@smithy/shared-ini-file-loader'
import { AwsErrorCodes, Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { AwsError, Observability } from '@aws/lsp-core'

// eslint-disable-next-line
use(require('chai-as-promised'))

let ssoOidc: SSOOIDC & Disposable
let observability: Observability

const ssoSession = {
    name: 'my-sso-session',
    settings: {
        sso_region: 'us-east-1',
        sso_registration_scopes: ['sso:account:access'],
        sso_start_url: 'https://nowhere',
    },
}

function createSsoClientRegistration(expiresAtOffsetMillis: number): SsoClientRegistration {
    return {
        clientId: 'existing-client-id',
        clientSecret: 'existing-client-secret',
        expiresAt: new Date(Date.now() + expiresAtOffsetMillis).toISOString(),
        issuedAt: new Date(Date.now()).toISOString(),
        scopes: ['sso:account:access'],
    } satisfies SsoClientRegistration
}

function createSsoToken(expiresAsOffsetMillis: number): SSOToken {
    return {
        accessToken: 'existing-access-token',
        clientId: 'existing-client-id',
        clientSecret: 'existing-client-secret',
        expiresAt: new Date(Date.now() + expiresAsOffsetMillis).toISOString(),
        refreshToken: 'existing-refresh-token',
        region: 'existing-region',
        startUrl: 'existing-start-url',
    } satisfies SSOToken
}

function stubSsoCache(clientRegistration?: SsoClientRegistration, ssoToken?: SSOToken): SsoCache {
    return stubInterface<SsoCache>({
        getSsoClientRegistration: Promise.resolve(clientRegistration),
        getSsoToken: Promise.resolve(ssoToken),
    })
}

describe('RefreshingSsoCache', () => {
    beforeEach(() => {
        ssoOidc = {
            createToken: () =>
                Promise.resolve({
                    accessToken: 'new-access-token',
                    expiresIn: 60 * 60 * 1000 /* 1 hour in relative seconds */,
                    refreshToken: 'new-refresh-token',
                }),
            registerClient: () =>
                Promise.resolve({
                    clientId: 'new-client-id',
                    clientSecret: 'new-client-secret',
                    clientIdIssuedAt: Date.now() / 1000,
                    clientSecretExpiresAt: Date.now() / 1000,
                }),
            [Symbol.dispose]: () => {},
        } as unknown as SSOOIDC & Disposable

        stub(ssoUtils, 'getSsoOidc').returns(ssoOidc)

        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()
    })

    afterEach(() => {
        restore()
    })

    describe('getSsoClientRegistration', () => {
        it('Creates a new SSO client registration.', async () => {
            const ssoCache = stubSsoCache()
            const sut = new RefreshingSsoCache(ssoCache, _ => {}, observability)

            const actual = await sut.getSsoClientRegistration('my-client-name', ssoSession)

            expect(actual).not.to.be.empty
            expect(actual!.clientId).to.equal('new-client-id')
            expect(actual!.clientSecret).to.equal('new-client-secret')
            expect(actual!.expiresAt).not.to.be.empty
            expect(actual!.scopes).to.deep.equal(['sso:account:access'])
        })

        it('Updates an expired SSO client registration.', async () => {
            const clientRegistration = createSsoClientRegistration(-10000 /* expired */)
            const ssoCache = stubSsoCache(clientRegistration)
            const sut = new RefreshingSsoCache(ssoCache, _ => {}, observability)

            const actual = await sut.getSsoClientRegistration('my-client-name', ssoSession)

            expect(actual).not.to.be.empty
            expect(actual!.clientId).to.equal('new-client-id')
            expect(actual!.clientSecret).to.equal('new-client-secret')
            expect(actual!.expiresAt).not.to.be.empty
            expect(Date.parse(actual!.expiresAt)).to.be.greaterThan(Date.parse(clientRegistration.expiresAt))
            expect(actual!.scopes).to.deep.equal(['sso:account:access'])
        })
    })

    describe('getSsoToken', () => {
        it('Returns nothing on no cached SSO token.', async () => {
            const ssoCache = stubSsoCache()
            const sut = new RefreshingSsoCache(ssoCache, _ => {}, observability)

            const actual = await sut.getSsoToken('my-client-name', ssoSession)

            expect(actual).to.be.undefined
        })

        it('Returns refreshed token on expired SSO token.', async () => {
            const ssoCache = stubSsoCache(createSsoClientRegistration(10000), createSsoToken(-10000))
            const sut = new RefreshingSsoCache(ssoCache, _ => {}, observability)

            const actual = await sut.getSsoToken('my-client-name', ssoSession)

            expect(actual).not.to.be.empty
            expect(actual?.accessToken).to.equal('new-access-token')
            expect(actual?.clientId).to.equal('existing-client-id')
            expect(actual?.clientSecret).to.equal('existing-client-secret')
            expect(actual!.expiresAt).not.to.be.empty
            expect(actual?.refreshToken).to.equal('new-refresh-token')
            expect(actual?.region).to.equal('us-east-1')
            expect(actual?.startUrl).to.equal('https://nowhere')
        })

        it('Returns existing SSO token before refresh window (5 minutes before expiration).', async () => {
            const ssoToken = createSsoToken(6 * 60 * 1000 /* 6 minutes before */)
            const ssoCache = stubSsoCache(createSsoClientRegistration(10000), ssoToken)
            const sut = new RefreshingSsoCache(ssoCache, _ => {}, observability)

            const actual = await sut.getSsoToken('my-client-name', ssoSession)

            expect(actual).not.to.be.empty
            expect(actual?.accessToken).to.equal('existing-access-token')
            expect(actual?.clientId).to.equal('existing-client-id')
            expect(actual?.clientSecret).to.equal('existing-client-secret')
            expect(actual?.expiresAt).to.equal(ssoToken.expiresAt)
            expect(actual?.refreshToken).to.equal('existing-refresh-token')
            expect(actual?.region).to.equal('existing-region')
            expect(actual?.startUrl).to.equal('existing-start-url')
        })

        it('Returns existing SSO token when refresh attempted recently (within 30 seconds).', async () => {
            const ssoToken = createSsoToken(3 * 60 * 1000 /* 3 minutes before */)
            const ssoCache = stubSsoCache(createSsoClientRegistration(10000), ssoToken)
            const sut = new RefreshingSsoCache(ssoCache, _ => {}, observability)
            ;(sut as any).ssoTokenDetails[ssoSession.name] = {
                lastRefreshMillis: Date.now() - 10000 /* 10 seconds ago */,
            }

            const actual = await sut.getSsoToken('my-client-name', ssoSession)

            expect(actual).not.to.be.empty
            expect(actual?.accessToken).to.equal('existing-access-token')
            expect(actual?.clientId).to.equal('existing-client-id')
            expect(actual?.clientSecret).to.equal('existing-client-secret')
            expect(actual?.expiresAt).to.equal(ssoToken.expiresAt)
            expect(actual?.refreshToken).to.equal('existing-refresh-token')
            expect(actual?.region).to.equal('existing-region')
            expect(actual?.startUrl).to.equal('existing-start-url')
        })

        it('Throw error when no refreshToken.', async () => {
            const ssoToken = createSsoToken(-10000)
            ssoToken.refreshToken = undefined
            const ssoCache = stubSsoCache(createSsoClientRegistration(10000), ssoToken)
            const sut = new RefreshingSsoCache(ssoCache, _ => {}, observability)

            await expect(sut.getSsoToken('my-client-name', ssoSession))
                .to.be.rejectedWith(AwsError)
                .then(err => {
                    expect(err).to.have.property('awsErrorCode', AwsErrorCodes.E_SSO_TOKEN_EXPIRED)
                })
        })

        it('Returns new SSO token upon refresh.', async () => {
            const ssoToken = createSsoToken(4 * 60 * 1000 /* 4 minutes before */)
            const expiresAtMillis = Date.parse(ssoToken.expiresAt) // Save, token updated in-place
            const ssoCache = stubSsoCache(createSsoClientRegistration(10000), ssoToken)
            const sut = new RefreshingSsoCache(ssoCache, _ => {}, observability)

            const actual = await sut.getSsoToken('my-client-name', ssoSession)

            expect(actual).not.to.be.empty
            expect(actual?.accessToken).to.equal('new-access-token')
            expect(actual?.clientId).to.equal('existing-client-id')
            expect(actual?.clientSecret).to.equal('existing-client-secret')
            expect(Date.parse(actual!.expiresAt)).to.be.greaterThan(expiresAtMillis)
            expect(actual?.refreshToken).to.equal('new-refresh-token')
            expect(actual?.region).to.equal('us-east-1')
            expect(actual?.startUrl).to.equal('https://nowhere')
        })
    })
})
