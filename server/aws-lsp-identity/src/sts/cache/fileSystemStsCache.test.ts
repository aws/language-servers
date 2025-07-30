// eslint-disable-next-line @typescript-eslint/no-require-imports
import mock = require('mock-fs')
import { FileSystemStsCache, getStsCredentialFilepath } from './fileSystemStsCache'
import { expect, use } from 'chai'
import { DirectoryItems } from 'mock-fs/lib/filesystem'
import { Logging, IamCredentials, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { access } from 'fs/promises'
import * as fs from 'fs'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { Observability } from '@aws/lsp-core'

// eslint-disable-next-line
use(require('chai-as-promised'))

let sut: FileSystemStsCache

let observability: StubbedInstance<Observability>

const id: string = 'someid'

const credential: IamCredentials = {
    accessKeyId: 'someaccesskeyid',
    secretAccessKey: 'somesecretaccesskey',
    sessionToken: 'somesessiontoken',
    expiration: new Date(Date.now() + 60 * 60 * 1000),
}

function setupTest(args?: { id?: string; credential?: IamCredentials }): void {
    // Just for sanity, safe to call restore if mock not currently active
    mock.restore()

    args = { ...{ id, credential }, ...args }

    const mockConfig: DirectoryItems = {}
    mockConfig[getStsCredentialFilepath(args.id!)] = JSON.stringify({
        Credentials: {
            AccessKeyId: credential.accessKeyId,
            SecretAccessKey: credential.secretAccessKey,
            SessionToken: credential.sessionToken,
            Expiration: credential.expiration,
        },
    })

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
        const filename = getStsCredentialFilepath(id)
        setupTest()

        await expectFileExists(filename).to.not.be.rejectedWith()

        await sut.removeStsCredential(id)

        await expectFileExists(filename).to.be.rejectedWith()
    })

    it('removeStsCredential does nothing on invalid/non-existent credential', async () => {
        const filename = getStsCredentialFilepath(id)
        setupTest()

        await expectFileExists(filename).to.not.be.rejectedWith()

        await sut.removeStsCredential('non-existent credential')

        await expectFileExists(filename).to.not.be.rejectedWith()
    })

    it('removeStsCredential throws on invalid id', async () => {
        await expect(sut.removeStsCredential(' ')).to.be.rejectedWith()
    })

    it('getStsCredential returns valid credential', async () => {
        setupTest()

        const actual = await sut.getStsCredential(id)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.accessKeyId).to.equal(credential.accessKeyId)
        expect(actual?.secretAccessKey).to.equal(credential.secretAccessKey)
        expect(actual?.sessionToken).to.equal(credential.sessionToken)
        expect(actual?.expiration?.toISOString()).to.equal(credential.expiration?.toISOString())
    })

    it('getStsCredential returns undefined when file does not exist', async () => {
        setupTest()

        const actual = await sut.getStsCredential('does not exist')

        expect(actual).to.be.undefined
    })

    it('getStsCredential returns undefined on invalid credential', async () => {
        setupTest({ id: 'invalid-id', credential: {} as IamCredentials })

        const actual = await sut.getStsCredential(id)

        expect(actual).to.be.undefined
    })

    it('getStsCredential returns undefined on expired credential', async () => {
        setupTest({
            id: 'invalid-id',
            credential: {
                accessKeyId: 'newaccesskeyid',
                secretAccessKey: 'newsecretaccesskey',
                sessionToken: 'newsessiontoken',
                expiration: new Date(Date.now() - 60 * 60 * 1000),
            } as IamCredentials,
        })

        const actual = await sut.getStsCredential(id)

        expect(actual).to.be.undefined
    })

    it('setStsCredential writes new valid credential', async () => {
        setupTest()
        await sut.setStsCredential(id, credential)

        const actual = await sut.getStsCredential(id)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.accessKeyId).to.equal(credential.accessKeyId)
        expect(actual?.secretAccessKey).to.equal(credential.secretAccessKey)
        expect(actual?.sessionToken).to.equal(credential.sessionToken)
        expect(actual?.expiration?.toISOString()).to.equal(credential.expiration?.toISOString())
    })

    it('setStsCredential writes new valid credential when ~/.aws does not exist', async () => {
        mock.restore()
        mock({})

        await sut.setStsCredential(id, credential)

        const actual = await sut.getStsCredential(id)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.accessKeyId).to.equal(credential.accessKeyId)
        expect(actual?.secretAccessKey).to.equal(credential.secretAccessKey)
        expect(actual?.sessionToken).to.equal(credential.sessionToken)
        expect(actual?.expiration?.toISOString()).to.equal(credential.expiration?.toISOString())
    })

    it('setStsCredential writes updated existing credential', async () => {
        setupTest()

        const newCredential = {
            accessKeyId: 'newaccesskeyid',
            secretAccessKey: 'newsecretaccesskey',
            sessionToken: 'newsessiontoken',
            expiration: new Date(Date.now() + 60 * 60 * 1000),
        }
        await sut.setStsCredential(id, newCredential)
        const actual = await sut.getStsCredential(id)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.accessKeyId).to.equal(newCredential.accessKeyId)
        expect(actual?.secretAccessKey).to.equal(newCredential.secretAccessKey)
        expect(actual?.sessionToken).to.equal(newCredential.sessionToken)
        expect(actual?.expiration?.toISOString()).to.equal(newCredential.expiration.toISOString())
    })

    it('setStsCredential returns without error on invalid credential', async () => {
        setupTest()

        await sut.setStsCredential(id, {} as IamCredentials) // no throw
    })

    it('setStsCredential returns without error on expired credential', async () => {
        setupTest()

        await sut.setStsCredential(id, {
            accessKeyId: 'newaccesskeyid',
            secretAccessKey: 'newsecretaccesskey',
            sessionToken: 'newsessiontoken',
            expiration: new Date(Date.now() - 60 * 60 * 1000),
        } as IamCredentials) // no throw
    })
})
