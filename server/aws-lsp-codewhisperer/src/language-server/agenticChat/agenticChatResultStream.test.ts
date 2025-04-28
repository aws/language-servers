import * as assert from 'assert'
import { ChatResult } from '@aws/language-server-runtimes/protocol'
import { AgenticChatResultStream } from './agenticChatResultStream'
import { TestFeatures } from '@aws/language-server-runtimes/testing'

// TODO: renable this test suite and update the following tests.
xdescribe('agenticChatResponse', function () {
    let output: (ChatResult | string)[] = []
    const logging = new TestFeatures().logging
    const sendProgress = async (s: ChatResult | string) => void output.push(s)
    let chatResultStream: AgenticChatResultStream

    beforeEach(function () {
        output = []
        chatResultStream = new AgenticChatResultStream(sendProgress)
    })

    it('combines all previous results on write', async function () {
        await chatResultStream.writeResultBlock({ body: 'first' })
        await chatResultStream.writeResultBlock({ body: 'second' })
        await chatResultStream.writeResultBlock({ body: 'third' })

        assert.deepStrictEqual(chatResultStream.getResult(), {
            body: `first${AgenticChatResultStream.resultDelimiter}second${AgenticChatResultStream.resultDelimiter}third`,
        })
    })

    it('inherits properties from the last result', async function () {
        await chatResultStream.writeResultBlock({ body: 'first', messageId: '1' })
        await chatResultStream.writeResultBlock({ body: 'second', messageId: '2' })
        await chatResultStream.writeResultBlock({ body: 'third', messageId: '3' })

        assert.deepStrictEqual(chatResultStream.getResult(), {
            body: `first${AgenticChatResultStream.resultDelimiter}second${AgenticChatResultStream.resultDelimiter}third`,
            messageId: '3',
        })
    })

    it('streams the results to the chat', async function () {
        const writer = chatResultStream.getResultStreamWriter()
        await writer.write({ body: 'f' })
        await writer.write({ body: 'fi' })
        await writer.write({ body: 'firs' })
        await writer.write({ body: 'first' })

        await writer.close()

        assert.deepStrictEqual(chatResultStream.getResult(), { body: 'first' })
    })

    it('combines results properly', async function () {
        const writer = chatResultStream.getResultStreamWriter()
        await writer.write({ body: 'f', messageId: '1' })
        await writer.write({ body: 'fi', messageId: '1' })
        await writer.write({ body: 'firs', messageId: '1' })
        await writer.write({ body: 'first', messageId: '1' })

        await writer.close()

        assert.deepStrictEqual(chatResultStream.getResult(), {
            messageId: '1',
            body: 'first',
        })
    })

    it('throws error if multiple stream writers are initialized', async function () {
        const writer = chatResultStream.getResultStreamWriter()
        assert.throws(() => chatResultStream.getResultStreamWriter(), Error)
        await writer.close()

        assert.ok(chatResultStream.getResultStreamWriter())
    })

    it('allows blocks to overwritten on id', async function () {
        const first = await chatResultStream.writeResultBlock({ body: 'first' })
        const second = await chatResultStream.writeResultBlock({ body: 'second' })
        await chatResultStream.writeResultBlock({ body: 'third' })

        await chatResultStream.overwriteResultBlock({ body: 'fourth' }, first)
        await chatResultStream.overwriteResultBlock({ body: 'fifth' }, second)

        assert.deepStrictEqual(chatResultStream.getResult(), {
            body: `fourth${AgenticChatResultStream.resultDelimiter}fifth${AgenticChatResultStream.resultDelimiter}third`,
        })
    })
})
