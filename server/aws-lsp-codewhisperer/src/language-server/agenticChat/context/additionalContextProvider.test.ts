import * as path from 'path'
import * as sinon from 'sinon'
import { URI } from 'vscode-uri'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import { AdditionalContextPrompt, ContextCommandItem } from 'local-indexing'
import { AdditionalContextProvider } from './additionalContextProvider'
import { getInitialContextInfo, getUserPromptsDirectory } from './contextUtils'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'
import { workspaceUtils } from '@aws/lsp-core'
import { ChatDatabase } from '../tools/chatDb/chatDb'
import { TriggerContext } from './agenticChatTriggerContext'
import { expect } from 'chai'

describe('AdditionalContextProvider', () => {
    let provider: AdditionalContextProvider
    let testFeatures: TestFeatures
    let chatHistoryDb: ChatDatabase
    let fsExistsStub: sinon.SinonStub
    let getContextCommandPromptStub: sinon.SinonStub
    let getContextCommandItemsStub: sinon.SinonStub
    let fsReadDirStub: sinon.SinonStub
    let localProjectContextControllerInstanceStub: sinon.SinonStub

    beforeEach(() => {
        testFeatures = new TestFeatures()
        fsExistsStub = sinon.stub()
        fsReadDirStub = sinon.stub()
        testFeatures.workspace.fs.exists = fsExistsStub
        testFeatures.workspace.fs.readdir = fsReadDirStub
        testFeatures.chat.sendPinnedContext = sinon.stub()
        getContextCommandPromptStub = sinon.stub().returns([])
        getContextCommandItemsStub = sinon.stub().returns([])
        chatHistoryDb = {
            getHistory: sinon.stub().returns([]),
            searchMessages: sinon.stub().returns([]),
            getOpenTabId: sinon.stub(),
            getTab: sinon.stub(),
            deleteHistory: sinon.stub(),
            setHistoryIdMapping: sinon.stub(),
            getOpenTabs: sinon.stub().returns([]),
            updateTabOpenState: sinon.stub(),
            getDatabaseFileSize: sinon.stub(),
            getLoadTime: sinon.stub(),
            getRules: sinon.stub(),
            setRules: sinon.stub(),
            addPinnedContext: sinon.stub(),
            removePinnedContext: sinon.stub(),
            getPinnedContext: sinon.stub().returns([]),
        } as unknown as ChatDatabase

        provider = new AdditionalContextProvider(testFeatures, chatHistoryDb)
        localProjectContextControllerInstanceStub = sinon.stub(LocalProjectContextController, 'getInstance').resolves({
            getContextCommandPrompt: getContextCommandPromptStub,
            getContextCommandItems: getContextCommandItemsStub,
        } as unknown as LocalProjectContextController)
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('getAdditionalContext', () => {
        it('should return empty array when no additional context commands', async () => {
            const triggerContext: TriggerContext = {
                workspaceFolder: null,
            }

            fsExistsStub.resolves(false)
            getContextCommandPromptStub.resolves([])

            const result = await provider.getAdditionalContext(triggerContext, '')

            assert.deepStrictEqual(result, [])
        })

        it('should process workspace rules and context correctly', async () => {
            const mockWorkspaceFolder = {
                uri: URI.file('/workspace').toString(),
                name: 'test',
            }
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])
            const triggerContext: TriggerContext = {
                workspaceFolder: mockWorkspaceFolder,
            }

            // Mock fs.exists to only return true for .amazonq/rules directory, false for README/AmazonQ files
            fsExistsStub.callsFake((pathStr: string) => {
                if (pathStr.includes(path.join('.amazonq', 'rules'))) {
                    return Promise.resolve(true)
                }
                return Promise.resolve(false)
            })
            fsReadDirStub.resolves([{ name: 'rule1.md', isFile: () => true, isDirectory: () => false }])

            // Mock getContextCommandPrompt to handle both calls:
            // 1. First call for promptContextCommands (empty array)
            // 2. Second call for pinnedContextCommands (workspace rules)
            getContextCommandPromptStub
                .onFirstCall()
                .resolves([]) // for promptContextCommands
                .onSecondCall()
                .resolves([
                    // for pinnedContextCommands (workspace rules)
                    {
                        name: 'Test Rule',
                        description: 'Test Description',
                        content: 'Test Content',
                        filePath: '/workspace/.amazonq/rules/rule1.md',
                        relativePath: '.amazonq/rules/rule1.md',
                        startLine: 1,
                        endLine: 10,
                    },
                ])

            const result = await provider.getAdditionalContext(triggerContext, '')

            assert.strictEqual(result.length, 1)
        })
        it('should handle pinned context correctly', async () => {
            const mockWorkspaceFolder = {
                uri: URI.file('/workspace').toString(),
                name: 'test',
            }
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])
            const triggerContext: TriggerContext = {
                workspaceFolder: mockWorkspaceFolder,
            }

            // Mock pinned context in database
            const pinnedContext = [
                {
                    id: 'pinned-file',
                    command: 'Pinned File',
                    label: 'file',
                    route: ['/workspace', 'src/pinned.ts'],
                },
            ]
            ;(chatHistoryDb.getPinnedContext as sinon.SinonStub).returns(pinnedContext)

            fsExistsStub.resolves(false)

            getContextCommandPromptStub
                .onFirstCall()
                .resolves([]) // for promptContextCommands
                .onSecondCall()
                .resolves([
                    // for pinnedContextCommands
                    {
                        name: 'Pinned File',
                        description: 'Test Description',
                        content: 'Pinned content',
                        filePath: '/workspace/src/pinned.ts',
                        relativePath: 'src/pinned.ts',
                        startLine: 1,
                        endLine: 10,
                    },
                ])

            const result = await provider.getAdditionalContext(triggerContext, 'tab1')

            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].name, 'Pinned File')
            assert.strictEqual(result[0].pinned, true)
        })

        it('should handle explicit context (@-mentions) correctly', async () => {
            const mockWorkspaceFolder = {
                uri: URI.file('/workspace').toString(),
                name: 'test',
            }
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])
            const triggerContext: TriggerContext = {
                workspaceFolder: mockWorkspaceFolder,
            }

            const explicitContext = [
                {
                    id: 'explicit-file',
                    command: 'Explicit File',
                    label: 'file' as any,
                    route: ['/workspace', 'src/explicit.ts'],
                },
            ]
            ;(chatHistoryDb.getPinnedContext as sinon.SinonStub).returns([])

            fsExistsStub.resolves(false)

            getContextCommandPromptStub
                .onFirstCall()
                .resolves([
                    // for promptContextCommands (explicit @-mentions)
                    {
                        name: 'Explicit File',
                        description: 'Test Description',
                        content: 'Explicit content',
                        filePath: '/workspace/src/explicit.ts',
                        relativePath: 'src/explicit.ts',
                        startLine: 1,
                        endLine: 10,
                    },
                ])
                .onSecondCall()
                .resolves([]) // for pinnedContextCommands

            const result = await provider.getAdditionalContext(triggerContext, 'tab1', explicitContext)

            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].name, 'Explicit File')
            assert.strictEqual(result[0].pinned, false)
        })

        it('should avoid duplicates between explicit and pinned context', async () => {
            const mockWorkspaceFolder = {
                uri: URI.file('/workspace').toString(),
                name: 'test',
            }
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])
            const triggerContext: TriggerContext = {
                workspaceFolder: mockWorkspaceFolder,
            }

            const sharedContext = {
                id: 'shared-file',
                command: 'Shared File',
                label: 'file' as any,
                route: ['/workspace', 'src/shared.ts'],
            }
            const explicitContext = [sharedContext]
            const pinnedContext = [sharedContext]

            ;(chatHistoryDb.getPinnedContext as sinon.SinonStub).returns(pinnedContext)

            fsExistsStub.resolves(false)

            getContextCommandPromptStub
                .onFirstCall()
                .resolves([
                    // for promptContextCommands (explicit @-mentions)
                    {
                        name: 'Shared File',
                        description: 'Test Description',
                        content: 'Shared content',
                        filePath: '/workspace/src/shared.ts',
                        relativePath: 'src/shared.ts',
                        startLine: 1,
                        endLine: 10,
                    },
                ])
                .onSecondCall()
                .resolves([]) // for pinnedContextCommands (should be empty due to deduplication)

            const result = await provider.getAdditionalContext(triggerContext, 'tab1', explicitContext)

            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].name, 'Shared File')
            assert.strictEqual(result[0].pinned, false) // Should be marked as explicit, not pinned
        })

        it('should handle Active File context correctly', async () => {
            const mockWorkspaceFolder = {
                uri: URI.file('/workspace').toString(),
                name: 'test',
            }
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])
            const triggerContext: TriggerContext = {
                workspaceFolder: mockWorkspaceFolder,

                text: 'active file content',
                cursorState: { position: { line: 1, character: 0 } },
            }

            const contextWithActiveFile = [{ id: 'active-editor', command: 'Active file', label: 'file' }]
            ;(chatHistoryDb.getPinnedContext as sinon.SinonStub).returns(contextWithActiveFile)

            fsExistsStub.resolves(false)
            getContextCommandPromptStub.resolves([])

            const result = await provider.getAdditionalContext(triggerContext, 'tab1')

            // Active file should be preserved in triggerContext but not added to result
            assert.strictEqual(triggerContext.text, 'active file content')
            assert.strictEqual(triggerContext.cursorState?.position?.line, 1)
        })

        it('should remove Active File context when not in pinned context', async () => {
            const mockWorkspaceFolder = {
                uri: URI.file('/workspace').toString(),
                name: 'test',
            }
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])
            const triggerContext: TriggerContext = {
                workspaceFolder: mockWorkspaceFolder,

                text: 'active file content',
                cursorState: { position: { line: 1, character: 0 } },
            }

            ;(chatHistoryDb.getPinnedContext as sinon.SinonStub).returns([]) // No active file in pinned context

            fsExistsStub.resolves(false)
            getContextCommandPromptStub.resolves([])

            const result = await provider.getAdditionalContext(triggerContext, 'tab1')

            // Active file should be removed from triggerContext
            assert.strictEqual(triggerContext.text, undefined)
            assert.strictEqual(triggerContext.cursorState, undefined)
        })

        it('should set hasWorkspace flag when @workspace is present', async () => {
            const mockWorkspaceFolder = {
                uri: URI.file('/workspace').toString(),
                name: 'test',
            }
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])
            const triggerContext: TriggerContext = {
                workspaceFolder: mockWorkspaceFolder,
            }

            const workspaceContext = [{ id: '@workspace', command: 'Workspace', label: 'folder' }]
            ;(chatHistoryDb.getPinnedContext as sinon.SinonStub).returns(workspaceContext)

            fsExistsStub.resolves(false)
            getContextCommandPromptStub.resolves([])

            await provider.getAdditionalContext(triggerContext, 'tab1')

            assert.strictEqual(triggerContext.hasWorkspace, true)
        })

        it('should count context types correctly', async () => {
            const mockWorkspaceFolder = {
                uri: URI.file('/workspace').toString(),
                name: 'test',
            }
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])
            const triggerContext: TriggerContext = {
                workspaceFolder: mockWorkspaceFolder,
            }

            const mixedContext = [
                { id: 'file1', command: 'File 1', label: 'file', route: ['/workspace', 'file1.ts'] },
                { id: 'folder1', command: 'Folder 1', label: 'folder', route: ['/workspace', 'src'] },
                { id: 'code1', command: 'Code 1', label: 'code', route: ['/workspace', 'code1.ts'] },
                { id: 'prompt', command: 'Prompt', label: 'prompt' },
            ]

            ;(chatHistoryDb.getPinnedContext as sinon.SinonStub).returns(mixedContext)

            fsExistsStub.resolves(false)
            getContextCommandPromptStub.resolves([])

            await provider.getAdditionalContext(triggerContext, 'tab1')

            assert.strictEqual(triggerContext.contextInfo?.pinnedContextCount.fileContextCount, 1)
            assert.strictEqual(triggerContext.contextInfo?.pinnedContextCount.folderContextCount, 1)
            assert.strictEqual(triggerContext.contextInfo?.pinnedContextCount.codeContextCount, 1)
            assert.strictEqual(triggerContext.contextInfo?.pinnedContextCount.promptContextCount, 1)
        })
    })

    describe('getFileListFromContext', () => {
        it('should create correct file list for symbol entries', () => {
            const mockContext = [
                {
                    relativePath: 'test/path.ts',
                    name: 'symbol',
                    startLine: 1,
                    endLine: 10,
                    type: 'code',
                    description: 'test',
                    innerContext: 'test',
                    path: '1/test/path.ts',
                },
            ]

            const result = provider.getFileListFromContext(mockContext)
            const fileDetail = result.details ? result.details['test/path.ts'] : undefined
            const lineRange = fileDetail?.lineRanges ? fileDetail.lineRanges[0] : undefined

            assert.deepStrictEqual(result.filePaths, ['test/path.ts'])
            assert.deepStrictEqual(lineRange, {
                first: 1,
                second: 10,
            })
        })

        it('should handle non-symbol entries with -1 line ranges', () => {
            const mockContext = [
                {
                    relativePath: 'test/path.ts',
                    name: 'not-symbol',
                    startLine: 1,
                    endLine: 10,
                    type: 'file',
                    description: 'test',
                    innerContext: 'test',
                    path: '1/test/path.ts',
                },
            ]

            const result = provider.getFileListFromContext(mockContext)
            const fileDetail = result.details ? result.details['test/path.ts'] : undefined
            const lineRange = fileDetail?.lineRanges ? fileDetail.lineRanges[0] : undefined

            assert.deepStrictEqual(lineRange, {
                first: -1,
                second: -1,
            })
        })
    })

    describe('getContextType', () => {
        const mockPrompt: AdditionalContextPrompt = {
            filePath: path.join('/workspace', '.amazonq', 'rules', 'test.md'),
            relativePath: path.join('.amazonq', 'rules', 'test.md'),
            content: 'Sample content',
            name: 'Test Rule',
            description: 'Test Description',
            startLine: 1,
            endLine: 10,
        }
        it('should identify rule type for files in .amazonq/rules', () => {
            const result = provider.getContextType(mockPrompt)

            assert.strictEqual(result, 'rule')
        })

        it('should identify prompt type for files in user prompts directory', () => {
            const userPromptsDir = getUserPromptsDirectory()
            const mockPrompt = {
                filePath: path.join(userPromptsDir, 'test.md'),
                relativePath: 'test.md',
                content: 'Sample content',
                name: 'Test Prompt',
                description: 'Test Description',
                startLine: 1,
                endLine: 10,
            }

            const result = provider.getContextType(mockPrompt)

            assert.strictEqual(result, 'prompt')
        })

        it('should return file type for non-prompt files', () => {
            const mockPrompt = {
                filePath: 'test.ts',
                relativePath: 'test.ts',
                content: 'Sample content',
                name: 'Test File',
                description: 'Test Description',
                startLine: 1,
                endLine: 10,
            }

            const result = provider.getContextType(mockPrompt)

            assert.strictEqual(result, 'file')
        })
    })

    describe('collectWorkspaceRules', () => {
        it('should return empty array when no workspace folder', async () => {
            // Mock empty workspace folders
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns([])

            const result = await provider.collectWorkspaceRules()

            assert.deepStrictEqual(result, [])
        })

        it('should return rules files when they exist', async () => {
            // Mock workspace folders
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])

            fsExistsStub.callsFake((pathStr: string) => {
                if (pathStr.includes(path.join('.amazonq', 'rules'))) {
                    return Promise.resolve(true)
                }
                return Promise.resolve(false)
            })
            fsReadDirStub.resolves([
                { name: 'rule1.md', isFile: () => true, isDirectory: () => false },
                { name: 'rule2.md', isFile: () => true, isDirectory: () => false },
            ])

            const result = await provider.collectWorkspaceRules()

            assert.deepStrictEqual(result, [
                {
                    workspaceFolder: '/workspace',
                    type: 'file',
                    relativePath: path.join('.amazonq', 'rules', 'rule1.md'),
                    id: path.join('/workspace', '.amazonq', 'rules', 'rule1.md'),
                },
                {
                    workspaceFolder: '/workspace',
                    type: 'file',
                    relativePath: path.join('.amazonq', 'rules', 'rule2.md'),
                    id: path.join('/workspace', '.amazonq', 'rules', 'rule2.md'),
                },
            ])
        })

        it('should update pinned code symbol IDs when they no longer match current index', async () => {
            // Mock LocalProjectContextController.getInstance
            getContextCommandItemsStub.returns([
                {
                    id: 'new-symbol-id',
                    symbol: {
                        name: 'calculateTotal',
                        kind: 'Function',
                        range: {
                            start: { line: 9, column: 0 },
                            end: { line: 19, column: 1 },
                        },
                    },
                    workspaceFolder: '/workspace',
                    relativePath: 'src/utils.ts',
                    type: 'file',
                },
            ] as ContextCommandItem[])

            // Create a trigger context
            const triggerContext = {
                workspaceFolder: { uri: '/workspace', name: 'workspace' },
                contextInfo: getInitialContextInfo(),
            }

            // Mock pinned context with an outdated symbol ID
            const pinnedContext = [
                {
                    id: 'old-symbol-id', // This ID no longer exists in the index
                    command: 'calculateTotal',
                    label: 'code',
                    description: 'Function, workspace/src/utils.ts',
                    route: ['/workspace', '/src/utils.ts'],
                    pinned: true,
                },
            ]

            // Mock chatDb.getPinnedContext to return our pinned context
            ;(chatHistoryDb.getPinnedContext as sinon.SinonStub).returns(pinnedContext)

            // Call getAdditionalContext
            await provider.getAdditionalContext(triggerContext, 'tab1')

            // Verify that LocalProjectContextController.getInstance was called
            sinon.assert.called(localProjectContextControllerInstanceStub)

            // Verify that getContextCommandPrompt was called with updated ID
            const contextCommandPromptCall = getContextCommandPromptStub
                .getCalls()
                .find(call => call.args[0].some((item: ContextCommandItem) => item.id === 'new-symbol-id'))

            expect(contextCommandPromptCall).to.exist
        })

        describe('convertPinnedContextToChatMessages', () => {
            it('should return empty array for no pinned context', async () => {
                const result = await provider.convertPinnedContextToChatMessages()
                assert.deepStrictEqual(result, [])
            })

            it('should return empty array for empty pinned context', async () => {
                const result = await provider.convertPinnedContextToChatMessages([])
                assert.deepStrictEqual(result, [])
            })

            it('should convert rule context to promptInstruction XML', async () => {
                const pinnedContext = [
                    {
                        name: 'Test Rule',
                        type: 'rule',
                        innerContext: 'Follow this rule',
                        relativePath: '.amazonq/rules/test.md',
                        description: '',
                        path: '/workspace/.amazonq/rules/test.md',
                        startLine: 1,
                        endLine: 10,
                        pinned: true,
                    },
                ]

                const result = await provider.convertPinnedContextToChatMessages(pinnedContext)

                assert.strictEqual(result.length, 2)
                assert.strictEqual(result[0].userInputMessage?.content?.includes('<promptInstruction>'), true)
                assert.strictEqual(result[0].userInputMessage?.content?.includes('Follow this rule'), true)
                assert.strictEqual(result[1].assistantResponseMessage?.content, 'Thinking...')
            })

            it('should convert file context to fileContext XML', async () => {
                const pinnedContext = [
                    {
                        name: 'Test File',
                        type: 'file',
                        innerContext: 'File content here',
                        relativePath: 'src/test.ts',
                        description: '',
                        path: '/workspace/src/test.ts',
                        startLine: 1,
                        endLine: 10,
                        pinned: true,
                    },
                ]

                const result = await provider.convertPinnedContextToChatMessages(pinnedContext)

                assert.strictEqual(result.length, 2)
                assert.strictEqual(result[0].userInputMessage?.content?.includes('<fileContext>'), true)
                assert.strictEqual(result[0].userInputMessage?.content?.includes('File content here'), true)
            })

            it('should convert code context to codeContext XML', async () => {
                const pinnedContext = [
                    {
                        name: 'symbol',
                        type: 'code',
                        innerContext: 'function test() {}',
                        relativePath: 'src/test.ts',
                        description: '',
                        path: '/workspace/src/test.ts',
                        startLine: 1,
                        endLine: 3,
                        pinned: true,
                    },
                ]

                const result = await provider.convertPinnedContextToChatMessages(pinnedContext)

                assert.strictEqual(result.length, 2)
                assert.strictEqual(result[0].userInputMessage?.content?.includes('<codeContext>'), true)
                assert.strictEqual(result[0].userInputMessage?.content?.includes('function test() {}'), true)
            })

            it('should handle mixed context types', async () => {
                const pinnedContext = [
                    {
                        name: 'Test Rule',
                        type: 'rule',
                        innerContext: 'Follow this rule',
                        relativePath: '.amazonq/rules/test.md',
                        description: '',
                        path: '/workspace/.amazonq/rules/test.md',
                        startLine: 1,
                        endLine: 10,
                        pinned: true,
                    },
                    {
                        name: 'Test File',
                        type: 'file',
                        innerContext: 'File content',
                        relativePath: 'src/test.ts',
                        description: '',
                        path: '/workspace/src/test.ts',
                        startLine: 1,
                        endLine: 10,
                        pinned: true,
                    },
                ]

                const result = await provider.convertPinnedContextToChatMessages(pinnedContext)

                assert.strictEqual(result.length, 2)
                const content = result[0].userInputMessage?.content || ''
                assert.strictEqual(content.includes('<promptInstruction>'), true)
                assert.strictEqual(content.includes('<fileContext>'), true)
                assert.strictEqual(content.includes('Follow this rule'), true)
                assert.strictEqual(content.includes('File content'), true)
            })
        })
    })

    describe('convertRulesToRulesFolders', () => {
        it('should convert workspace rules to folders structure', () => {
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])

            // Configure the getRules stub to return a specific value
            ;(chatHistoryDb.getRules as sinon.SinonStub).returns({
                folders: {}, // Empty folders state (default all active)
                rules: {}, // Empty rules state (default all active)
            })

            const workspaceRules = [
                {
                    workspaceFolder: '/workspace',
                    type: 'file' as any,
                    relativePath: '.amazonq/rules/rule1.md',
                    id: '/workspace/.amazonq/rules/rule1.md',
                },
                {
                    workspaceFolder: '/workspace',
                    type: 'file' as any,
                    relativePath: '.amazonq/rules/rule2.md',
                    id: '/workspace/.amazonq/rules/rule2.md',
                },
            ]

            const result = provider.convertRulesToRulesFolders(workspaceRules, 'tab1')

            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].folderName, '.amazonq/rules')
            assert.strictEqual(result[0].active, true)
            assert.strictEqual(result[0].rules.length, 2)
            assert.strictEqual(result[0].rules[0].name, 'rule1')
            assert.strictEqual(result[0].rules[1].name, 'rule2')
        })

        it('should handle rules with explicit active/inactive states', () => {
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])

            // Configure the getRules stub to return specific active/inactive states
            ;(chatHistoryDb.getRules as sinon.SinonStub).returns({
                folders: {
                    '.amazonq/rules': false, // This folder is explicitly inactive
                },
                rules: {
                    '/workspace/.amazonq/rules/rule1.md': true, // This rule is explicitly active
                    '/workspace/.amazonq/rules/rule2.md': false, // This rule is explicitly inactive
                },
            })

            const workspaceRules = [
                {
                    workspaceFolder: '/workspace',
                    type: 'file' as any,
                    relativePath: '.amazonq/rules/rule1.md',
                    id: '/workspace/.amazonq/rules/rule1.md',
                },
                {
                    workspaceFolder: '/workspace',
                    type: 'file' as any,
                    relativePath: '.amazonq/rules/rule2.md',
                    id: '/workspace/.amazonq/rules/rule2.md',
                },
            ]

            const result = provider.convertRulesToRulesFolders(workspaceRules, 'tab1')

            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].folderName, '.amazonq/rules')
            assert.strictEqual(result[0].active, 'indeterminate') // Should be indeterminate since rules have mixed states
            assert.strictEqual(result[0].rules[0].active, true) // Explicitly set to true
            assert.strictEqual(result[0].rules[1].active, false) // Explicitly set to false
        })
    })
})
