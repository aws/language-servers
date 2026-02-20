import { ContextCommandsProvider } from './contextCommandsProvider'
import * as sinon from 'sinon'
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
        it('should update workspacePending and call processContextCommandUpdate when indexing status changes', async () => {
            let capturedCallback: ((indexingInProgress: boolean) => void) | undefined

            const mockController = {
                onContextItemsUpdated: sinon.stub(),
                set onIndexingInProgressChanged(callback: (indexingInProgress: boolean) => void) {
                    capturedCallback = callback
                },
            }

            const processUpdateSpy = sinon.spy(provider, 'processContextCommandUpdate')
            sinon.stub(LocalProjectContextController, 'isInitialized').returns(true)
            ;(LocalProjectContextController.getInstance as sinon.SinonStub).resolves(mockController as any)

            // Set initial state to false so condition is met
            ;(provider as any).workspacePending = false

            await (provider as any).registerContextCommandHandler()

            capturedCallback?.(true)

            sinon.assert.calledWith(processUpdateSpy, [])
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
})
