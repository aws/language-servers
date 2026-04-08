import { ContextCommandsProvider, CONTEXT_COMMAND_PAYLOAD_CAP, INDEXING_THROTTLE_MS } from './contextCommandsProvider'
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
            onIndexingInProgressChanged: sinon.stub(),
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

    describe('onIndexingInProgressChanged', () => {
        it('should update workspacePending and call processContextCommandUpdate after throttle window', async () => {
            const clock = sinon.useFakeTimers()
            let capturedCallback: ((indexingInProgress: boolean) => void) | undefined

            const mockController = {
                onContextItemsUpdated: sinon.stub(),
                set onIndexingInProgressChanged(callback: (indexingInProgress: boolean) => void) {
                    capturedCallback = callback
                },
            }

            const processUpdateSpy = sinon.spy(provider, 'processContextCommandUpdate')
            ;(LocalProjectContextController.getInstance as sinon.SinonStub).resolves(mockController as any)

            // Set initial state to false so condition is met
            ;(provider as any).workspacePending = false

            await (provider as any).registerContextCommandHandler()

            capturedCallback?.(true)

            // Not called yet — still within throttle window
            sinon.assert.notCalled(processUpdateSpy)

            // Advance past the throttle window
            clock.tick(INDEXING_THROTTLE_MS)

            sinon.assert.calledWith(processUpdateSpy, [])

            clock.restore()
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
            const folders = Array.from({ length: 200 }, (_, i) => makeItem('folder', i))
            const files = Array.from({ length: 2000 }, (_, i) => makeItem('file', i))
            const items = [...files, ...folders]

            await provider.processContextCommandUpdate(items)

            sinon.assert.calledOnce(sendContextCommandsSpy)
            const sent = sendContextCommandsSpy.firstCall.args[0]
            const topCommands = sent.contextCommandGroups[0].commands
            const folderChildren = topCommands.find((c: any) => c.command === 'Folders')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            // Folders should be present (budget = ceil(1000 * 0.1) = 100)
            sinon.assert.match(folderChildren.length, 100)
            // Files fill the remaining budget (1000 - 100 = 900), plus the "Active File" command
            sinon.assert.match(fileChildren.length, 901)
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
            // Remaining budget: 1000 - 5 = 995, plus "Active File"
            sinon.assert.match(fileChildren.length, 996)
        })

        it('should not exceed cap total', async () => {
            const folders = Array.from({ length: 500 }, (_, i) => makeItem('folder', i))
            const files = Array.from({ length: 2000 }, (_, i) => makeItem('file', i))
            const items = [...files, ...folders]

            await provider.processContextCommandUpdate(items)

            const sent = sendContextCommandsSpy.firstCall.args[0]
            const topCommands = sent.contextCommandGroups[0].commands
            const folderChildren = topCommands.find((c: any) => c.command === 'Folders')?.children?.[0]?.commands ?? []
            const fileChildren = topCommands.find((c: any) => c.command === 'Files')?.children?.[0]?.commands ?? []

            // Folder budget capped at ceil(1000 * 0.1) = 100
            sinon.assert.match(folderChildren.length, 100)
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
            const folders = Array.from({ length: 200 }, (_, i) => makeItem('folder', i))
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

            // Folder budget = ceil(1000 * 0.1) = 100
            sinon.assert.match(folderChildren.length, 100)
            // Files fill the remaining 900 + the "Active File" command
            sinon.assert.match(fileChildren.length, 901)
        })

        it('should also apply capItems when searchTerm is whitespace-only', async () => {
            const folders = Array.from({ length: 200 }, (_, i) => makeItem('folder', i))
            const files = Array.from({ length: 2000 }, (_, i) => makeItem('file', i))
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
            sinon.assert.match(folderChildren.length, 100)
        })
    })
})
