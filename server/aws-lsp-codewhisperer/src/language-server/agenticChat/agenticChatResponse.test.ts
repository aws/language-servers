import * as assert from 'assert'
import { ChatResult } from '@aws/language-server-runtimes/protocol'
import { AgenticChatResponse } from './agenticChatResponse'
import { TestFeatures } from '@aws/language-server-runtimes/testing'

describe('agenticChatResponse', function () {
    let output: (ChatResult | string)[] = []
    const logging = new TestFeatures().logging
    const sendProgress = async (s: ChatResult | string) => void output.push(s)
    let chatResponse: AgenticChatResponse

    beforeEach(function () {
        output = []
        chatResponse = new AgenticChatResponse(logging, sendProgress)
    })

    it('combines all previous results on write', async function () {
        chatResponse.appendResult({ body: 'first' })
        chatResponse.appendResult({ body: 'second' })
        chatResponse.appendResult({ body: 'third' })

        assert.deepStrictEqual(chatResponse.getResponse(), {
            body: `first${AgenticChatResponse.resultDelimiter}second${AgenticChatResponse.resultDelimiter}third`,
        })
    })

    it('inherits properties from the last result', async function () {
        chatResponse.appendResult({ body: 'first', messageId: '1' })
        chatResponse.appendResult({ body: 'second', messageId: '2' })
        chatResponse.appendResult({ body: 'third', messageId: '3' })

        assert.deepStrictEqual(chatResponse.getResponse(), {
            body: `first${AgenticChatResponse.resultDelimiter}second${AgenticChatResponse.resultDelimiter}third`,
            messageId: '1',
        })
    })

    it('streams the results to the chat', async function () {
        const writer = chatResponse.getResultStreamWriter()
        await writer.write({ body: 'f' })
        await writer.write({ body: 'fi' })
        await writer.write({ body: 'firs' })
        await writer.write({ body: 'first' })

        await writer.close()

        assert.deepStrictEqual(chatResponse.getResponse(), { body: 'first' })
    })

    it('combines results properly', async function () {
        const writer = chatResponse.getResultStreamWriter()
        await writer.write({ body: 'f', messageId: '1' })
        await writer.write({ body: 'fi', messageId: '1' })
        await writer.write({ body: 'firs', messageId: '1' })
        await writer.write({ body: 'first', messageId: '1' })

        await writer.close()

        assert.deepStrictEqual(chatResponse.getResponse(), {
            messageId: '1',
            body: 'first',
        })
    })

    it('throws error if multiple stream writers are initialized', async function () {
        const writer = chatResponse.getResultStreamWriter()
        assert.throws(() => chatResponse.getResultStreamWriter(), Error)
        await writer.close()

        assert.ok(chatResponse.getResultStreamWriter())
    })
})
