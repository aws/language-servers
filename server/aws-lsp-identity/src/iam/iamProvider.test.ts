import { expect, use } from 'chai'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { ProfileData, ProfileStore } from '../language-server/profiles/profileService'
import { createStubInstance, restore, SinonStub, stub } from 'sinon'
import { CancellationToken, Profile, ProfileKind } from '@aws/language-server-runtimes/protocol'
import { Logging, Telemetry } from '@aws/language-server-runtimes/server-interface'
import { IamCredentials, Observability } from '@aws/lsp-core'
import { StsCache } from '../sts/cache/stsCache'
import { StsAutoRefresher } from '../sts/stsAutoRefresher'
import { IamProvider } from '../iam/iamProvider'
import { IamFlowParams } from './utils'
import * as iamUtils from '../iam/utils'
import { STSClient } from '@aws-sdk/client-sts'
import { SimulatePrincipalPolicyCommandOutput } from '@aws-sdk/client-iam'

// eslint-disable-next-line
use(require('chai-as-promised'))

let sut: IamProvider
let defaultParams: IamFlowParams
let defaultProfile: Profile
let profileStore: StubbedInstance<ProfileStore>
let stsCache: StubbedInstance<StsCache>
let stsAutoRefresher: StubbedInstance<StsAutoRefresher>
let handlers: StubbedInstance<iamUtils.IamHandlers>
let observability: StubbedInstance<Observability>
let token: StubbedInstance<CancellationToken>
let simulatePermissionsStub: SinonStub<
    [credentials: IamCredentials, permissions: string[], region?: string | undefined],
    Promise<SimulatePrincipalPolicyCommandOutput>
>

