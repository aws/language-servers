/**
 * Copied from chat/contexts/triggerContext.test.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import { TestFeatures } from '@aws/language-server-runtimes/testing'
import assert = require('assert')
import { TextDocument } from 'vscode-languageserver-textdocument'
import sinon = require('sinon')
import { AgenticChatTriggerContext } from './agenticChatTriggerContext'
import { DocumentContext, DocumentContextExtractor } from '../../chat/contexts/documentContext'
import { ChatTriggerType, CursorState } from '@amzn/codewhisperer-streaming'
import { URI } from 'vscode-uri'
import { InitializeParams } from '@aws/language-server-runtimes/protocol'

describe('AgenticChatTriggerContext', () => {
    let testFeatures: TestFeatures

    const filePath = 'file://test.ts'
    const mockWorkspaceFolders = [{ uri: URI.file('/path/to/my/workspace/').toString(), name: 'myWorkspace' }]
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
        testFeatures.lsp.getClientInitializeParams.returns({
            workspaceFolders: mockWorkspaceFolders,
        } as InitializeParams)
        sinon.stub(DocumentContextExtractor.prototype, 'extractDocumentContext').resolves(mockDocumentContext)
    })

    afterEach(() => {
        sinon.restore()
    })

    it('returns null if text document is not defined in params', async () => {
        const triggerContext = new AgenticChatTriggerContext(testFeatures)

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
        const triggerContext = new AgenticChatTriggerContext(testFeatures)

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
        const triggerContext = new AgenticChatTriggerContext(testFeatures)

        const documentContext = await triggerContext.extractDocumentContext({
            cursorState: [],
            textDocument: {
                uri: filePath,
            },
        })

        assert.deepStrictEqual(documentContext, undefined)
    })

    it('includes cursor state from the parameters and text document if found', async () => {
        const triggerContext = new AgenticChatTriggerContext(testFeatures)

        testFeatures.openDocument(mockTSDocument)
        const documentContext = await triggerContext.extractDocumentContext({
            cursorState: [],
            textDocument: {
                uri: filePath,
            },
        })

        assert.deepStrictEqual(documentContext, mockDocumentContext)
    })

    it('includes workspace folders as part of editor state in chat params', async () => {
        const triggerContext = new AgenticChatTriggerContext(testFeatures)
        const chatParams = triggerContext.getChatParamsFromTrigger(
            { tabId: 'tab', prompt: {} },
            {},
            ChatTriggerType.MANUAL
        )
        const chatParamsWithMore = triggerContext.getChatParamsFromTrigger(
            { tabId: 'tab', prompt: {} },
            { cursorState: {} as CursorState, relativeFilePath: '' },
            ChatTriggerType.MANUAL
        )

        assert.deepStrictEqual(
            chatParams.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.editorState
                ?.workspaceFolders,
            mockWorkspaceFolders.map(f => URI.parse(f.uri).fsPath)
        )
        assert.deepStrictEqual(
            chatParamsWithMore.conversationState?.currentMessage?.userInputMessage?.userInputMessageContext?.editorState
                ?.workspaceFolders,
            mockWorkspaceFolders.map(f => URI.parse(f.uri).fsPath)
        )
    })
})
