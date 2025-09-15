import mock from 'mock-fs'
import { DirectoryItems } from 'mock-fs/lib/filesystem'
import { getHomeDir, loadSharedConfigFiles, parseKnownFiles, SharedConfigInit } from '@smithy/shared-ini-file-loader'
import { join } from 'path'
import { ParsedIniData } from '@smithy/types'
import { readFile } from 'fs/promises'
import assert from 'assert'
import { saveSharedConfigFile } from './saveSharedConfigFile'
import { IniFileType } from './types'
import { normalizeParsedIniData } from './saveKnownFiles'

const file = `# Config comment 1
[default] # Section's trailing comment
region = us-west-2   ; Setting's trailing comment

[profile subsettings] # Comment on section
needasetting = or this section gets dropped until api_versions is uncommented
api_versions =
    ec2 = 2015-03-01
    cloudfront = 2015-09-17

# Config comment 2

[profile s3settings]
region = us-south-1
whatever = something with spaces in between # comment here
s3 =
  max_concurrent_requests = 20
  max_queue_size = 10000
  multipart_threshold = 64MB
  multipart_chunksize = 16MB
  max_bandwidth = 50MB/s
  use_accelerate_endpoint = true
  addressing_style = path
# comment = looks like a setting 

[sso-session test-sso-session]
sso_region = us-west-2
sso_start_url = https://nowhere

[services s3-service]
s3 =
  endpoint_url = http://localhost:4567
# Config comment 3`

// mock-fs requires / even on Windows
const dir = join(getHomeDir(), '.aws').replaceAll('\\', '/')

// Must ignoreCache on all calls or data from prior tests will leak into current test
// This applies to parseKnownFiles, saveKnownFiles, and loadSharedConfigFiles
const init: SharedConfigInit = {
    configFilepath: join(dir, 'config'),
    ignoreCache: true,
}

afterEach(() => {
    mock.restore()
})

async function setupTest(config: string): Promise<ParsedIniData> {
    // Just for sanity, safe to call restore if mock not currently active
    mock.restore()

    const mockConfig: DirectoryItems = {}
    mockConfig[dir] = {
        config,
        'config~': config,
    }

    mock(mockConfig)

    return normalizeParsedIniData(await parseKnownFiles(init))
}

async function loadFile(filepath: string): Promise<string> {
    return (await readFile(filepath, { encoding: 'utf-8' })).replaceAll(/\r\n/g, '\n')
}

