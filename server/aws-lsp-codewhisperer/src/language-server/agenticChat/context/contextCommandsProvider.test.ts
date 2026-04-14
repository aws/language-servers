import { ContextCommandsProvider, CONTEXT_COMMAND_PAYLOAD_CAP } from './contextCommandsProvider'
import * as sinon from 'sinon'
import * as fs from 'fs'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as chokidar from 'chokidar'
import { ContextCommandItem } from 'local-indexing'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'

describe('ContextCommandsProvider', () => {
    let provider: ContextCommandsProvider
    let testFeatures: TestFeatures
    let fsExistsStub: sinon.SinonStub
    let fsReadDirStub: sinon.SinonStub

    beforeEach(() => {
        sinon.stub(chokidar, 'watch').returns({
            on: sinon.stub(),
            close: sinon.stub(),
        } as unknown as chokidar.FSWatcher)
        testFeatures = new TestFeatures()
        fsExistsStub = sinon.stub()
        fsReadDirStub = sinon.stub()

        testFeatures.workspace.fs.exists = fsExistsStub
        testFeatures.workspace.fs.readdir = fsReadDirStub

        sinon.stub(LocalProjectContextController, 'getInstance').resolves({
            onContextItemsUpdated: sinon.stub(),
        } as any)

        provider = new ContextCommandsProvider(
            testFeatures.logging,
            testFeatures.chat,
            testFeatures.workspace,
            testFeatures.lsp
        )
        sinon.stub(provider, 'registerPromptFileWatcher').resolves()
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('getUserPrompts', () => {
        it('should return empty commands list when directory does not exist', async () => {
            fsExistsStub.resolves(false)
            const result = await provider.getUserPromptsCommand()

            sinon.assert.match(result.length, 1) // Only create prompt button
            sinon.assert.match(result[0].command, 'Create a new prompt')
        })

        it('should return prompt commands when directory exists with files', async () => {
            fsExistsStub.resolves(true)
            fsReadDirStub.resolves([
                { name: 'test1.prompt.md', isFile: () => true },
                { name: 'test2.prompt.md', isFile: () => true },
            ])

            const result = await provider.getUserPromptsCommand()

            sinon.assert.match(result.length, 3) // 2 files + create button
            sinon.assert.match(result[0].command, 'test1')
            sinon.assert.match(result[1].command, 'test2')
        })
    })

    describe('onReady', () => {
        it('should call processContextCommandUpdate with empty array on first call', async () => {
            const processUpdateSpy = sinon.spy(provider, 'processContextCommandUpdate')

            provider.onReady()

            sinon.assert.calledOnce(processUpdateSpy)
            sinon.assert.calledWith(processUpdateSpy, [])
        })

        it('should not call processContextCommandUpdate on subsequent calls', async () => {
            const processUpdateSpy = sinon.spy(provider, 'processContextCommandUpdate')

            provider.onReady()
            provider.onReady()

            sinon.assert.calledOnce(processUpdateSpy)
        })
    })

    describe('onContextItemsUpdated', () => {
        it('should call processContextCommandUpdate when controller raises event', async () => {
            const mockContextItems: ContextCommandItem[] = [
                {
                    workspaceFolder: '/workspace',
                    type: 'file',
                    relativePath: 'test/path',
                    id: 'test-id',
                },
            ]

            const processUpdateSpy = sinon.spy(provider, 'processContextCommandUpdate')

            const callback = (provider as any).processContextCommandUpdate.bind(provider)
            await callback(mockContextItems)

            sinon.assert.calledOnce(processUpdateSpy)
            sinon.assert.calledWith(processUpdateSpy, mockContextItems)
        })
    })

    describe('setFilesAndFoldersFailed', () => {
        it('should set filesAndFoldersFailed to true and filesAndFoldersPending to false', () => {
            provider.setFilesAndFoldersFailed(true)

            sinon.assert.match((provider as any).filesAndFoldersFailed, true)
            sinon.assert.match((provider as any).filesAndFoldersPending, false)
        })

        it('should show failed disabledText when filesAndFoldersFailed is true', async () => {
            fsExistsStub.resolves(false)
            provider.setFilesAndFoldersFailed(true)

            const result = await provider.mapContextCommandItems([])
            const filesCmd = result[0].commands?.find(cmd => cmd.command === 'Files')
            const foldersCmd = result[0].commands?.find(cmd => cmd.command === 'Folders')

            sinon.assert.match(filesCmd?.disabledText, 'failed')
            sinon.assert.match(foldersCmd?.disabledText, 'failed')
        })

        it('should show pending disabledText when filesAndFoldersPending is true and not failed', async () => {
            fsExistsStub.resolves(false)
            ;(provider as any).filesAndFoldersPending = true
            ;(provider as any).filesAndFoldersFailed = false

            const result = await provider.mapContextCommandItems([])
            const filesCmd = result[0].commands?.find(cmd => cmd.command === 'Files')
            const foldersCmd = result[0].commands?.find(cmd => cmd.command === 'Folders')

            sinon.assert.match(filesCmd?.disabledText, 'pending')
            sinon.assert.match(foldersCmd?.disabledText, 'pending')
        })

        it('should show no disabledText when not pending and not failed', async () => {
            fsExistsStub.resolves(false)
            provider.setFilesAndFoldersPending(false)
            ;(provider as any).filesAndFoldersFailed = false

            const result = await provider.mapContextCommandItems([])
            const filesCmd = result[0].commands?.find(cmd => cmd.command === 'Files')
            const foldersCmd = result[0].commands?.find(cmd => cmd.command === 'Folders')

            sinon.assert.match(filesCmd?.disabledText, undefined)
            sinon.assert.match(foldersCmd?.disabledText, undefined)
        })
    })

    describe('processContextCommandUpdate folder budget', () => {
        let sendContextCommandsSpy: sinon.SinonStub
        let existsSyncStub: sinon.SinonStub

        function makeItem(type: 'file' | 'folder', index: number): ContextCommandItem {
            return {
                workspaceFolder: '/workspace',
                type,
                relativePath: type === 'folder' ? `dir${index}` : `file${index}.ts`,
                id: `${type}-${index}`,
            }
        }

        beforeEach(() => {
            sendContextCommandsSpy = testFeatures.chat.sendContextCommands as unknown as sinon.SinonStub
            existsSyncStub = sinon.stub(fs, 'existsSync').returns(true)
        })

        it('should include folders in capped payload when items exceed cap', async () => {
            const folders = Array.from({ length: 600 }, (_, i) => makeItem('folder', i))
            const files = Array.from({ length: 2000 }, (_, i) => makeItem('file', i))
            const items = [...files, ...folders]

            await provider.processContextCommandUpdate(items)

            sinon.assert.calledOnce(sendContextCommandsSpy)
            const sent = sendContextCommandsSpy.firstCall.args[0]
            const topCommands = sent.contextCommandGroups[0].commands
            const folderChildren = topCommands.find((c: any) => c.command === 'Folders')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            // Folders should be present (budget = ceil(2000 * 0.25) = 500)
            sinon.assert.match(folderChildren.length, 500)
            // Files fill the remaining budget (2000 - 500 = 1500), plus the "Active File" command
            sinon.assert.match(fileChildren.length, 1501)
        })

        it('should include all folders when fewer than budget', async () => {
            const folders = Array.from({ length: 5 }, (_, i) => makeItem('folder', i))
            const files = Array.from({ length: 2000 }, (_, i) => makeItem('file', i))
            const items = [...files, ...folders]

            await provider.processContextCommandUpdate(items)

            const sent = sendContextCommandsSpy.firstCall.args[0]
            const topCommands = sent.contextCommandGroups[0].commands
            const folderChildren = topCommands.find((c: any) => c.command === 'Folders')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            // All 5 folders included
            sinon.assert.match(folderChildren.length, 5)
            // Remaining budget: 2000 - 5 = 1995, plus "Active File"
            sinon.assert.match(fileChildren.length, 1996)
        })

        it('should not exceed cap total', async () => {
            const folders = Array.from({ length: 800 }, (_, i) => makeItem('folder', i))
            const files = Array.from({ length: 2000 }, (_, i) => makeItem('file', i))
            const items = [...files, ...folders]

            await provider.processContextCommandUpdate(items)

            const sent = sendContextCommandsSpy.firstCall.args[0]
            const topCommands = sent.contextCommandGroups[0].commands
            const folderChildren = topCommands.find((c: any) => c.command === 'Folders')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            // Folder budget capped at ceil(2000 * 0.25) = 500
            sinon.assert.match(folderChildren.length, 500)
            // Total items (excluding "Active File") should not exceed CONTEXT_COMMAND_PAYLOAD_CAP
            const totalItems = folderChildren.length + (fileChildren.length - 1) // subtract Active File
            sinon.assert.match(totalItems <= CONTEXT_COMMAND_PAYLOAD_CAP, true)
        })

        it('should work normally when items are under cap', async () => {
            const folders = Array.from({ length: 10 }, (_, i) => makeItem('folder', i))
            const files = Array.from({ length: 50 }, (_, i) => makeItem('file', i))
            const items = [...files, ...folders]

            await provider.processContextCommandUpdate(items)

            const sent = sendContextCommandsSpy.firstCall.args[0]
            const topCommands = sent.contextCommandGroups[0].commands
            const folderChildren = topCommands.find((c: any) => c.command === 'Folders')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            // All items included when under cap
            sinon.assert.match(folderChildren.length, 10)
            sinon.assert.match(fileChildren.length, 51) // 50 + Active File
        })
    })

    describe('processContextCommandUpdate code budget', () => {
        let sendContextCommandsSpy: sinon.SinonStub
        let existsSyncStub: sinon.SinonStub

        function makeFile(index: number): ContextCommandItem {
            return {
                workspaceFolder: '/workspace',
                type: 'file',
                relativePath: `file${index}.ts`,
                id: `file-${index}`,
            }
        }

        function makeFolder(index: number): ContextCommandItem {
            return {
                workspaceFolder: '/workspace',
                type: 'folder',
                relativePath: `dir${index}`,
                id: `folder-${index}`,
            }
        }

        function makeCode(index: number): ContextCommandItem {
            return {
                workspaceFolder: '/workspace',
                type: 'code',
                relativePath: `file${index}.ts`,
                id: `code-${index}`,
                symbol: {
                    kind: 'Function',
                    name: `func${index}`,
                    range: {
                        start: { line: 0, column: 0 },
                        end: { line: 10, column: 0 },
                    },
                },
            } as ContextCommandItem
        }

        beforeEach(() => {
            sendContextCommandsSpy = testFeatures.chat.sendContextCommands as unknown as sinon.SinonStub
            existsSyncStub = sinon.stub(fs, 'existsSync').returns(true)
        })

        it('should include code symbols in capped payload when items exceed cap', async () => {
            const code = Array.from({ length: 600 }, (_, i) => makeCode(i))
            const files = Array.from({ length: 2000 }, (_, i) => makeFile(i))
            // Files first in input order to mirror typical indexer output (files
            // scanned before AST symbol extraction).
            const items = [...files, ...code]

            await provider.processContextCommandUpdate(items)

            const sent = sendContextCommandsSpy.firstCall.args[0]
            const topCommands = sent.contextCommandGroups[0].commands
            const codeChildren = topCommands.find((c: any) => c.command === 'Code')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            // Code budget = ceil(2000 * 0.25) = 500
            sinon.assert.match(codeChildren.length, 500)
            // Files fill the remaining budget (2000 - 500 = 1500), plus the "Active File" command
            sinon.assert.match(fileChildren.length, 1501)
        })

        it('should include all code symbols when fewer than budget', async () => {
            const code = Array.from({ length: 5 }, (_, i) => makeCode(i))
            const files = Array.from({ length: 2000 }, (_, i) => makeFile(i))
            const items = [...files, ...code]

            await provider.processContextCommandUpdate(items)

            const sent = sendContextCommandsSpy.firstCall.args[0]
            const topCommands = sent.contextCommandGroups[0].commands
            const codeChildren = topCommands.find((c: any) => c.command === 'Code')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            // All 5 code symbols included
            sinon.assert.match(codeChildren.length, 5)
            // File budget grows to absorb the slack: 2000 - 5 = 1995, plus Active File
            sinon.assert.match(fileChildren.length, 1996)
        })

        it('should split 500/500/1000 when folders, code, and files all exceed budget', async () => {
            const folders = Array.from({ length: 800 }, (_, i) => makeFolder(i))
            const code = Array.from({ length: 800 }, (_, i) => makeCode(i))
            const files = Array.from({ length: 3000 }, (_, i) => makeFile(i))
            const items = [...files, ...folders, ...code]

            await provider.processContextCommandUpdate(items)

            const sent = sendContextCommandsSpy.firstCall.args[0]
            const topCommands = sent.contextCommandGroups[0].commands
            const folderChildren = topCommands.find((c: any) => c.command === 'Folders')?.children?.[0]?.commands ?? []
            const codeChildren = topCommands.find((c: any) => c.command === 'Code')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            sinon.assert.match(folderChildren.length, 500)
            sinon.assert.match(codeChildren.length, 500)
            sinon.assert.match(fileChildren.length, 1001) // 1000 + Active File

            // Total non-active items must not exceed CONTEXT_COMMAND_PAYLOAD_CAP
            const totalItems = folderChildren.length + codeChildren.length + (fileChildren.length - 1)
            sinon.assert.match(totalItems <= CONTEXT_COMMAND_PAYLOAD_CAP, true)
        })

        it('should not starve code symbols when files come first in input', async () => {
            // This is the regression case: pre-fix, the flat slice(0, 1800) on
            // nonFolders consumed the entire budget with files (which appear
            // first in typical indexer output) and dropped all code symbols.
            const files = Array.from({ length: 5000 }, (_, i) => makeFile(i))
            const code = Array.from({ length: 50 }, (_, i) => makeCode(i))
            const items = [...files, ...code]

            await provider.processContextCommandUpdate(items)

            const sent = sendContextCommandsSpy.firstCall.args[0]
            const topCommands = sent.contextCommandGroups[0].commands
            const codeChildren = topCommands.find((c: any) => c.command === 'Code')?.children?.[0]?.commands ?? []

            // All 50 code symbols should appear regardless of where they sit
            // in the input array.
            sinon.assert.match(codeChildren.length, 50)
        })
    })

    describe('getFreshItems', () => {
        it('should return empty array and log when LocalProjectContextController.getInstance rejects', async () => {
            ;(LocalProjectContextController.getInstance as sinon.SinonStub).rejects(new Error('boom'))
            const errorSpy = testFeatures.logging.error as unknown as sinon.SinonStub

            const result = await (provider as any).getFreshItems()

            sinon.assert.match(result.length, 0)
            sinon.assert.calledOnce(errorSpy)
        })

        it('should return empty array and log when getContextCommandItems rejects', async () => {
            ;(LocalProjectContextController.getInstance as sinon.SinonStub).resolves({
                getContextCommandItems: sinon.stub().rejects(new Error('indexer down')),
            } as any)
            const errorSpy = testFeatures.logging.error as unknown as sinon.SinonStub

            const result = await (provider as any).getFreshItems()

            sinon.assert.match(result.length, 0)
            sinon.assert.calledOnce(errorSpy)
        })

        it('should return items from controller on success', async () => {
            const fakeItems: ContextCommandItem[] = [
                { workspaceFolder: '/workspace', type: 'file', relativePath: 'a.ts', id: 'a' },
            ]
            ;(LocalProjectContextController.getInstance as sinon.SinonStub).resolves({
                getContextCommandItems: sinon.stub().resolves(fakeItems),
            } as any)

            const result = await (provider as any).getFreshItems()

            sinon.assert.match(result.length, 1)
            sinon.assert.match(result[0].id, 'a')
        })
    })

    describe('registerFilterHandler empty-search path', () => {
        let existsSyncStub: sinon.SinonStub

        function makeItem(type: 'file' | 'folder', index: number): ContextCommandItem {
            return {
                workspaceFolder: '/workspace',
                type,
                relativePath: type === 'folder' ? `dir${index}` : `file${index}.ts`,
                id: `${type}-${index}`,
            }
        }

        beforeEach(() => {
            existsSyncStub = sinon.stub(fs, 'existsSync').returns(true)
        })

        it('should apply capItems folder budget when filter handler called with empty searchTerm', async () => {
            const folders = Array.from({ length: 600 }, (_, i) => makeItem('folder', i))
            const files = Array.from({ length: 2000 }, (_, i) => makeItem('file', i))
            ;(LocalProjectContextController.getInstance as sinon.SinonStub).resolves({
                getContextCommandItems: sinon.stub().resolves([...files, ...folders]),
            } as any)

            // Register a fresh filter handler so the new stubbed controller is used.
            ;(provider as any).registerFilterHandler()

            const onFilterStub = testFeatures.chat.onFilterContextCommands as unknown as sinon.SinonStub
            // The handler is the most recently-registered one (initial registration
            // happens in the constructor with the placeholder controller stub).
            const handler = onFilterStub.lastCall.args[0]
            const result = await handler({ searchTerm: '' })

            const topCommands = result.contextCommandGroups[0].commands
            const folderChildren = topCommands.find((c: any) => c.command === 'Folders')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            // Folder budget = ceil(2000 * 0.25) = 500
            sinon.assert.match(folderChildren.length, 500)
            // Files fill the remaining 1500 + the "Active File" command
            sinon.assert.match(fileChildren.length, 1501)
        })

        it('should also apply capItems when searchTerm is whitespace-only', async () => {
            const folders = Array.from({ length: 800 }, (_, i) => makeItem('folder', i))
            const files = Array.from({ length: 3000 }, (_, i) => makeItem('file', i))
            ;(LocalProjectContextController.getInstance as sinon.SinonStub).resolves({
                getContextCommandItems: sinon.stub().resolves([...files, ...folders]),
            } as any)
            ;(provider as any).registerFilterHandler()

            const onFilterStub = testFeatures.chat.onFilterContextCommands as unknown as sinon.SinonStub
            const handler = onFilterStub.lastCall.args[0]
            const result = await handler({ searchTerm: '   ' })

            const topCommands = result.contextCommandGroups[0].commands
            const folderChildren = topCommands.find((c: any) => c.command === 'Folders')?.children?.[0]?.commands ?? []

            // Whitespace trims to empty → folder budget enforced
            sinon.assert.match(folderChildren.length, 500)
        })

        it('should reserve a code budget on the empty-search path', async () => {
            const folders = Array.from({ length: 800 }, (_, i) => makeItem('folder', i))
            const files = Array.from({ length: 3000 }, (_, i) => makeItem('file', i))
            const code = Array.from({ length: 800 }, (_, i) => ({
                workspaceFolder: '/workspace',
                type: 'code' as const,
                relativePath: `file${i}.ts`,
                id: `code-${i}`,
                symbol: {
                    kind: 'Function',
                    name: `func${i}`,
                    range: {
                        start: { line: 0, column: 0 },
                        end: { line: 10, column: 0 },
                    },
                },
            })) as ContextCommandItem[]
            ;(LocalProjectContextController.getInstance as sinon.SinonStub).resolves({
                // Files first to mirror typical indexer output.
                getContextCommandItems: sinon.stub().resolves([...files, ...folders, ...code]),
            } as any)
            ;(provider as any).registerFilterHandler()

            const onFilterStub = testFeatures.chat.onFilterContextCommands as unknown as sinon.SinonStub
            const handler = onFilterStub.lastCall.args[0]
            const result = await handler({ searchTerm: '' })

            const topCommands = result.contextCommandGroups[0].commands
            const folderChildren = topCommands.find((c: any) => c.command === 'Folders')?.children?.[0]?.commands ?? []
            const codeChildren = topCommands.find((c: any) => c.command === 'Code')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            // 500 / 500 / 1000 split (+ 1 Active File pseudo-command in the Files group)
            sinon.assert.match(folderChildren.length, 500)
            sinon.assert.match(codeChildren.length, 500)
            sinon.assert.match(fileChildren.length, 1001)
        })
    })
})
