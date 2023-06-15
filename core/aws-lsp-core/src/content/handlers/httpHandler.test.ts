import { expect } from 'chai'
import { describe } from 'node:test'
import { URI } from 'vscode-uri'
import { HttpRequestOptions, HttpRequester, HttpResponse } from '../../http/requesters'
import { ContentRequestMiddlewareDelegate } from '../contentRequestMiddleware'
import { HttpHandler } from './httpHandler'

class FakeHttpRequester implements HttpRequester {
    private contents: string = ''

    public respondWith(contents: string): void {
        this.contents = contents
    }

    public request(url: string, options?: HttpRequestOptions): Promise<HttpResponse> {
        return Promise.resolve({
            status: 200,
            body: new Uint8Array(),
            headers: {},
            responseText: this.contents,
        })
    }
}

describe('Test HttpHandler', async () => {
    const sampleUri = URI.parse('https://aws.amazon.com/')
    const sampleFileUri = URI.parse('file://sample/location')

    let sut: HttpHandler
    let requester: FakeHttpRequester

    beforeEach(async () => {
        requester = new FakeHttpRequester()
        sut = new HttpHandler(requester)
    })

    it('requests content', async () => {
        requester.respondWith('hello')

        const response = await sut.get(sampleUri, createDelegateReturning('world'))
        expect(response.content).to.equal('hello')
    })

    it('skips file requests', async () => {
        const response = await sut.get(sampleFileUri, createDelegateReturning('foo'))
        expect(response.content).to.equal('foo')
    })

    function createDelegateReturning(returnContent: string): ContentRequestMiddlewareDelegate {
        return (uri: URI) =>
            Promise.resolve({
                content: returnContent,
            })
    }
})
