import { LocalProjectContextController } from './localProjectContextController'
import { SinonStub, stub, assert as sinonAssert, match, restore } from 'sinon'
import * as assert from 'assert'
import * as fs from 'fs'
import { Dirent } from 'fs'
import * as path from 'path'
import { URI } from 'vscode-uri'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as chokidar from 'chokidar'

class LoggingMock {
    public error: SinonStub
    public info: SinonStub
    public log: SinonStub
    public warn: SinonStub

    constructor() {
        this.error = stub()
        this.info = stub()
        this.log = stub()
        this.warn = stub()
    }
}

describe('LocalProjectContextController', () => {
    let controller: LocalProjectContextController
    let logging: LoggingMock
    let mockWorkspaceFolders: any[]
    let vectorLibMock: any
    let fsStub: SinonStub
    let testFeatures: TestFeatures

    const BASE_PATH = path.join(__dirname, 'path', 'to', 'workspace1')

    beforeEach(() => {
        testFeatures = new TestFeatures()
        logging = new LoggingMock()
        mockWorkspaceFolders = [
            {
                uri: URI.file(BASE_PATH),
                name: 'workspace1',
            },
        ]
        stub(chokidar, 'watch').returns({
            on: stub(),
            close: stub(),
        } as unknown as chokidar.FSWatcher)

        vectorLibMock = {
            start: stub().resolves({
                buildIndex: stub().resolves(),
                clear: stub().resolves(),
                queryVectorIndex: stub().resolves(['mockChunk1', 'mockChunk2']),
                queryInlineProjectContext: stub().resolves(['mockContext1']),
                updateIndexV2: stub().resolves(),
                getContextCommandItems: stub().resolves([]),
                getIndexSequenceNumber: stub().resolves(1),
                getContextCommandPrompt: stub().resolves([]),
            }),
        }

        fsStub = stub(fs.promises, 'readdir')
        fsStub.withArgs(match.string, { withFileTypes: true }).callsFake(path => {
            if (path.endsWith('workspace1')) {
                return Promise.resolve([createMockDirent('Test.java', false), createMockDirent('src', true)])
            } else if (path.endsWith('src')) {
                return Promise.resolve([createMockDirent('Main.java', false)])
            } else {
                return Promise.resolve([])
            }
        })

        controller = new LocalProjectContextController(
            'testClient',
            mockWorkspaceFolders,
            logging as any,
            testFeatures.chat,
            testFeatures.workspace
        )
        stub(controller, 'maybeUpdateCodeSymbols').resolves()
    })

    afterEach(() => {
        fsStub.restore()
        restore()
    })

    describe('init', () => {
        it('should initialize vector library successfully', async () => {
            await controller.init({ vectorLib: vectorLibMock })

            sinonAssert.notCalled(logging.error)
            sinonAssert.called(vectorLibMock.start)
            const vecLib = await vectorLibMock.start()
            sinonAssert.called(vecLib.buildIndex)
        })

        it('should handle initialization errors', async () => {
            vectorLibMock.start.rejects(new Error('Init failed'))

            await controller.init({ vectorLib: vectorLibMock })

            sinonAssert.called(logging.error)
        })
    })

    describe('queryVectorIndex', () => {
        beforeEach(async () => {
            await controller.init({ vectorLib: vectorLibMock })
        })

        it('should return empty array when vector library is not initialized', async () => {
            const uninitializedController = new LocalProjectContextController(
                'testClient',
                mockWorkspaceFolders,
                logging as any,
                testFeatures.chat,
                testFeatures.workspace
            )

            const result = await uninitializedController.queryVectorIndex({ query: 'test' })
            assert.deepStrictEqual(result, [])
        })

        it('should return chunks from vector library', async () => {
            const result = await controller.queryVectorIndex({ query: 'test' })
            assert.deepStrictEqual(result, ['mockChunk1', 'mockChunk2'])
        })

        it('should handle query errors', async () => {
            const vecLib = await vectorLibMock.start()
            vecLib.queryVectorIndex.rejects(new Error('Query failed'))

            const result = await controller.queryVectorIndex({ query: 'test' })
            assert.deepStrictEqual(result, [])
            sinonAssert.called(logging.error)
        })
    })

    describe('queryInlineProjectContext', () => {
        beforeEach(async () => {
            await controller.init({ vectorLib: vectorLibMock })
        })

        it('should return empty array when vector library is not initialized', async () => {
            const uninitializedController = new LocalProjectContextController(
                'testClient',
                mockWorkspaceFolders,
                logging as any,
                testFeatures.chat,
                testFeatures.workspace
            )

            const result = await uninitializedController.queryInlineProjectContext({
                query: 'test',
                filePath: 'test.java',
                target: 'test',
            })
            assert.deepStrictEqual(result, [])
        })

        it('should return context from vector library', async () => {
            const result = await controller.queryInlineProjectContext({
                query: 'test',
                filePath: 'test.java',
                target: 'test',
            })
            assert.deepStrictEqual(result, ['mockContext1'])
        })

        it('should handle query errors', async () => {
            const vecLib = await vectorLibMock.start()
            vecLib.queryInlineProjectContext.rejects(new Error('Query failed'))

            const result = await controller.queryInlineProjectContext({
                query: 'test',
                filePath: 'test.java',
                target: 'test',
            })
            assert.deepStrictEqual(result, [])
            sinonAssert.called(logging.error)
        })
    })

    describe('updateIndex', () => {
        beforeEach(async () => {
            await controller.init({ vectorLib: vectorLibMock })
        })

        it('should do nothing when vector library is not initialized', async () => {
            const uninitializedController = new LocalProjectContextController(
                'testClient',
                mockWorkspaceFolders,
                logging as any,
                testFeatures.chat,
                testFeatures.workspace
            )

            await uninitializedController.updateIndex(['test.java'], 'add')
            sinonAssert.notCalled(logging.error)
        })

        it('should update index successfully', async () => {
            const vecLib = await vectorLibMock.start()
            await controller.updateIndex(['test.java'], 'add')
            sinonAssert.called(vecLib.updateIndexV2)
        })

        it('should handle update errors', async () => {
            const vecLib = await vectorLibMock.start()
            vecLib.updateIndexV2.rejects(new Error('Update failed'))

            await controller.updateIndex(['test.java'], 'add')
            sinonAssert.called(logging.error)
        })
    })

    describe('configuration options', () => {
        let processEnvBackup: NodeJS.ProcessEnv

        beforeEach(() => {
            processEnvBackup = { ...process.env }
        })

        afterEach(() => {
            process.env = processEnvBackup
        })

        it('should set GPU acceleration environment variable when enabled', async () => {
            await controller.init({
                enableGpuAcceleration: true,
                vectorLib: vectorLibMock,
            })
            assert.strictEqual(process.env.Q_ENABLE_GPU, 'true')
            sinonAssert.called(vectorLibMock.start)
        })

        it('should remove GPU acceleration environment variable when disabled', async () => {
            process.env.Q_ENABLE_GPU = 'true'
            await controller.init({
                enableGpuAcceleration: false,
                vectorLib: vectorLibMock,
            })
            assert.strictEqual(process.env.Q_ENABLE_GPU, undefined)
            sinonAssert.called(vectorLibMock.start)
        })

        it('should set worker threads environment variable when specified', async () => {
            await controller.init({
                indexWorkerThreads: 4,
                vectorLib: vectorLibMock,
            })
            assert.strictEqual(process.env.Q_WORKER_THREADS, '4')
            sinonAssert.called(vectorLibMock.start)
        })

        it('should remove worker threads environment variable when not specified', async () => {
            process.env.Q_WORKER_THREADS = '4'
            await controller.init({
                vectorLib: vectorLibMock,
            })
            assert.strictEqual(process.env.Q_WORKER_THREADS, undefined)
            sinonAssert.called(vectorLibMock.start)
        })

        it('should ignore invalid worker thread counts', async () => {
            process.env.Q_WORKER_THREADS = '4'
            await controller.init({
                indexWorkerThreads: 101,
                vectorLib: vectorLibMock,
            })
            assert.strictEqual(process.env.Q_WORKER_THREADS, undefined)
            sinonAssert.called(vectorLibMock.start)
        })

        it('should ignore negative worker thread counts', async () => {
            process.env.Q_WORKER_THREADS = '4'
            await controller.init({
                indexWorkerThreads: -1,
                vectorLib: vectorLibMock,
            })
            assert.strictEqual(process.env.Q_WORKER_THREADS, undefined)
            sinonAssert.called(vectorLibMock.start)
        })
    })

    describe('dispose', () => {
        it('should clear and remove vector library reference', async () => {
            await controller.init({ vectorLib: vectorLibMock })
            await controller.dispose()

            const vecLib = await vectorLibMock.start()
            sinonAssert.called(vecLib.clear)

            const queryResult = await controller.queryVectorIndex({ query: 'test' })
            assert.deepStrictEqual(queryResult, [])
        })
    })
})

function createMockDirent(name: string, isDirectory: boolean): Dirent {
    return {
        name,
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isFIFO: () => false,
        isSocket: () => false,
        isSymbolicLink: () => false,
    } as Dirent
}
