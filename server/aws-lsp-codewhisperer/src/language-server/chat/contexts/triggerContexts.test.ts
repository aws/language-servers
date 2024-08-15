import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { QChatTriggerContext } from './triggerContext'
import assert = require('assert')
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentContext, DocumentContextExtractor } from './documentContext'
import sinon = require('sinon')

describe('QChatTriggerContext', () => {
    let testFeatures: TestFeatures

    const filePath = 'file://test.ts'
    const mockTSDocument = TextDocument.create(filePath, 'typescript', 1, '')
    const mockDocumentContext: DocumentContext = {
        text: '',
        programmingLanguage: { languageName: 'typescript' },
        relativeFilePath: 'file://test.ts',
        documentSymbols: [],
        hasCodeSnippet: false,
        totalEditorCharacters: 0,
    }

    beforeEach(() => {
        testFeatures = new TestFeatures()
        sinon.stub(DocumentContextExtractor.prototype, 'extractDocumentContext').resolves(mockDocumentContext)
    })

    afterEach(() => {
        sinon.restore()
    })

    it('returns null if text document is not defined in params', async () => {
        const triggerContext = new QChatTriggerContext(testFeatures.workspace, testFeatures.logging)

        const documentContext = await triggerContext.extractDocumentContext({
            cursorState: [
                {
                    position: {
                        line: 5,
                        character: 0,
                    },
                },
            ],
            textDocument: undefined,
        })

        assert.deepStrictEqual(documentContext, undefined)
    })

    it('returns null if text document is not found', async () => {
        const triggerContext = new QChatTriggerContext(testFeatures.workspace, testFeatures.logging)

        const documentContext = await triggerContext.extractDocumentContext({
            cursorState: [
                {
                    position: {
                        line: 5,
                        character: 0,
                    },
                },
            ],
            textDocument: {
                uri: filePath,
            },
        })

        assert.deepStrictEqual(documentContext, undefined)
    })

    it('passes default cursor state if no cursor is found', async () => {
        const triggerContext = new QChatTriggerContext(testFeatures.workspace, testFeatures.logging)

        const documentContext = await triggerContext.extractDocumentContext({
            cursorState: [],
            textDocument: {
                uri: filePath,
            },
        })

        assert.deepStrictEqual(documentContext, undefined)
    })

    it('includes cursor state from the parameters and text document if found', async () => {
        const triggerContext = new QChatTriggerContext(testFeatures.workspace, testFeatures.logging)

        testFeatures.openDocument(mockTSDocument)
        const documentContext = await triggerContext.extractDocumentContext({
            cursorState: [],
            textDocument: {
                uri: filePath,
            },
        })

        assert.deepStrictEqual(documentContext, mockDocumentContext)
    })
})
