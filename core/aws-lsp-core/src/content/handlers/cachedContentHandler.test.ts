import { expect } from 'chai'
import * as mockfs from 'mock-fs'
import { describe } from 'node:test'
import { SinonStubbedInstance, stub } from 'sinon'
import { URI } from 'vscode-uri'
import { HttpRequestOptions, HttpRequester, HttpResponse } from '../../http/requesters'
import { TimeProvider } from '../../util/timeProvider'
import { UriCacheRepository } from '../cache/uriCacheRepository'
import { ContentRequestMiddlewareDelegate } from '../contentRequestMiddleware'
import { CachedContentHandler } from './cachedContentHandler'

class FakeHttpRequester implements HttpRequester {
    private contents: string = ''
    private eTag: string = ''

    public respondWith(contents: string, eTag: string): void {
        this.contents = contents
        this.eTag = eTag
    }

    public request(url: string, options?: HttpRequestOptions): Promise<HttpResponse> {
        return Promise.resolve({
            status: 200,
            body: new Uint8Array(),
            headers: {
                eTag: this.eTag,
            },
            responseText: this.contents,
        })
    }
}

describe('Test CachedContentHandler', async () => {
    const sampleUri = URI.parse('https://aws.amazon.com/')
    const sampleFileUri = URI.parse('file://sample/location')
    const currentTimeMs = 1000000

    let cacheRepository: UriCacheRepository
    let timeProviderStub: SinonStubbedInstance<TimeProvider>
    let requester: FakeHttpRequester

    let sut: CachedContentHandler

    beforeEach(async () => {
        mockfs({
            '//cache': {
                cachedUris: {
                    metadata: '{}',
                },
            },
        })

        requester = new FakeHttpRequester()
        timeProviderStub = stub(new TimeProvider())
        timeProviderStub.currentMilliseconds.returns(currentTimeMs)

        cacheRepository = new UriCacheRepository('//cache', timeProviderStub)
        sut = new CachedContentHandler({
            cacheRepository,
            timeProvider: timeProviderStub,
            httpRequester: requester,
        })
    })

    afterEach(async () => {
        mockfs.restore()
    })

    it('skips file requests', async () => {
        const response = await sut.get(sampleFileUri, createDelegateReturning('foo', 'foo-tag'))
        expect(response.content).to.equal('foo')
    })

    it('requests content when there is no cache', async () => {
        const response = await sut.get(sampleUri, createDelegateReturning('hello', 'hello-tag'))
        expect(response.content).to.equal('hello')

        // check that it got cached
        const cacheMetadata = await cacheRepository.getContentMetadata(sampleUri)
        expect(cacheMetadata?.lastUpdated).to.equal(currentTimeMs)
        expect(cacheMetadata?.eTag).to.equal('hello-tag')
    })

    it('requests content when the cache is stale', async () => {
        const response = await sut.get(sampleUri, createDelegateReturning('hello', 'hello-tag'))
        expect(response.content).to.equal('hello')

        // advance time so that the cache is stale, and make a new request
        const updatedCurrentTime = currentTimeMs + CachedContentHandler.timeoutPeriodInMillis + 1
        timeProviderStub.currentMilliseconds.resetBehavior()
        timeProviderStub.currentMilliseconds.returns(updatedCurrentTime)

        const response2 = await sut.get(sampleUri, createDelegateReturning('world', 'world-tag'))
        expect(response2.content).to.equal('world')

        // check that the cache was updated
        const cacheMetadata = await cacheRepository.getContentMetadata(sampleUri)
        expect(cacheMetadata?.lastUpdated).to.equal(updatedCurrentTime)
        expect(cacheMetadata?.eTag).to.equal('world-tag')
    })

    it('requests content when a different version is online', async () => {
        requester.respondWith('hello', 'hello-tag')
        const response = await sut.get(sampleUri, createDelegateReturning('hello', 'hello-tag'))
        expect(response.content).to.equal('hello')

        requester.respondWith('world', 'world-tag')

        const response2 = await sut.get(sampleUri, createDelegateReturning('world', 'world-tag'))
        expect(response2.content).to.equal('world')

        // check that the cache was updated
        const cacheMetadata = await cacheRepository.getContentMetadata(sampleUri)
        expect(cacheMetadata?.eTag).to.equal('world-tag')
    })

    function createDelegateReturning(returnContent: string, eTag: string): ContentRequestMiddlewareDelegate {
        return (uri: URI) =>
            Promise.resolve({
                content: returnContent,
                eTag: eTag,
            })
    }
})
