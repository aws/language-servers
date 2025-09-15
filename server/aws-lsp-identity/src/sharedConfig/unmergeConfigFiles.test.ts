import { ParsedIniData } from '@smithy/types'
import { unmergeConfigFiles } from './unmergeConfigFiles'
import assert from 'assert'

const parsedKnownFiles: ParsedIniData = {
    default: {
        aws_access_key_id: 'Key ID parsedKnownFiles',
        aws_secret_access_key: 'Secret key in parsedKnownFiles',
        region: 'us-east-1',
        other: 'credentials-only',
    },

    'config-only.profile': {
        region: 'us-west-2',
    },

    'credentials-only.profile': {
        region: 'us-east-2',
    },

    'new-profile': {
        region: 'us-central-1',
    },
}

const configFile: ParsedIniData = {
    default: {
        aws_access_key_id: 'In config file',
        region: 'us-west-1',
    },

    'config-only.profile': {
        region: 'us-east-2',
        deleteme: 'true',
    },

    'delete-me-profile': {
        region: 'us-south-1',
    },

    'sso-session.test-sso-session': {
        sso_region: 'us-west-2',
        sso_start_url: 'http://myhouse',
    },
}

const credentialsFile: ParsedIniData = {
    default: {
        aws_access_key_id: 'In credentials file',
        region: 'us-west-2',
        other: 'original value',
    },

    'credentials-only.profile': {
        sso_session: 'test-sso-session',
        region: 'us-north-1',
    },

    'delete-me-profile': {
        region: 'us-north-1',
    },
}

beforeEach(() => {
    unmergeConfigFiles(parsedKnownFiles, configFile, credentialsFile)
})

describe('sharedConfig.unmergeConfigFiles', () => {
    it('Removes sections deleted from parseKnownFiles from both files', () => {
        assert.equal(Object.hasOwn(configFile, 'default'), true)
        assert.equal(Object.hasOwn(configFile, 'config-only.profile'), true)
        assert.equal(Object.hasOwn(configFile, 'credentials-only.profile'), false)
        assert.equal(Object.hasOwn(configFile, 'new-profile'), true)
        assert.equal(Object.hasOwn(configFile, 'delete-me-profile'), false)

        assert.equal(Object.hasOwn(credentialsFile, 'default'), true)
        assert.equal(Object.hasOwn(credentialsFile, 'config-only.profile'), false)
        assert.equal(Object.hasOwn(credentialsFile, 'credentials-only.profile'), true)
        assert.equal(Object.hasOwn(credentialsFile, 'new-profile'), false)
        assert.equal(Object.hasOwn(credentialsFile, 'delete-me-profile'), false)
    })

    it('Settings deleted from parseKnownFiles sections are removed from sections in both files', () => {
        assert.equal(Object.hasOwn(configFile['config-only.profile'], 'deleteme'), false)
        assert.equal(Object.hasOwn(configFile['config-only.profile'], 'region'), true)

        assert.equal(Object.hasOwn(credentialsFile['credentials-only.profile'], 'sso_session'), false)
        assert.equal(Object.hasOwn(credentialsFile['credentials-only.profile'], 'region'), true)
    })

    it('Secrets are written to credentials file only and removed from config if they exist', () => {
        assert.equal(Object.hasOwn(configFile['default'], 'aws_access_key_id'), false)
        assert.equal(Object.hasOwn(configFile['default'], 'aws_secret_access_key'), false)

        assert.equal(Object.hasOwn(credentialsFile['default'], 'aws_access_key_id'), true)
        assert.equal(credentialsFile['default'].aws_access_key_id, 'Key ID parsedKnownFiles')
        assert.equal(Object.hasOwn(credentialsFile['default'], 'aws_secret_access_key'), true)
        assert.equal(credentialsFile['default'].aws_secret_access_key, 'Secret key in parsedKnownFiles')
    })

    it('New non-secret settings are written to config only', () => {
        assert.equal(Object.hasOwn(configFile['new-profile'], 'region'), true)
        assert.equal(configFile['new-profile'].region, 'us-central-1')

        assert.equal(Object.hasOwn(credentialsFile, 'new-profile'), false)
    })

    it('Existing non-secret settings in credentials are updated there and in config if exists', () => {
        assert.equal(configFile['default'].region, 'us-east-1')
        assert.equal(Object.hasOwn(configFile['default'], 'other'), false)
        assert.equal(configFile['config-only.profile'].region, 'us-west-2')
        assert.equal(Object.hasOwn(configFile, 'credentials-only.profile'), false)

        assert.equal(credentialsFile['default'].region, 'us-east-1')
        assert.equal(credentialsFile['default'].other, 'credentials-only')
        assert.equal(credentialsFile['credentials-only.profile'].region, 'us-east-2')
        assert.equal(Object.hasOwn(credentialsFile, 'config-only.profile'), false)
    })
})
