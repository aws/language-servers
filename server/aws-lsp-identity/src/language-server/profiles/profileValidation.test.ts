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
import { loadSsoSessionData, parseKnownFiles } from '@smithy/shared-ini-file-loader'
import { stubInterface } from 'ts-sinon'
import { ProfileService, ProfileStore } from './profileService'
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

// Saved files use os.EOL. Compare their content independent of the platform line ending.
async function readSavedFile(filepath: string): Promise<string> {
    return (await readFile(filepath, { encoding: 'utf-8' })).replaceAll(/\r\n/g, '\n')
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
    const init = { configFilepath, filepath, ignoreCache: true }
    const config =
        '[profile existing]\nregion = us-west-2\nsso_session = existing-session\n' +
        '\n[sso-session existing-session]\nsso_region = us-west-2\nsso_start_url = https://example.com/original\n'
    const credentials = '[existing]\naws_access_key_id = test-key\n'
    const configBackup = '[profile backup]\nregion = us-east-1\n'
    const credentialsBackup = '[backup]\naws_access_key_id = backup-test-key\n'

    function setupFiles(withBackups = false): void {
        mock.restore()
        mock({
            [directory.replaceAll('\\', '/')]: {
                config,
                credentials,
                ...(withBackups && { 'config~': configBackup, 'credentials~': credentialsBackup }),
            },
        })
    }

    beforeEach(() => {
        setupFiles()
    })

    afterEach(() => {
        mock.restore()
    })

    function store(): SharedConfigProfileStore {
        return new SharedConfigProfileStore(observability(), init)
    }

    async function assertUnchanged(withBackups = false): Promise<void> {
        assert.strictEqual(await readFile(configFilepath, 'utf8'), config)
        assert.strictEqual(await readFile(filepath, 'utf8'), credentials)
        assert.strictEqual(existsSync(configFilepath + '~'), withBackups)
        assert.strictEqual(existsSync(filepath + '~'), withBackups)
        if (withBackups) {
            assert.strictEqual(await readFile(configFilepath + '~', 'utf8'), configBackup)
            assert.strictEqual(await readFile(filepath + '~', 'utf8'), credentialsBackup)
        }
    }

    async function assertRejectedWithoutChanges(
        params: UpdateProfileParams,
        code: string,
        withBackups: boolean
    ): Promise<void> {
        setupFiles(withBackups)
        const objects = [
            Object.prototype,
            ...Object.values(Object.getOwnPropertyDescriptors(Object.prototype))
                .map(descriptor => descriptor.value)
                .filter(value => typeof value === 'function'),
        ]
        const snapshots = objects.map(object => ({ object, descriptors: Object.getOwnPropertyDescriptors(object) }))
        const service = new ProfileService(store(), observability())

        try {
            await assert.rejects(service.updateProfile(params), hasErrorCode(code))
            await assertUnchanged(withBackups)
            await store().load()
            for (const { object, descriptors } of snapshots) {
                assert.deepStrictEqual(Object.getOwnPropertyDescriptors(object), descriptors)
            }
        } finally {
            // Restore descriptors even if a regression fails, to protect subsequent tests.
            for (const { object, descriptors } of snapshots) {
                for (const key of Reflect.ownKeys(object)) {
                    if (!Object.hasOwn(descriptors, key)) {
                        Reflect.deleteProperty(object, key)
                    }
                }
                Object.defineProperties(object, descriptors)
            }
        }
    }

    for (const name of ['first\nsecond', 'first\rsecond', '[section]', 'section]', ' profile ']) {
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

    for (const name of Object.getOwnPropertyNames(Object.prototype)) {
        for (const kind of ['profile', 'session'] as const) {
            for (const withBackups of [false, true]) {
                it(`rejects colliding raw ${kind} name ${name} with backups ${withBackups}`, async () => {
                    const params = parameters()
                    if (kind === 'profile') {
                        params.profile.name = name
                    } else {
                        params.ssoSession!.name = name
                        params.profile.settings!.sso_session = name
                    }
                    const code =
                        kind === 'profile' ? AwsErrorCodes.E_INVALID_PROFILE : AwsErrorCodes.E_INVALID_SSO_SESSION

                    await assertRejectedWithoutChanges(params, code, withBackups)
                })
            }
        }
    }

    it('creates and updates profile and session prototype through the SDK', async () => {
        const name = 'prototype'
        const objects = [
            Object.prototype,
            ...Object.values(Object.getOwnPropertyDescriptors(Object.prototype))
                .map(descriptor => descriptor.value)
                .filter(value => typeof value === 'function'),
        ]
        const snapshots = objects.map(object => ({ object, descriptors: Object.getOwnPropertyDescriptors(object) }))
        const original = await parseKnownFiles(init)
        const profileStore = store()
        const service = new ProfileService(profileStore, observability())
        const params = parameters()
        params.profile.name = name
        params.profile.settings = { sso_session: name, region: 'us-west-2' }
        Object.assign(params.profile.settings, { sso_account_id: '000000000000' })
        params.ssoSession!.name = name
        const sessionKey = `sso-session.${name}`

        async function assertRoundTrip(region: string): Promise<void> {
            const parsed = await parseKnownFiles(init)
            assert.strictEqual(Object.hasOwn(parsed, name), true)
            assert.strictEqual(Object.hasOwn(parsed, sessionKey), true)
            assert.deepStrictEqual(parsed[name], {
                sso_session: name,
                region,
                sso_account_id: '000000000000',
            })
            assert.deepStrictEqual(parsed[sessionKey], params.ssoSession!.settings)
            const sessions = await loadSsoSessionData(init)
            assert.strictEqual(Object.hasOwn(sessions, name), true)
            assert.deepStrictEqual(sessions[name], params.ssoSession!.settings)
            const loaded = await profileStore.load()
            assert.deepStrictEqual(loaded.profiles.find(profile => profile.name === name)?.settings, parsed[name])
            assert.deepStrictEqual(
                loaded.ssoSessions.find(session => session.name === name),
                params.ssoSession
            )
            for (const [key, settings] of Object.entries(original)) {
                assert.deepStrictEqual(parsed[key], settings)
            }
            assert.deepStrictEqual(Object.keys(parsed).sort(), [...Object.keys(original), name, sessionKey].sort())
            assert.strictEqual(await readSavedFile(filepath), credentials)
            for (const { object, descriptors } of snapshots) {
                assert.deepStrictEqual(Object.getOwnPropertyDescriptors(object), descriptors)
            }
        }

        try {
            await service.updateProfile(params)
            await assertRoundTrip('us-west-2')

            const configBeforeUpdate = await readFile(configFilepath, 'utf8')
            params.profile.settings = { sso_session: name, region: 'us-east-1' }
            params.ssoSession!.settings = {
                sso_region: 'us-east-1',
                sso_start_url: 'https://example.com/updated',
            }
            params.options = { createNonexistentProfile: false, createNonexistentSsoSession: false }

            await service.updateProfile(params)
            await assertRoundTrip('us-east-1')
            assert.strictEqual(await readFile(configFilepath + '~', 'utf8'), configBeforeUpdate)
        } finally {
            // Restore descriptors even if a regression fails, to protect subsequent tests.
            for (const { object, descriptors } of snapshots) {
                for (const key of Reflect.ownKeys(object)) {
                    if (!Object.hasOwn(descriptors, key)) {
                        Reflect.deleteProperty(object, key)
                    }
                }
                Object.defineProperties(object, descriptors)
            }
        }
    })

    for (const lineBreak of ['\n', '\r']) {
        for (const kind of ['profile', 'session'] as const) {
            it(`rejects a ${kind} setting value containing ${JSON.stringify(lineBreak)} without changing files`, async () => {
                const params = parameters()
                if (kind === 'profile') {
                    params.profile.settings!.region = `us-west-2${lineBreak}extra = value`
                } else {
                    params.ssoSession!.settings!.sso_start_url = `https://example.com/start${lineBreak}extra = value`
                }
                const data = { profiles: [params.profile], ssoSessions: [params.ssoSession!] }
                const code = kind === 'profile' ? AwsErrorCodes.E_INVALID_PROFILE : AwsErrorCodes.E_INVALID_SSO_SESSION

                await assert.rejects(store().save(data), hasErrorCode(code))
                await assert.rejects(
                    new ProfileService(store(), observability()).updateProfile(params),
                    hasErrorCode(code)
                )

                await assertUnchanged()
            })
        }
    }

    it('rejects a session scope containing a line break without changing files', async () => {
        const params = parameters()
        params.ssoSession!.settings!.sso_registration_scopes = ['sso:account:access', 'scope\rextra']

        await assert.rejects(
            new ProfileService(store(), observability()).updateProfile(params),
            hasErrorCode(AwsErrorCodes.E_INVALID_SSO_SESSION)
        )

        await assertUnchanged()
    })

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

    for (const withBackups of [false, true]) {
        describe(`SDK section-name validation with backups ${withBackups ? 'present' : 'absent'}`, () => {
            for (const quote of ['"', "'"]) {
                it(`rejects a ${quote}-quoted shared-session alias when shared updates are disabled`, async () => {
                    const params = parameters()
                    params.ssoSession!.name = `${quote}existing-session${quote}`
                    params.ssoSession!.settings = {
                        sso_region: 'us-east-1',
                        sso_start_url: 'https://example.com/changed',
                    }
                    params.profile.settings!.sso_session = params.ssoSession!.name
                    params.options = { updateSharedSsoSession: false }

                    await assertRejectedWithoutChanges(params, AwsErrorCodes.E_INVALID_SSO_SESSION, withBackups)
                })

                for (const name of ['__proto__', 'prototype', 'constructor', 'toString', 'valueOf']) {
                    for (const kind of ['profile', 'session'] as const) {
                        it(`rejects ${quote}${name}${quote} as a ${kind} name without prototype mutation`, async () => {
                            const params = parameters()
                            if (kind === 'profile') {
                                params.profile.name = `${quote}${name}${quote}`
                            } else {
                                params.ssoSession!.name = `${quote}${name}${quote}`
                                params.profile.settings!.sso_session = params.ssoSession!.name
                            }
                            const code =
                                kind === 'profile'
                                    ? AwsErrorCodes.E_INVALID_PROFILE
                                    : AwsErrorCodes.E_INVALID_SSO_SESSION

                            await assertRejectedWithoutChanges(params, code, withBackups)
                        })
                    }
                }
            }

            for (const name of [
                'team profile',
                'team\u00a0profile',
                'team #shadow',
                'team ;shadow',
                'team#shadow',
                'team;shadow',
            ]) {
                for (const kind of ['profile', 'session'] as const) {
                    it(`rejects ${kind} name ${JSON.stringify(name)} that the SDK cannot read back`, async () => {
                        const params = parameters()
                        if (kind === 'profile') {
                            params.profile.name = name
                        } else {
                            params.ssoSession!.name = name
                            params.profile.settings!.sso_session = name
                        }
                        const code =
                            kind === 'profile' ? AwsErrorCodes.E_INVALID_PROFILE : AwsErrorCodes.E_INVALID_SSO_SESSION

                        await assertRejectedWithoutChanges(params, code, withBackups)
                    })
                }
            }
        })
    }

    for (const name of [
        'team.dev',
        'team-profile',
        'team_profile',
        'team@work',
        'team+work',
        'team%work',
        'team:work',
        'team/work',
        'default',
        'Team123',
    ]) {
        it(`round-trips profile and session ${name} through the service and SDK reader`, async () => {
            const profileStore = store()
            const service = new ProfileService(profileStore, observability())
            const params = parameters()
            params.profile.name = name
            params.ssoSession!.name = name
            params.profile.settings!.sso_session = name
            const originalProperties = Object.getOwnPropertyDescriptors(Object.prototype.toString)

            await service.updateProfile(params)
            const parsed = await parseKnownFiles(init)
            assert.strictEqual(parsed[name]?.sso_session, name)
            assert.deepStrictEqual(parsed[`sso-session.${name}`], params.ssoSession!.settings)
            const loaded = await profileStore.load()

            assert.strictEqual(loaded.profiles.find(profile => profile.name === name)?.settings?.sso_session, name)
            assert.deepStrictEqual(
                loaded.ssoSessions.find(session => session.name === name),
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

    it('preserves existing settings that the request does not change', async () => {
        const profile = parameters().profile
        profile.name = 'existing'
        profile.settings = { sso_session: 'updated-session' }

        await store().save({ profiles: [profile], ssoSessions: [] })

        assert.match(await readFile(configFilepath, 'utf8'), /region = us-west-2/)
        assert.match(await readFile(configFilepath, 'utf8'), /sso_session = updated-session/)
        assert.strictEqual(await readSavedFile(filepath), credentials)
    })
})
