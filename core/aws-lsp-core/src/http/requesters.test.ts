import { assert } from 'chai'
import { XHRRequest } from 'request-light'
import { SinonStubbedInstance, SinonStubbedMember, stub } from 'sinon'
import { stubInterface } from 'ts-sinon'
import { DefaultHttpRequester, HttpRequestHeaders, HttpResponse } from './requesters'

describe('Test HttpRequest class', async () => {
    describe('Test request()', async () => {
        const url = 'https://my.url.com/some/path'
        const implReturnObj: SinonStubbedInstance<HttpResponse> = stubInterface()

        let instance: DefaultHttpRequester
        let requestImpl: SinonStubbedMember<XHRRequest>

        beforeEach(async () => {
            requestImpl = stub()
            requestImpl.resolves(implReturnObj)

            instance = new DefaultHttpRequester(requestImpl)
        })

        it('calls the impl with no options', async () => {
            const result = await instance.request(url)
            assert.strictEqual(result, implReturnObj)
            assert.deepEqual(requestImpl.args, [[{ url }]])
        })

        it('calls the impl with the header option', async () => {
            const headers: SinonStubbedInstance<HttpRequestHeaders> = stubInterface()
            const result = await instance.request(url, { headers })
            assert.strictEqual(result, implReturnObj)
            assert.deepEqual(requestImpl.args, [[{ url, headers }]])
        })
    })
})
