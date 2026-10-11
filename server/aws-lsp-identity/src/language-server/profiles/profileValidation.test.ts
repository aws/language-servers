import assert from 'assert'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import mock from 'mock-fs'
import { AwsError, Observability } from '@aws/lsp-core'
import {
    AwsErrorCodes,
    Logging,
    ProfileKind,
    UpdateProfileParams,
} from '@aws/language-server-runtimes/server-interface'
import { stubInterface } from 'ts-sinon'
import { ProfileData, ProfileService, ProfileStore } from './profileService'
import { SharedConfigProfileStore } from './sharedConfigProfileStore'

function parameters(): UpdateProfileParams {
    return {
        profile: {
            kinds: [ProfileKind.SsoTokenProfile],
            name: 'profile',
            settings: { sso_session: 'session' },
        },
        ssoSession: {
            name: 'session',
            settings: { sso_region: 'us-west-2', sso_start_url: 'https://example.com/start' },
        },
    }
}

function observability(): Observability {
    const result = stubInterface<Observability>()
    result.logging = stubInterface<Logging>()
    return result
}

function hasErrorCode(code: string): (error: unknown) => boolean {
    return error => error instanceof AwsError && error.awsErrorCode === code
}

describe('ProfileService setting validation', () => {
    for (const name of [
        'credential_process',
        'services',
        '__proto__',
        'constructor',
        'region\nextra',
        'region=other',
    ]) {
        it(`rejects unsupported profile setting ${JSON.stringify(name)} before accessing the store`, async () => {
            const store = stubInterface<ProfileStore>()
            const service = new ProfileService(store, observability())
            const params = parameters()
            params.profile.settings = { ...params.profile.settings, [name]: 'unused' }

            await assert.rejects(service.updateProfile(params), hasErrorCode(AwsErrorCodes.E_INVALID_PROFILE))

            assert.strictEqual(store.load.callCount, 0)
            assert.strictEqual(store.save.callCount, 0)
        })
    }

    for (const name of ['credential_process', 'region', '__proto__', 'constructor', 'sso_region\nextra']) {
        it(`rejects unsupported session setting ${JSON.stringify(name)} before accessing the store`, async () => {
            const store = stubInterface<ProfileStore>()
            const service = new ProfileService(store, observability())
            const params = parameters()
            params.ssoSession!.settings = { ...params.ssoSession!.settings, [name]: 'unused' }

            await assert.rejects(service.updateProfile(params), hasErrorCode(AwsErrorCodes.E_INVALID_SSO_SESSION))

            assert.strictEqual(store.load.callCount, 0)
            assert.strictEqual(store.save.callCount, 0)
        })
    }

    it('accepts all supported profile and session settings', async () => {
        const store = stubInterface<ProfileStore>()
        store.load.resolves({ profiles: [], ssoSessions: [] })
        store.save.resolves()
        const service = new ProfileService(store, observability())
        const params = parameters()
        Object.assign(params.profile.settings!, {
            region: 'us-east-1',
            sso_account_id: '000000000000',
            sso_role_name: 'ExampleRole',
        })
        params.ssoSession!.settings!.sso_registration_scopes = ['sso:account:access']

        await service.updateProfile(params)

        assert.deepStrictEqual(store.save.firstCall.args[0], {
            profiles: [params.profile],
            ssoSessions: [params.ssoSession],
        })
    })
})

