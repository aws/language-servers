/**
 * Copied from chat/contexts/triggerContext.test.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import * as fs from 'fs/promises'
import { TextDocument } from 'vscode-languageserver-textdocument'
import * as sinon from 'sinon'
import { AgenticChatTriggerContext } from './agenticChatTriggerContext'
import { DocumentContext, DocumentContextExtractor } from '../../chat/contexts/documentContext'
import { ChatTriggerType, CursorState } from '@aws/codewhisperer-streaming-client'
import { URI } from 'vscode-uri'
import { InitializeParams } from '@aws/language-server-runtimes/protocol'
import { TestFolder } from '@aws/lsp-core/out/test/testFolder'
import { WorkspaceFolderManager } from '../../workspaceContext/workspaceFolderManager'

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
    let mockWorkspaceFolderManager: any

    beforeEach(() => {
        testFeatures = new TestFeatures()
        testFeatures.workspace.getAllWorkspaceFolders = sinon.stub().returns(mockWorkspaceFolders) as any
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
        const chatParams = await triggerContext.getChatParamsFromTrigger(
            { tabId: 'tab', prompt: {} },
            {},
            ChatTriggerType.MANUAL
        )
        const chatParamsWithMore = await triggerContext.getChatParamsFromTrigger(
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

    it('includes modelId in chat params when provided', async () => {
        const triggerContext = new AgenticChatTriggerContext(testFeatures)
        const modelId = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'

        const chatParams = await triggerContext.getChatParamsFromTrigger(
            { tabId: 'tab', prompt: {} },
            {},
            ChatTriggerType.MANUAL,
            undefined,
            undefined,
            undefined,
            [],
            [],
            undefined,
            modelId
        )

        assert.strictEqual(chatParams.conversationState?.currentMessage?.userInputMessage?.modelId, modelId)
    })

    it('does not include modelId in chat params when not provided', async () => {
        const triggerContext = new AgenticChatTriggerContext(testFeatures)
        const chatParams = await triggerContext.getChatParamsFromTrigger(
            { tabId: 'tab', prompt: {} },
            {},
            ChatTriggerType.MANUAL
        )

        assert.strictEqual(chatParams.conversationState?.currentMessage?.userInputMessage?.modelId, undefined)
    })

    it('includes remote workspaceId if it exists and is connected', async () => {
        mockWorkspaceFolderManager = {
            getWorkspaceState: sinon.stub(),
        }
        sinon.stub(WorkspaceFolderManager, 'getInstance').returns(mockWorkspaceFolderManager)
        mockWorkspaceFolderManager.getWorkspaceState.returns({
            webSocketClient: { isConnected: () => true },
            workspaceId: 'test-workspace-123',
        })
        const triggerContext = new AgenticChatTriggerContext(testFeatures)
        const chatParams = await triggerContext.getChatParamsFromTrigger(
            { tabId: 'tab', prompt: {} },
            {},
            ChatTriggerType.MANUAL
        )
        const chatParamsWithMore = await triggerContext.getChatParamsFromTrigger(
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
        assert.deepStrictEqual(chatParamsWithMore.conversationState?.workspaceId, 'test-workspace-123')
    })
    describe('getTextDocument', function () {
        let tempFolder: TestFolder

        before(async () => {
            tempFolder = await TestFolder.create()
        })

        afterEach(async () => {
            await tempFolder.clear()
        })

        after(async () => {
            await tempFolder.delete()
        })

        it('returns text document if it is synced', async function () {
            const mockDocument = {
                uri: 'file://this/is/my/file.py',
                languageId: 'python',
                version: 0,
            } as TextDocument
            testFeatures.workspace.getTextDocument.resolves(mockDocument)

            const result = await new AgenticChatTriggerContext(testFeatures).getTextDocument(mockDocument.uri)
            assert.deepStrictEqual(result, mockDocument)
        })

        it('falls back to file system if it is not synced', async function () {
            const pythonContent = 'print("hello")'
            const pythonFilePath = await tempFolder.write('pythonFile.py', pythonContent)
            const uri = URI.file(pythonFilePath).toString()
            testFeatures.workspace.getTextDocument.resolves(undefined)
            testFeatures.workspace = {
                ...testFeatures.workspace,
                fs: {
                    ...testFeatures.workspace.fs,
                    readFile: path => fs.readFile(path, { encoding: 'utf-8' }),
                },
            }
            const result = await new AgenticChatTriggerContext(testFeatures).getTextDocument(uri)

            assert.ok(result)
            assert.strictEqual(result.uri, uri)
            assert.strictEqual(result.getText(), pythonContent)
        })

        it('returns undefined if both sync and fs fails', async function () {
            const uri = 'file://not/a/real/path'
            testFeatures.workspace.getTextDocument.resolves(undefined)

            const result = await new AgenticChatTriggerContext(testFeatures).getTextDocument(uri)

            assert.deepStrictEqual(result, undefined)
        })
    })
})
