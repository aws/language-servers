import { expect, use } from 'chai'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { awsBuilderIdReservedName, SsoCache, SsoClientRegistration } from '../sso'
import { IdentityService } from './identityService'
import { ProfileData, ProfileStore } from './profiles/profileService'
import { SsoTokenAutoRefresher } from './ssoTokenAutoRefresher'
import { createStubInstance, restore, spy, SinonSpy, stub } from 'sinon'
import {
    AuthorizationFlowKind,
    CancellationToken,
    IamCredentials,
    ProfileKind,
    SsoTokenSourceKind,
} from '@aws/language-server-runtimes/protocol'
import { SSOToken } from '@smithy/shared-ini-file-loader'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { Observability } from '@aws/lsp-core'
import { StsCache } from '../sts/cache/stsCache'
import { StsAutoRefresher } from '../sts/stsAutoRefresher'
import * as processProvider from '../providers/processProvider'
import { STSClient } from '@aws-sdk/client-sts'
import { IAMClient } from '@aws-sdk/client-iam'

// eslint-disable-next-line
use(require('chai-as-promised'))

let sut: IdentityService

let profileStore: StubbedInstance<ProfileStore>
let ssoCache: StubbedInstance<SsoCache>
let stsCache: StubbedInstance<StsCache>
let autoRefresher: StubbedInstance<SsoTokenAutoRefresher>
let stsAutoRefresher: StubbedInstance<StsAutoRefresher>
let observability: StubbedInstance<Observability>
let authFlowFn: SinonSpy

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
                    {
                        kinds: [ProfileKind.IamCredentialsProfile],
                        name: 'my-sts-profile',
                        settings: {
                            aws_access_key_id: 'my-access-key',
                            aws_secret_access_key: 'my-secret-key',
                            aws_session_token: 'my-session-token',
                        },
                    },
                    {
                        kinds: [ProfileKind.IamSourceProfileProfile],
                        name: 'my-role-profile',
                        settings: {
                            role_arn: 'my-role-arn',
                            source_profile: 'my-iam-profile',
                        },
                    },
                    {
                        kinds: [ProfileKind.IamSourceProfileProfile],
                        name: 'my-mfa-profile',
                        settings: {
                            role_arn: 'my-role-arn',
                            source_profile: 'my-iam-profile',
                            mfa_serial: 'my-device-arn',
                        },
                    },
                    {
                        kinds: [ProfileKind.IamCredentialProcessProfile],
                        name: 'my-process-profile',
                        settings: {
                            credential_process: 'my-process',
                        },
                    },
                    {
                        kinds: [ProfileKind.IamSourceProfileProfile],
                        name: 'cyclic-profile-1',
                        settings: {
                            role_arn: 'my-role-arn',
                            source_profile: 'cyclic-profile-1',
                        },
                    },
                    {
                        kinds: [ProfileKind.IamSourceProfileProfile],
                        name: 'cyclic-profile-2',
                        settings: {
                            role_arn: 'my-role-arn',
                            source_profile: 'cyclic-profile-3',
                        },
                    },
                    {
                        kinds: [ProfileKind.IamSourceProfileProfile],
                        name: 'cyclic-profile-3',
                        settings: {
                            role_arn: 'my-role-arn',
                            source_profile: 'cyclic-profile-2',
                        },
                    },
                    {
                        kinds: [ProfileKind.IamSourceProfileProfile],
                        name: 'base-profile',
                        settings: {
                            role_arn: 'my-role-arn',
                            source_profile: 'intermediate-profile',
                        },
                    },
                    {
                        kinds: [ProfileKind.IamSourceProfileProfile],
                        name: 'intermediate-profile',
                        settings: {
                            role_arn: 'my-role-arn',
                            source_profile: 'my-iam-profile',
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
            {
                showUrl: _ => {},
                showMessageRequest: _ => Promise.resolve({ title: 'client-response' }),
                showProgress: _ => Promise.resolve(),
            },
            () => Promise.resolve({ code: 'mfa-code' }),
            'My Client',
            observability,
            {
                [AuthorizationFlowKind.Pkce]: authFlowFn,
                [AuthorizationFlowKind.DeviceCode]: authFlowFn,
            }
        )

        stub(STSClient.prototype, 'send').resolves({
            Credentials: {
                AccessKeyId: 'role-access-key',
                SecretAccessKey: 'role-secret-key',
                SessionToken: 'role-session-token',
                Expiration: new Date('2024-09-25T18:09:20.455Z'),
            },
            AssumedRoleUser: {
                Arn: 'role-arn',
                AssumedRoleId: 'role-id',
            },
            Arn: 'role-arn',
        })

        stub(IAMClient.prototype, 'send').resolves({
            EvaluationResults: [],
        })

        const getProcessCredentialStub = stub(processProvider, 'getProcessCredential')
        getProcessCredentialStub.resolves({
            accessKeyId: 'process-access-key',
            secretAccessKey: 'process-secret-key',
            sessionToken: 'process-session-token',
            expiration: new Date('2024-09-25T18:09:20.455Z'),
        } as IamCredentials)
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
        it('Can login with access key and secret key.', async () => {
            const actual = await sut.getIamCredential({ profileName: 'my-iam-profile' }, CancellationToken.None)

            expect(actual.credentials.accessKeyId).to.equal('my-access-key')
            expect(actual.credentials.secretAccessKey).to.equal('my-secret-key')
        })

        it('Can login with access key, secret key, and session token.', async () => {
            const actual = await sut.getIamCredential({ profileName: 'my-sts-profile' }, CancellationToken.None)

            expect(actual.credentials.accessKeyId).to.equal('my-access-key')
            expect(actual.credentials.secretAccessKey).to.equal('my-secret-key')
            expect(actual.credentials.sessionToken).to.equal('my-session-token')
        })

        it('Can login with assumed role.', async () => {
            const actual = await sut.getIamCredential({ profileName: 'my-role-profile' }, CancellationToken.None)

            expect(actual.credentials.accessKeyId).to.equal('role-access-key')
            expect(actual.credentials.secretAccessKey).to.equal('role-secret-key')
            expect(actual.credentials.sessionToken).to.equal('role-session-token')
            expect(actual.credentials.expiration?.toISOString()).to.equal('2024-09-25T18:09:20.455Z')
            expect(stsAutoRefresher.watch.calledOnce).to.be.true
        })

        it('Returns existing STS credential.', async () => {
            stsCache.getStsCredential = (() =>
                Promise.resolve({
                    Credentials: {
                        AccessKeyId: 'other-access-key',
                        SecretAccessKey: 'other-secret-key',
                        SessionToken: 'other-session-token',
                        Expiration: new Date('2024-10-25T18:09:20.455Z'),
                    },
                    AssumedRoleUser: {
                        Arn: 'other-role-arn',
                        AssumedRoleId: 'other-role-id',
                    },
                })) as any
            const actual = await sut.getIamCredential({ profileName: 'my-role-profile' }, CancellationToken.None)

            expect(actual.credentials.accessKeyId).to.equal('other-access-key')
            expect(actual.credentials.secretAccessKey).to.equal('other-secret-key')
            expect(actual.credentials.sessionToken).to.equal('other-session-token')
            expect(actual.credentials.expiration?.toISOString()).to.equal('2024-10-25T18:09:20.455Z')
            expect(stsAutoRefresher.watch.calledOnce).to.be.true
        })

        it('Throws when no STS credential cached and callStsOnInvalidIamCredential is false.', async () => {
            const error = await expect(
                sut.getIamCredential(
                    {
                        profileName: 'my-role-profile',
                        options: { callStsOnInvalidIamCredential: false },
                    },
                    CancellationToken.None
                )
            ).rejectedWith(Error)

            expect(error.message).to.equal('STS credential not found.')
            expect(stsAutoRefresher.watch.calledOnce).to.be.false
        })

        it('Can login with chained IamSourceProfileProfiles.', async () => {
            const actual = await sut.getIamCredential({ profileName: 'base-profile' }, CancellationToken.None)

            expect(actual.credentials.accessKeyId).to.equal('role-access-key')
            expect(actual.credentials.secretAccessKey).to.equal('role-secret-key')
            expect(actual.credentials.sessionToken).to.equal('role-session-token')
            expect(actual.credentials.expiration?.toISOString()).to.equal('2024-09-25T18:09:20.455Z')
            expect(stsAutoRefresher.watch.called).to.be.true
        })

        it('Throws when IamSourceProfileProfile points to itself.', async () => {
            const error = await expect(
                sut.getIamCredential({ profileName: 'cyclic-profile-1' }, CancellationToken.None)
            ).rejectedWith(Error)

            expect(error.message).to.equal('Source profile chain exceeded max length.')
            expect(stsAutoRefresher.watch.calledOnce).to.be.false
        })

        it('Throws when IamSourceProfileProfile form cycle.', async () => {
            const error = await expect(
                sut.getIamCredential({ profileName: 'cyclic-profile-2' }, CancellationToken.None)
            ).rejectedWith(Error)

            expect(error.message).to.equal('Source profile chain exceeded max length.')
            expect(stsAutoRefresher.watch.calledOnce).to.be.false
        })

        it('Can login with credential process.', async () => {
            const actual = await sut.getIamCredential({ profileName: 'my-process-profile' }, CancellationToken.None)

            expect(actual.credentials.accessKeyId).to.equal('process-access-key')
            expect(actual.credentials.secretAccessKey).to.equal('process-secret-key')
            expect(actual.credentials.sessionToken).to.equal('process-session-token')
            expect(actual.credentials.expiration?.toISOString()).to.equal('2024-09-25T18:09:20.455Z')
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
        it('Removes on valid profile name', async () => {
            await sut.invalidateStsCredential({ profileName: 'my-role-profile' }, CancellationToken.None)

            expect(stsCache.removeStsCredential.called).is.true
        })

        it('Throws on invalid profile name', async () => {
            await expect(
                sut.invalidateStsCredential({ profileName: '   ' }, CancellationToken.None)
            ).to.be.rejectedWith()

            expect(stsCache.removeStsCredential.notCalled).is.true
        })
    })
})
