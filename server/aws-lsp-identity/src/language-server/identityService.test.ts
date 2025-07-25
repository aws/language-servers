import { expect, use } from 'chai'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { awsBuilderIdReservedName, SsoCache, SsoClientRegistration } from '../sso'
import { IdentityService } from './identityService'
import { ProfileData, ProfileStore } from './profiles/profileService'
import { SsoTokenAutoRefresher } from '../sso/ssoTokenAutoRefresher'
import { createStubInstance, restore, spy, SinonSpy, stub, SinonStub } from 'sinon'
import {
    AuthorizationFlowKind,
    CancellationToken,
    IamCredential,
    IamCredentials,
    ProfileKind,
    SsoTokenSourceKind,
} from '@aws/language-server-runtimes/protocol'
import { SSOToken } from '@smithy/shared-ini-file-loader'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { Observability } from '@aws/lsp-core'
import { StsCache } from '../sts/cache/stsCache'
import { StsAutoRefresher } from '../sts/stsAutoRefresher'
import { IamProvider } from '../iam/iamProvider'
import * as iamUtils from '../iam/utils'

// eslint-disable-next-line
use(require('chai-as-promised'))

let sut: IdentityService

let profileStore: StubbedInstance<ProfileStore>
let ssoCache: StubbedInstance<SsoCache>
let stsCache: StubbedInstance<StsCache>
let autoRefresher: StubbedInstance<SsoTokenAutoRefresher>
let stsAutoRefresher: StubbedInstance<StsAutoRefresher>
let iamProvider: StubbedInstance<IamProvider>
let observability: StubbedInstance<Observability>
let authFlowFn: SinonSpy
let validatePermissionsStub: SinonStub<
    [credentials: IamCredentials, permissions: string[], region?: string | undefined],
    Promise<boolean>
>

