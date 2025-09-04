/**
 * Copied from chat/contexts/triggerContext.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

import * as assert from 'assert'
import * as sinon from 'sinon'
import { MemoryBankController } from './memoryBankController'
import { MemoryBankPrompts } from './memoryBankPrompts'

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

    describe('prompt delegation', () => {
        it('should delegate prompt generation to MemoryBankPrompts class', () => {
            // Test that controller properly delegates to MemoryBankPrompts
            // This ensures clean separation of concerns
            const filesString = 'test.ts has 100 lines and a mean lexical dissimilarity of 0.85'
            const prompt = MemoryBankPrompts.getFileRankingPrompt(filesString, 15)

            assert.ok(typeof prompt === 'string')
            assert.ok(prompt.length > 100)
            assert.ok(prompt.includes('JSON list'))
            assert.ok(prompt.includes('15'))
            assert.ok(prompt.includes(filesString))
        })
    })

    describe('Science Pipeline Methods', () => {
        it('should delegate file ranking prompt to MemoryBankPrompts', () => {
            const filesString = 'test.ts has 100 lines and a mean lexical dissimilarity of 0.85'
            const prompt = MemoryBankPrompts.getFileRankingPrompt(filesString, 15)

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

        it('should provide TF-IDF analysis methods', () => {
            // Test that the science document methods are available
            assert.ok(typeof controller.discoverAllSourceFiles === 'function')
            assert.ok(typeof controller.calculateFileLineCount === 'function')
            assert.ok(typeof controller.calculateLexicalDissimilarity === 'function')
            assert.ok(typeof controller.executeGuidelinesGenerationPipeline === 'function')
        })

        it('should format files for ranking correctly', () => {
            const files = [
                { path: 'test1.ts', size: 100, dissimilarity: 0.85 },
                { path: 'test2.ts', size: 200, dissimilarity: 0.75 },
            ]

            const formatted = controller.formatFilesForRanking(files)

            assert.ok(typeof formatted === 'string')
            assert.ok(formatted.includes('test1.ts has 100 lines'))
            assert.ok(formatted.includes('test2.ts has 200 lines'))
            assert.ok(formatted.includes('0.850000'))
            assert.ok(formatted.includes('0.750000'))
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
