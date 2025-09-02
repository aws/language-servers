import * as assert from 'assert'
import * as sinon from 'sinon'
import { MemoryBankController } from './memoryBankController'
import { MEMORY_BANK_DIRECTORY, MEMORY_BANK_FILES } from './memoryBankTypes'

describe('MemoryBankController', () => {
    let controller: MemoryBankController
    let mockFeatures: any
    let mockWorkspace: any
    let mockFs: any
    let mockLogging: any

    beforeEach(() => {
        mockFs = {
            exists: sinon.stub(),
            mkdir: sinon.stub(),
            readFile: sinon.stub(),
            readdir: sinon.stub(),
        }

        mockWorkspace = {
            fs: mockFs,
        }

        mockLogging = {
            info: sinon.stub(),
            error: sinon.stub(),
            warn: sinon.stub(),
        }

        mockFeatures = {
            workspace: mockWorkspace,
            logging: mockLogging,
        }

        controller = new MemoryBankController(mockFeatures)
    })

    afterEach(() => {
        sinon.restore()
        // Reset singleton instance
        ;(MemoryBankController as any).instance = undefined
    })

    describe('getInstance', () => {
        it('should return singleton instance', () => {
            const instance1 = MemoryBankController.getInstance(mockFeatures)
            const instance2 = MemoryBankController.getInstance(mockFeatures)

            assert.strictEqual(instance1, instance2)
        })

        it('should create new instance if none exists', () => {
            const instance = MemoryBankController.getInstance(mockFeatures)

            assert.ok(instance instanceof MemoryBankController)
        })
    })

    describe('memoryBankExists', () => {
        const workspaceFolder = '/test/workspace'

        it('should return false if memory bank directory does not exist', async () => {
            mockFs.exists.resolves(false)

            const result = await controller.memoryBankExists(workspaceFolder)

            assert.strictEqual(result, false)
            sinon.assert.calledOnce(mockFs.exists)
        })

        it('should return false if directory exists but no files exist', async () => {
            mockFs.exists.onFirstCall().resolves(true) // directory exists
            mockFs.exists.onSecondCall().resolves(false) // product.md doesn't exist
            mockFs.exists.onThirdCall().resolves(false) // structure.md doesn't exist
            mockFs.exists.onCall(3).resolves(false) // tech.md doesn't exist
            mockFs.exists.onCall(4).resolves(false) // guidelines.md doesn't exist

            const result = await controller.memoryBankExists(workspaceFolder)

            assert.strictEqual(result, false)
        })

        it('should return true if directory exists and at least one file exists', async () => {
            mockFs.exists.onFirstCall().resolves(true) // directory exists
            mockFs.exists.onSecondCall().resolves(true) // product.md exists

            const result = await controller.memoryBankExists(workspaceFolder)

            assert.strictEqual(result, true)
        })

        it('should handle errors gracefully', async () => {
            mockFs.exists.rejects(new Error('File system error'))

            const result = await controller.memoryBankExists(workspaceFolder)

            assert.strictEqual(result, false)
            sinon.assert.calledOnce(mockLogging.error)
        })
    })

    describe('createMemoryBankDirectory', () => {
        const workspaceFolder = '/test/workspace'

        it('should create all necessary directories', async () => {
            mockFs.exists.resolves(false) // all directories don't exist
            mockFs.mkdir.resolves()

            const result = await controller.createMemoryBankDirectory(workspaceFolder)

            assert.strictEqual(result, true)
            sinon.assert.calledThrice(mockFs.mkdir)
            sinon.assert.calledWith(mockFs.mkdir, '/test/workspace/.amazonq')
            sinon.assert.calledWith(mockFs.mkdir, '/test/workspace/.amazonq/rules')
            sinon.assert.calledWith(mockFs.mkdir, '/test/workspace/.amazonq/rules/memory-bank')
        })

        it('should skip creating existing directories', async () => {
            mockFs.exists.onFirstCall().resolves(true) // .amazonq exists
            mockFs.exists.onSecondCall().resolves(true) // rules exists
            mockFs.exists.onThirdCall().resolves(false) // memory-bank doesn't exist
            mockFs.mkdir.resolves()

            const result = await controller.createMemoryBankDirectory(workspaceFolder)

            assert.strictEqual(result, true)
            sinon.assert.calledOnce(mockFs.mkdir)
            sinon.assert.calledWith(mockFs.mkdir, '/test/workspace/.amazonq/rules/memory-bank')
        })

        it('should handle errors gracefully', async () => {
            mockFs.exists.rejects(new Error('File system error'))

            const result = await controller.createMemoryBankDirectory(workspaceFolder)

            assert.strictEqual(result, false)
            sinon.assert.calledOnce(mockLogging.error)
        })
    })

    describe('validateMemoryBankCreation', () => {
        const workspaceFolder = '/test/workspace'

        it('should return success when all files exist and are readable', async () => {
            mockFs.exists.resolves(true)
            mockFs.readFile.resolves(Buffer.from('test content'))

            const result = await controller.validateMemoryBankCreation(workspaceFolder)

            assert.strictEqual(result.success, true)
            assert.strictEqual(result.filesCreated.length, 4)
            assert.strictEqual(result.error, undefined)
        })

        it('should return partial success when some files exist', async () => {
            mockFs.exists.onFirstCall().resolves(true) // product.md exists
            mockFs.exists.onSecondCall().resolves(false) // structure.md doesn't exist
            mockFs.exists.onThirdCall().resolves(true) // tech.md exists
            mockFs.exists.onCall(3).resolves(false) // guidelines.md doesn't exist
            mockFs.readFile.resolves(Buffer.from('test content'))

            const result = await controller.validateMemoryBankCreation(workspaceFolder)

            assert.strictEqual(result.success, true)
            assert.strictEqual(result.filesCreated.length, 2)
            assert.ok(result.error?.includes('File structure.md was not created'))
        })

        it('should return failure when no files exist', async () => {
            mockFs.exists.resolves(false)

            const result = await controller.validateMemoryBankCreation(workspaceFolder)

            assert.strictEqual(result.success, false)
            assert.strictEqual(result.filesCreated.length, 0)
            assert.ok(result.error?.includes('was not created'))
        })

        it('should handle read errors gracefully', async () => {
            mockFs.exists.resolves(true)
            mockFs.readFile.rejects(new Error('Read error'))

            const result = await controller.validateMemoryBankCreation(workspaceFolder)

            assert.strictEqual(result.success, false)
            assert.strictEqual(result.filesCreated.length, 0)
            assert.ok(result.error?.includes('Failed to read'))
        })
    })

    describe('getMemoryBankFilePaths', () => {
        it('should return correct file paths', () => {
            const workspaceFolder = '/test/workspace'
            const paths = controller.getMemoryBankFilePaths(workspaceFolder)

            assert.strictEqual(paths.length, 4)
            assert.ok(paths.includes('/test/workspace/.amazonq/rules/memory-bank/product.md'))
            assert.ok(paths.includes('/test/workspace/.amazonq/rules/memory-bank/structure.md'))
            assert.ok(paths.includes('/test/workspace/.amazonq/rules/memory-bank/tech.md'))
            assert.ok(paths.includes('/test/workspace/.amazonq/rules/memory-bank/guidelines.md'))
        })
    })

    describe('isMemoryBankCreationRequest', () => {
        it('should detect memory bank creation requests', () => {
            const testCases = [
                'create a memory bank',
                'Create a Memory Bank',
                'CREATE MEMORY BANK',
                'generate memory bank for this project',
                'build memory bank',
                'make memory bank',
                'setup memory bank',
            ]

            testCases.forEach(prompt => {
                const result = controller.isMemoryBankCreationRequest(prompt)
                assert.strictEqual(result, true, `Failed to detect: "${prompt}"`)
            })
        })

        it('should not detect non-memory bank requests', () => {
            const testCases = [
                'create a file',
                'help me with code',
                'explain this function',
                'memory usage optimization',
                'bank account management',
            ]

            testCases.forEach(prompt => {
                const result = controller.isMemoryBankCreationRequest(prompt)
                assert.strictEqual(result, false, `False positive for: "${prompt}"`)
            })
        })
    })

    describe('getMemoryBankCreationPrompt', () => {
        it('should return a comprehensive prompt', () => {
            const prompt = controller.getMemoryBankCreationPrompt()

            assert.ok(typeof prompt === 'string')
            assert.ok(prompt.length > 100)
            assert.ok(prompt.includes('Memory Bank'))
            assert.ok(prompt.includes('product.md'))
            assert.ok(prompt.includes('structure.md'))
            assert.ok(prompt.includes('tech.md'))
            assert.ok(prompt.includes('guidelines.md'))
        })
    })

    describe('getMemoryBankSummary', () => {
        it('should return formatted summary', () => {
            const summary = controller.getMemoryBankSummary()

            assert.ok(typeof summary === 'string')
            assert.ok(summary.includes('📁'))
            assert.ok(summary.includes('🧠'))
            assert.ok(summary.includes('.amazonq/rules/memory-bank'))
            assert.ok(summary.includes('product.md'))
            assert.ok(summary.includes('structure.md'))
            assert.ok(summary.includes('tech.md'))
            assert.ok(summary.includes('guidelines.md'))
        })
    })

    describe('logProgress', () => {
        it('should log progress with correct format', () => {
            controller.logProgress('test step', 'test message', false)

            sinon.assert.calledOnce(mockLogging.info)
            sinon.assert.calledWith(mockLogging.info, '[Memory Bank] 🔄 test step: test message')
        })

        it('should log completed progress with checkmark', () => {
            controller.logProgress('test step', 'test message', true)

            sinon.assert.calledOnce(mockLogging.info)
            sinon.assert.calledWith(mockLogging.info, '[Memory Bank] ✅ test step: test message')
        })
    })
})
