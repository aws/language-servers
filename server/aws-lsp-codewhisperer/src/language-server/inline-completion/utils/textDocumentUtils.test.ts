import assert = require('assert')
import { getLanguageIdFromUri, getTextDocument } from './textDocumentUtils'
import { TextDocument } from '@aws/language-server-runtimes/server-interface'
import sinon from 'ts-sinon'

describe('textDocumentUtils', () => {
    describe('getLanguageIdFromUri', () => {
        it('should return python for notebook cell URIs', () => {
            const uri = 'vscode-notebook-cell:/some/path/notebook.ipynb#cell1'
            assert.strictEqual(getLanguageIdFromUri(uri), 'python')
        })

        it('should return abap for files with ABAP extensions', () => {
            const uris = ['file:///path/to/file.asprog']

            uris.forEach(uri => {
                assert.strictEqual(getLanguageIdFromUri(uri), 'abap')
            })
        })

        it('should return empty string for non-ABAP files', () => {
            const uris = ['file:///path/to/file.js', 'file:///path/to/file.ts', 'file:///path/to/file.py']

            uris.forEach(uri => {
                assert.strictEqual(getLanguageIdFromUri(uri), '')
            })
        })

        it('should return empty string for invalid URIs', () => {
            const invalidUris = ['', 'invalid-uri', 'file:///']

            invalidUris.forEach(uri => {
                assert.strictEqual(getLanguageIdFromUri(uri), '')
            })
        })

        it('should log errors when provided with a logging object', () => {
            const mockLogger = {
                log: sinon.spy(),
            }

            const invalidUri = {} as string // Force type error
            getLanguageIdFromUri(invalidUri, mockLogger)

            sinon.assert.calledOnce(mockLogger.log)
            sinon.assert.calledWith(mockLogger.log, sinon.match(/Error parsing URI to determine language:.*/))
        })

        it('should handle URIs without extensions', () => {
            const uri = 'file:///path/to/file'
            assert.strictEqual(getLanguageIdFromUri(uri), '')
        })
    })

    describe('getTextDocument', () => {
        let mockWorkspace: any
        let mockLogging: any

        beforeEach(() => {
            mockWorkspace = {
                getTextDocument: sinon.stub(),
                fs: {
                    readFile: sinon.stub(),
                },
            }
            mockLogging = {
                log: sinon.stub(),
            }
        })

        it('should return existing text document from workspace', async () => {
            const existingDoc = TextDocument.create('file:///test.js', 'javascript', 1, 'content')
            mockWorkspace.getTextDocument.resolves(existingDoc)

            const result = await getTextDocument('file:///test.js', mockWorkspace, mockLogging)

            assert.strictEqual(result, existingDoc)
            sinon.assert.calledOnceWithExactly(mockWorkspace.getTextDocument, 'file:///test.js')
            sinon.assert.notCalled(mockWorkspace.fs.readFile)
        })

        it('should create text document from file system when not in workspace', async () => {
            mockWorkspace.getTextDocument.resolves(null)
            mockWorkspace.fs.readFile.resolves('file content')

            const result = await getTextDocument('file:///test.py', mockWorkspace, mockLogging)

            assert.strictEqual(result?.uri, 'file:///test.py')
            assert.strictEqual(result?.getText(), 'file content')
            assert.strictEqual(result?.languageId, '')
            sinon.assert.calledOnce(mockWorkspace.fs.readFile)
        })

        it('should handle file system read errors', async () => {
            mockWorkspace.getTextDocument.resolves(null)
            mockWorkspace.fs.readFile.rejects(new Error('File not found'))

            const result = await getTextDocument('file:///missing.js', mockWorkspace, mockLogging)

            assert.strictEqual(result, null)
            sinon.assert.calledWith(mockLogging.log, sinon.match(/Unable to load from.*File not found/))
        })

        it('should use correct language ID for ABAP files', async () => {
            mockWorkspace.getTextDocument.resolves(null)
            mockWorkspace.fs.readFile.resolves('ABAP content')

            const result = await getTextDocument('file:///test.asprog', mockWorkspace, mockLogging)

            assert.strictEqual(result?.languageId, 'abap')
        })
    })
})
