import * as assert from 'assert'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { SsoConnectionType } from '../utils'
import { Logging } from '@aws/language-server-runtimes/server-interface'
import {
    AmazonQDeveloperProfile,
    getListAllAvailableProfilesHandler,
    ListAllAvailableProfilesHandler,
} from './qDeveloperProfiles'
import { DEFAULT_AWS_Q_ENDPOINT_URL, DEFAULT_AWS_Q_REGION } from '../../constants'

const SOME_Q_DEVELOPER_PROFILE_ARN = 'some-random-q-developer-profile-arn'
const SOME_Q_DEVELOPER_PROFILE_NAME = 'some-random-q-developer-profile-name'
const SOME_Q_ENDPOINT = 'some-random-q-endpoint'
const SOME_AWS_Q_ENDPOINTS = {
    [DEFAULT_AWS_Q_REGION]: DEFAULT_AWS_Q_ENDPOINT_URL,
    'eu-central-1': SOME_Q_ENDPOINT,
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

    beforeEach(() => {
        logging = stubInterface<Logging>()
        codeWhispererService = stubInterface<CodeWhispererServiceToken>()

        codeWhispererService.listAvailableProfiles.returns(
            Promise.resolve({
                profiles: [
                    {
                        arn: SOME_Q_DEVELOPER_PROFILE_ARN,
                        profileName: SOME_Q_DEVELOPER_PROFILE_NAME,
                    },
                ],
                $response: {} as any,
            })
        )

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
})
