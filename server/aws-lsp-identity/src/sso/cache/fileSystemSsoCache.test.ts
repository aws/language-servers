// eslint-disable-next-line @typescript-eslint/no-require-imports
import mock = require('mock-fs')
import { FileSystemSsoCache } from './fileSystemSsoCache'
import { expect, use } from 'chai'
import { DirectoryItems } from 'mock-fs/lib/filesystem'
import { getSSOTokenFilepath, SSOToken } from '@smithy/shared-ini-file-loader'
import { SsoClientRegistration } from './ssoCache'
import { Logging, SsoSession, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { access } from 'fs/promises'
import * as fs from 'fs'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { Observability } from '@aws/lsp-core'

// eslint-disable-next-line
use(require('chai-as-promised'))

let sut: FileSystemSsoCache

let observability: StubbedInstance<Observability>

const ssoRegion = 'us-east-1'
const ssoStartUrl = 'https://nowhere'
const clientName = 'my-test-client'

const clientRegistrationId = JSON.stringify({
    region: ssoRegion,
    startUrl: ssoStartUrl,
    tool: clientName,
})

const clientRegistration: SsoClientRegistration = {
    clientId: 'someclientid',
    clientSecret: 'someclientsecret',
    expiresAt: '2019-11-14T04:05:45Z',
    scopes: ['codewhisperer:completions', 'codewhisperer:analysis'],
}

const ssoSession: SsoSession = {
    name: 'my-sso-session',
    settings: {
        sso_region: 'us-east-1',
        sso_start_url: 'https://nowhere',
        sso_registration_scopes: ['codewhisperer:completions', 'codewhisperer:analysis'],
    },
}

const ssoToken: SSOToken = {
    clientId: 'someclientid',
    clientSecret: 'someclientsecret',
    region: 'us-east-1',
    startUrl: 'https://nowhere',
    accessToken: 'someaccesstoken',
    refreshToken: 'somerefreshtoken',
    expiresAt: '2024-09-25T18:09:20.455Z',
    registrationExpiresAt: '2024-12-09T19:59:06.000Z',
}

function setupTest(args?: {
    clientRegistrationId?: string
    clientRegistration?: SsoClientRegistration
    ssoSessionName?: string
    ssoToken?: SSOToken
}): void {
    // Just for sanity, safe to call restore if mock not currently active
    mock.restore()

    args = { ...{ clientRegistrationId, clientRegistration, ssoSessionName: ssoSession.name, ssoToken }, ...args }

    const mockConfig: DirectoryItems = {}
    mockConfig[getSSOTokenFilepath(args.clientRegistrationId!)] = JSON.stringify(args.clientRegistration)
    mockConfig[getSSOTokenFilepath(args.ssoSessionName!)] = JSON.stringify(args.ssoToken)

    mock(mockConfig)
}

function createSsoSession(name: string): SsoSession {
    return {
        name,
        settings: {
            sso_region: 'us-east-1',
            sso_start_url: 'https://nowhere',
            sso_registration_scopes: ['codewhisperer:completions', 'codewhisperer:analysis'],
        },
    }
}

function expectFileExists(filename: string): Chai.Assertion {
    return expect(access(getSSOTokenFilepath(ssoSession.name), fs.constants.F_OK))
}

describe('FileSystemSsoCache', () => {
    beforeEach(() => {
        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()

        sut = new FileSystemSsoCache(observability)
    })

    afterEach(() => {
        mock.restore()
    })

    it('getSsoClientRegistration returns valid registration', async () => {
        setupTest()

        const actual = await sut.getSsoClientRegistration(clientName, ssoSession)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.clientId).to.equal('someclientid')
        expect(actual?.clientSecret).to.equal('someclientsecret')
        expect(actual?.expiresAt).to.equal('2019-11-14T04:05:45Z')
        expect(actual?.scopes).to.deep.equal(['codewhisperer:completions', 'codewhisperer:analysis'])
    })

    it('getSsoClientRegistration returns undefined when file does not exist', async () => {
        setupTest()

        const actual = await sut.getSsoClientRegistration('does', ssoSession)

        expect(actual).to.be.undefined
    })

    it('getSsoClientRegistration returns undefined on invalid registration', async () => {
        setupTest({ clientRegistration: {} as SsoClientRegistration })

        const actual = await sut.getSsoClientRegistration(clientName, ssoSession)

        expect(actual).to.be.undefined
    })

    it('setSsoClientRegistration writes new valid registration', async () => {
        setupTest()

        await sut.setSsoClientRegistration('new', ssoSession, {
            clientId: 'someclientid',
            clientSecret: 'someclientsecret',
            expiresAt: '2024-10-14T12:00:00.000Z',
            scopes: ['sso:account:access', 'codewhisperer:analysis'],
        })

        const actual = await sut.getSsoClientRegistration('new', ssoSession)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.clientId).to.equal('someclientid')
        expect(actual?.clientSecret).to.equal('someclientsecret')
        expect(actual?.expiresAt).to.equal('2024-10-14T12:00:00.000Z')
        expect(actual?.scopes).to.deep.equal(['sso:account:access', 'codewhisperer:analysis'])
    })

    it('setSsoClientRegistration writes new valid registration when ~/.aws does not exist', async () => {
        mock.restore()
        mock({})

        await sut.setSsoClientRegistration('new', ssoSession, {
            clientId: 'someclientid',
            clientSecret: 'someclientsecret',
            expiresAt: '2024-10-14T12:00:00.000Z',
            scopes: ['sso:account:access', 'codewhisperer:analysis'],
        })

        const actual = await sut.getSsoClientRegistration('new', ssoSession)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.clientId).to.equal('someclientid')
        expect(actual?.clientSecret).to.equal('someclientsecret')
        expect(actual?.expiresAt).to.equal('2024-10-14T12:00:00.000Z')
        expect(actual?.scopes).to.deep.equal(['sso:account:access', 'codewhisperer:analysis'])
    })

    it('setSsoClientRegistration writes updated existing registration', async () => {
        setupTest()

        await sut.setSsoClientRegistration(clientName, ssoSession, {
            clientId: 'newclientid',
            clientSecret: 'newclientsecret',
            expiresAt: '2024-11-14T04:05:45Z',
        })

        const actual = await sut.getSsoClientRegistration(clientName, ssoSession)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.clientId).to.equal('newclientid')
        expect(actual?.clientSecret).to.equal('newclientsecret')
        expect(actual?.expiresAt).to.equal('2024-11-14T04:05:45Z')
        expect(actual).does.not.have.property('scopes')
    })

    it('setSsoClientRegistration returns without error on invalid registration', async () => {
        setupTest()

        await sut.setSsoClientRegistration(clientName, ssoSession, {} as SsoClientRegistration) // no throw
    })

    it('removeSsoToken deletes a valid token', async () => {
        const filename = getSSOTokenFilepath(ssoSession.name)
        setupTest()

        await expectFileExists(filename).to.not.be.rejectedWith()

        await sut.removeSsoToken(ssoSession.name)

        await expectFileExists(filename).to.be.rejectedWith()
    })

    it('removeSsoToken does nothing on invalid/non-existent token', async () => {
        const filename = getSSOTokenFilepath(ssoSession.name)
        setupTest()

        await expectFileExists(filename).to.not.be.rejectedWith()

        await sut.removeSsoToken('non-existent token')

        await expectFileExists(filename).to.not.be.rejectedWith()
    })

    it('removeToken throws on invalid SSO session name', async () => {
        await expect(sut.removeSsoToken(null!)).to.be.rejectedWith()
    })

    it('getSsoToken returns valid token', async () => {
        setupTest()

        const actual = await sut.getSsoToken(clientName, ssoSession)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.accessToken).to.equal('someaccesstoken')
        expect(actual?.clientId).to.equal('someclientid')
        expect(actual?.clientSecret).to.equal('someclientsecret')
        expect(actual?.expiresAt).to.equal('2024-09-25T18:09:20.455Z')
        expect(actual?.refreshToken).to.equal('somerefreshtoken')
        expect(actual?.region).to.equal('us-east-1')
        expect(actual?.registrationExpiresAt).to.equal('2024-12-09T19:59:06.000Z')
        expect(actual?.startUrl).to.equal('https://nowhere')
    })

    it('getSsoToken returns undefined when file does not exist', async () => {
        setupTest()

        const actual = await sut.getSsoToken(clientName, createSsoSession('does not exist'))

        expect(actual).to.be.undefined
    })

    it('getSsoToken returns undefined on invalid token', async () => {
        setupTest({ ssoSessionName: 'invalid-token', ssoToken: {} as SSOToken })

        const actual = await sut.getSsoToken(clientName, createSsoSession('invalid-token'))

        expect(actual).to.be.undefined
    })

    it('setSsoToken writes new valid token', async () => {
        setupTest()
        const ssoSession = createSsoSession('new-token')

        await sut.setSsoToken(clientName, ssoSession, {
            clientId: 'someclientid',
            clientSecret: 'someclientsecret',
            region: 'us-west-2',
            startUrl: 'https://somewhere',
            accessToken: 'newaccesstoken',
            refreshToken: 'newrefreshtoken',
            expiresAt: '2024-10-14T12:00:00.000Z',
            registrationExpiresAt: '2024-12-14T12:00:00.000Z',
        })

        const actual = await sut.getSsoToken(clientName, ssoSession)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.accessToken).to.equal('newaccesstoken')
        expect(actual?.clientId).to.equal('someclientid')
        expect(actual?.clientSecret).to.equal('someclientsecret')
        expect(actual?.expiresAt).to.equal('2024-10-14T12:00:00.000Z')
        expect(actual?.refreshToken).to.equal('newrefreshtoken')
        expect(actual?.region).to.equal('us-west-2')
        expect(actual?.registrationExpiresAt).to.equal('2024-12-14T12:00:00.000Z')
        expect(actual?.startUrl).to.equal('https://somewhere')
    })

    it('setSsoToken writes new valid token when ~/.aws does not exist', async () => {
        mock.restore()
        mock({})

        const ssoSession = createSsoSession('new-token')

        await sut.setSsoToken(clientName, ssoSession, {
            clientId: 'someclientid',
            clientSecret: 'someclientsecret',
            region: 'us-west-2',
            startUrl: 'https://somewhere',
            accessToken: 'newaccesstoken',
            refreshToken: 'newrefreshtoken',
            expiresAt: '2024-10-14T12:00:00.000Z',
            registrationExpiresAt: '2024-12-14T12:00:00.000Z',
        })

        const actual = await sut.getSsoToken(clientName, ssoSession)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.accessToken).to.equal('newaccesstoken')
        expect(actual?.clientId).to.equal('someclientid')
        expect(actual?.clientSecret).to.equal('someclientsecret')
        expect(actual?.expiresAt).to.equal('2024-10-14T12:00:00.000Z')
        expect(actual?.refreshToken).to.equal('newrefreshtoken')
        expect(actual?.region).to.equal('us-west-2')
        expect(actual?.registrationExpiresAt).to.equal('2024-12-14T12:00:00.000Z')
        expect(actual?.startUrl).to.equal('https://somewhere')
    })

    it('setSsoToken writes updated existing token', async () => {
        setupTest()

        await sut.setSsoToken(clientName, ssoSession, {
            accessToken: 'newaccesstoken',
            expiresAt: '2024-10-14T12:00:00.000Z',
        })

        const actual = await sut.getSsoToken(clientName, ssoSession)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.accessToken).to.equal('newaccesstoken')
        expect(actual?.expiresAt).to.equal('2024-10-14T12:00:00.000Z')
        expect(actual).does.not.have.property('clientId')
        expect(actual).does.not.have.property('clientSecret')
        expect(actual).does.not.have.property('refreshToken')
        expect(actual).does.not.have.property('region')
        expect(actual).does.not.have.property('registrationExpiresAt')
        expect(actual).does.not.have.property('startUrl')
    })

    it('setSsoToken returns without error on invalid token', async () => {
        setupTest()

        await sut.setSsoToken(clientName, ssoSession, {} as SSOToken) // no throw
    })
})