describe('SharedConfigProfileStore section validation', () => {
    const directory = join(tmpdir(), 'profile-validation')
    const configFilepath = join(directory, 'config')
    const filepath = join(directory, 'credentials')
    const config = '[profile existing]\nregion = us-west-2\nsso_session = existing-session\n'
    const credentials = '[existing]\naws_access_key_id = test-key\n'

    beforeEach(() => {
        mock({ [directory.replaceAll('\\', '/')]: { config, credentials } })
    })

    afterEach(() => {
        mock.restore()
    })

    function store(): SharedConfigProfileStore {
        return new SharedConfigProfileStore(observability(), { configFilepath, filepath, ignoreCache: true })
    }

    async function assertUnchanged(): Promise<void> {
        assert.strictEqual(await readFile(configFilepath, 'utf8'), config)
        assert.strictEqual(await readFile(filepath, 'utf8'), credentials)
        assert.strictEqual(existsSync(configFilepath + '~'), false)
        assert.strictEqual(existsSync(filepath + '~'), false)
    }

    for (const name of [
        'first\nsecond',
        'first\rsecond',
        '[section]',
        'section]',
        ' profile ',
        'prototype',
        ...Object.getOwnPropertyNames(Object.prototype),
    ]) {
        for (const kind of ['profile', 'session'] as const) {
            it(`rejects invalid ${kind} name ${JSON.stringify(name)} without changing files`, async () => {
                const params = parameters()
                params.profile.name = kind === 'profile' ? name : params.profile.name
                params.ssoSession!.name = kind === 'session' ? name : params.ssoSession!.name
                const data = { profiles: [params.profile], ssoSessions: [params.ssoSession!] }
                const code = kind === 'profile' ? AwsErrorCodes.E_INVALID_PROFILE : AwsErrorCodes.E_INVALID_SSO_SESSION

                await assert.rejects(store().save(data), hasErrorCode(code))

                await assertUnchanged()
            })
        }
    }

    for (const name of ['sso-session.existing', 'services.existing', 'profile.existing']) {
        it(`rejects a profile name that changes when parsed: ${name}`, async () => {
            const profile = parameters().profile
            profile.name = name

            await assert.rejects(
                store().save({ profiles: [profile], ssoSessions: [] }),
                hasErrorCode(AwsErrorCodes.E_INVALID_PROFILE)
            )

            await assertUnchanged()
        })
    }

    for (const name of ['region\nextra', 'region=other', '[section]', 'region.extra.more']) {
        it(`rejects invalid setting name ${JSON.stringify(name)} without changing files`, async () => {
            const profile = parameters().profile
            profile.settings = { ...profile.settings, [name]: 'unused' }

            await assert.rejects(
                store().save({ profiles: [profile], ssoSessions: [] }),
                hasErrorCode(AwsErrorCodes.E_INVALID_PROFILE)
            )

            await assertUnchanged()
        })
    }

    for (const name of ['team.dev', 'team-profile', 'team_profile', 'team@work']) {
        it(`round-trips profile ${name} through the service and SDK reader`, async () => {
            const profileStore = store()
            const service = new ProfileService(profileStore, observability())
            const params = parameters()
            params.profile.name = name
            const originalProperties = Object.getOwnPropertyDescriptors(Object.prototype.toString)

            await service.updateProfile(params)
            const loaded = await profileStore.load()

            assert.strictEqual(loaded.profiles.find(profile => profile.name === name)?.settings?.sso_session, 'session')
            assert.deepStrictEqual(
                loaded.ssoSessions.find(session => session.name === 'session'),
                params.ssoSession
            )
            assert.deepStrictEqual(Object.getOwnPropertyDescriptors(Object.prototype.toString), originalProperties)
        })
    }

    it('rejects a colliding profile name through the service without changing files', async () => {
        const service = new ProfileService(store(), observability())
        const params = parameters()
        params.profile.name = 'toString'
        const originalProperties = Object.getOwnPropertyDescriptors(Object.prototype.toString)

        await assert.rejects(service.updateProfile(params), hasErrorCode(AwsErrorCodes.E_INVALID_PROFILE))

        await assertUnchanged()
        await store().load()
        assert.deepStrictEqual(Object.getOwnPropertyDescriptors(Object.prototype.toString), originalProperties)
    })

    it('preserves existing section spelling with spaces', async () => {
        const profile = parameters().profile
        profile.name = 'team profile'
        const data: ProfileData = { profiles: [profile], ssoSessions: [] }

        await store().save(data)

        assert.ok((await readFile(configFilepath, 'utf8')).includes('[profile team profile]'))
    })

    it('preserves existing settings that the request does not change', async () => {
        const profile = parameters().profile
        profile.name = 'existing'
        profile.settings = { sso_session: 'updated-session' }

        await store().save({ profiles: [profile], ssoSessions: [] })

        assert.match(await readFile(configFilepath, 'utf8'), /region = us-west-2/)
        assert.match(await readFile(configFilepath, 'utf8'), /sso_session = updated-session/)
        assert.strictEqual(await readFile(filepath, 'utf8'), credentials)
    })
})
