import { assert } from 'chai'
import { createTempDirectorySync, ITempDirectorySync } from 'create-temp-directory'
import { SinonSpiedInstance, SinonStubbedInstance, spy, stub } from 'sinon'
import { URI } from 'vscode-uri'
import { Time } from '../../../../src/utils/datetime'
import { DefaultHttpRequester } from '../../../../src/utils/http/request'
import { CachedUriContentResolver, HttpUriContentResolver } from '../../../../src/utils/uri/resolve'

describe(`Test ${CachedUriContentResolver.name}`, async () => {
    describe(`Test getContent()`, async () => {
        const realHttpUri = URI.parse('https://json.schemastore.org/mocharc.json')
        let expectedUriContent: string
        let tmpDir: ITempDirectorySync
        let httpDownloaderSpy: SinonSpiedInstance<HttpUriContentResolver>
        let instance: CachedUriContentResolver
        let timeStub: SinonStubbedInstance<Time>

        before(async () => {
            // Download actual content to verify against in tests
            expectedUriContent = (await new DefaultHttpRequester().request(realHttpUri.toString())).responseText
        })

        beforeEach(async () => {
            tmpDir = createTempDirectorySync()

            httpDownloaderSpy = spy(new HttpUriContentResolver())

            timeStub = stub(new Time())
            timeStub.inMilliseconds.callThrough()

            instance = new CachedUriContentResolver(tmpDir.path, httpDownloaderSpy, timeStub)
        })

        afterEach(async () => {
            tmpDir.remove()
        })

        it('gets uri content from server on initial request.', async () => {
            const result = await instance.getContent(realHttpUri)
            assert.strictEqual(result, expectedUriContent)
            assert(httpDownloaderSpy.getContent.calledOnce)
        })

        it('gets uri content from cache on second request.', async () => {
            // First request will download
            let result = await instance.getContent(realHttpUri)
            assert.strictEqual(result, expectedUriContent)
            assert(httpDownloaderSpy.getContent.calledOnce)

            // Second request returns same content without download
            result = await instance.getContent(realHttpUri)
            assert(httpDownloaderSpy.getContent.calledOnce)
            assert.strictEqual(result, expectedUriContent)
        })

        it('sends request with etag if cache is timed out.', async () => {
            // First request will download
            let result = await instance.getContent(realHttpUri)
            assert.strictEqual(result, expectedUriContent)

            // Stub the timer to be timed out
            timeStub.inMilliseconds.resetBehavior()
            const millisecondAfterTimeoutPeriod =
                new Time().inMilliseconds() + CachedUriContentResolver.timeoutPeriodInMillis + 1
            timeStub.inMilliseconds.returns(millisecondAfterTimeoutPeriod)

            // Second request will download, but with eTag
            result = await instance.getContent(realHttpUri)
            assert.strictEqual(result, expectedUriContent)
            // Assert second request uses eTag
            assert(httpDownloaderSpy.getContent.calledTwice)
            assert.deepStrictEqual(httpDownloaderSpy.getContent.secondCall.args[1], instance.getETag(realHttpUri))
        })
    })
})
