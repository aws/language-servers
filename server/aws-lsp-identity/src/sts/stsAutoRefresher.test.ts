import { expect, use } from 'chai'
import { StsAutoRefresher } from './stsAutoRefresher'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { restore, spy } from 'sinon'
import { AwsErrorCodes, IamCredentials, Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { AwsError, Observability } from '@aws/lsp-core'
import { RefreshingStsCache } from './cache/refreshingStsCache'

// eslint-disable-next-line
use(require('chai-as-promised'))

let observability: StubbedInstance<Observability>

const profileName = 'someprofile'
const now = Date.now()

function createStsCredential(expiresAsOffsetMillis: number): IamCredentials {
    return {
        accessKeyId: 'someaccesskeyid',
        secretAccessKey: 'somesecretaccesskey',
        sessionToken: 'somesessiontoken',
        expiration: new Date(now + expiresAsOffsetMillis),
    } satisfies IamCredentials
}

function refreshStsCredential(): Promise<IamCredentials> {
    return Promise.resolve({
        accessKeyId: 'newaccesskeyid',
        secretAccessKey: 'newsecretaccesskey',
        sessionToken: 'newsessiontoken',
        expiration: new Date(now + 60 * 60 * 1000 /* 1 hour in relative seconds */),
    } satisfies IamCredentials)
}

function stubStsCache(credential?: IamCredentials): RefreshingStsCache {
    return stubInterface<RefreshingStsCache>({
        getStsCredential: credential
            ? Promise.resolve(credential)
            : Promise.reject(new AwsError('Test: No STS credential', AwsErrorCodes.E_INVALID_STS_CREDENTIAL)),
    })
}

describe('StsAutoRefresher', () => {
    beforeEach(() => {
        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()
    })

    afterEach(() => {
        restore()
    })

    it('watch does nothing if STS credential is not loaded from cache.', async () => {
        const stsCache = stubStsCache()
        using sut = new StsAutoRefresher(stsCache, () => {}, observability)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)

        await sut.watch(profileName, refreshStsCredential)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)
    })

    it('watch does nothing if STS credential is expired.', async () => {
        const stsCache = stubStsCache(createStsCredential(-10000))
        using sut = new StsAutoRefresher(stsCache, () => {}, observability)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)

        await sut.watch(profileName, refreshStsCredential)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)
    })

    it('watch schedules refresh in refresh window prior to expiration.', async () => {
        const setTimeoutSpy = spy(global, 'setTimeout')

        // Before the refresh window
        const stsCache = stubStsCache(createStsCredential(60 * 60 * 1000))
        using sut = new StsAutoRefresher(stsCache, () => {}, observability)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)

        await sut.watch(profileName, refreshStsCredential)

        expect(Object.keys(sut['timeouts']).length).to.equal(1)

        expect(setTimeoutSpy.calledOnce).to.be.true
        expect(setTimeoutSpy.lastCall.args[1])
            .to.be.greaterThan(55 * 60 * 1000)
            .and.lessThan(60 * 60 * 1000)
    })

    it('watch schedules refresh retry in retry window after last attempt.', async () => {
        const setTimeoutSpy = spy(global, 'setTimeout')

        // In the refresh window
        const stsCache = stubStsCache(createStsCredential(4 * 60 * 1000))
        using sut = new StsAutoRefresher(stsCache, () => {}, observability)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)

        await sut.watch(profileName, refreshStsCredential)

        expect(Object.keys(sut['timeouts']).length).to.equal(1)

        expect(setTimeoutSpy.calledOnce).to.be.true
        expect(setTimeoutSpy.lastCall.args[1])
            .to.be.greaterThan(30 * 1000)
            .and.lessThan(40 * 1000)
    })

    it('unwatch does nothing if profileName is not watched.', () => {
        const stsCache = stubStsCache()
        using sut = new StsAutoRefresher(stsCache, () => {}, observability)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)

        sut.unwatch(refreshStsCredential.name)

        expect(Object.keys(sut['timeouts']).length).to.equal(0)
    })
})
