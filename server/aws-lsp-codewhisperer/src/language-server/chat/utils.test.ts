import * as assert from 'assert'
import { getGovCloudUnsupportedResponse } from './utils'

describe('getGovCloudUnsupportedResponse', () => {
    let savedAwsRegion: string | undefined
    let savedAwsDefaultRegion: string | undefined

    beforeEach(() => {
        savedAwsRegion = process.env.AWS_REGION
        savedAwsDefaultRegion = process.env.AWS_DEFAULT_REGION
        delete process.env.AWS_REGION
        delete process.env.AWS_DEFAULT_REGION
    })

    afterEach(() => {
        if (savedAwsRegion === undefined) {
            delete process.env.AWS_REGION
        } else {
            process.env.AWS_REGION = savedAwsRegion
        }
        if (savedAwsDefaultRegion === undefined) {
            delete process.env.AWS_DEFAULT_REGION
        } else {
            process.env.AWS_DEFAULT_REGION = savedAwsDefaultRegion
        }
    })

    it('returns undefined when no region is available', () => {
        assert.strictEqual(getGovCloudUnsupportedResponse(undefined), undefined)
    })

    it('returns undefined for a non-GovCloud client region', () => {
        assert.strictEqual(getGovCloudUnsupportedResponse('us-east-1'), undefined)
    })

    it('returns a block response for us-gov-east-1 via client region', () => {
        const result = getGovCloudUnsupportedResponse('us-gov-east-1')
        assert.ok(result)
        assert.ok(result!.body?.includes('us-gov-east-1'))
        assert.ok(result!.body?.includes('GovCloud'))
        assert.ok(result!.messageId)
    })

    it('returns a block response for us-gov-west-1 via client region', () => {
        const result = getGovCloudUnsupportedResponse('us-gov-west-1')
        assert.ok(result)
        assert.ok(result!.body?.includes('us-gov-west-1'))
    })

    it('falls back to AWS_REGION when client region is undefined', () => {
        process.env.AWS_REGION = 'us-gov-west-1'
        const result = getGovCloudUnsupportedResponse(undefined)
        assert.ok(result)
        assert.ok(result!.body?.includes('us-gov-west-1'))
    })

    it('falls back to AWS_DEFAULT_REGION when client region and AWS_REGION are undefined', () => {
        process.env.AWS_DEFAULT_REGION = 'us-gov-east-1'
        const result = getGovCloudUnsupportedResponse(undefined)
        assert.ok(result)
        assert.ok(result!.body?.includes('us-gov-east-1'))
    })

    it('prefers client region over env vars', () => {
        process.env.AWS_REGION = 'us-gov-west-1'
        process.env.AWS_DEFAULT_REGION = 'us-gov-east-1'
        // Client region is a non-GovCloud region, so the block should NOT trigger
        // despite env vars pointing at GovCloud regions.
        assert.strictEqual(getGovCloudUnsupportedResponse('us-west-2'), undefined)
    })

    it('prefers AWS_REGION over AWS_DEFAULT_REGION', () => {
        process.env.AWS_REGION = 'us-east-1' // non-GovCloud
        process.env.AWS_DEFAULT_REGION = 'us-gov-west-1'
        assert.strictEqual(getGovCloudUnsupportedResponse(undefined), undefined)
    })
})
