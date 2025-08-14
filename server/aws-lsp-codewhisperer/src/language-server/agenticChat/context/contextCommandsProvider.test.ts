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
            ;(LocalProjectContextController.getInstance as sinon.SinonStub).resolves(mockController as any)

            // Set initial state to false so condition is met
            ;(provider as any).workspacePending = false

            await (provider as any).registerContextCommandHandler()

            capturedCallback?.(true)

            sinon.assert.calledWith(processUpdateSpy, [])
        })
    })
})
