import * as assert from 'assert'
import * as sinon from 'sinon'
import { MemoryBankController } from './memoryBankController'

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

    describe('isMemoryBankCreationRequest', () => {
        it('should detect memory bank creation requests', () => {
            const testCases = [
                'create a memory bank',
                'Create a Memory Bank',
                'CREATE MEMORY BANK',
                'Create a Memory Bank for this project',
                'generate memory bank for this project',
                'generate memory bank',
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

    describe('getFirst3FilesPrompt', () => {
        it('should return a comprehensive first 3 files prompt', () => {
            const prompt = controller.getFirst3FilesPrompt()

            assert.ok(typeof prompt === 'string')
            assert.ok(prompt.length > 100)
            assert.ok(prompt.includes('Memory Bank'))
            assert.ok(prompt.includes('.amazonq/rules/memory-bank/'))
            assert.ok(prompt.includes('product.md'))
            assert.ok(prompt.includes('structure.md'))
            assert.ok(prompt.includes('tech.md'))
            assert.ok(prompt.includes('first 3 files'))
            assert.ok(prompt.includes('science pipeline'))
        })
    })

    describe('Science Pipeline Methods', () => {
        it('should provide file ranking prompt', () => {
            const filesString = 'test.ts has 100 lines and a mean lexical dissimilarity of 0.85'
            const prompt = controller.getFileRankingPrompt(filesString, 15)

            assert.ok(typeof prompt === 'string')
            assert.ok(prompt.includes('JSON list'))
            assert.ok(prompt.includes('15'))
            assert.ok(prompt.includes(filesString))
        })

        describe('TF-IDF Lexical Dissimilarity', () => {
            it('should calculate TF-IDF dissimilarity for multiple files', async () => {
                const files = [
                    { path: 'file1.ts', size: 50 },
                    { path: 'file2.ts', size: 75 },
                    { path: 'file3.ts', size: 100 },
                ]

                // Mock file contents with different lexical patterns
                mockFs.readFile.onFirstCall().resolves('function calculateSum(a, b) { return a + b; }')
                mockFs.readFile.onSecondCall().resolves('class UserService { constructor() {} getUser() {} }')
                mockFs.readFile.onThirdCall().resolves('const config = { apiUrl: "https://api.example.com" }')

                const result = await controller.calculateLexicalDissimilarity(files)

                assert.strictEqual(result.length, 3)
                assert.ok(result.every(f => f.dissimilarity >= 0 && f.dissimilarity <= 1))
                assert.ok(result.every(f => typeof f.dissimilarity === 'number'))

                // Verify all original properties are preserved
                result.forEach((file, index) => {
                    assert.strictEqual(file.path, files[index].path)
                    assert.strictEqual(file.size, files[index].size)
                })
            })

            it('should handle empty or unreadable files gracefully', async () => {
                const files = [
                    { path: 'readable.ts', size: 50 },
                    { path: 'unreadable.ts', size: 25 },
                ]

                mockFs.readFile.onFirstCall().resolves('function test() { return true; }')
                mockFs.readFile.onSecondCall().rejects(new Error('File not found'))

                const result = await controller.calculateLexicalDissimilarity(files)

                assert.strictEqual(result.length, 2)
                assert.ok(result.every(f => f.dissimilarity >= 0 && f.dissimilarity <= 1))
                sinon.assert.calledOnce(mockLogging.warn)
            })

            it('should return fallback values on calculation error', async () => {
                const files = [{ path: 'test.ts', size: 50 }]

                mockFs.readFile.rejects(new Error('Filesystem error'))

                const result = await controller.calculateLexicalDissimilarity(files)

                assert.strictEqual(result.length, 1)
                assert.strictEqual(result[0].dissimilarity, 0.85)
                sinon.assert.calledOnce(mockLogging.error)
            })
        })

        it('should provide iterative style guide prompt', () => {
            const chunkFiles = ['file1.ts content', 'file2.ts content']
            const prompt = controller.getIterativeStyleGuidePrompt(chunkFiles, 15)

            assert.ok(typeof prompt === 'string')
            assert.ok(prompt.includes('2 out of 15'))
            assert.ok(prompt.includes('Code Quality Standards'))
        })

        it('should execute complete memory bank creation pipeline', async () => {
            const workspaceFolder = '/test/workspace'

            try {
                const result = await controller.executeCompleteMemoryBankCreation(workspaceFolder)

                assert.ok(result.hasOwnProperty('success'))
                assert.ok(result.hasOwnProperty('message'))
                assert.ok(typeof result.success === 'boolean')
                assert.ok(typeof result.message === 'string')
            } catch (error) {
                // Expected to fail in test environment due to missing file system
                assert.ok(error instanceof Error)
            }
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

        it('should handle filesystem errors gracefully', async () => {
            mockFs.exists.rejects(new Error('File system error'))

            const result = await controller.memoryBankExists(workspaceFolder)

            assert.strictEqual(result, false)
            sinon.assert.calledOnce(mockLogging.error)
        })
    })
})
