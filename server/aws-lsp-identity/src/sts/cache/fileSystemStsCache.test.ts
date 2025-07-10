// eslint-disable-next-line @typescript-eslint/no-require-imports
import mock = require('mock-fs')
import { FileSystemStsCache, getStsCredentialFilepath } from './fileSystemStsCache'
import { expect, use } from 'chai'
import { DirectoryItems } from 'mock-fs/lib/filesystem'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { access } from 'fs/promises'
import * as fs from 'fs'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { Observability } from '@aws/lsp-core'
import { StsCredential } from './stsCache'

// eslint-disable-next-line
use(require('chai-as-promised'))

let sut: FileSystemStsCache

let observability: StubbedInstance<Observability>

const profileName: string = 'someprofile'

const stsCredential: StsCredential = {
    Credentials: {
        AccessKeyId: 'someaccesskeyid',
        SecretAccessKey: 'somesecretaccesskey',
        SessionToken: 'somesessiontoken',
        Expiration: new Date('2024-09-25T18:09:20.455Z'),
    },
    AssumedRoleUser: {
        Arn: 'arn:aws:sts::123456789012:assumed-role/somerole/somesession',
        AssumedRoleId: 'someassumedroleid',
    },
}

function setupTest(args?: { profileName?: string; stsCredential?: StsCredential }): void {
    // Just for sanity, safe to call restore if mock not currently active
    mock.restore()

    args = { ...{ profileName, stsCredential }, ...args }

    const mockConfig: DirectoryItems = {}
    mockConfig[getStsCredentialFilepath(args.profileName!)] = JSON.stringify(args.stsCredential)

    mock(mockConfig)
}

function expectFileExists(filename: string): Chai.Assertion {
    return expect(access(filename, fs.constants.F_OK))
}

describe('FileSystemStsCache', () => {
    beforeEach(() => {
        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()

        sut = new FileSystemStsCache(observability)
    })

    afterEach(() => {
        mock.restore()
    })

    it('removeStsCredential deletes a valid credential', async () => {
        const filename = getStsCredentialFilepath(profileName)
        setupTest()

        await expectFileExists(filename).to.not.be.rejectedWith()

        await sut.removeStsCredential(profileName)

        await expectFileExists(filename).to.be.rejectedWith()
    })

    it('removeStsCredential does nothing on invalid/non-existent credential', async () => {
        const filename = getStsCredentialFilepath(profileName)
        setupTest()

        await expectFileExists(filename).to.not.be.rejectedWith()

        await sut.removeStsCredential('non-existent credential')

        await expectFileExists(filename).to.not.be.rejectedWith()
    })

    it('removeStsCredential throws on invalid profile name', async () => {
        await expect(sut.removeStsCredential(null!)).to.be.rejectedWith()
    })

    it('getStsCredential returns valid credential', async () => {
        setupTest()

        const actual = await sut.getStsCredential(profileName)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.Credentials?.AccessKeyId).to.equal(stsCredential.Credentials?.AccessKeyId)
        expect(actual?.Credentials?.SecretAccessKey).to.equal(stsCredential.Credentials?.SecretAccessKey)
        expect(actual?.Credentials?.SessionToken).to.equal(stsCredential.Credentials?.SessionToken)
        expect(actual?.Credentials?.Expiration?.toISOString()).to.equal(
            stsCredential.Credentials?.Expiration?.toISOString()
        )
        expect(actual?.AssumedRoleUser?.Arn).to.equal(stsCredential.AssumedRoleUser?.Arn)
        expect(actual?.AssumedRoleUser?.AssumedRoleId).to.equal(stsCredential.AssumedRoleUser?.AssumedRoleId)
    })

    it('getStsCredential returns undefined when file does not exist', async () => {
        setupTest()

        const actual = await sut.getStsCredential('does not exist')

        expect(actual).to.be.undefined
    })

    it('getStsCredential returns undefined on invalid credential', async () => {
        setupTest({ profileName: 'invalid-profile', stsCredential: {} as StsCredential })

        const actual = await sut.getStsCredential(profileName)

        expect(actual).to.be.undefined
    })

    it('setStsCredential writes new valid credential', async () => {
        setupTest()
        await sut.setStsCredential(profileName, stsCredential)

        const actual = await sut.getStsCredential(profileName)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.Credentials?.AccessKeyId).to.equal(stsCredential.Credentials?.AccessKeyId)
        expect(actual?.Credentials?.SecretAccessKey).to.equal(stsCredential.Credentials?.SecretAccessKey)
        expect(actual?.Credentials?.SessionToken).to.equal(stsCredential.Credentials?.SessionToken)
        expect(actual?.Credentials?.Expiration?.toISOString()).to.equal(
            stsCredential.Credentials?.Expiration?.toISOString()
        )
        expect(actual?.AssumedRoleUser?.Arn).to.equal(stsCredential.AssumedRoleUser?.Arn)
        expect(actual?.AssumedRoleUser?.AssumedRoleId).to.equal(stsCredential.AssumedRoleUser?.AssumedRoleId)
    })

    it('setStsCredential writes new valid credential when ~/.aws does not exist', async () => {
        mock.restore()
        mock({})

        await sut.setStsCredential(profileName, stsCredential)

        const actual = await sut.getStsCredential(profileName)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.Credentials?.AccessKeyId).to.equal(stsCredential.Credentials?.AccessKeyId)
        expect(actual?.Credentials?.SecretAccessKey).to.equal(stsCredential.Credentials?.SecretAccessKey)
        expect(actual?.Credentials?.SessionToken).to.equal(stsCredential.Credentials?.SessionToken)
        expect(actual?.Credentials?.Expiration?.toISOString()).to.equal(
            stsCredential.Credentials?.Expiration?.toISOString()
        )
        expect(actual?.AssumedRoleUser?.Arn).to.equal(stsCredential.AssumedRoleUser?.Arn)
        expect(actual?.AssumedRoleUser?.AssumedRoleId).to.equal(stsCredential.AssumedRoleUser?.AssumedRoleId)
    })

    it('setStsCredential writes updated existing credential', async () => {
        setupTest()

        await sut.setStsCredential(profileName, {
            Credentials: {
                AccessKeyId: 'newaccesskeyid',
                SecretAccessKey: 'newsecretaccesskey',
                SessionToken: 'newsessiontoken',
                Expiration: new Date('2024-10-14T12:00:00.000Z'),
            },
            AssumedRoleUser: {
                Arn: 'newarn',
                AssumedRoleId: 'newroleid',
            },
        })

        const actual = await sut.getStsCredential(profileName)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.Credentials?.AccessKeyId).to.equal('newaccesskeyid')
        expect(actual?.Credentials?.SecretAccessKey).to.equal('newsecretaccesskey')
        expect(actual?.Credentials?.SessionToken).to.equal('newsessiontoken')
        expect(actual?.Credentials?.Expiration?.toISOString()).to.equal('2024-10-14T12:00:00.000Z')
        expect(actual?.AssumedRoleUser?.Arn).to.equal('newarn')
        expect(actual?.AssumedRoleUser?.AssumedRoleId).to.equal('newroleid')
    })

    it('setStsCredential returns without error on invalid credential', async () => {
        setupTest()

        await sut.setStsCredential(profileName, {} as StsCredential) // no throw
    })
})
