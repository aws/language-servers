import * as assert from 'assert'
import { ChatResult } from '@aws/language-server-runtimes/protocol'
import { AgenticChatResponse } from './agenticChatResponse'
import { Logging } from '@aws/language-server-runtimes/server-interface'

describe('agenticChatResponse', function () {
    it('combines all previous results on write', async function () {
        const output: (ChatResult | string)[] = []
        const sendProgress = async (s: ChatResult | string) => void output.push(s)
        const chatResponse = new AgenticChatResponse({} as Logging, sendProgress)

        chatResponse.addResult({ body: 'first' })
        chatResponse.addResult({ body: 'second' })
        chatResponse.addResult({ body: 'third' })

        assert.deepStrictEqual(output, [
            { body: 'first' },
            { body: `first${AgenticChatResponse.resultDelimiter}second` },
            { body: `first${AgenticChatResponse.resultDelimiter}second${AgenticChatResponse.resultDelimiter}third` },
        ])
    })

    it('streams the results to the chat', async function () {
        const output: (ChatResult | string)[] = []
        const sendProgress = async (s: ChatResult | string) => void output.push(s)
        const chatResponse = new AgenticChatResponse({} as Logging, sendProgress)

        const writer = chatResponse.getResultStreamWriter()
        await writer.write({ body: 'f' })
        await writer.write({ body: 'fi' })
        await writer.write({ body: 'firs' })
        await writer.write({ body: 'first' })

        await writer.close()

        assert.deepStrictEqual(output[output.length - 1], { body: 'first' })
    })

    it('combines chunks properly', async function () {
        const output: (ChatResult | string)[] = []
        const sendProgress = async (s: ChatResult | string) => void output.push(s)
        const chatResponse = new AgenticChatResponse({} as Logging, sendProgress)

        const writer = chatResponse.getResultStreamWriter()
        await writer.write({ body: 'f' })
        await writer.write({ body: 'fi' })
        await writer.write({ body: 'firs' })
        await writer.write({ body: 'first' })

        await writer.close()

        assert.deepStrictEqual(chatResponse.getCombinedResult({ messageId: '1', body: 'thrown away' }), {
            messageId: '1',
            body: 'first',
        })
    })

    it('throws error if multiple stream writers are initializes', async function () {
        const output: (ChatResult | string)[] = []
        const sendProgress = async (s: ChatResult | string) => void output.push(s)
        const chatResponse = new AgenticChatResponse({} as Logging, sendProgress)

        const writer = chatResponse.getResultStreamWriter()
        assert.throws(() => chatResponse.getResultStreamWriter(), Error)
        await writer.close()

        assert.ok(chatResponse.getResultStreamWriter())
    })
})
