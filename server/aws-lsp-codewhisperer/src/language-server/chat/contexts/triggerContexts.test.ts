import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { QChatTriggerContext } from './triggerContext'
import assert = require('assert')
import { TextDocument } from 'vscode-languageserver-textdocument'
import { DocumentContext, DocumentContextExtractor } from './documentContext'
import sinon = require('sinon')
import { LocalProjectContextController } from '../../../shared/localProjectContextController'

describe('QChatTriggerContext', () => {
    let testFeatures: TestFeatures
    let amazonQServiceManager: any

    const filePath = 'file://test.ts'
    const mockTSDocument = TextDocument.create(filePath, 'typescript', 1, '')
    const mockDocumentContext: DocumentContext = {
        text: '',
        programmingLanguage: { languageName: 'typescript' },
        relativeFilePath: 'file://test.ts',
        hasCodeSnippet: false,
        totalEditorCharacters: 0,
    }

    beforeEach(() => {
        testFeatures = new TestFeatures()
        amazonQServiceManager = {
            getConfiguration: sinon.stub().returns({
                projectContext: {
                    enableLocalIndexing: true,
                },
            }),
        }
        sinon.stub(DocumentContextExtractor.prototype, 'extractDocumentContext').resolves(mockDocumentContext)
    })

    afterEach(() => {
        sinon.restore()
    })

    it('returns null if text document is not defined in params', async () => {
        const triggerContext = new QChatTriggerContext(
            testFeatures.workspace,
            testFeatures.logging,
            amazonQServiceManager
        )

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
        const triggerContext = new QChatTriggerContext(
            testFeatures.workspace,
            testFeatures.logging,
            amazonQServiceManager
        )

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
        const triggerContext = new QChatTriggerContext(
            testFeatures.workspace,
            testFeatures.logging,
            amazonQServiceManager
        )

        const documentContext = await triggerContext.extractDocumentContext({
            cursorState: [],
            textDocument: {
                uri: filePath,
            },
        })

        assert.deepStrictEqual(documentContext, undefined)
    })

    it('includes cursor state from the parameters and text document if found', async () => {
        const triggerContext = new QChatTriggerContext(
            testFeatures.workspace,
            testFeatures.logging,
            amazonQServiceManager
        )

        testFeatures.openDocument(mockTSDocument)
        const documentContext = await triggerContext.extractDocumentContext({
            cursorState: [],
            textDocument: {
                uri: filePath,
            },
        })

        assert.deepStrictEqual(documentContext, mockDocumentContext)
    })

    it('should not extract project context when workspace context is disabled', async () => {
        amazonQServiceManager.getConfiguration.returns({
            projectContext: {
                enableLocalIndexing: false,
            },
        })

        const triggerContext = new QChatTriggerContext(
            testFeatures.workspace,
            testFeatures.logging,
            amazonQServiceManager
        )

        const getInstanceStub = sinon.stub(LocalProjectContextController, 'getInstance')

        const result = await triggerContext.extractProjectContext('test query')

        sinon.assert.notCalled(getInstanceStub)

        assert.deepStrictEqual(result, [])
    })
})