describe('IdentityService', () => {
    beforeEach(() => {
        profileStore = stubInterface<ProfileStore>({
            load: Promise.resolve({
                profiles: [
                    {
                        kinds: [ProfileKind.SsoTokenProfile],
                        name: 'my-sso-profile',
                        settings: {
                            sso_session: 'my-sso-session',
                        },
                    },
                    {
                        kinds: [ProfileKind.IamCredentialsProfile],
                        name: 'my-iam-profile',
                        settings: {
                            aws_access_key_id: 'my-access-key',
                            aws_secret_access_key: 'my-secret-key',
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
            getSsoToken: Promise.resolve(undefined),
            removeSsoToken: Promise.resolve(),
            setSsoToken: Promise.resolve(),
        })

        stsCache = stubInterface<StsCache>({
            getStsCredential: Promise.resolve(undefined),
            setStsCredential: Promise.resolve(),
            removeStsCredential: Promise.resolve(),
        })

        autoRefresher = createStubInstance(SsoTokenAutoRefresher, {
            watch: Promise.resolve(),
            unwatch: undefined,
        }) as StubbedInstance<SsoTokenAutoRefresher>

        stsAutoRefresher = createStubInstance(StsAutoRefresher, {
            watch: Promise.resolve(),
            unwatch: undefined,
        }) as StubbedInstance<StsAutoRefresher>

        iamProvider = createStubInstance(IamProvider, {
            getCredential: Promise.resolve({
                id: 'id',
                kinds: [],
                credentials: {
                    accessKeyId: 'access-key',
                    secretAccessKey: 'secret-key',
                },
            } as IamCredential),
        }) as StubbedInstance<IamProvider>

        authFlowFn = spy(() =>
            Promise.resolve({
                accessToken: 'my-access-token',
                expiresAt: new Date(Date.now() + 10 * 1000).toISOString(),
            } satisfies SSOToken)
        )

        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()

        sut = new IdentityService(
            profileStore,
            ssoCache,
            autoRefresher,
            stsCache,
            stsAutoRefresher,
            iamProvider,
            {
                showUrl: _ => {},
                showMessageRequest: _ => Promise.resolve({ title: 'client-response' }),
                showProgress: _ => Promise.resolve(),
                sendGetMfaCode: () => Promise.resolve({ code: 'mfa-code', mfaSerial: 'mfa-serial' }),
            },
            'My Client',
            observability,
            {
                [AuthorizationFlowKind.Pkce]: authFlowFn,
                [AuthorizationFlowKind.DeviceCode]: authFlowFn,
            }
        )

        validatePermissionsStub = stub(iamUtils, 'validatePermissions')
        validatePermissionsStub.resolves(true)
    })

    afterEach(() => {
        restore()
    })

    describe('getSsoToken', () => {
        it('Can login with AWS Builder ID.', async () => {
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
            const actual = await sut.getSsoToken(
                {
                    clientName: 'my-client',
                    source: { kind: SsoTokenSourceKind.IamIdentityCenter, profileName: 'my-sso-profile' },
                },
                CancellationToken.None
            )

            expect(actual.ssoToken.id).to.equal('my-sso-session')
            expect(actual.ssoToken.accessToken).to.equal('my-access-token')
            expect(autoRefresher.watch.calledOnce).to.be.true
        })

        it('Can login with different auth flows.', async () => {
            await sut.getSsoToken(
                {
                    clientName: 'my-client',
                    source: { kind: SsoTokenSourceKind.IamIdentityCenter, profileName: 'my-sso-profile' },
                    options: {
                        authorizationFlow: 'DeviceCode',
                    },
                },
                CancellationToken.None
            )
            expect(authFlowFn.calledOnce).to.be.true

            await sut.getSsoToken(
                {
                    clientName: 'my-client',
                    source: { kind: SsoTokenSourceKind.IamIdentityCenter, profileName: 'my-sso-profile' },
                    options: {
                        authorizationFlow: 'Pkce',
                    },
                },
                CancellationToken.None
            )
            expect(authFlowFn.calledTwice).to.be.true
        })

        it('Throws when auth flow is invalid.', async () => {
            const error = await expect(
                sut.getSsoToken(
                    {
                        clientName: 'my-client',
                        source: {
                            kind: SsoTokenSourceKind.AwsBuilderId,
                            ssoRegistrationScopes: ['sso:account:access'],
                        },
                        options: {
                            authorizationFlow: 'unknown' as any,
                        },
                    },
                    CancellationToken.None
                )
            ).rejectedWith(Error)

            expect(error.message).to.equal('Unsupported authorization flow requested: unknown')
            expect(autoRefresher.watch.calledOnce).to.be.false
        })

        it('Can login with cache error if loginOnInvalidToken is true.', async () => {
            const err = new Error('test created error')
            ssoCache.getSsoToken = (() => Promise.reject(err)) as any
            const actual = await sut.getSsoToken(
                {
                    clientName: 'my-client',
                    source: { kind: SsoTokenSourceKind.IamIdentityCenter, profileName: 'my-sso-profile' },
                },
                CancellationToken.None
            )

            expect(actual.ssoToken.id).to.equal('my-sso-session')
            expect(actual.ssoToken.accessToken).to.equal('my-access-token')
            expect(autoRefresher.watch.calledOnce).to.be.true
        })

        it('Returns existing SSO token.', async () => {
            ssoCache.getSsoToken = (() =>
                Promise.resolve({
                    accessToken: 'my-other-access-token',
                })) as any
            const actual = await sut.getSsoToken(
                {
                    clientName: 'my-client',
                    source: { kind: SsoTokenSourceKind.IamIdentityCenter, profileName: 'my-sso-profile' },
                },
                CancellationToken.None
            )

            expect(actual.ssoToken.id).to.equal('my-sso-session')
            expect(actual.ssoToken.accessToken).to.equal('my-other-access-token')
            expect(authFlowFn.called).to.be.false
            expect(autoRefresher.watch.calledOnce).to.be.true
        })

        it('Throws when no SSO token cached and loginOnInvalidToken is false.', async () => {
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

        it('Throws when SSO retrieval throws and loginOnInvalidToken is false.', async () => {
            const err = new Error('test created error')
            ssoCache.getSsoToken = (() => Promise.reject(err)) as any

            await expect(
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
            ).rejectedWith(err)

            expect(autoRefresher.watch.calledOnce).to.be.false
        })
    })

    describe('getIamCredential', () => {
        it('Can login with IAM credentials.', async () => {
            const actual = await sut.getIamCredential({ profileName: 'my-iam-profile' }, CancellationToken.None)

            expect(actual.credential.credentials.accessKeyId).to.equal('access-key')
            expect(actual.credential.credentials.secretAccessKey).to.equal('secret-key')
        })

        it('Throws when permissions are insufficient', async () => {
            validatePermissionsStub.resolves(false)
            const error = await expect(
                sut.getIamCredential({ profileName: 'my-iam-profile' }, CancellationToken.None)
            ).rejectedWith(Error)

            expect(error.message).to.equal('Credentials have insufficient permissions.')
        })
    })

    describe('invalidateSsoToken', () => {
        it('removeToken removes on valid SSO session name', async () => {
            await sut.invalidateSsoToken({ ssoTokenId: 'my-sso-session' }, CancellationToken.None)

            expect(ssoCache.removeSsoToken.called).is.true
        })

        it('removeToken throws on invalid SSO session name', async () => {
            await expect(sut.invalidateSsoToken({ ssoTokenId: '   ' }, CancellationToken.None)).to.be.rejectedWith()

            expect(ssoCache.removeSsoToken.notCalled).is.true
        })
    })

    describe('invalidateStsCredential', () => {
        it('Removes on valid name', async () => {
            await sut.invalidateStsCredential({ iamCredentialId: 'my-role-profile' }, CancellationToken.None)

            expect(stsCache.removeStsCredential.called).is.true
        })

        it('Throws on invalid name', async () => {
            await expect(
                sut.invalidateStsCredential({ iamCredentialId: '   ' }, CancellationToken.None)
            ).to.be.rejectedWith()

            expect(stsCache.removeStsCredential.notCalled).is.true
        })
    })
})
