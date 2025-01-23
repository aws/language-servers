import { ProfileData, profileDuckTypers, ProfileService, ProfileStore, ssoSessionDuckTyper } from './profileService'
import {
    AwsErrorCodes,
    Logging,
    Profile,
    ProfileKind,
    SsoSession,
    Telemetry,
    UpdateProfileParams,
} from '@aws/language-server-runtimes/server-interface'
import { normalizeParsedIniData } from '../../sharedConfig/saveKnownFiles'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { expect, use } from 'chai'
import { AwsError, Observability } from '@aws/lsp-core'

// eslint-disable-next-line @typescript-eslint/no-require-imports
use(require('chai-as-promised'))

let sut: ProfileService

let store: StubbedInstance<ProfileStore>
let observability: StubbedInstance<Observability>
let profile1: Profile
let profile2: Profile
let profile3: Profile
let ssoSession1: SsoSession
let ssoSession2: SsoSession

describe('ProfileService', async () => {
    beforeEach(() => {
        profile1 = {
            kinds: [ProfileKind.SsoTokenProfile],
            name: 'profile1',
            settings: {
                sso_session: 'ssoSession1',
            },
        }

        profile2 = {
            kinds: [ProfileKind.Unknown],
            name: 'profile2',
            settings: {
                region: 'whatever',
            },
        }

        profile3 = {
            kinds: [ProfileKind.SsoTokenProfile],
            name: 'profile3',
            settings: {
                sso_session: 'ssoSession2',
            },
        }

        ssoSession1 = {
            name: 'ssoSession1',
            settings: {
                sso_region: 'us-west-1',
                sso_start_url: 'http://nowhere',
                sso_registration_scopes: ['a', 'b', 'c'],
            },
        }

        ssoSession2 = {
            name: 'ssoSession2',
            settings: {
                sso_region: 'us-west-2',
                sso_start_url: 'http://nowhere',
            },
        }

        store = stubInterface<ProfileStore>({
            load: Promise.resolve({
                profiles: [profile1, profile2, profile3],
                ssoSessions: [ssoSession1, ssoSession2],
            } satisfies ProfileData),
            save: Promise.resolve(),
        })

        observability = stubInterface<Observability>()
        observability.logging = stubInterface<Logging>()
        observability.telemetry = stubInterface<Telemetry>()

        sut = new ProfileService(store, observability)
    })

    it('listProfiles return profiles and sso-sessions', async () => {
        const actual = await sut.listProfiles({})

        expect(actual.profiles).to.be.an('array').that.has.deep.members([profile1, profile2, profile3])
        expect(actual.ssoSessions).to.be.an('array').that.has.deep.members([ssoSession1, ssoSession2])
    })

    it('listProfiles returns empty arrays when no profiles or sso-sessions', async () => {
        store.load.returns(
            Promise.resolve({
                profiles: [],
                ssoSessions: [],
            })
        )

        const actual = await sut.listProfiles({})

        expect(actual.profiles).to.be.an('array').lengthOf(0)
        expect(actual.ssoSessions).to.be.an('array').lengthOf(0)
    })

    it('updateProfile updates existing profiles and sso-sessions', async () => {
        await sut.updateProfile({
            profile: {
                kinds: [ProfileKind.SsoTokenProfile],
                name: 'profile1',
                settings: {
                    sso_session: 'ssoSession1',
                    region: 'us-west-2',
                },
            },
            ssoSession: {
                name: 'ssoSession1',
                settings: {
                    sso_region: 'us-west-1',
                    sso_start_url: 'http://newnowhere',
                    sso_registration_scopes: ['x', 'y', 'z'],
                },
            },
        })

        const [[data]] = store.save.args

        expect(data).to.deep.equal({
            profiles: [
                {
                    kinds: [ProfileKind.SsoTokenProfile],
                    name: 'profile1',
                    settings: {
                        sso_session: 'ssoSession1',
                        region: 'us-west-2',
                    },
                },
            ],
            ssoSessions: [
                {
                    name: 'ssoSession1',
                    settings: {
                        sso_region: 'us-west-1',
                        sso_start_url: 'http://newnowhere',
                        sso_registration_scopes: ['x', 'y', 'z'],
                    },
                },
            ],
        })
    })

    it('updateProfile creates new profiles and sso-sessions', async () => {
        const newProfile = {
            kinds: [ProfileKind.SsoTokenProfile],
            name: 'newProfile',
            settings: {
                sso_session: 'newSsoSession',
                region: 'us-west-2',
            },
        }

        const newSsoSession = {
            name: 'newSsoSession',
            settings: {
                sso_region: 'us-west-1',
                sso_start_url: 'http://nowhere',
                sso_registration_scopes: ['scope'],
            },
        }

        await sut.updateProfile({
            profile: newProfile,
            ssoSession: newSsoSession,
        })

        const [[data]] = store.save.args

        expect(data).to.deep.equal({
            profiles: [newProfile],
            ssoSessions: [newSsoSession],
        })
    })

    async function expectAwsError(
        service: ProfileService,
        params: UpdateProfileParams,
        awsErrorCode: string,
        message: string
    ): Promise<void> {
        const error = await expect(service.updateProfile(params)).rejectedWith(AwsError)
        expect(error.message).equal(message)
        expect(error.awsErrorCode).equal(awsErrorCode)
    }

    it('updateProfile throws on no profile', async () => {
        expectAwsError(sut, { profile: undefined! }, AwsErrorCodes.E_INVALID_PROFILE, 'Profile required.')
    })

    it('updateProfile throws on non-SSO token profile', async () => {
        const profile = {
            kinds: [ProfileKind.Unknown],
            name: 'profile-name',
            settings: {
                sso_session: 'sso-session-name',
            },
        }

        await expectAwsError(
            sut,
            { profile },
            AwsErrorCodes.E_INVALID_PROFILE,
            'Profile must be non-legacy sso-session type.'
        )
    })

    it('updateProfile throws on no profile name', async () => {
        const profile = {
            kinds: [ProfileKind.SsoTokenProfile],
            name: '',
            settings: {
                sso_session: 'sso-session-name',
            },
        }

        await expectAwsError(sut, { profile }, AwsErrorCodes.E_INVALID_PROFILE, 'Profile name required.')
    })

    it('updateProfile throws on no settings', async () => {
        const profile = {
            kinds: [ProfileKind.SsoTokenProfile],
            name: 'profile-name',
        }

        await expectAwsError(
            sut,
            { profile: profile as Profile },
            AwsErrorCodes.E_INVALID_PROFILE,
            'Settings required on profile.'
        )
    })

    it('updateProfile throws on no sso-session', async () => {
        const profile = {
            kinds: [ProfileKind.SsoTokenProfile],
            name: 'profile-name',
            settings: {
                sso_session: '',
            },
        }

        await expectAwsError(sut, { profile }, AwsErrorCodes.E_INVALID_PROFILE, 'Sso-session name required on profile.')
    })

    it('updateProfile throws on no sso-session on profile', async () => {
        const profile = {
            kinds: [ProfileKind.SsoTokenProfile],
            name: 'profile-name',
            settings: {
                sso_session: '',
            },
        }

        await expectAwsError(sut, { profile }, AwsErrorCodes.E_INVALID_PROFILE, 'Sso-session name required on profile.')
    })

    it('updateProfile throws when profile cannot be created', async () => {
        const profile = {
            kinds: [ProfileKind.SsoTokenProfile],
            name: 'nonexistent-profile-name',
            settings: {
                sso_session: 'ssoSession',
            },
        }

        const ssoSession = {
            name: 'ssoSession',
            settings: {
                sso_region: 'us-west-2',
                sso_start_url: 'http://nowhere',
            },
        }

        await expectAwsError(
            sut,
            { profile, ssoSession, options: { createNonexistentProfile: false } },
            AwsErrorCodes.E_CANNOT_CREATE_PROFILE,
            'Cannot create profile.'
        )
    })

    it('updateProfile throws on no sso-session name', async () => {
        const ssoSession = {
            name: '',
            settings: {
                sso_region: 'us-west-2',
                sso_start_url: 'http://nowhere',
            },
        }

        await expectAwsError(
            sut,
            { profile: profile1, ssoSession },
            AwsErrorCodes.E_INVALID_SSO_SESSION,
            'Sso-session name required.'
        )
    })

    it('updateProfile throws on no sso-session settings', async () => {
        const ssoSession = {
            name: 'ssoSession',
        }

        await expectAwsError(
            sut,
            { profile: profile1, ssoSession: ssoSession as SsoSession },
            AwsErrorCodes.E_INVALID_SSO_SESSION,
            'Settings required on sso-session.'
        )
    })

    it('updateProfile throws on no sso-session region', async () => {
        const ssoSession = {
            name: 'ssoSession',
            settings: {
                sso_region: '',
                sso_start_url: 'http://nowhere',
            },
        }

        await expectAwsError(
            sut,
            { profile: profile1, ssoSession },
            AwsErrorCodes.E_INVALID_SSO_SESSION,
            'Sso-session region required.'
        )
    })

    it('updateProfile throws on no sso-session start URL', async () => {
        const ssoSession = {
            name: 'ssoSession',
            settings: {
                sso_region: 'us-west-2',
                sso_start_url: '',
            },
        }

        await expectAwsError(
            sut,
            { profile: profile1, ssoSession },
            AwsErrorCodes.E_INVALID_SSO_SESSION,
            'Sso-session start URL required.'
        )
    })

    it('updateProfile throws on sso-session different than name referenced on profile', async () => {
        const ssoSession = {
            name: 'notTheSsoSession',
            settings: {
                sso_region: 'us-west-2',
                sso_start_url: 'http://nowhere',
            },
        }

        await expectAwsError(
            sut,
            { profile: profile1, ssoSession },
            AwsErrorCodes.E_INVALID_PROFILE,
            'Profile sso-session name must be the same as provided sso-session.'
        )
    })

    it('updateProfile throws when sso-session cannot be created', async () => {
        profile1.settings!.sso_session = 'nonexistent-sso-session-name'

        const ssoSession = {
            name: 'nonexistent-sso-session-name',
            settings: {
                sso_region: 'us-west-2',
                sso_start_url: 'http://nowhere',
            },
        }

        await expectAwsError(
            sut,
            { profile: profile1, ssoSession, options: { createNonexistentSsoSession: false } },
            AwsErrorCodes.E_CANNOT_CREATE_SSO_SESSION,
            'Cannot create sso-session.'
        )
    })

    it('updateProfile throws when cannot update shared sso-session', async () => {
        profile3.settings!.sso_session = 'ssoSession1'

        const ssoSession = {
            name: 'ssoSession1',
            settings: {
                sso_region: 'change something',
                sso_start_url: 'http://nowhere',
            },
        }

        await expectAwsError(
            sut,
            { profile: profile3, ssoSession, options: { updateSharedSsoSession: false } },
            AwsErrorCodes.E_CANNOT_OVERWRITE_SSO_SESSION,
            'Cannot update shared sso-session.'
        )
    })
})

