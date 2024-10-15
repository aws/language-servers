import mock = require('mock-fs')
import { FileSystemSsoCache } from './fileSystemSsoCache'
import { expect, use } from 'chai'
import { DirectoryItems } from 'mock-fs/lib/filesystem'
import { getSSOTokenFilepath, SSOToken } from '@smithy/shared-ini-file-loader'
import { SsoClientRegistration } from './ssoCache'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

const sut = new FileSystemSsoCache()

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

const ssoSessionName = 'my-sso-session'

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

afterEach(() => {
    mock.restore()
})

function setupTest(args?: {
    clientRegistrationId?: string
    clientRegistration?: SsoClientRegistration
    ssoSessionName?: string
    ssoToken?: SSOToken
}): void {
    // Just for sanity, safe to call restore if mock not currently active
    mock.restore()

    args = { ...{ clientRegistrationId, clientRegistration, ssoSessionName, ssoToken }, ...args }

    const mockConfig: DirectoryItems = {}
    mockConfig[getSSOTokenFilepath(args.clientRegistrationId!)] = JSON.stringify(args.clientRegistration)
    mockConfig[getSSOTokenFilepath(args.ssoSessionName!)] = JSON.stringify(args.ssoToken)

    mock(mockConfig)
}

describe('FileSystemSsoCache', () => {
    it('getSsoClientRegistration returns valid registration', async () => {
        setupTest()

        const actual = await sut.getSsoClientRegistration(clientName, ssoRegion, ssoStartUrl)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.clientId).to.equal('someclientid')
        expect(actual?.clientSecret).to.equal('someclientsecret')
        expect(actual?.expiresAt).to.equal('2019-11-14T04:05:45Z')
        expect(actual?.scopes).to.deep.equal(['codewhisperer:completions', 'codewhisperer:analysis'])
    })

    it('getSsoClientRegistration returns undefined when file does not exist', async () => {
        setupTest()

        const actual = await sut.getSsoClientRegistration('does', 'not', 'exist')

        expect(actual).to.be.undefined
    })

    it('getSsoClientRegistration returns undefined on invalid registration', async () => {
        setupTest({ clientRegistration: {} as SsoClientRegistration })

        const actual = await sut.getSsoClientRegistration(clientName, ssoRegion, ssoStartUrl)

        expect(actual).to.be.undefined
    })

    it('setSsoClientRegistration writes new valid registration', async () => {
        setupTest()

        await sut.setSsoClientRegistration('new', 'client', 'id', {
            clientId: 'someclientid',
            clientSecret: 'someclientsecret',
            expiresAt: '2024-10-14T12:00:00.000Z',
            scopes: ['sso:account:access', 'codewhisperer:analysis'],
        })

        const actual = await sut.getSsoClientRegistration('new', 'client', 'id')

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.clientId).to.equal('someclientid')
        expect(actual?.clientSecret).to.equal('someclientsecret')
        expect(actual?.expiresAt).to.equal('2024-10-14T12:00:00.000Z')
        expect(actual?.scopes).to.deep.equal(['sso:account:access', 'codewhisperer:analysis'])
    })

    it('setSsoClientRegistration writes updated existing registration', async () => {
        setupTest()

        await sut.setSsoClientRegistration(clientName, ssoRegion, ssoStartUrl, {
            clientId: 'newclientid',
            clientSecret: 'newclientsecret',
            expiresAt: '2024-11-14T04:05:45Z',
        })

        const actual = await sut.getSsoClientRegistration(clientName, ssoRegion, ssoStartUrl)

        expect(actual).to.not.be.null.and.not.undefined
        expect(actual?.clientId).to.equal('newclientid')
        expect(actual?.clientSecret).to.equal('newclientsecret')
        expect(actual?.expiresAt).to.equal('2024-11-14T04:05:45Z')
        expect(actual).does.not.have.property('scopes')
    })

    it('setSsoClientRegistration returns without error on invalid registration', async () => {
        setupTest()

        await sut.setSsoClientRegistration(clientName, ssoRegion, ssoStartUrl, {} as SsoClientRegistration) // no throw
    })

    it('getSsoToken returns valid token', async () => {
        setupTest()

        const actual = await sut.getSsoToken(ssoSessionName)

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

        const actual = await sut.getSsoToken('does not exist')

        expect(actual).to.be.undefined
    })

    it('getSsoToken returns undefined on invalid token', async () => {
        setupTest({ ssoSessionName: 'invalid-token', ssoToken: {} as SSOToken })

        const actual = await sut.getSsoToken('invalid-token')

        expect(actual).to.be.undefined
    })

    it('setSsoToken writes new valid token', async () => {
        setupTest()

        await sut.setSsoToken('new-token', {
            clientId: 'someclientid',
            clientSecret: 'someclientsecret',
            region: 'us-west-2',
            startUrl: 'https://somewhere',
            accessToken: 'newaccesstoken',
            refreshToken: 'newrefreshtoken',
            expiresAt: '2024-10-14T12:00:00.000Z',
            registrationExpiresAt: '2024-12-14T12:00:00.000Z',
        })

        const actual = await sut.getSsoToken('new-token')

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

        await sut.setSsoToken(ssoSessionName, {
            accessToken: 'newaccesstoken',
            expiresAt: '2024-10-14T12:00:00.000Z',
        })

        const actual = await sut.getSsoToken(ssoSessionName)

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

        await sut.setSsoToken(ssoSessionName, {} as SSOToken) // no throw
    })
})
