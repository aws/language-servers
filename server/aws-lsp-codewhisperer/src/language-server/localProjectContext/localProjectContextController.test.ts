import { LocalProjectContextController } from './localProjectContextController'
import { SinonStub, stub, spy, assert as sinonAssert } from 'sinon'
import * as assert from 'assert'
import * as fs from 'fs'
import { Dirent } from 'fs'
import sinon from 'ts-sinon'

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

    beforeEach(() => {
        logging = new LoggingMock()
        mockWorkspaceFolders = [
            {
                uri: 'file:///path/to/workspace1',
                name: 'workspace1',
            },
        ]

        vectorLibMock = {
            start: stub().resolves({
                buildIndex: stub().resolves(),
                clear: stub().resolves(),
                queryVectorIndex: stub().resolves(['mockChunk1', 'mockChunk2']),
                queryInlineProjectContext: stub().resolves(['mockContext1']),
                updateIndexV2: stub().resolves(),
            }),
        }

        fsStub = stub(fs.promises, 'readdir')
        fsStub
            .withArgs('/path/to/workspace1', { withFileTypes: true })
            .resolves([createMockDirent('Test.java', false), createMockDirent('src', true)])
        fsStub
            .withArgs('/path/to/workspace1/src', { withFileTypes: true })
            .resolves([createMockDirent('Main.java', false)])

        controller = new LocalProjectContextController('testClient', mockWorkspaceFolders, logging as any)
    })

    afterEach(() => {
        fsStub.restore()
    })

    describe('init', () => {
        it('should initialize vector library successfully', async () => {
            await controller.init(vectorLibMock)

            sinonAssert.notCalled(logging.error)
            sinonAssert.called(vectorLibMock.start)
            const vecLib = await vectorLibMock.start()
            sinonAssert.called(vecLib.buildIndex)
        })

        it('should handle initialization errors', async () => {
            vectorLibMock.start.rejects(new Error('Init failed'))

            await controller.init(vectorLibMock)

            sinonAssert.called(logging.error)
        })
    })

    describe('queryVectorIndex', () => {
        beforeEach(async () => {
            await controller.init(vectorLibMock)
        })

        it('should return empty chunks when vector library is not initialized', async () => {
            const uninitializedController = new LocalProjectContextController(
                'testClient',
                mockWorkspaceFolders,
                logging as any
            )

            const result = await uninitializedController.queryVectorIndex({ query: 'test' })
            assert.deepStrictEqual(result, { chunks: [] })
        })

        it('should return chunks from vector library', async () => {
            const result = await controller.queryVectorIndex({ query: 'test' })
            assert.deepStrictEqual(result, { chunks: ['mockChunk1', 'mockChunk2'] })
        })

        it('should handle query errors', async () => {
            const vecLib = await vectorLibMock.start()
            vecLib.queryVectorIndex.rejects(new Error('Query failed'))

            const result = await controller.queryVectorIndex({ query: 'test' })
            assert.deepStrictEqual(result, { chunks: [] })
            sinonAssert.called(logging.error)
        })
    })

    describe('queryInlineProjectContext', () => {
        beforeEach(async () => {
            await controller.init(vectorLibMock)
        })

        it('should return empty context when vector library is not initialized', async () => {
            const uninitializedController = new LocalProjectContextController(
                'testClient',
                mockWorkspaceFolders,
                logging as any
            )

            const result = await uninitializedController.queryInlineProjectContext({
                query: 'test',
                filePath: 'test.java',
                target: 'test',
            })
            assert.deepStrictEqual(result, { inlineProjectContext: [] })
        })

        it('should return context from vector library', async () => {
            const result = await controller.queryInlineProjectContext({
                query: 'test',
                filePath: 'test.java',
                target: 'test',
            })
            assert.deepStrictEqual(result, { inlineProjectContext: ['mockContext1'] })
        })

        it('should handle query errors', async () => {
            const vecLib = await vectorLibMock.start()
            vecLib.queryInlineProjectContext.rejects(new Error('Query failed'))

            const result = await controller.queryInlineProjectContext({
                query: 'test',
                filePath: 'test.java',
                target: 'test',
            })
            assert.deepStrictEqual(result, { inlineProjectContext: [] })
            sinonAssert.called(logging.error)
        })
    })

    describe('updateIndex', () => {
        beforeEach(async () => {
            await controller.init(vectorLibMock)
        })

        it('should do nothing when vector library is not initialized', async () => {
            const uninitializedController = new LocalProjectContextController(
                'testClient',
                mockWorkspaceFolders,
                logging as any
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

    describe('findCommonWorkspaceRoot', () => {
        it('should return single workspace path when only one workspace exists', () => {
            const singleWorkspace = [
                {
                    uri: 'file:///path/to/workspace',
                    name: 'workspace',
                },
            ]

            const result = (controller as any).findCommonWorkspaceRoot(singleWorkspace)
            assert.strictEqual(result, '/path/to/workspace')
        })

        it('should throw error when no workspaces provided', () => {
            assert.throws(() => (controller as any).findCommonWorkspaceRoot([]), Error, 'No workspace folders provided')
        })

        it('should find common root between multiple workspaces', () => {
            const multipleWorkspaces = [
                { uri: 'file:///path/to/workspace1', name: 'workspace1' },
                { uri: 'file:///path/to/workspace2', name: 'workspace2' },
            ]

            const result = (controller as any).findCommonWorkspaceRoot(multipleWorkspaces)
            assert.strictEqual(result, '/path/to')
        })
    })

    describe('getCodeSourceFiles', () => {
        it('should return java files from directory', async () => {
            const results = await (controller as any).getCodeSourceFiles('/path/to/workspace1')

            assert.deepStrictEqual(results, ['/path/to/workspace1/Test.java', '/path/to/workspace1/src/Main.java'])
        })

        it('should handle directory read errors', async () => {
            fsStub.withArgs('/path/to/error', { withFileTypes: true }).rejects(new Error('Read error'))

            const results = await (controller as any).getCodeSourceFiles('/path/to/error')
            assert.deepStrictEqual(results, [])
            sinonAssert.calledWith(logging.error, sinon.match(/Error reading directory \/path\/to\/error/))
        })
    })

    describe('dispose', () => {
        it('should clear and remove vector library reference', async () => {
            await controller.init(vectorLibMock)
            await controller.dispose()

            const vecLib = await vectorLibMock.start()
            sinonAssert.called(vecLib.clear)

            const queryResult = await controller.queryVectorIndex({ query: 'test' })
            assert.deepStrictEqual(queryResult, { chunks: [] })
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
