import mock = require('mock-fs')
import { DirectoryItems } from 'mock-fs/lib/filesystem'
import { getHomeDir, loadSharedConfigFiles, parseKnownFiles, SharedConfigInit } from '@smithy/shared-ini-file-loader'
import { normalizeParsedIniData, saveKnownFiles } from './saveKnownFiles'
import { join } from 'path'
import { ParsedIniData } from '@smithy/types'
import { readFile } from 'fs/promises'
import assert from 'assert'

const config = `# Config comment 1
[default]
region = us-west-2
BIG_letters = 1

[profile subsettings] # Comment on section
needasetting = or this section gets dropped until api_versions is uncommented
api_versions =
    ec2 = 2015-03-01
    cloudfront = 2015-09-17

# Config comment 2

[profile config-only.profile]
region = us-south-1 ; Comment on setting
whatever = something with spaces in between # comment here
s3 =
  max_concurrent_requests = 20
  max_queue_size = 10000
  multipart_threshold = 64MB
  multipart_chunksize = 16MB
  max_bandwidth = 50MB/s
  use_accelerate_endpoint = true
  addressing_style = path
#commented = setting 

[sso-session test-sso-session]
sso_region = us-west-2
sso_start_url = https://nowhere

#[services s3-specific]
s3 = 
  endpoint_url = http://localhost:4567
# Config comment 3`

const credentials = `# Credentials comment 1
[default]
aws_access_key_id = AAAAAAAA
aws_secret_access_key = BBBBBBBB

# Credentials comment 2
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

async function setupTest(config: string, credentials: string): Promise<ParsedIniData> {
    // Just for sanity, safe to call restore if mock not currently active
    mock.restore()

    const mockConfig: DirectoryItems = {}
    mockConfig[dir] = {
        config,
        credentials,
    }

    mock(mockConfig)

    return normalizeParsedIniData(await parseKnownFiles(init))
}

async function loadFile(filepath: string): Promise<string> {
    return (await readFile(filepath, { encoding: 'utf-8' })).replaceAll(/\r\n/g, '\n')
}

async function assertCredentialsNotChanged() {
    const credentialsFile = await loadFile(join(dir, 'credentials'))
    assert.equal(credentialsFile, credentials)
}

describe('sharedConfig.normalizeParsedIniData', () => {
    it('Setting names are converted to lowercase', async () => {
        const credentials = `[default]
AWS_access_key_id = AAAAAAAA
AWS_Secret_Access_Key = BBBBBBBB`

        const data = await setupTest(config, credentials)

        assert.equal(Object.hasOwn(data['default'], 'aws_access_key_id'), true)
        assert.equal(Object.hasOwn(data['default'], 'AWS_access_key_id'), false)
        assert.equal(Object.hasOwn(data['default'], 'aws_secret_access_key'), true)
        assert.equal(Object.hasOwn(data['default'], 'AWS_Secret_Access_Key'), false)
    })
})

describe('sharedConfig.saveKnownFiles', () => {
    it('Invalid lines are commented', async () => {
        const credentials = `# Credentials comment 1
[default]
aws_access_key_id = AAAAAAAA
aws_secret_access_key = BBBBBBBB

# Credentials comment 2
[credentials-only]profile]
region = us-east-1
total mess
sso_session = test-sso-session