describe('sharedConfig.saveSharedConfigFile', () => {
    it('New and original file match on unchanged parsedKnownFiles', async () => {
        const data = await setupTest(file)

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        const input = await loadFile(init.configFilepath!)
        const backup = await loadFile(init.configFilepath! + '~')

        assert.equal(input, file)
        assert.equal(backup, file)
    })

    it('Invalid lines are commented', async () => {
        const file = `[default]
region = us-east-1
total mess
sso_session = test-sso-session`

        const data = await setupTest(file)

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        const configFile = await loadFile(init.configFilepath!)
        const backup = await loadFile(init.configFilepath! + '~')

        assert.match(file, /\ntotal mess/)
        assert.match(configFile, /\n# total mess/)
        assert.equal(configFile.replace(/\n# total mess/, ''), file.replace(/\ntotal mess/, ''))

        assert.equal(backup, file)
    })

    it('Adds new settings', async () => {
        const data = await setupTest(file)

        // Try different data types encoded as strings
        const section = data['default']
        section['api_versions.s3'] = '2024-09-07'
        section['api_versions.dynamodb'] = '2024-09-30'
        section['cli_timestamp_format'] = '2019-10-31T22:21:41Z'
        section['credential_process'] = '/opt/bin/awscreds-retriever --username susan'
        section['max_attempts'] = '3'
        section['parameter_validation'] = 'true'

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        // [default] in config should have new fields
        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        assert.equal(configFile['default']['api_versions.s3'], '2024-09-07')
        assert.equal(configFile['default']['api_versions.dynamodb'], '2024-09-30')
        assert.equal(configFile['default']['cli_timestamp_format'], '2019-10-31T22:21:41Z')
        assert.equal(configFile['default']['credential_process'], '/opt/bin/awscreds-retriever --username susan')
        assert.equal(configFile['default']['max_attempts'], '3')
        assert.equal(configFile['default']['parameter_validation'], 'true')
    })

    it('Updates changed settings', async () => {
        const data = await setupTest(file)

        // Try various sections
        data['default']['region'] = 'eu-north-1'
        data['subsettings']['api_versions.ec2'] = '2024-09-07'
        data['subsettings']['api_versions.dynamodb'] = '2024-09-30'
        data['s3settings']['region'] = 'eu-north-2'
        data['sso-session.test-sso-session']['sso_region'] = 'eu-north-3'

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        assert.equal(configFile['default']['region'], 'eu-north-1')
        assert.equal(configFile['subsettings']['api_versions.ec2'], '2024-09-07')
        assert.equal(configFile['subsettings']['api_versions.cloudfront'], '2015-09-17')
        assert.equal(configFile['subsettings']['api_versions.dynamodb'], '2024-09-30')
        assert.equal(configFile['s3settings']['region'], 'eu-north-2')
        assert.equal(configFile['sso-session.test-sso-session']['sso_region'], 'eu-north-3')
    })

    it('Removes deleted settings', async () => {
        const data = await setupTest(file)

        delete data['default']['region'] // region is only setting in default, so whole section is deleted
        delete data['subsettings']['api_versions.ec2']
        delete data['s3settings']['region']
        delete data['sso-session.test-sso-session']['sso_region']
        delete data['services.s3-service']['s3.endpoint_url'] // Remove only setting removes whole section

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        // All were deleted
        assert.equal(Object.hasOwn(configFile, 'default'), false)
        assert.equal(Object.hasOwn(configFile['subsettings'], 'api_versions.ec2'), false)
        assert.equal(Object.hasOwn(configFile['subsettings'], 'api_versions.cloudfront'), true)
        assert.equal(Object.hasOwn(configFile['s3settings'], 'region'), false)
        assert.equal(Object.hasOwn(configFile['sso-session.test-sso-session'], 'sso_region'), false)
        assert.equal(Object.hasOwn(configFile, 'services.s3-service'), false)
    })

    it('Adds new sections', async () => {
        const data = await setupTest(file)

        data['sso-session.new-sso-session'] = {
            sso_region: 'us-west-42',
            sso_start_url: 'https://nothing',
            'api_versions.ec2': '2024-09-29',
            'api_versions.s3': '2000-01-01',
        }

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        assert.equal(configFile['sso-session.new-sso-session']['sso_region'], 'us-west-42')
        assert.equal(configFile['sso-session.new-sso-session']['sso_start_url'], 'https://nothing')
        assert.equal(configFile['sso-session.new-sso-session']['api_versions.ec2'], '2024-09-29')
        assert.equal(configFile['sso-session.new-sso-session']['api_versions.s3'], '2000-01-01')
    })

    it('Renames (effectively add/delete) sections', async () => {
        const data = await setupTest(file)

        data['sso-session.renamed-sso-session'] = data['sso-session.test-sso-session']
        delete data['sso-session.test-sso-session']

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        assert.equal(Object.hasOwn(configFile, 'sso-session.test-sso-session'), false)
        assert.equal(configFile['sso-session.renamed-sso-session']['sso_region'], 'us-west-2')
        assert.equal(configFile['sso-session.renamed-sso-session']['sso_start_url'], 'https://nowhere')
    })

    it('Removes deleted sections', async () => {
        const data = await setupTest(file)

        delete data['default']

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        assert.equal(Object.hasOwn(configFile, 'default'), false)
    })

    it('Comments are preserved', async () => {
        const data = await setupTest(file)

        data['default'].region = 'us-east-1'

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        const input = (await loadFile(init.configFilepath!)).split(/\n/)

        assert.equal(input[0], '# Config comment 1')
        assert.equal(input[1], "[default] # Section's trailing comment")
        assert.equal(input[2], "region = us-east-1   ; Setting's trailing comment")
    })

    it('Can create new when ~/.aws does not exist', async () => {
        mock.restore()
        mock({})

        const data = { default: { region: 'us-west-2' } }

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        assert.equal(Object.hasOwn(configFile, 'default'), true)
    })

    it('Can create new when ~/.aws exists, but file does not exist', async () => {
        mock.restore()
        const mockConfig: DirectoryItems = {}
        mockConfig[dir] = {}
        mock(mockConfig)

        const data = { default: { region: 'us-west-2' } }

        await saveSharedConfigFile(init.configFilepath!, IniFileType.config, data)

        const { configFile } = await loadSharedConfigFiles(init)
        normalizeParsedIniData(configFile)

        assert.equal(Object.hasOwn(configFile, 'default'), true)
    })
})
