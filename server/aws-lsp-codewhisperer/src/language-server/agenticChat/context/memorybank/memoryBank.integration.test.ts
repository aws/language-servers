import * as assert from 'assert'
import * as path from 'path'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { MemoryBankController } from './memoryBankController'
import { MEMORY_BANK_DIRECTORY, MEMORY_BANK_FILES } from './memoryBankTypes'

describe('Memory Bank Integration', () => {
    let features: TestFeatures
    let controller: MemoryBankController
    let tempWorkspace: string

    beforeEach(async () => {
        features = new TestFeatures()
        controller = MemoryBankController.getInstance(features)
        tempWorkspace = '/tmp/test-workspace'

        // Reset singleton for each test
        ;(MemoryBankController as any).instance = undefined
        controller = MemoryBankController.getInstance(features)
    })

    describe('Memory Bank Creation Flow', () => {
        it('should detect memory bank creation requests', () => {
            const testCases = [
                'create a memory bank',
                'Create a Memory Bank for this project',
                'generate memory bank',
                'build memory bank',
            ]

            testCases.forEach(prompt => {
                const isDetected = controller.isMemoryBankCreationRequest(prompt)
                assert.strictEqual(isDetected, true, `Should detect: "${prompt}"`)
            })
        })

        it('should not detect non-memory bank requests', () => {
            const testCases = ['create a file', 'help me with code', 'memory usage optimization']

            testCases.forEach(prompt => {
                const isDetected = controller.isMemoryBankCreationRequest(prompt)
                assert.strictEqual(isDetected, false, `Should not detect: "${prompt}"`)
            })
        })

        it('should return comprehensive creation prompt', () => {
            const prompt = controller.getMemoryBankCreationPrompt()

            assert.ok(prompt.includes('Memory Bank'))
            assert.ok(prompt.includes('.amazonq/rules/memory-bank/'))
            assert.ok(prompt.includes('product.md'))
            assert.ok(prompt.includes('structure.md'))
            assert.ok(prompt.includes('tech.md'))
            assert.ok(prompt.includes('guidelines.md'))
            assert.ok(prompt.includes('list_directory'))
            assert.ok(prompt.includes('fs_write'))
        })

        it('should create directory structure', async () => {
            // Mock filesystem
            const mockExists = features.workspace.fs.exists as any
            const mockMkdir = features.workspace.fs.mkdir as any

            mockExists.resolves(false) // directories don't exist
            mockMkdir.resolves()

            const result = await controller.createMemoryBankDirectory(tempWorkspace)

            assert.strictEqual(result, true)

            // Verify directories were created
            const expectedPaths = [
                path.join(tempWorkspace, '.amazonq'),
                path.join(tempWorkspace, '.amazonq', 'rules'),
                path.join(tempWorkspace, '.amazonq', 'rules', 'memory-bank'),
            ]

            expectedPaths.forEach(expectedPath => {
                assert.ok(mockMkdir.calledWith(expectedPath), `Should create directory: ${expectedPath}`)
            })
        })

        it('should validate memory bank creation', async () => {
            // Mock filesystem with existing files
            const mockExists = features.workspace.fs.exists as any
            const mockReadFile = features.workspace.fs.readFile as any

            mockExists.resolves(true)
            mockReadFile.resolves(Buffer.from('# Test Content\n\nThis is test content.'))

            const result = await controller.validateMemoryBankCreation(tempWorkspace)

            assert.strictEqual(result.success, true)
            assert.strictEqual(result.filesCreated.length, 4)
            assert.strictEqual(result.error, undefined)

            // Check file types
            const fileTypes = result.filesCreated.map(f => f.type)
            assert.ok(fileTypes.includes('product'))
            assert.ok(fileTypes.includes('structure'))
            assert.ok(fileTypes.includes('tech'))
            assert.ok(fileTypes.includes('guidelines'))
        })

        it('should handle partial file creation', async () => {
            // Mock filesystem with only some files existing
            const mockExists = features.workspace.fs.exists as any
            const mockReadFile = features.workspace.fs.readFile as any

            // Only product.md and tech.md exist
            mockExists.callsFake((filePath: string) => {
                return filePath.includes('product.md') || filePath.includes('tech.md')
            })
            mockReadFile.resolves(Buffer.from('# Test Content'))

            const result = await controller.validateMemoryBankCreation(tempWorkspace)

            assert.strictEqual(result.success, true)
            assert.strictEqual(result.filesCreated.length, 2)
            assert.ok(result.error?.includes('structure.md was not created'))
            assert.ok(result.error?.includes('guidelines.md was not created'))
        })

        it('should return correct file paths', () => {
            const paths = controller.getMemoryBankFilePaths(tempWorkspace)

            assert.strictEqual(paths.length, 4)

            const expectedPaths = [
                path.join(tempWorkspace, MEMORY_BANK_DIRECTORY, MEMORY_BANK_FILES.PRODUCT),
                path.join(tempWorkspace, MEMORY_BANK_DIRECTORY, MEMORY_BANK_FILES.STRUCTURE),
                path.join(tempWorkspace, MEMORY_BANK_DIRECTORY, MEMORY_BANK_FILES.TECH),
                path.join(tempWorkspace, MEMORY_BANK_DIRECTORY, MEMORY_BANK_FILES.GUIDELINES),
            ]

            expectedPaths.forEach(expectedPath => {
                assert.ok(paths.includes(expectedPath), `Should include path: ${expectedPath}`)
            })
        })

        it('should check memory bank existence correctly', async () => {
            const mockExists = features.workspace.fs.exists as any

            // Test when directory doesn't exist
            mockExists.resolves(false)
            let exists = await controller.memoryBankExists(tempWorkspace)
            assert.strictEqual(exists, false)

            // Test when directory exists but no files
            mockExists.onFirstCall().resolves(true) // directory exists
            mockExists.resolves(false) // no files exist
            exists = await controller.memoryBankExists(tempWorkspace)
            assert.strictEqual(exists, false)

            // Test when directory and at least one file exists
            mockExists.onFirstCall().resolves(true) // directory exists
            mockExists.onSecondCall().resolves(true) // product.md exists
            exists = await controller.memoryBankExists(tempWorkspace)
            assert.strictEqual(exists, true)
        })

        it('should provide helpful summary', () => {
            const summary = controller.getMemoryBankSummary()

            assert.ok(summary.includes('📁'))
            assert.ok(summary.includes('🧠'))
            assert.ok(summary.includes('.amazonq/rules/memory-bank'))
            assert.ok(summary.includes('product.md'))
            assert.ok(summary.includes('structure.md'))
            assert.ok(summary.includes('tech.md'))
            assert.ok(summary.includes('guidelines.md'))
            assert.ok(summary.includes('automatically included'))
        })
    })

    describe('Error Handling', () => {
        it('should handle filesystem errors gracefully', async () => {
            const mockExists = features.workspace.fs.exists as any
            mockExists.rejects(new Error('Filesystem error'))

            const exists = await controller.memoryBankExists(tempWorkspace)
            assert.strictEqual(exists, false)
        })

        it('should handle directory creation errors', async () => {
            const mockExists = features.workspace.fs.exists as any
            const mockMkdir = features.workspace.fs.mkdir as any

            mockExists.resolves(false)
            mockMkdir.rejects(new Error('Permission denied'))

            const result = await controller.createMemoryBankDirectory(tempWorkspace)
            assert.strictEqual(result, false)
        })

        it('should handle validation errors', async () => {
            const mockExists = features.workspace.fs.exists as any
            mockExists.rejects(new Error('Validation error'))

            const result = await controller.validateMemoryBankCreation(tempWorkspace)

            assert.strictEqual(result.success, false)
            assert.strictEqual(result.filesCreated.length, 0)
            assert.ok(result.error?.includes('Validation failed'))
        })
    })
})
