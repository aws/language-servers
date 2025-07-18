import { expect, use } from 'chai'
import { restore } from 'sinon'
import { stubInterface } from 'ts-sinon'
import { RefreshingStsCache } from './refreshingStsCache'
import { Logging, IamCredentials, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { Observability } from '@aws/lsp-core'
import { StsCache } from './stsCache'

// eslint-disable-next-line
use(require('chai-as-promised'))

let observability: Observability

const profileName: string = 'someprofile'

function createStsCredential(expiresAsOffsetMillis: number): IamCredentials {
    return {
        accessKeyId: 'someaccesskeyid',
        secretAccessKey: 'somesecretaccesskey',
        sessionToken: 'somesessiontoken',
        expiration: new Date(Date.now() + expiresAsOffsetMillis),
    } satisfies IamCredentials
}

function stubStsCache(credential?: IamCredentials): StsCache {
    return stubInterface<StsCache>({
        getStsCredential: Promise.resolve(credential),
    })
}

describe('RefreshingStsCache', () => {
    beforeEach(() => {
        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()
    })

    afterEach(() => {
        restore()
    })

    describe('getStsCredential', () => {
        it('Returns nothing on no cached STS credential.', async () => {
            const stsCache = stubStsCache()
            const sut = new RefreshingStsCache(stsCache, observability)

            const actual = await sut.getStsCredential(profileName)

            expect(actual).to.be.undefined
        })

        it('Returns existing STS credential before refresh window (5 minutes before expiration).', async () => {
            const credential = createStsCredential(6 * 60 * 1000 /* 6 minutes before */)
            const stsCache = stubStsCache(credential)
            const sut = new RefreshingStsCache(stsCache, observability)

            const actual = await sut.getStsCredential(profileName)

            expect(actual).to.not.be.null.and.not.empty
            expect(actual?.accessKeyId).to.equal(credential.accessKeyId)
            expect(actual?.secretAccessKey).to.equal(credential.secretAccessKey)
            expect(actual?.sessionToken).to.equal(credential.sessionToken)
            expect(actual?.expiration).to.equal(credential.expiration)
        })
    })
})
