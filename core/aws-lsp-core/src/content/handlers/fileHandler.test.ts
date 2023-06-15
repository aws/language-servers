import { expect } from 'chai'
import * as mockfs from 'mock-fs'
import { describe } from 'node:test'
import { URI } from 'vscode-uri'
import { ContentRequestMiddlewareDelegate } from '../contentRequestMiddleware'
import { FileHandler } from './fileHandler'

describe('Test FileHandler', async () => {
    const sampleUri = URI.parse('https://aws.amazon.com/')
    const sampleFileUri = URI.parse('file://sample/location')

    let sut: FileHandler

    beforeEach(async () => {
        mockfs({
            '//sample/location': Buffer.from('hello'),
        })

        sut = new FileHandler()
    })

    afterEach(async () => {
        mockfs.restore()
    })

    it('requests content', async () => {
        const response = await sut.get(sampleFileUri, createDelegateReturning('world'))
        expect(response.content).to.equal('hello')
    })

    it('skips non-file requests', async () => {
        const response = await sut.get(sampleUri, createDelegateReturning('foo'))
        expect(response.content).to.equal('foo')
    })

    function createDelegateReturning(returnContent: string): ContentRequestMiddlewareDelegate {
        return (uri: URI) =>
            Promise.resolve({
                content: returnContent,
            })
    }
})
