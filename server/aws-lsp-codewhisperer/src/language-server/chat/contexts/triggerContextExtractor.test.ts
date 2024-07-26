import * as assert from 'assert'
import sinon from 'ts-sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentContext, TriggerContextExtractor } from './triggerContextExtractor'
import { DocumentFqnExtractor } from './documentFqnExtractor'
import { TestFeatures } from '@aws/language-server-runtimes/testing'

describe('DocumentContext', () => {
    let features: TestFeatures
    const mockTypescriptCodeBlock = `function test() {
    console.log('test')
}`
    const mockTSDocument = TextDocument.create('file://test.ts', 'typescript', 1, mockTypescriptCodeBlock)

    beforeEach(() => {
        features = new TestFeatures()
        sinon.stub(DocumentFqnExtractor.prototype, 'extractDocumentSymbols').resolves([])
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('TriggerContextExtractor.getTriggerContext', () => {
        it('returns user intent if prompt starts with certain words', () => {})

        it('able to return state if editor state is not provided', () => {})
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

            const result = await documentContextExtractor.extractDocumentContext(mockTSDocument, {
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

            const result = await documentContextExtractor.extractDocumentContext(mockTSDocument, {
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

        it('returns undefined cursorState if the end position was collapsed', async () => {
            const documentContextExtractor = new TriggerContextExtractor(features.workspace, { characterLimits: 0 })

            const expected: DocumentContext = {
                programmingLanguage: { languageName: 'typescript' },
                relativeFilePath: 'file://test.ts',
                documentSymbols: [],
                text: '',
                hasCodeSnippet: false,
                totalEditorCharacters: mockTypescriptCodeBlock.length,
                cursorState: undefined,
            }

            const result = await documentContextExtractor.extractDocumentContext(mockTSDocument, {
                range: {
                    start: {
                        line: 1,
                        character: 13,
                    },
                    end: {
                        line: 1,
                        character: 13,
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
        const result = await documentContextExtractor.extractDocumentContext(mockDocument, {
            range: {
                start: { line: 1, character: 4 },
                end: { line: 1, character: 23 },
            },
        })

        assert.deepStrictEqual(result, expectedResult)
    })
})
