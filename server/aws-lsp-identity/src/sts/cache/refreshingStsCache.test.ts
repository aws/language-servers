import { expect, use } from 'chai'
import { restore } from 'sinon'
import { stubInterface } from 'ts-sinon'
import { RefreshingStsCache } from './refreshingStsCache'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { Observability } from '@aws/lsp-core'
import { StsCache, StsCredential } from './stsCache'

// eslint-disable-next-line
use(require('chai-as-promised'))

let observability: Observability

const profileName: string = 'someprofile'

function createStsCredential(expiresAsOffsetMillis: number): StsCredential {
    return {
        Credentials: {
            AccessKeyId: 'someaccesskeyid',
            SecretAccessKey: 'somesecretaccesskey',
            SessionToken: 'somesessiontoken',
            Expiration: new Date(Date.now() + expiresAsOffsetMillis),
        },
        AssumedRoleUser: {
            Arn: 'arn:aws:sts::123456789012:assumed-role/somerole/somesession',
            AssumedRoleId: 'someassumedroleid',
        },
    } as StsCredential
}

function stubStsCache(stsCredential?: StsCredential): StsCache {
    return stubInterface<StsCache>({
        getStsCredential: Promise.resolve(stsCredential),
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
            const stsCredential = createStsCredential(6 * 60 * 1000 /* 6 minutes before */)
            const stsCache = stubStsCache(stsCredential)
            const sut = new RefreshingStsCache(stsCache, observability)

            const actual = await sut.getStsCredential(profileName)

            expect(actual).to.not.be.null.and.not.empty
            expect(actual?.Credentials?.AccessKeyId).to.equal(stsCredential.Credentials?.AccessKeyId)
            expect(actual?.Credentials?.SecretAccessKey).to.equal(stsCredential.Credentials?.SecretAccessKey)
            expect(actual?.Credentials?.SessionToken).to.equal(stsCredential.Credentials?.SessionToken)
            expect(actual?.Credentials?.Expiration).to.equal(stsCredential.Credentials?.Expiration)
            expect(actual?.AssumedRoleUser?.Arn).to.equal(stsCredential.AssumedRoleUser?.Arn)
            expect(actual?.AssumedRoleUser?.AssumedRoleId).to.equal(stsCredential.AssumedRoleUser?.AssumedRoleId)
        })
    })
})
