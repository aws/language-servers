import mock = require('mock-fs')
import { getHomeDir, SharedConfigInit } from '@smithy/shared-ini-file-loader'
import { DirectoryItems } from 'mock-fs/lib/filesystem'
import { join } from 'path'
import { SharedConfigProfileStore } from './sharedConfigProfileStore'
import { expect, use } from 'chai'
import { ProfileData } from './profileService'
import { ProfileKind } from '@aws/language-server-runtimes/protocol/identity-management'

// eslint-disable-next-line @typescript-eslint/no-var-requires
use(require('chai-as-promised'))

const sut = new SharedConfigProfileStore()

const config = `
[default]
region = us-west-2

[profile subsettings]
api_versions =
    ec2 = 2015-03-01
    cloudfront = 2015-09-17

[profile config-only.profile]
region = us-west-2
sso_session = test-sso-session

[sso-session test-sso-session]
sso_region = us-west-2
sso_start_url = https://nowhere

[services s3-specific]
s3 = 
  endpoint_url = http://localhost:4567`

const credentials = `# Credentials comment 1
[default]
aws_access_key_id = AAAAAAAA
aws_secret_access_key = BBBBBBBB

[credentials-only.profile]
region = us-east-1
sso_session = test-sso-session`

// mock-fs requires / even on Windows
const dir = join(getHomeDir(), '.aws').replaceAll('\\', '/')

// Must ignoreCache on all calls or data from prior tests will leak into current test
// This applies to parseKnownFiles, saveKnownFiles, and loadSharedConfigFiles
const init: SharedConfigInit = { ignoreCache: true }

afterEach(() => {
    mock.restore()
})

function setupTest(config: string, credentials: string): void {
    // Just for sanity, safe to call restore if mock not currently active
    mock.restore()

    const mockConfig: DirectoryItems = {}
    mockConfig[dir] = {
        config,
        credentials,
    }

    mock(mockConfig)
}

describe('SharedConfigProfileStore', async () => {
    it('loads SSO token profiles and sso-sessions, but not services', async () => {
        setupTest(config, credentials)

        const actual = await sut.load()

        expect(actual).to.deep.equal({
            profiles: [
                {
                    kind: 'SsoTokenProfile',
                    name: 'config-only.profile',
                    settings: {
                        region: 'us-west-2',
                        sso_session: 'test-sso-session',
                    },
                },
                {
                    kind: 'SsoTokenProfile',
                    name: 'credentials-only.profile',
                    settings: {
                        region: 'us-east-1',
                        sso_session: 'test-sso-session',
                    },
                },
            ],
            ssoSessions: [
                {
                    name: 'test-sso-session',
                    settings: {
                        sso_region: 'us-west-2',
                        sso_start_url: 'https://nowhere',
                    },
                },
            ],
        })
    })

    it('Does not save if no profiles nor ssoSessions are provided', async () => {
        setupTest(config, credentials)

        const before = await sut.load()

        const data: ProfileData = {
            profiles: [],
            ssoSessions: [],
        }

        await sut.save(data)

        const after = await sut.load()

        expect(after).to.deep.equal(before)
    })

    it('Saves if profiles and ssoSessions are provided', async () => {
        setupTest(config, credentials)

        const data: ProfileData = {
            profiles: [
                {
                    kind: ProfileKind.SsoTokenProfile,
                    name: 'config-only.profile',
                    settings: {
                        region: 'us-west-1',
                        sso_session: 'new-sso-session',
                    },
                },
            ],
            ssoSessions: [
                {
                    name: 'sso-session.test-sso-session',
                    settings: {
                        sso_region: 'us-east-1',
                        sso_start_url: 'http://newnowhere',
                        sso_registration_scopes: ['my-scope'], // Also verifies sso:account:access scope is added implicitly
                    },
                },
                {
                    name: 'sso-session.new-sso-session',
                    settings: {
                        sso_region: 'us-north-1',
                        sso_start_url: 'http://somewhere',
                    },
                },
            ],
        }

        await sut.save(data)

        const after = await sut.load()

        expect(after).to.deep.equal({
            profiles: [
                {
                    kind: ProfileKind.SsoTokenProfile,
                    name: 'config-only.profile',
                    settings: {
                        region: 'us-west-1',
                        sso_session: 'new-sso-session',
                    },
                },
                {
                    kind: ProfileKind.SsoTokenProfile,
                    name: 'credentials-only.profile',
                    settings: {
                        region: 'us-east-1',
                        sso_session: 'test-sso-session',
                    },
                },
            ],
            ssoSessions: [
                {
                    name: 'test-sso-session',
                    settings: {
                        sso_region: 'us-east-1',
                        sso_registration_scopes: ['my-scope', 'sso:account:access'],
                        sso_start_url: 'http://newnowhere',
                    },
                },
                {
                    name: 'new-sso-session',
                    settings: {
                        sso_region: 'us-north-1',
                        sso_registration_scopes: ['sso:account:access'],
                        sso_start_url: 'http://somewhere',
                    },
                },
            ],
        })
    })
})
