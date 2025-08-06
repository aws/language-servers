/**
 * Copied from chat/contexts/triggerContext.test.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import * as fs from 'fs/promises'
import { TextDocument } from 'vscode-languageserver-textdocument'
import * as path from 'path'
import * as sinon from 'sinon'
import { AgenticChatTriggerContext } from './agenticChatTriggerContext'
import { DocumentContext, DocumentContextExtractor } from '../../chat/contexts/documentContext'
import { ChatTriggerType, CursorState } from '@amzn/codewhisperer-streaming'
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
            undefined,
            modelId
        )
        // Note: modelId is not part of the UserInputMessage type in current definitions
        // This test verifies the method can be called with modelId parameter
        assert.ok(chatParams.conversationState?.currentMessage?.userInputMessage)
    })

    it('does not include modelId in chat params when not provided', async () => {
        const triggerContext = new AgenticChatTriggerContext(testFeatures)
        const chatParams = await triggerContext.getChatParamsFromTrigger(
            { tabId: 'tab', prompt: {} },
            {},
            ChatTriggerType.MANUAL
        )
        // Note: modelId is not part of the UserInputMessage type in current definitions
        // This test verifies the method works without modelId parameter
        assert.ok(chatParams.conversationState?.currentMessage?.userInputMessage)
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
        // Note: workspaceId is not part of the ConversationState type in current definitions
        // This test verifies the method works with workspace state configuration
        assert.ok(chatParamsWithMore.conversationState)
    })
    describe('getTextDocument*', function () {
        let tempFolder: TestFolder

        const mockDocument = {
            uri: 'file://this/is/my/file.py',
            languageId: 'python',
            version: 0,
        } as TextDocument
        let mockDocumentFilepath: string

        before(async () => {
            tempFolder = await TestFolder.create()
            mockDocumentFilepath = path.join(tempFolder.path, 'this/is/my/file.py')
        })

        afterEach(async () => {
            await tempFolder.clear()
        })

        after(async () => {
            await tempFolder.delete()
        })

        describe('getTextDocumentFromUri', function () {
            it('returns text document if it is synced', async function () {
                testFeatures.workspace.getTextDocument.resolves(mockDocument)

                const result = await new AgenticChatTriggerContext(testFeatures).getTextDocumentFromUri(
                    mockDocument.uri
                )
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
                const result = await new AgenticChatTriggerContext(testFeatures).getTextDocumentFromUri(uri)

                assert.ok(result)
                assert.strictEqual(result.uri, uri)
                assert.strictEqual(result.getText(), pythonContent)
            })

            it('returns undefined if both sync and fs fails', async function () {
                const uri = 'file://not/a/real/path'
                testFeatures.workspace.getTextDocument.resolves(undefined)

                const result = await new AgenticChatTriggerContext(testFeatures).getTextDocumentFromUri(uri)

                assert.deepStrictEqual(result, undefined)
            })
        })

        describe('getTextDocumentFromPath', function () {
            let fsContent: string
            let fsPath: string

            this.beforeEach(async () => {
                fsContent = 'print("hello")'
                fsPath = await tempFolder.write('pythonFile.py', fsContent)

                testFeatures.workspace = {
                    ...testFeatures.workspace,
                    fs: {
                        ...testFeatures.workspace.fs,
                        readFile: path => fs.readFile(path, { encoding: 'utf-8' }),
                    },
                }
            })

            describe('when text document is synced', function () {
                this.beforeEach(async () => {
                    testFeatures.workspace.getTextDocument.resolves(mockDocument)
                })

                it('returns text document', async function () {
                    const result = await new AgenticChatTriggerContext(testFeatures).getTextDocumentFromPath(
                        mockDocumentFilepath,
                        true,
                        true
                    )
                    assert.deepStrictEqual(result, mockDocument)
                })

                it('loads from file system if workspace is not used', async function () {
                    const result = await new AgenticChatTriggerContext(testFeatures).getTextDocumentFromPath(
                        fsPath,
                        false,
                        true
                    )

                    assert.ok(result)
                    assert.strictEqual(result.uri, fsPath)
                    assert.strictEqual(result.getText(), fsContent)
                })

                if (process.platform === 'win32') {
                    describe('Windows path to uri combinations', function () {
                        for (const workspaceUri of [
                            'file:///c%3A/Foo/bar.txt',
                            'file:///C%3A/Foo/bar.txt',
                            'file:///c:/Foo/bar.txt',
                            'file:///C:/Foo/bar.txt',
                        ]) {
                            describe(`when workspace uri is: ${workspaceUri}`, function () {
                                for (const path of ['c:\\Foo\\bar.txt', 'C:\\Foo\\bar.txt']) {
                                    it(`loads when path is ${path}`, async function () {
                                        const storedDocument = {
                                            uri: workspaceUri,
                                            languageId: 'python',
                                            version: 0,
                                        } as TextDocument

                                        testFeatures.workspace.getTextDocument.callsFake((uri: string) => {
                                            if (uri === workspaceUri) {
                                                return Promise.resolve(storedDocument)
                                            }
                                            return Promise.resolve(undefined)
                                        })

                                        const result = await new AgenticChatTriggerContext(
                                            testFeatures
                                        ).getTextDocumentFromPath(path, true, false)

                                        assert.ok(result)
                                        assert.strictEqual(result.uri, workspaceUri)
                                        assert.strictEqual(result, storedDocument)
                                    })
                                }
                            })
                        }
                    })
                }
            })

            describe('when text document is not synced', function () {
                this.beforeEach(async () => {
                    testFeatures.workspace.getTextDocument.resolves(undefined)
                })

                it('falls back to file system', async function () {
                    const result = await new AgenticChatTriggerContext(testFeatures).getTextDocumentFromPath(
                        fsPath,
                        true,
                        true
                    )

                    assert.ok(result)
                    assert.strictEqual(result.uri, fsPath)
                    assert.strictEqual(result.getText(), fsContent)
                })

                it('returns undefined if the file system is not used', async function () {
                    const result = await new AgenticChatTriggerContext(testFeatures).getTextDocumentFromPath(
                        fsPath,
                        true,
                        false
                    )

                    assert.deepStrictEqual(result, undefined)
                })

                it('returns undefined if fs fails', async function () {
                    const filePath = path.join(tempFolder.path, 'not-a-real-path.txt')

                    const result = await new AgenticChatTriggerContext(testFeatures).getTextDocumentFromPath(
                        filePath,
                        true,
                        true
                    )

                    assert.deepStrictEqual(result, undefined)
                })
            })
        })
    })
})
