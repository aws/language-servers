import { ChatTriggerType, EditorState } from '@amzn/codewhisperer-streaming'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import sinon from 'ts-sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentContextExtractor } from './contexts/documentContext'
import { QAPIInputConverter } from './qAPIInputConverter'
import assert = require('assert')

describe('QAPIInputConverter', () => {
    let converter: QAPIInputConverter
    let extractEditorStateStub: sinon.SinonStub
    let testFeatures: TestFeatures
    const mockTabId = 'mockTabId'
    const mockDocumentPath = 'file://test.ts'
    const typescriptDocument = TextDocument.create(mockDocumentPath, 'typescript', 1, 'console.log("hello")')
    const mockCursorState = [
        {
            range: {
                start: {
                    line: 1,
                    character: 1,
                },
                end: {
                    line: 1,
                    character: 1,
                },
            },
        },
    ]
    const mockEditorState: EditorState = {
        document: {
            text: typescriptDocument.getText(),
            relativeFilePath: '',
            programmingLanguage: { languageName: 'typescript' },
            documentSymbols: [],
        },
        cursorState: {
            range: {
                start: {
                    line: 0,
                    character: 0,
                },
                end: {
                    line: 500,
                    character: 0,
                },
            },
        },
    }

    beforeEach(() => {
        testFeatures = new TestFeatures()
        extractEditorStateStub = sinon.stub(DocumentContextExtractor.prototype, 'extractEditorState')
        converter = new QAPIInputConverter(testFeatures.workspace, testFeatures.logging)
        extractEditorStateStub.resolves(mockEditorState)

        testFeatures.openDocument(typescriptDocument)
    })

    afterEach(() => {
        extractEditorStateStub.restore()
    })

    describe('.convertChatParamsToInput()', () => {
        it('includes prompt and editor state', async () => {
            const requestInput = await converter.convertChatParamsToInput({
                tabId: mockTabId,
                prompt: { prompt: 'test' },
                textDocument: { uri: mockDocumentPath },
                cursorState: mockCursorState,
            })

            assert.deepStrictEqual(requestInput, {
                success: true,
                data: {
                    conversationState: {
                        chatTriggerType: ChatTriggerType.MANUAL,
                        currentMessage: {
                            userInputMessage: {
                                content: 'test',
                                userInputMessageContext: {
                                    editorState: mockEditorState,
                                },
                            },
                        },
                    },
                },
            })
        })

        it('uses escaped prompt if exist', async () => {
            const requestInput = await converter.convertChatParamsToInput({
                tabId: mockTabId,
                prompt: { prompt: 'test', escapedPrompt: 'test-escaped' },
                textDocument: { uri: mockDocumentPath },
                cursorState: mockCursorState,
            })

            assert.deepStrictEqual(requestInput, {
                success: true,
                data: {
                    conversationState: {
                        chatTriggerType: ChatTriggerType.MANUAL,
                        currentMessage: {
                            userInputMessage: {
                                content: 'test-escaped',
                                userInputMessageContext: {
                                    editorState: mockEditorState,
                                },
                            },
                        },
                    },
                },
            })
        })

        it('throws error if both escapedPrompt and prompt are empty', async () => {
            const result = await converter.convertChatParamsToInput({
                tabId: mockTabId,
                prompt: { prompt: '', escapedPrompt: '' },
            })
            sinon.assert.match(result, { success: false, error: sinon.match.string })
        })

        it('does not terminate if extract editor state flow throws error', async () => {
            extractEditorStateStub.throws()

            const requestInput = await converter.convertChatParamsToInput({
                tabId: mockTabId,
                prompt: { prompt: 'test' },
                textDocument: { uri: mockDocumentPath },
                cursorState: mockCursorState,
            })

            assert.deepStrictEqual(requestInput, {
                success: true,
                data: {
                    conversationState: {
                        chatTriggerType: ChatTriggerType.MANUAL,
                        currentMessage: {
                            userInputMessage: {
                                content: 'test',
                                userInputMessageContext: undefined,
                            },
                        },
                    },
                },
            })
        })

        it('returns empty editor state is document is not found', async () => {
            const requestInput = await converter.convertChatParamsToInput({
                tabId: mockTabId,
                prompt: { prompt: 'test' },
                textDocument: { uri: 'file://non-existent.ts' },
                cursorState: mockCursorState,
            })
            assert.deepStrictEqual(requestInput, {
                success: true,
                data: {
                    conversationState: {
                        chatTriggerType: ChatTriggerType.MANUAL,
                        currentMessage: {
                            userInputMessage: {
                                content: 'test',
                                userInputMessageContext: undefined,
                            },
                        },
                    },
                },
            })
        })

        it('returns empty editor state if cursor state is not passed', async () => {
            const requestInput = await converter.convertChatParamsToInput({
                tabId: mockTabId,
                prompt: { prompt: 'test' },
                textDocument: { uri: 'file://non-existent.ts' },
            })
            assert.deepStrictEqual(requestInput, {
                success: true,
                data: {
                    conversationState: {
                        chatTriggerType: ChatTriggerType.MANUAL,
                        currentMessage: {
                            userInputMessage: {
                                content: 'test',
                                userInputMessageContext: undefined,
                            },
                        },
                    },
                },
            })
        })
    })
})
