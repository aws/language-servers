import { expect, use } from 'chai'
import { restore, stub } from 'sinon'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import {
    AuthorizationPendingException,
    CreateTokenCommandOutput,
    SSOOIDC,
    StartDeviceAuthorizationCommandOutput,
} from '@aws-sdk/client-sso-oidc'
import { SsoClientRegistration } from '../cache'
import {
    AwsErrorCodes,
    CancellationToken,
    CancellationTokenSource,
    SsoSession,
} from '@aws/language-server-runtimes/protocol'
import * as ssoUtils from '../utils'
import { deviceCodeFlow } from './deviceCodeFlow'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { AwsError, Observability } from '@aws/lsp-core'

// eslint-disable-next-line
use(require('chai-as-promised'))

let observability: StubbedInstance<Observability>

let ssoOidc: SSOOIDC & Disposable

const userCode = '1234-5678'
const startUrl = 'https://my.starturl/start'
const verificationUriComplete = `${startUrl}/#/device?user_code=${userCode}`

const clientRegistration: SsoClientRegistration = {
    clientId: 'my-client-id',
    clientSecret: 'my-client-secret',
    expiresAt: new Date(Date.now() + 5 * 1000).toISOString(),
    issuedAt: new Date(Date.now()).toISOString(),
    scopes: ['sso:account:access'],
}

const ssoSession: SsoSession = {
    name: 'my-sso-session',
    settings: {
        sso_region: 'us-east-1',
        sso_registration_scopes: ['sso:account:access'],
        sso_start_url: startUrl,
    },
}

const createTokenResponse = {
    $metadata: 'metadata',
    accessToken: 'my-access-token',
    expiresIn: 60 /* relative seconds */,
    refreshToken: 'my-refresh-token',
} as CreateTokenCommandOutput

const startDeviceAuthorizationResponse = {
    userCode,
    verificationUriComplete,
    deviceCode: 'some-code',
} as StartDeviceAuthorizationCommandOutput

describe('deviceCodeFlow', () => {
    beforeEach(() => {
        ssoOidc = {
            createToken: () => Promise.resolve(createTokenResponse),
            startDeviceAuthorization: () => Promise.resolve(startDeviceAuthorizationResponse),
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

    function getDefaultFlowParams(): ssoUtils.SsoFlowParams {
        return {
            clientName: 'My Client',
            clientRegistration,
            ssoSession,
            handlers: {
                showMessageRequest: params => Promise.resolve(params.actions![0]),
                showProgress: _ => Promise.resolve(),
                showUrl: _ => {},
            },
            token: CancellationToken.None,
            observability,
        }
    }

    it('Generates a valid authorize URL.', async () => {
        let authUrl: URL
        const params = getDefaultFlowParams()
        params.handlers.showUrl = url => (authUrl = url)

        await deviceCodeFlow(params)

        expect(authUrl!.toString()).to.equal(verificationUriComplete)
    })

    it('Returns a valid SSO token.', async () => {
        const params = getDefaultFlowParams()
        const actual = await deviceCodeFlow(params)

        expect(actual.accessToken).to.equal('my-access-token')
        expect(actual.clientId).to.equal('my-client-id')
        expect(actual.clientSecret).to.equal('my-client-secret')
        expect(actual.expiresAt).to.not.be.empty
        expect(actual.refreshToken).to.equal('my-refresh-token')
        expect(actual.region).to.equal('us-east-1')
        expect(actual.registrationExpiresAt).to.not.be.empty
        expect(actual.startUrl).to.equal(startUrl)
    })

    it('Cancels if user code is not acknowledged.', async () => {
        const params = getDefaultFlowParams()
        params.handlers.showMessageRequest = async () => {
            return undefined as any
        }
        const err = await expect(deviceCodeFlow(params)).to.be.rejectedWith(AwsError)
        expect(err).to.have.property('awsErrorCode', AwsErrorCodes.E_CANCELLED)
    })

    it('Cancels if client cancels auth via token.', async () => {
        const params = getDefaultFlowParams()
        const token = new CancellationTokenSource()
        params.token = token.token
        token.cancel()

        const err = await expect(deviceCodeFlow(params)).to.be.rejectedWith(AwsError)
        expect(err).to.have.property('awsErrorCode', AwsErrorCodes.E_CANCELLED)
    })

    it("Throws client's error from ShowMessageRequest", async () => {
        const params = getDefaultFlowParams()
        const errorToThrow = new Error('client error')
        params.handlers.showMessageRequest = async () => {
            throw errorToThrow
        }

        await expect(deviceCodeFlow(params)).to.be.rejectedWith(errorToThrow)
    })

    it('Throws error if authorization expires', async () => {
        const params = getDefaultFlowParams()
        ssoOidc.startDeviceAuthorization = () =>
            Promise.resolve({
                ...startDeviceAuthorizationResponse,
                expiresIn: 0.001,
            } as StartDeviceAuthorizationCommandOutput)
        ssoOidc.createToken = new Promise(r => setTimeout(r, 0.002)) as any

        const err = await expect(deviceCodeFlow(params)).to.be.rejectedWith(AwsError)
        expect(err).to.have.property('awsErrorCode', AwsErrorCodes.E_TIMEOUT)
    })

    it('Returns a valid SSO Token after waiting for user via AuthorizationPendingException', async () => {
        const params = getDefaultFlowParams()
        ssoOidc.startDeviceAuthorization = () =>
            Promise.resolve({
                ...startDeviceAuthorizationResponse,
                interval: 0.001,
            } as StartDeviceAuthorizationCommandOutput)

        const err = new AuthorizationPendingException({ $metadata: {}, message: 'test error' })
        const createTokenStub = stub(ssoOidc, 'createToken')
        createTokenStub
            .onFirstCall()
            .rejects(err)
            .onSecondCall()
            .rejects(err)
            .onThirdCall()
            .resolves(createTokenResponse)

        const actual = await deviceCodeFlow(params)

        expect(actual.accessToken).to.equal('my-access-token')
        expect(actual.clientId).to.equal('my-client-id')
        expect(actual.clientSecret).to.equal('my-client-secret')
        expect(actual.expiresAt).to.not.be.empty
        expect(actual.refreshToken).to.equal('my-refresh-token')
        expect(actual.region).to.equal('us-east-1')
        expect(actual.registrationExpiresAt).to.not.be.empty
        expect(actual.startUrl).to.equal(startUrl)
        expect(createTokenStub.callCount).to.equal(3)
    })
})