# Shouldn't comment twice
[credentials-only.profile]
region = us-east-1
sso_session = test-sso-session`

        const data = await setupTest(config, credentials)

        await saveKnownFiles(data, init)

        const credentialsFile = await loadFile(join(dir, 'credentials'))

        assert.match(credentials, /\ntotal mess/)
        assert.match(credentialsFile, /\n# total mess/)
        assert.equal(credentialsFile.replace(/\n# total mess/, ''), credentials.replace(/\ntotal mess/, ''))
    })

    it('Adds new settings', async () => {
        const data = await setupTest(config, credentials)

        // Try different data types encoded as strings
        const section = data['default']
        //section['api_versions.ec2'] = '2024-09-07'
        //section['api_versions.cloudfront'] = '2024-09-30'
        section['cli_timestamp_format'] = '2019-10-31T22:21:41Z'
        section['credential_process'] = '/opt/bin/awscreds-retriever --username susan'
        section['max_attempts'] = '3'
        section['parameter_validation'] = 'true'

        await saveKnownFiles(data, init)

        // [default] in config should have new fields
        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        assert.equal(configFile['default']['cli_timestamp_format'], '2019-10-31T22:21:41Z')
        assert.equal(configFile['default']['credential_process'], '/opt/bin/awscreds-retriever --username susan')
        assert.equal(configFile['default']['max_attempts'], '3')
        assert.equal(configFile['default']['parameter_validation'], 'true')

        await assertCredentialsNotChanged()
    })

    it('Updates changed settings', async () => {
        const data = await setupTest(config, credentials)

        // Try various sections
        //data['default']['api_versions.ec2'] = '2024-09-07'
        //data['default']['api_versions.cloudfront'] = '2024-09-30'
        data['default']['region'] = 'eu-north-1'
        data['config-only.profile']['region'] = 'eu-north-2'
        data['sso-session.test-sso-session']['sso_region'] = 'eu-north-3'
        data['credentials-only.profile']['region'] = 'eu-north-4'

        await saveKnownFiles(data, init)

        const { configFile, credentialsFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)
        normalizeParsedIniData(credentialsFile)

        assert.equal(configFile['default']['region'], 'eu-north-1')
        assert.equal(configFile['config-only.profile']['region'], 'eu-north-2')
        assert.equal(configFile['sso-session.test-sso-session']['sso_region'], 'eu-north-3')
        assert.equal(credentialsFile['credentials-only.profile']['region'], 'eu-north-4')
    })

    it('Removes deleted settings', async () => {
        const data = await setupTest(config, credentials)

        //data['default']['api_versions.ec2'] = '2024-09-07'
        //data['default']['api_versions.cloudfront'] = '2024-09-30'
        delete data['default']['region']
        delete data['default']['big_letters']
        delete data['config-only.profile']['region']
        delete data['sso-session.test-sso-session']['sso_region']
        delete data['credentials-only.profile']['region']

        await saveKnownFiles(data, init)

        const { configFile, credentialsFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)
        normalizeParsedIniData(credentialsFile)

        // All were deleted
        assert.equal(Object.hasOwn(configFile, 'default'), false)
        assert.equal(Object.hasOwn(configFile['config-only.profile'], 'region'), false)
        assert.equal(Object.hasOwn(configFile['sso-session.test-sso-session'], 'sso_region'), false)
        assert.equal(Object.hasOwn(credentialsFile['credentials-only.profile'], 'region'), false)
    })

    it('Stores secret settings in credentials only', async () => {
        const data = await setupTest(config, credentials)

        // Add secret keys to profile only in config, should create new profile in credentials with same name
        data['default']['aws_access_key_id'] = 'updated aws_access_key_id should be in credentials'
        data['default']['aws_secret_access_key'] = 'updated aws_secret_access_key should be in credentials'
        data['default']['aws_session_token'] = 'new aws_session_token should be in credentials'
        data['config-only.profile']['aws_access_key_id'] = 'new aws_access_key_id should be in credentials'
        data['config-only.profile']['aws_secret_access_key'] = 'new aws_secret_access_key should be in credentials'
        data['config-only.profile']['aws_session_token'] = 'new aws_session_token should be in credentials'

        await saveKnownFiles(data, init)

        const { configFile, credentialsFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)
        normalizeParsedIniData(credentialsFile)

        // None stored in config
        assert.equal(Object.hasOwn(configFile['default'], 'aws_access_key_id'), false)
        assert.equal(Object.hasOwn(configFile['default'], 'aws_secret_access_key'), false)
        assert.equal(Object.hasOwn(configFile['default'], 'aws_session_token'), false)
        assert.equal(Object.hasOwn(configFile['config-only.profile'], 'aws_access_key_id'), false)
        assert.equal(Object.hasOwn(configFile['config-only.profile'], 'aws_secret_access_key'), false)
        assert.equal(Object.hasOwn(configFile['config-only.profile'], 'aws_session_token'), false)

        // All stored in credentials, containing new/updated values
        assert.equal(
            credentialsFile['default']['aws_access_key_id'],
            'updated aws_access_key_id should be in credentials'
        )
        assert.equal(
            credentialsFile['default']['aws_secret_access_key'],
            'updated aws_secret_access_key should be in credentials'
        )
        assert.equal(credentialsFile['default']['aws_session_token'], 'new aws_session_token should be in credentials')
        assert.equal(
            credentialsFile['config-only.profile']['aws_access_key_id'],
            'new aws_access_key_id should be in credentials'
        )
        assert.equal(
            credentialsFile['config-only.profile']['aws_secret_access_key'],
            'new aws_secret_access_key should be in credentials'
        )
        assert.equal(
            credentialsFile['config-only.profile']['aws_session_token'],
            'new aws_session_token should be in credentials'
        )
    })

    it('Adds new sections', async () => {
        const data = await setupTest(config, credentials)

        data['sso-session.new-sso-session'] = {
            sso_region: 'us-west-42',
            sso_start_url: 'https://nothing',
        }

        await saveKnownFiles(data, init)

        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        assert.equal(configFile['sso-session.new-sso-session']['sso_region'], 'us-west-42')
        assert.equal(configFile['sso-session.new-sso-session']['sso_start_url'], 'https://nothing')

        await assertCredentialsNotChanged()
    })

    it('Renames (effectively add/delete) sections', async () => {
        const data = await setupTest(config, credentials)

        data['sso-session.renamed-sso-session'] = data['sso-session.test-sso-session']
        delete data['sso-session.test-sso-session']

        await saveKnownFiles(data, init)

        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        assert.equal(Object.hasOwn(configFile, 'sso-session.test-sso-session'), false)
        assert.equal(configFile['sso-session.renamed-sso-session']['sso_region'], 'us-west-2')
        assert.equal(configFile['sso-session.renamed-sso-session']['sso_start_url'], 'https://nowhere')

        await assertCredentialsNotChanged()
    })

    it('Removes deleted sections', async () => {
        const data = await setupTest(config, credentials)

        delete data['default']

        await saveKnownFiles(data, init)

        const { configFile, credentialsFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)
        normalizeParsedIniData(credentialsFile)

        assert.equal(Object.hasOwn(configFile, 'default'), false)
        assert.equal(Object.hasOwn(credentialsFile, 'default'), false)
    })

    it('Converts setting names to lowercase', async () => {
        const data = await setupTest(config, credentials)

        await saveKnownFiles(data, init)

        const { configFile, credentialsFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)
        normalizeParsedIniData(credentialsFile)

        assert.equal(Object.hasOwn(configFile['default'], 'big_letters'), true)
        assert.equal(Object.hasOwn(configFile['default'], 'BIG_letters'), false)
        assert.equal(Object.hasOwn(credentialsFile['default'], 'big_letters'), false)
        assert.equal(Object.hasOwn(credentialsFile['default'], 'BIG_letters'), false)
    })
})
