import { use } from 'chai'
import { SinonStub } from 'sinon'
import { StubbedInstance } from 'ts-sinon'
import { AuthorizationServer } from './authorizationServer'
import { SSOOIDC } from '@aws-sdk/client-sso-oidc'
import { SsoClientRegistration } from '../cache'
import { SsoSession } from '@aws/language-server-runtimes/protocol'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

let authorizationServer: StubbedInstance<AuthorizationServer>
let ssoOidc: SSOOIDC & Disposable
const stubs: SinonStub[] = []

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

beforeEach(() => {
    // authorizationServer = createStubInstance(AuthorizationServer) as StubbedInstance<AuthorizationServer>
    // stubs.push(authorizationServer.authorizationCode.returns(Promise.resolve('my-authorization-code')))
    // stubs.push(stub(authorizationServer, 'csrfState').get(() => 'my-csrf-state'))
    // stubs.push(stub(authorizationServer, 'redirectUri').get(() => 'my-redirect-uri'))
    // stubs.push(stub(AuthorizationServer, 'start').returns(Promise.resolve(authorizationServer)))
    // ssoOidc = {
    //     createToken: () =>
    //         Promise.resolve({
    //             $metadata: 'metadata',
    //             accessToken: 'my-access-token',
    //             expiresIn: 60 /* relative seconds */,
    //             refreshToken: 'my-refresh-token',
    //         }),
    //     [Symbol.dispose]: () => {},
    // } as unknown as SSOOIDC & Disposable
    // stubs.push(stub(util, 'getSsoOidc').returns(ssoOidc))
})

afterEach(() => {
    // stubs.forEach(s => s.restore())
    // restore()
})

describe('authorizationCodePkceFlow', () => {
    it('Generates a valid authorize URL.', async () => {
        // let authUrl: URL
        // const actual = await authorizationCodePkceFlow(
        //     clientRegistration,
        //     ssoSession,
        //     url => (authUrl = url),
        //     CancellationToken.None
        // )
        // expect(authUrl!.host).to.equal('oidc.us-east-1.amazonaws.com')
        // expect(authUrl!.pathname).to.equal('/authorize')
        // const search = authUrl!.searchParams
        // expect(search.get('response_type')).to.equal('code')
        // expect(search.get('client_id')).to.equal('my-client-id')
        // expect(search.get('scopes')).to.equal('sso:account:access')
        // expect(search.get('redirect_uri')).to.equal('my-redirect-uri')
        // expect(search.get('state')).to.equal('my-csrf-state')
        // expect(search.get('code_challenge')).to.not.be.empty
        // expect(search.get('code_challenge_method')).to.equal('S256')
    })

    it('Returns a valid SSO token.', async () => {
        // const actual = await authorizationCodePkceFlow(clientRegistration, ssoSession, _ => {}, CancellationToken.None)
        // expect(actual.accessToken).to.equal('my-access-token')
        // expect(actual.clientId).to.equal('my-client-id')
        // expect(actual.clientSecret).to.equal('my-client-secret')
        // expect(actual.expiresAt).to.not.be.empty
        // expect(actual.refreshToken).to.equal('my-refresh-token')
        // expect(actual.region).to.equal('us-east-1')
        // expect(actual.registrationExpiresAt).to.not.be.empty
        // expect(actual.startUrl).to.equal('https://nowhere')
    })
})
