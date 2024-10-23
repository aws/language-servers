import { use } from 'chai'
import { StubbedInstance } from 'ts-sinon'
import { SsoCache } from '../sso'
import { IdentityService } from './identityService'
import { ProfileStore } from './profiles/profileService'
import { SsoTokenAutoRefresher } from './ssoTokenAutoRefresher'
import { SinonStub } from 'sinon'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

let sut: IdentityService

let profileStore: StubbedInstance<ProfileStore>
let ssoCache: StubbedInstance<SsoCache>
let autoRefresher: StubbedInstance<SsoTokenAutoRefresher>
let tryAsync: SinonStub

beforeEach(() => {
    // profileStore = stubInterface<ProfileStore>({
    //     load: Promise.resolve({
    //         profiles: [
    //             {
    //                 kinds: [ProfileKind.SsoTokenProfile],
    //                 name: 'my-profile',
    //                 settings: {
    //                     sso_session: 'my-sso-session',
    //                 },
    //             },
    //         ],
    //         ssoSessions: [
    //             {
    //                 name: 'my-sso-session',
    //                 settings: {
    //                     sso_region: 'us-east-1',
    //                     sso_registration_scopes: ['sso:account:access'],
    //                     sso_start_url: 'https://nowhere',
    //                 },
    //             },
    //         ],
    //     } satisfies ProfileData),
    // })
    // ssoCache = stubInterface<SsoCache>({
    //     getSsoClientRegistration: Promise.resolve({
    //         clientId: 'my-client-id',
    //         clientSecret: 'my-client-secret',
    //         expiresAt: new Date(Date.now() + 10 * 1000).toISOString(),
    //         issuedAt: new Date(Date.now()).toISOString(),
    //         scopes: ['sso:account:access'],
    //     } satisfies SsoClientRegistration),
    // })
    // autoRefresher = createStubInstance(SsoTokenAutoRefresher) as StubbedInstance<SsoTokenAutoRefresher>
    // tryAsync = stub(util, 'tryAsync').returns(
    //     Promise.resolve({
    //         accessToken: 'my-access-token',
    //         expiresAt: new Date(Date.now() + 10 * 1000).toISOString(),
    //     } satisfies SSOToken)
    // )
})

afterEach(() => {
    // tryAsync.restore()
    // restore()
})

describe('IdentityService', () => {
    describe('getSsoToken', () => {
        it('Can login with AWS Builder ID.', async () => {
            // sut = new IdentityService(profileStore, ssoCache, autoRefresher, _ => {})
            // const actual = await sut.getSsoToken(
            //     {
            //         clientName: 'my-client',
            //         source: { kind: SsoTokenSourceKind.AwsBuilderId, ssoRegistrationScopes: ['sso:account:access'] },
            //     },
            //     CancellationToken.None
            // )
            // expect(actual.ssoToken.id).to.equal(awsBuilderIdReservedName)
            // expect(actual.ssoToken.accessToken).to.equal('my-access-token')
            // expect(autoRefresher.watch.calledOnce).to.be.true
        })

        it('Can login with IAM Identity Center.', async () => {
            // sut = new IdentityService(profileStore, ssoCache, autoRefresher, _ => {})
            // const actual = await sut.getSsoToken(
            //     {
            //         clientName: 'my-client',
            //         source: { kind: SsoTokenSourceKind.IamIdentityCenter, profileName: 'my-profile' },
            //     },
            //     CancellationToken.None
            // )
            // expect(actual.ssoToken.id).to.equal('my-sso-session')
            // expect(actual.ssoToken.accessToken).to.equal('my-access-token')
            // expect(autoRefresher.watch.calledOnce).to.be.true
        })

        it('Throws when no SSO token cached and loginOnInvalidToken is false.', async () => {
            // sut = new IdentityService(profileStore, ssoCache, autoRefresher, _ => {})
            // const error = await expect(
            //     sut.getSsoToken(
            //         {
            //             clientName: 'my-client',
            //             source: {
            //                 kind: SsoTokenSourceKind.AwsBuilderId,
            //                 ssoRegistrationScopes: ['sso:account:access'],
            //             },
            //             options: { loginOnInvalidToken: false },
            //         },
            //         CancellationToken.None
            //     )
            // ).rejectedWith(Error)
            // expect(error.message).to.equal('SSO token not found.')
            // expect(autoRefresher.watch.calledOnce).to.be.false
        })
    })
})
