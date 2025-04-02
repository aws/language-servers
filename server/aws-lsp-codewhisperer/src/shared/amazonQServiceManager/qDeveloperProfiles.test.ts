import * as assert from 'assert'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { SsoConnectionType } from '../utils'
import { AWSInitializationOptions, Logging } from '@aws/language-server-runtimes/server-interface'
import {
    AmazonQDeveloperProfile,
    getListAllAvailableProfilesHandler,
    ListAllAvailableProfilesHandler,
    signalsAWSQDeveloperProfilesEnabled,
} from './qDeveloperProfiles'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../shared/constants'

const SOME_Q_DEVELOPER_PROFILE_ARN = 'some-random-q-developer-profile-arn'
const SOME_Q_DEVELOPER_PROFILE_NAME = 'some-random-q-developer-profile-name'
const SOME_Q_ENDPOINT_URL = 'some-random-q-endpoint'
const SOME_AWS_Q_ENDPOINT = {
    [DEFAULT_AWS_Q_REGION]: DEFAULT_AWS_Q_ENDPOINT_URL,
}
const SOME_AWS_Q_ENDPOINTS = {
    ...SOME_AWS_Q_ENDPOINT,
    'eu-central-1': SOME_Q_ENDPOINT_URL,
}

const EXPECTED_DEVELOPER_PROFILES_LIST: AmazonQDeveloperProfile[] = Object.keys(SOME_AWS_Q_ENDPOINTS).map(region => ({
    arn: SOME_Q_DEVELOPER_PROFILE_ARN,
    name: SOME_Q_DEVELOPER_PROFILE_NAME,
    identityDetails: {
        region,
    },
}))

const UNHAPPY_SSO_CONNECTION_TYPES: SsoConnectionType[] = ['builderId', 'none']

describe('ListAllAvailableProfiles Handler', () => {
    let logging: StubbedInstance<Logging>

    let codeWhispererService: StubbedInstance<CodeWhispererServiceToken>
    let handler: ListAllAvailableProfilesHandler

    const listAvailableProfilesResponse = {
        profiles: [
            {
                arn: SOME_Q_DEVELOPER_PROFILE_ARN,
                profileName: SOME_Q_DEVELOPER_PROFILE_NAME,
            },
        ],
        $response: {} as any,
    }

    const listAvailableProfilesResponseWithNextToken = {
        ...listAvailableProfilesResponse,
        nextToken: 'some-random-next-token',
    }

    beforeEach(() => {
        logging = stubInterface<Logging>()
        codeWhispererService = stubInterface<CodeWhispererServiceToken>()
        codeWhispererService.listAvailableProfiles.resolves(listAvailableProfilesResponse)

        handler = getListAllAvailableProfilesHandler(() => codeWhispererService)
    })

    it('should aggregrate profiles retrieved from different regions', async () => {
        const profiles = await handler({
            connectionType: 'identityCenter',
            logging,
            endpoints: SOME_AWS_Q_ENDPOINTS,
        })

        assert.strictEqual(
            codeWhispererService.listAvailableProfiles.callCount,
            EXPECTED_DEVELOPER_PROFILES_LIST.length
        )
        assert.deepStrictEqual(profiles, EXPECTED_DEVELOPER_PROFILES_LIST)
    })

    UNHAPPY_SSO_CONNECTION_TYPES.forEach((connectionType: SsoConnectionType) => {
        it(`should return an empty list when connection type equals: ${connectionType}`, async () => {
            const profiles = await handler({
                connectionType,
                logging,
            })

            assert.deepStrictEqual(profiles, [])
        })
    })

    describe('Pagination', () => {
        const MAX_EXPECTED_PAGES = 10

        it('should paginate if nextToken is defined', async () => {
            const EXPECTED_CALLS = 3

            codeWhispererService.listAvailableProfiles
                .onFirstCall()
                .resolves(listAvailableProfilesResponseWithNextToken)
            codeWhispererService.listAvailableProfiles
                .onSecondCall()
                .resolves(listAvailableProfilesResponseWithNextToken)
            codeWhispererService.listAvailableProfiles.onThirdCall().resolves(listAvailableProfilesResponse)

            const profiles = await handler({
                connectionType: 'identityCenter',
                logging,
                endpoints: SOME_AWS_Q_ENDPOINT,
            })

            assert.strictEqual(codeWhispererService.listAvailableProfiles.callCount, EXPECTED_CALLS)
            assert.deepStrictEqual(profiles, Array(EXPECTED_CALLS).fill(EXPECTED_DEVELOPER_PROFILES_LIST[0]))
        })

        it(`should retrieve at most ${MAX_EXPECTED_PAGES} pages`, async () => {
            codeWhispererService.listAvailableProfiles.resolves(listAvailableProfilesResponseWithNextToken)

            const profiles = await handler({
                connectionType: 'identityCenter',
                logging,
                endpoints: SOME_AWS_Q_ENDPOINT,
            })

            assert.strictEqual(codeWhispererService.listAvailableProfiles.callCount, MAX_EXPECTED_PAGES)
            assert.deepStrictEqual(profiles, Array(MAX_EXPECTED_PAGES).fill(EXPECTED_DEVELOPER_PROFILES_LIST[0]))
        })
    })
})

describe('signalsAWSQDeveloperProfilesEnabled', () => {
    const makeQCapability = (value?: any) => {
        return value !== undefined ? { developerProfiles: value } : {}
    }

    const makeInitOptions = (value?: any): AWSInitializationOptions => {
        return { awsClientCapabilities: { q: makeQCapability(value) } }
    }

    const TEST_CASES: { input: AWSInitializationOptions; expected: boolean }[] = [
        { input: {}, expected: false },
        { input: { awsClientCapabilities: {} }, expected: false },
        { input: makeInitOptions(), expected: false },
        { input: makeInitOptions([]), expected: false },
        { input: makeInitOptions({}), expected: false },
        { input: makeInitOptions(42), expected: false },
        { input: makeInitOptions('some-string'), expected: false },
        { input: makeInitOptions(false), expected: false },
        { input: makeInitOptions(true), expected: true },
    ]

    TEST_CASES.forEach(testCase => {
        it(`should return: ${testCase.expected} when passed: ${JSON.stringify(testCase.input)}`, () => {
            assert.strictEqual(signalsAWSQDeveloperProfilesEnabled(testCase.input), testCase.expected)
        })
    })
})
