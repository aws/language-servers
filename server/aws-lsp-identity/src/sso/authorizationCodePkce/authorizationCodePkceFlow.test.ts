import { expect, use } from 'chai'
import { createStubInstance, restore, stub } from 'sinon'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { AuthorizationServer } from './authorizationServer'
import { SSOOIDC } from '@aws-sdk/client-sso-oidc'
import { SsoClientRegistration } from '../cache'
import { CancellationToken, SsoSession } from '@aws/language-server-runtimes/protocol'
import * as ssoUtils from '../utils'
import { authorizationCodePkceFlow } from './authorizationCodePkceFlow'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { Observability } from '@aws/lsp-core'

// eslint-disable-next-line
use(require('chai-as-promised'))

let authorizationServer: StubbedInstance<AuthorizationServer>
let observability: StubbedInstance<Observability>

let ssoOidc: SSOOIDC & Disposable

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
        sso_start_url: 'https://nowhere',
    },
}

describe('authorizationCodePkceFlow', () => {
    beforeEach(() => {
        authorizationServer = createStubInstance(AuthorizationServer) as StubbedInstance<AuthorizationServer>
        authorizationServer.authorizationCode.returns(Promise.resolve('my-authorization-code'))
        stub(authorizationServer, 'csrfState').get(() => 'my-csrf-state')
        stub(authorizationServer, 'redirectUri').get(() => 'my-redirect-uri')
        stub(AuthorizationServer, 'start').returns(Promise.resolve(authorizationServer))

        ssoOidc = {
            createToken: () =>
                Promise.resolve({
                    $metadata: 'metadata',
                    accessToken: 'my-access-token',
                    expiresIn: 60 /* relative seconds */,
                    refreshToken: 'my-refresh-token',
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

    function getDefaultFlowParams(): ssoUtils.SsoFlowParams {
        return {
            clientName: 'My Client',
            clientRegistration,
            ssoSession,
            handlers: {
                showMessageRequest: (_: any) => {
                    return undefined as any
                },
                showProgress: async (_: any) => {},
                showUrl: (_: any) => {},
            },
            token: CancellationToken.None,
            observability,
        }
    }

    it('Generates a valid authorize URL.', async () => {
        let authUrl: URL
        const params = getDefaultFlowParams()
        params.handlers.showUrl = url => (authUrl = url)

        await authorizationCodePkceFlow(params)

        expect(authUrl!.host).to.equal('oidc.us-east-1.amazonaws.com')
        expect(authUrl!.pathname).to.equal('/authorize')
        const search = authUrl!.searchParams
        expect(search.get('response_type')).to.equal('code')
        expect(search.get('client_id')).to.equal('my-client-id')
        expect(search.get('scopes')).to.equal('sso:account:access')
        expect(search.get('redirect_uri')).to.equal('my-redirect-uri')
        expect(search.get('state')).to.equal('my-csrf-state')
        expect(search.get('code_challenge')).to.not.be.empty
        expect(search.get('code_challenge_method')).to.equal('S256')
    })

    it('Returns a valid SSO token.', async () => {
        const params = getDefaultFlowParams()
        const actual = await authorizationCodePkceFlow(params)

        expect(actual.accessToken).to.equal('my-access-token')
        expect(actual.clientId).to.equal('my-client-id')
        expect(actual.clientSecret).to.equal('my-client-secret')
        expect(actual.expiresAt).to.not.be.empty
        expect(actual.refreshToken).to.equal('my-refresh-token')
        expect(actual.region).to.equal('us-east-1')
        expect(actual.registrationExpiresAt).to.not.be.empty
        expect(actual.startUrl).to.equal('https://nowhere')
    })
})