describe('profileService.DuckTypers', () => {
    it('profileDuckTypers.eval returns true on valid profiles', () => {
        const profiles = [
            {
                sso_session: 'my-sso-session',
            },
            {
                sso_session: 'another sesson',
                another_setting: 'whatever',
            },
        ]

        for (const profile of profiles) {
            const actual = profileDuckTypers.SsoTokenProfile.eval(profile)
            expect(actual).to.be.true
        }
    })

    it('profileDuckTypers returns false on invalid profiles', () => {
        const profiles = [
            {
                SSO_session: 'my-sso-session',
            },
            {},
            null,
            {
                sso_session: 'legacy SSO profile',
                sso_account_id: '123',
            },
        ]

        for (const profile of profiles) {
            const actual = profileDuckTypers.SsoTokenProfile.eval(profile as object)
            expect(actual).to.be.false
        }
    })

    it('ssoSessionDuckTyper.eval returns true on valid sso-sessions', () => {
        const ssoSessions = [
            {
                sso_region: 'us-east-1',
                sso_start_url: 'http://nowhere',
            },
            {
                sso_region: 'us-east-1',
                sso_start_url: 'http://nowhere',
                sso_registration_scopes: 'some,scopes',
            },
        ]

        for (const ssoSession of ssoSessions) {
            const actual = ssoSessionDuckTyper.eval(ssoSession)
            expect(actual).to.be.true
        }
    })

    it('ssoSessionDuckTyper returns false on invalid sso-sessions', () => {
        const ssoSessions = [
            {
                SSO_region: 'us-west-2',
                SSO_start_URL: 'http://nowhere',
            },
            {},
            null,
            {
                sso_region: 'missing start URL',
            },
        ]

        for (const ssoSession of ssoSessions) {
            const actual = ssoSessionDuckTyper.eval(ssoSession as object)
            expect(actual).to.be.false
        }
    })
})

describe('profileService.functions', () => {
    it('normalizeParsedIniData changes all key names to lowercase', () => {
        const actual = normalizeParsedIniData({
            ssoProfile: {
                'api_versions.EC2': '2020-01-01',
                'API_versions.S3': '1000-13-14',
                SSO_session: 'my SSO session',
                AWS_Access_Key_ID: 'ALL IN CAPS',
            },
            second: {
                BIG_LETTERS: 'Up AnD DoWn',
            },
        })

        const expected = {
            ssoProfile: {
                'api_versions.ec2': '2020-01-01',
                'api_versions.s3': '1000-13-14',
                sso_session: 'my SSO session',
                aws_access_key_id: 'ALL IN CAPS',
            },
            second: {
                big_letters: 'Up AnD DoWn',
            },
        }

        expect(actual).to.deep.equal(expected)
    })
})
