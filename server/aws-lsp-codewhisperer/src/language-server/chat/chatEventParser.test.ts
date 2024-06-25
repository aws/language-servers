import { ChatResult } from '@aws/language-server-runtimes/protocol'
import * as assert from 'assert'
import sinon from 'ts-sinon'

import { ChatEventParser } from './chatEventParser'
import { Metric } from '../telemetry/metric'
import { AddMessageEvent } from '../telemetry/types'

describe('ChatEventParser', () => {
    const mockMessageId = 'mock-message-id'

    it('set error if invalidState event is received', () => {
        const chatEventParser = new ChatEventParser(mockMessageId, new Metric<AddMessageEvent>())

        sinon.assert.match(
            chatEventParser.processPartialEvent({
                invalidStateEvent: {
                    message: 'Invalid state!',
                    reason: 'Unknown!',
                },
            }),
            {
                success: false,
                data: {
                    messageId: mockMessageId,
                    body: undefined,
                    canBeVoted: true,
                    codeReference: undefined,
                    followUp: undefined,
                    relatedContent: undefined,
                },
                error: sinon.match.string,
            }
        )
    })

    it('set error if error event is received', () => {
        const chatEventParser = new ChatEventParser(mockMessageId, new Metric<AddMessageEvent>())

        sinon.assert.match(
            chatEventParser.processPartialEvent({
                error: {
                    name: 'InternalServerException',
                    message: 'Error!',
                    $fault: 'server',
                    $retryable: false,
                    $metadata: {},
                },
            }),
            {
                success: false,
                data: {
                    messageId: mockMessageId,
                    body: undefined,
                    canBeVoted: true,
                    codeReference: undefined,
                    followUp: undefined,
                    relatedContent: undefined,
                },
                error: sinon.match.string,
            }
        )

        assert.strictEqual(chatEventParser.error, 'Error!')
    })

    it('processPartialEvent appends new event on top of the previous result', () => {
        const chatEventParser = new ChatEventParser(mockMessageId, new Metric<AddMessageEvent>())

        assert.deepStrictEqual(
            chatEventParser.processPartialEvent({
                assistantResponseEvent: {
                    content: 'This is an ',
                },
            }),
            {
                success: true,
                data: {
                    messageId: mockMessageId,
                    body: 'This is an ',
                    canBeVoted: true,
                    codeReference: undefined,
                    followUp: undefined,
                    relatedContent: undefined,
                },
            }
        )

        assert.deepStrictEqual(
            chatEventParser.processPartialEvent({
                assistantResponseEvent: {
                    content: 'assistant response.',
                },
            }),
            {
                success: true,
                data: {
                    messageId: mockMessageId,
                    body: 'This is an assistant response.',
                    canBeVoted: true,
                    codeReference: undefined,
                    followUp: undefined,
                    relatedContent: undefined,
                },
            }
        )
    })

    it('getChatResult returns the accumulated result', () => {
        const chatEventParser = new ChatEventParser(mockMessageId, new Metric<AddMessageEvent>())

        chatEventParser.processPartialEvent({
            assistantResponseEvent: {
                content: 'This is an ',
            },
        })

        chatEventParser.processPartialEvent({
            followupPromptEvent: {
                followupPrompt: {
                    content: 'follow up 1',
                },
            },
        })

        assert.deepStrictEqual(chatEventParser.getChatResult(), {
            success: true,
            data: {
                messageId: mockMessageId,
                body: 'This is an ',
                followUp: {
                    text: ChatEventParser.FOLLOW_UP_TEXT,
                    options: [
                        {
                            pillText: 'follow up 1',
                            prompt: 'follow up 1',
                        },
                    ],
                },
                canBeVoted: true,
                codeReference: undefined,
                relatedContent: undefined,
            },
        })

        chatEventParser.processPartialEvent({
            followupPromptEvent: {
                followupPrompt: {
                    content: 'follow up 2',
                },
            },
        })

        chatEventParser.processPartialEvent({
            codeReferenceEvent: {
                references: [
                    {
                        licenseName: 'MIT',
                        repository: 'langauge-servers',
                    },
                ],
            },
        })

        chatEventParser.processPartialEvent({
            assistantResponseEvent: {
                content: 'assistant response.',
            },
        })
        chatEventParser.processPartialEvent({
            supplementaryWebLinksEvent: {
                supplementaryWebLinks: [
                    {
                        title: 'weblink1',
                        snippet: 'snippet1',
                        url: 'https://link1.com',
                    },
                ],
            },
        })

        const expectedData: ChatResult = {
            messageId: mockMessageId,
            body: 'This is an assistant response.',
            canBeVoted: true,
            relatedContent: {
                content: [
                    {
                        title: 'weblink1',
                        body: 'snippet1',
                        url: 'https://link1.com',
                    },
                ],
            },
            codeReference: [
                {
                    licenseName: 'MIT',
                    repository: 'langauge-servers',
                    recommendationContentSpan: undefined,
                    information: ChatEventParser.getReferencedInformation({
                        licenseName: 'MIT',
                        repository: 'langauge-servers',
                    }),
                },
            ],
            followUp: {
                text: ChatEventParser.FOLLOW_UP_TEXT,
                options: [
                    {
                        pillText: 'follow up 1',
                        prompt: 'follow up 1',
                    },
                    {
                        pillText: 'follow up 2',
                        prompt: 'follow up 2',
                    },
                ],
            },
        }

        assert.deepStrictEqual(chatEventParser.getChatResult(), { success: true, data: expectedData })
    })
})
