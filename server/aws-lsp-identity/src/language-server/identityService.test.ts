import { expect, use } from 'chai'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { awsBuilderIdReservedName, SsoCache, SsoClientRegistration } from '../sso'
import * as acp from '../sso/authorizationCodePkce/authorizationCodePkceFlow'
import { IdentityService } from './identityService'
import { ProfileData, ProfileStore } from './profiles/profileService'
import { SsoTokenAutoRefresher } from './ssoTokenAutoRefresher'
import { createStubInstance, restore, stub } from 'sinon'
import { CancellationToken, ProfileKind, SsoTokenSourceKind } from '@aws/language-server-runtimes/protocol'
import { SSOToken } from '@smithy/shared-ini-file-loader'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

let sut: IdentityService

let profileStore: StubbedInstance<ProfileStore>
let ssoCache: StubbedInstance<SsoCache>
let autoRefresher: StubbedInstance<SsoTokenAutoRefresher>

describe('IdentityService', () => {
    beforeEach(() => {
        profileStore = stubInterface<ProfileStore>({
            load: Promise.resolve({
                profiles: [
                    {
                        kinds: [ProfileKind.SsoTokenProfile],
                        name: 'my-profile',
                        settings: {
                            sso_session: 'my-sso-session',
                        },
                    },
                ],
                ssoSessions: [
                    {
                        name: 'my-sso-session',
                        settings: {
                            sso_region: 'us-east-1',
                            sso_registration_scopes: ['sso:account:access'],
                            sso_start_url: 'https://nowhere',
                        },
                    },
                ],
            } satisfies ProfileData),
        })

        ssoCache = stubInterface<SsoCache>({
            getSsoClientRegistration: Promise.resolve({
                clientId: 'my-client-id',
                clientSecret: 'my-client-secret',
                expiresAt: new Date(Date.now() + 10 * 1000).toISOString(),
                issuedAt: new Date(Date.now()).toISOString(),
                scopes: ['sso:account:access'],
            } satisfies SsoClientRegistration),
            removeSsoToken: Promise.resolve(),
            setSsoToken: Promise.resolve(),
        })

        autoRefresher = createStubInstance(SsoTokenAutoRefresher, {
            watch: Promise.resolve(),
            unwatch: undefined,
        }) as StubbedInstance<SsoTokenAutoRefresher>

        stub(acp, 'authorizationCodePkceFlow').returns(
            Promise.resolve({
                accessToken: 'my-access-token',
                expiresAt: new Date(Date.now() + 10 * 1000).toISOString(),
            } satisfies SSOToken)
        )
    })

    afterEach(() => {
        restore()
    })

    describe('getSsoToken', () => {
        it('Can login with AWS Builder ID.', async () => {
            sut = new IdentityService(profileStore, ssoCache, autoRefresher, _ => {})

            const actual = await sut.getSsoToken(
                {
                    clientName: 'my-client',
                    source: { kind: SsoTokenSourceKind.AwsBuilderId, ssoRegistrationScopes: ['sso:account:access'] },
                },
                CancellationToken.None
            )

            expect(actual.ssoToken.id).to.equal(awsBuilderIdReservedName)
            expect(actual.ssoToken.accessToken).to.equal('my-access-token')
            expect(autoRefresher.watch.calledOnce).to.be.true
        })

        it('Can login with IAM Identity Center.', async () => {
            sut = new IdentityService(profileStore, ssoCache, autoRefresher, _ => {})

            const actual = await sut.getSsoToken(
                {
                    clientName: 'my-client',
                    source: { kind: SsoTokenSourceKind.IamIdentityCenter, profileName: 'my-profile' },
                },
                CancellationToken.None
            )

            expect(actual.ssoToken.id).to.equal('my-sso-session')
            expect(actual.ssoToken.accessToken).to.equal('my-access-token')
            expect(autoRefresher.watch.calledOnce).to.be.true
        })

        it('Throws when no SSO token cached and loginOnInvalidToken is false.', async () => {
            sut = new IdentityService(profileStore, ssoCache, autoRefresher, _ => {})

            const error = await expect(
                sut.getSsoToken(
                    {
                        clientName: 'my-client',
                        source: {
                            kind: SsoTokenSourceKind.AwsBuilderId,
                            ssoRegistrationScopes: ['sso:account:access'],
                        },
                        options: { loginOnInvalidToken: false },
                    },
                    CancellationToken.None
                )
            ).rejectedWith(Error)

            expect(error.message).to.equal('SSO token not found.')
            expect(autoRefresher.watch.calledOnce).to.be.false
        })
    })

    describe('invalidateSsoToken', () => {
        it('removeToken removes on valid SSO session name', async () => {
            sut = new IdentityService(profileStore, ssoCache, autoRefresher, _ => {})

            await sut.invalidateSsoToken({ ssoTokenId: 'my-sso-session' }, CancellationToken.None)

            expect(ssoCache.removeSsoToken.called).is.true
        })

        it('removeToken throws on invalid SSO session name', async () => {
            sut = new IdentityService(profileStore, ssoCache, autoRefresher, _ => {})

            await expect(sut.invalidateSsoToken({ ssoTokenId: '   ' }, CancellationToken.None)).to.be.rejectedWith()

            expect(ssoCache.removeSsoToken.notCalled).is.true
        })
    })
})