describe('IamProvider', () => {
    beforeEach(() => {
        defaultProfile = {
            kinds: [ProfileKind.Unknown],
            name: 'default-profile',
        }

        profileStore = stubInterface<ProfileStore>({
            load: Promise.resolve({
                profiles: [
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
                    {
                        kinds: [ProfileKind.IamCredentialsProfile],
                        name: 'my-iam-profile',
                        settings: {
                            aws_access_key_id: 'my-access-key',
                            aws_secret_access_key: 'my-secret-key',
                        },
                    },
                ],
                ssoSessions: [],
            } satisfies ProfileData),
        })

        stsCache = stubInterface<StsCache>({
            getStsCredential: Promise.resolve(undefined),
            setStsCredential: Promise.resolve(),
            removeStsCredential: Promise.resolve(),
        })

        stsAutoRefresher = createStubInstance(StsAutoRefresher, {
            watch: Promise.resolve(),
            unwatch: undefined,
        }) as StubbedInstance<StsAutoRefresher>

        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()

        handlers = stubInterface<iamUtils.IamHandlers>({
            sendGetMfaCode: Promise.resolve({ code: 'mfa-code' }),
        })

        token = stubInterface<CancellationToken>()

        defaultParams = {
            profile: defaultProfile,
            callStsOnInvalidIamCredential: true,
            profileStore: profileStore,
            stsCache: stsCache,
            stsAutoRefresher: stsAutoRefresher,
            handlers: handlers,
            token: token,
            observability: observability,
        }

        sut = new IamProvider()

        simulatePermissionsStub = stub(iamUtils, 'simulatePermissions')
        simulatePermissionsStub.resolves({
            $metadata: {},
            EvaluationResults: [],
        })

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
        })
    })

    afterEach(() => {
        restore()
    })

    describe('getCredential', () => {
        it('Can get credentials from profile', async () => {
            const profile: Profile = {
                kinds: [ProfileKind.IamCredentialsProfile],
                name: 'iam-profile',
                settings: {
                    aws_access_key_id: 'access-key',
                    aws_secret_access_key: 'secret-key',
                    aws_session_token: 'session-token',
                },
            }
            const actual = await sut.getCredential({ ...defaultParams, profile: profile })

            expect(actual.accessKeyId).to.equal('access-key')
            expect(actual.secretAccessKey).to.equal('secret-key')
            expect(actual.sessionToken).to.equal('session-token')
        })

        it('Can generate credentials by assuming role.', async () => {
            const profile: Profile = {
                kinds: [ProfileKind.IamSourceProfileProfile],
                name: 'my-role-profile',
                settings: {
                    role_arn: 'my-role-arn',
                    source_profile: 'my-iam-profile',
                },
            }
            const actual = await sut.getCredential({ ...defaultParams, profile: profile })

            expect(actual.accessKeyId).to.equal('role-access-key')
            expect(actual.secretAccessKey).to.equal('role-secret-key')
            expect(actual.sessionToken).to.equal('role-session-token')
            expect(actual.expiration?.toISOString()).to.equal('2024-09-25T18:09:20.455Z')
            expect(stsAutoRefresher.watch.calledOnce).to.be.true
        })

        it('Can generate credentials with MFA.', async () => {
            simulatePermissionsStub.resolves({
                $metadata: {},
                EvaluationResults: [
                    {
                        EvalActionName: 'name',
                        EvalResourceName: 'resource',
                        EvalDecision: 'implicitDeny',
                        MissingContextValues: ['aws:MultiFactorAuthPresent'],
                    },
                ],
            })
            const profile: Profile = {
                kinds: [ProfileKind.IamSourceProfileProfile],
                name: 'my-mfa-profile',
                settings: {
                    role_arn: 'my-role-arn',
                    source_profile: 'my-iam-profile',
                    mfa_serial: 'my-device-arn',
                },
            }
            const actual = await sut.getCredential({ ...defaultParams, profile: profile })

            expect(actual.accessKeyId).to.equal('role-access-key')
            expect(actual.secretAccessKey).to.equal('role-secret-key')
            expect(actual.sessionToken).to.equal('role-session-token')
            expect(actual.expiration?.toISOString()).to.equal('2024-09-25T18:09:20.455Z')
            expect(handlers.sendGetMfaCode.calledOnce).to.be.true
        })

        it('Returns existing STS credential.', async () => {
            const profile: Profile = {
                kinds: [ProfileKind.IamSourceProfileProfile],
                name: 'my-role-profile',
                settings: {
                    role_arn: 'my-role-arn',
                    source_profile: 'my-iam-profile',
                },
            }
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
            const actual = await sut.getCredential({ ...defaultParams, profile: profile })

            expect(actual.accessKeyId).to.equal('other-access-key')
            expect(actual.secretAccessKey).to.equal('other-secret-key')
            expect(actual.sessionToken).to.equal('other-session-token')
            expect(actual.expiration?.toISOString()).to.equal('2024-10-25T18:09:20.455Z')
            expect(stsAutoRefresher.watch.calledOnce).to.be.true
        })

        it('Throws when no STS credential cached and callStsOnInvalidIamCredential is false.', async () => {
            const profile: Profile = {
                kinds: [ProfileKind.IamSourceProfileProfile],
                name: 'my-role-profile',
                settings: {
                    role_arn: 'my-role-arn',
                    source_profile: 'my-iam-profile',
                },
            }
            const error = await expect(
                sut.getCredential({ ...defaultParams, profile: profile, callStsOnInvalidIamCredential: false })
            ).rejectedWith(Error)

            expect(error.message).to.equal('STS credential not found.')
            expect(stsAutoRefresher.watch.calledOnce).to.be.false
        })

        it('Can login with chained IamSourceProfileProfiles.', async () => {
            const profile: Profile = {
                kinds: [ProfileKind.IamSourceProfileProfile],
                name: 'base-profile',
                settings: {
                    role_arn: 'my-role-arn',
                    source_profile: 'intermediate-profile',
                },
            }
            const actual = await sut.getCredential({ ...defaultParams, profile: profile })

            expect(actual.accessKeyId).to.equal('role-access-key')
            expect(actual.secretAccessKey).to.equal('role-secret-key')
            expect(actual.sessionToken).to.equal('role-session-token')
            expect(actual.expiration?.toISOString()).to.equal('2024-09-25T18:09:20.455Z')
            expect(stsAutoRefresher.watch.called).to.be.true
        })

        it('Throws when IamSourceProfileProfile points to itself.', async () => {
            const profile: Profile = {
                kinds: [ProfileKind.IamSourceProfileProfile],
                name: 'cyclic-profile-1',
                settings: {
                    role_arn: 'my-role-arn',
                    source_profile: 'cyclic-profile-1',
                },
            }
            const error = await expect(sut.getCredential({ ...defaultParams, profile: profile })).rejectedWith(Error)

            expect(error.message).to.equal('Source profile chain exceeded max length.')
            expect(stsAutoRefresher.watch.calledOnce).to.be.false
        })

        it('Throws when IamSourceProfileProfile form cycle.', async () => {
            const profile: Profile = {
                kinds: [ProfileKind.IamSourceProfileProfile],
                name: 'cyclic-profile-2',
                settings: {
                    role_arn: 'my-role-arn',
                    source_profile: 'cyclic-profile-3',
                },
            }
            const error = await expect(sut.getCredential({ ...defaultParams, profile: profile })).rejectedWith(Error)

            expect(error.message).to.equal('Source profile chain exceeded max length.')
            expect(stsAutoRefresher.watch.calledOnce).to.be.false
        })
    })
})
