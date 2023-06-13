import { expect } from 'chai'
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as mockfs from 'mock-fs'
import { describe } from 'node:test'
import { SinonStubbedInstance, stub } from 'sinon'
import { URI } from 'vscode-uri'
import { TimeProvider } from '../../util/timeProvider'
import { UriCacheMetadata, UriCacheRepository } from './uriCacheRepository'
import path = require('path')

describe('Test UriCacheRepository', async () => {
    const sampleUri = URI.parse('https://aws.amazon.com/')
    const currentTimeMs = 1234
    const metadataPath = '//cache/cachedUris/metadata'

    let timeProviderStub: SinonStubbedInstance<TimeProvider>

    let sut: UriCacheRepository

    beforeEach(async () => {
        mockfs({
            '//cache': {
                cachedUris: {
                    metadata: '{}',
                },
            },
        })

        timeProviderStub = stub(new TimeProvider())
        timeProviderStub.currentMilliseconds.returns(currentTimeMs)

        sut = new UriCacheRepository('//cache', timeProviderStub)
    })

    afterEach(async () => {
        mockfs.restore()
    })

    describe('cacheContent', async () => {
        it('stores data', async () => {
            await sut.cacheContent(sampleUri, 'hello world', 'some eTag')

            // metadata roster is updated
            expect(fs.existsSync(metadataPath)).to.be.true
            const savedMetadata: UriCacheMetadata = JSON.parse(fs.readFileSync(metadataPath, { encoding: 'utf8' }))
            expect(savedMetadata[sampleUri.toString()].contentFileName).to.equal(getHash(sampleUri))
            expect(savedMetadata[sampleUri.toString()].eTag).to.equal('some eTag')
            expect(savedMetadata[sampleUri.toString()].lastUpdated).to.equal(currentTimeMs)

            // content is saved
            const savedContent = fs.readFileSync(getCachePath(sampleUri), { encoding: 'utf8' })
            expect(savedContent).to.equal('hello world')
        })
    })

    describe('touchLastUpdatedTime', async () => {
        it('stores data', async () => {
            await sut.cacheContent(sampleUri, 'hello world', 'some eTag')

            const updatedTime = 9876
            timeProviderStub.currentMilliseconds.resetBehavior()
            timeProviderStub.currentMilliseconds.returns(updatedTime)

            await sut.touchLastUpdatedTime(sampleUri)

            // metadata roster is updated
            const savedMetadata: UriCacheMetadata = JSON.parse(fs.readFileSync(metadataPath, { encoding: 'utf8' }))
            expect(savedMetadata[sampleUri.toString()].lastUpdated).to.equal(updatedTime)
        })
    })

    describe('getContent', async () => {
        it('retrieves data', async () => {
            await sut.cacheContent(sampleUri, 'hello world', 'some eTag')
            const content = await sut.getContent(sampleUri)

            expect(content).to.equal('hello world')
        })
    })

    describe('getContentETag', async () => {
        it('retrieves data', async () => {
            await sut.cacheContent(sampleUri, 'hello world', 'some eTag')
            const eTag = await sut.getContentETag(sampleUri)

            expect(eTag).to.equal('some eTag')
        })
    })

    function getCachePath(uri: URI): string {
        return path.join('//cache/cachedUris', getHash(uri))
    }

    function getHash(uri: URI): string {
        return createHash('sha1').update(uri.toString()).digest('hex')
    }
})
