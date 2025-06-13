import * as assert from 'assert'
import sinon from 'ts-sinon'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentContext, DocumentContextExtractor } from './documentContext'
import { Features } from '../../types'

describe('DocumentContext', () => {
    const mockTypescriptCodeBlock = `function test() {
    console.log('test')
}`

    const mockWorkspaceFolder = {
        uri: 'file://mock/workspace',
        name: 'test',
    }
    const mockWorkspace = {
        getWorkspaceFolder: sinon.stub().returns(mockWorkspaceFolder),
        fs: {
            existsSync: sinon.stub().returns(true),
        },
    } as unknown as Features['workspace']
    const testFilePath = 'file://mock/workspace/test.ts'
    const mockTSDocument = TextDocument.create(testFilePath, 'typescript', 1, mockTypescriptCodeBlock)

    afterEach(() => {
        sinon.restore()
    })

    describe('documentContextExtractor.extractEditorState', () => {
        it('extracts editor state for range selection', async () => {
            const documentContextExtractor = new DocumentContextExtractor({
                workspace: mockWorkspace,
                characterLimits: 19,
            })
            const expected: DocumentContext = {
                programmingLanguage: { languageName: 'typescript' },
                relativeFilePath: 'test.ts',
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
                workspaceFolder: mockWorkspaceFolder,
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
            const documentContextExtractor = new DocumentContextExtractor({
                workspace: mockWorkspace,
                characterLimits: 19,
            })
            const expected: DocumentContext = {
                programmingLanguage: { languageName: 'typescript' },
                relativeFilePath: 'test.ts',
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
                workspaceFolder: mockWorkspaceFolder,
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
    })

    it('handles other languages correctly', async () => {
        const documentContextExtractor = new DocumentContextExtractor({ workspace: mockWorkspace, characterLimits: 19 })

        const mockGoCodeBLock = `func main() {
    fmt.Println("test")
}`
        const testGoFilePath = 'file://mock/workspace/test.go'
        const mockDocument = TextDocument.create(testGoFilePath, 'go', 1, mockGoCodeBLock)

        const expectedResult: DocumentContext = {
            programmingLanguage: { languageName: 'go' },
            relativeFilePath: 'test.go',
            text: 'fmt.Println("test")',
            totalEditorCharacters: mockGoCodeBLock.length,
            hasCodeSnippet: true,
            cursorState: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 19 },
                },
            },
            workspaceFolder: mockWorkspaceFolder,
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
