import { expect, use } from 'chai'
import { SsoTokenAutoRefresher } from './ssoTokenAutoRefresher'
import { SSOToken } from '@smithy/shared-ini-file-loader'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { SsoClientRegistration, RefreshingSsoCache } from '../sso'
import { restore, spy } from 'sinon'
import { AwsErrorCodes, Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { AwsError, Observability } from '@aws/lsp-core'

// eslint-disable-next-line
use(require('chai-as-promised'))

let observability: StubbedInstance<Observability>

const clientName = 'my-test-client'
const now = Date.now()

const ssoSession = {
    name: 'my-sso-session',
    settings: {
        sso_region: 'us-east-1',
        sso_registration_scopes: ['sso:account:access'],
        sso_start_url: 'https://nowhere',
    },
}

const clientRegistration: SsoClientRegistration = {
    clientId: 'someclientid',
    clientSecret: 'someclientsecret',
    expiresAt: '2019-11-14T04:05:45Z',
    scopes: ['codewhisperer:completions', 'codewhisperer:analysis'],
}

function createSsoToken(expiresAsOffsetMillis: number): SSOToken {
    return {
        accessToken: 'existing-access-token',
        clientId: 'existing-client-id',
        clientSecret: 'existing-client-secret',
        expiresAt: new Date(now + expiresAsOffsetMillis).toISOString(),
        refreshToken: 'existing-refresh-token',
        region: 'existing-region',
        startUrl: 'existing-start-url',
    } satisfies SSOToken
}

function stubSsoCache(clientRegistration?: SsoClientRegistration, ssoToken?: SSOToken): RefreshingSsoCache {
    return stubInterface<RefreshingSsoCache>({
        getSsoClientRegistration: Promise.resolve(clientRegistration),
        getSsoToken: ssoToken
            ? Promise.resolve(ssoToken)
            : Promise.reject(new AwsError('Test: No SSO Token', AwsErrorCodes.E_INVALID_SSO_TOKEN)),
    })
}

describe('SsoTokenAutoRefresher', () => {
    beforeEach(() => {
        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()
    })

    afterEach(() => {
        restore()
    })

    it('watch does nothing if SSO token is not loaded from cache.', async () => {
        const ssoCache = stubSsoCache(clientRegistration)
        using sut = new SsoTokenAutoRefresher(ssoCache, observability)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)

        await sut.watch(clientName, ssoSession)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)
    })

    it('watch does nothing if SSO token is expired.', async () => {
        const ssoCache = stubSsoCache(clientRegistration, createSsoToken(-10000))
        using sut = new SsoTokenAutoRefresher(ssoCache, observability)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)

        await sut.watch(clientName, ssoSession)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)
    })

    it('watch schedules refresh in refresh window prior to expiration.', async () => {
        const setTimeoutSpy = spy(global, 'setTimeout')

        // Before the refresh window
        const ssoCache = stubSsoCache(clientRegistration, createSsoToken(60 * 60 * 1000))
        using sut = new SsoTokenAutoRefresher(ssoCache, observability)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)

        await sut.watch(clientName, ssoSession)

        expect(Object.keys(sut['timeouts']).length).to.equal(1)

        expect(setTimeoutSpy.calledOnce).to.be.true
        expect(setTimeoutSpy.lastCall.args[1])
            .to.be.greaterThan(55 * 60 * 1000)
            .and.lessThan(60 * 60 * 1000)
    })

    it('watch schedules refresh retry in retry window after last attempt.', async () => {
        const setTimeoutSpy = spy(global, 'setTimeout')

        // In the refresh window
        const ssoCache = stubSsoCache(clientRegistration, createSsoToken(4 * 60 * 1000))
        using sut = new SsoTokenAutoRefresher(ssoCache, observability)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)

        await sut.watch(clientName, ssoSession)

        expect(Object.keys(sut['timeouts']).length).to.equal(1)

        expect(setTimeoutSpy.calledOnce).to.be.true
        expect(setTimeoutSpy.lastCall.args[1])
            .to.be.greaterThan(30 * 1000)
            .and.lessThan(40 * 1000)
    })

    it('unwatch does nothing if ssoSessionName is not watched.', () => {
        const ssoCache = stubSsoCache(clientRegistration)
        using sut = new SsoTokenAutoRefresher(ssoCache, observability)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)

        sut.unwatch(ssoSession.name)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)
    })
})
