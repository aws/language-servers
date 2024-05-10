import { EditorState } from '@amzn/codewhisperer-streaming'
import * as assert from 'assert'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentContextExtractor } from './documentContext'

describe('DocumentContext', () => {
    const mockTypescriptCodeBlock = `function test() {
    console.log('test')
}`
    const mockTSDocument = TextDocument.create('file://test.ts', 'typescript', 1, mockTypescriptCodeBlock)

    describe('documentContextExtractor.extractEditorState', () => {
        it('extracts editor state for range selection', async () => {
            const documentContextExtractor = new DocumentContextExtractor(19)
            const expected: EditorState = {
                document: {
                    programmingLanguage: { languageName: 'typescript' },
                    relativeFilePath: 'file://test.ts',
                    documentSymbols: [],
                    text: "console.log('test')",
                },
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

            const result = await documentContextExtractor.extractEditorState(mockTSDocument, {
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
            const documentContextExtractor = new DocumentContextExtractor(19)
            const expected: EditorState = {
                document: {
                    programmingLanguage: { languageName: 'typescript' },
                    relativeFilePath: 'file://test.ts',
                    documentSymbols: [],
                    text: "console.log('test')",
                },
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

            const result = await documentContextExtractor.extractEditorState(mockTSDocument, {
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
            const documentContextExtractor = new DocumentContextExtractor(0)

            const expected: EditorState = {
                document: {
                    programmingLanguage: { languageName: 'typescript' },
                    relativeFilePath: 'file://test.ts',
                    documentSymbols: [],
                    text: '',
                },
                cursorState: undefined,
            }

            const result = await documentContextExtractor.extractEditorState(mockTSDocument, {
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

    describe('extractDocumentContext', () => {
        it('extract document context with the code block range correctly', async () => {
            const documentContextExtractor = new DocumentContextExtractor()

            const expectedResult: EditorState['document'] = {
                programmingLanguage: { languageName: 'typescript' },
                relativeFilePath: 'file://test.ts',
                documentSymbols: [],
                text: "console.log('test')",
            }
            const result = await documentContextExtractor.extractDocumentContext(mockTSDocument, {
                start: { line: 1, character: 4 },
                end: { line: 1, character: 23 },
            })

            assert.deepStrictEqual(result, expectedResult)
        })

        it('handles other languages correctly', async () => {
            const documentContextExtractor = new DocumentContextExtractor()

            const mockGoCodeBLock = `func main() {
    fmt.Println("test")
}`
            const mockDocument = TextDocument.create('file://test.go', 'go', 1, mockGoCodeBLock)

            const expectedResult: EditorState['document'] = {
                programmingLanguage: { languageName: 'go' },
                relativeFilePath: 'file://test.go',
                documentSymbols: [],
                text: 'fmt.Println("test")',
            }
            const result = await documentContextExtractor.extractDocumentContext(mockDocument, {
                start: { line: 1, character: 4 },
                end: { line: 1, character: 23 },
            })

            assert.deepStrictEqual(result, expectedResult)
        })
    })
})
