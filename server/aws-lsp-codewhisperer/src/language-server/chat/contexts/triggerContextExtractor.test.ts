import * as assert from 'assert'
import sinon from 'ts-sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentContext, TriggerContextExtractor } from './triggerContextExtractor'
import { DocumentFqnExtractor } from './documentFqnExtractor'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { UserIntent } from '@amzn/codewhisperer-streaming'

describe('TriggerContextExtractor', () => {
    let features: TestFeatures
    const mockTypescriptCodeBlock = `function test() {
    console.log('test')
}`
    const mockTSDocument = TextDocument.create('file://test.ts', 'typescript', 1, mockTypescriptCodeBlock)
    const mockTabId = 'tab-1'

    beforeEach(() => {
        features = new TestFeatures()
        sinon.stub(DocumentFqnExtractor.prototype, 'extractDocumentSymbols').returns([Promise.resolve([]), () => {}])
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('TriggerContextExtractor.extractEditorState', () => {
        it('extracts editor state for range selection', async () => {
            const documentContextExtractor = new TriggerContextExtractor(features.workspace, { characterLimits: 19 })
            const expected: DocumentContext = {
                programmingLanguage: { languageName: 'typescript' },
                relativeFilePath: 'file://test.ts',
                documentSymbols: [],
                text: "console.log('test')",
                hasCodeSnippet: true,
                totalEditorCharacters: mockTypescriptCodeBlock.length,
                cursorState: {
                    range: {
                        start: {
                            line: 0,
                            character: 8,
                        },
                        end: {
                            line: 0,
                            character: 11,
                        },
                    },
                },
            }

            const result = await documentContextExtractor.extractDocumentContext(mockTabId, mockTSDocument, {
                // highlighting "log"
                range: {
                    start: {
                        line: 1,
                        character: 12,
                    },
                    end: {
                        line: 1,
                        character: 15,
                    },
                },
            })

            assert.deepStrictEqual(result, expected)
        })

        it('extracts editor state for collapsed position', async () => {
            const documentContextExtractor = new TriggerContextExtractor(features.workspace, { characterLimits: 19 })
            const expected: DocumentContext = {
                programmingLanguage: { languageName: 'typescript' },
                relativeFilePath: 'file://test.ts',
                documentSymbols: [],
                text: "console.log('test')",
                hasCodeSnippet: true,
                totalEditorCharacters: mockTypescriptCodeBlock.length,
                cursorState: {
                    range: {
                        start: {
                            line: 0,
                            character: 9,
                        },
                        end: {
                            line: 0,
                            character: 10,
                        },
                    },
                },
            }

            const result = await documentContextExtractor.extractDocumentContext(mockTabId, mockTSDocument, {
                // highlighting "o" in "log"
                range: {
                    start: {
                        line: 1,
                        character: 13,
                    },
                    end: {
                        line: 1,
                        character: 14,
                    },
                },
            })

            assert.deepStrictEqual(result, expected)
        })
    })

    it('handles other languages correctly', async () => {
        const documentContextExtractor = new TriggerContextExtractor(features.workspace, { characterLimits: 19 })

        const mockGoCodeBLock = `func main() {
    fmt.Println("test")
}`
        const mockDocument = TextDocument.create('file://test.go', 'go', 1, mockGoCodeBLock)

        const expectedResult: DocumentContext = {
            programmingLanguage: { languageName: 'go' },
            relativeFilePath: 'file://test.go',
            documentSymbols: [],
            text: 'fmt.Println("test")',
            totalEditorCharacters: mockGoCodeBLock.length,
            hasCodeSnippet: true,
            cursorState: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 19 },
                },
            },
        }
        const result = await documentContextExtractor.extractDocumentContext(mockTabId, mockDocument, {
            range: {
                start: { line: 1, character: 4 },
                end: { line: 1, character: 23 },
            },
        })

        assert.deepStrictEqual(result, expectedResult)
    })

    describe('TriggerContextExtractor.getTriggerContext', () => {
        beforeEach(() => {
            features.openDocument(mockTSDocument)
        })

        it('returns only userIntent if textDocument uri is not passed', async () => {
            const documentContextExtractor = new TriggerContextExtractor(features.workspace, { characterLimits: 10 })

            const result = await documentContextExtractor.getTriggerContext({
                prompt: { prompt: 'Explain this code' },
                tabId: 'tab1',
                cursorState: [
                    {
                        range: {
                            start: { line: 1, character: 4 },
                            end: { line: 1, character: 23 },
                        },
                    },
                ],
            })

            assert.deepStrictEqual(result, { userIntent: UserIntent.EXPLAIN_CODE_SELECTION })
        })

        it('returns only userIntent if textDocument is not found', async () => {
            const documentContextExtractor = new TriggerContextExtractor(features.workspace, { characterLimits: 10 })

            const result = await documentContextExtractor.getTriggerContext({
                prompt: { prompt: 'Fix this code' },
                tabId: 'tab1',
                textDocument: {
                    uri: 'file://non-existent.ts',
                },
                cursorState: [
                    {
                        range: {
                            start: { line: 1, character: 4 },
                            end: { line: 1, character: 23 },
                        },
                    },
                ],
            })

            assert.deepStrictEqual(result, { userIntent: UserIntent.APPLY_COMMON_BEST_PRACTICES })
        })

        it('uses a default cursor state if cursor state is not defined', async () => {
            const documentContextExtractor = new TriggerContextExtractor(features.workspace, { characterLimits: 10 })

            const result = await documentContextExtractor.getTriggerContext({
                prompt: { prompt: 'Fix this code' },
                tabId: 'tab1',
                textDocument: {
                    uri: mockTSDocument.uri,
                },
            })

            assert.deepStrictEqual(result, {
                programmingLanguage: { languageName: 'typescript' },
                relativeFilePath: 'file://test.ts',
                documentSymbols: [],
                text: 'function t',
                hasCodeSnippet: true,
                totalEditorCharacters: mockTypescriptCodeBlock.length,
                userIntent: UserIntent.APPLY_COMMON_BEST_PRACTICES,
                cursorState: {
                    range: {
                        start: {
                            line: 0,
                            character: 0,
                        },
                        end: {
                            line: 0,

                            character: 0,
                        },
                    },
                },
            })
        })

        it('returns all context and userIntent', async () => {
            const documentContextExtractor = new TriggerContextExtractor(features.workspace, { characterLimits: 5 })

            const result = await documentContextExtractor.getTriggerContext({
                prompt: { prompt: 'Fix this code' },
                tabId: 'tab1',
                textDocument: {
                    uri: mockTSDocument.uri,
                },
                cursorState: [
                    {
                        position: {
                            line: 1,
                            character: 7,
                        },
                    },
                ],
            })

            assert.deepStrictEqual(result, {
                programmingLanguage: { languageName: 'typescript' },
                relativeFilePath: 'file://test.ts',
                documentSymbols: [],
                text: 'conso',
                hasCodeSnippet: true,
                totalEditorCharacters: mockTypescriptCodeBlock.length,
                userIntent: UserIntent.APPLY_COMMON_BEST_PRACTICES,
                cursorState: {
                    range: {
                        start: {
                            line: 0,
                            character: 3,
                        },
                        end: {
                            line: 0,
                            character: 3,
                        },
                    },
                },
            })
        })
    })
})
