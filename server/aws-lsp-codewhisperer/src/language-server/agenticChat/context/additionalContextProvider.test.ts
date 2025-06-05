import * as path from 'path'
import * as sinon from 'sinon'
import { URI } from 'vscode-uri'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'
import { AdditionalContextPrompt } from 'local-indexing'
import { AdditionalContextProvider } from './addtionalContextProvider'
import { getUserPromptsDirectory } from './contextUtils'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'
import { workspaceUtils } from '@aws/lsp-core'

describe('AdditionalContextProvider', () => {
    let provider: AdditionalContextProvider
    let testFeatures: TestFeatures
    let fsExistsStub: sinon.SinonStub
    let getContextCommandPromptStub: sinon.SinonStub
    let fsReadDirStub: sinon.SinonStub
    let localProjectContextControllerInstanceStub: sinon.SinonStub

    beforeEach(() => {
        testFeatures = new TestFeatures()
        fsExistsStub = sinon.stub()
        fsReadDirStub = sinon.stub()
        testFeatures.workspace.fs.exists = fsExistsStub
        testFeatures.workspace.fs.readdir = fsReadDirStub
        getContextCommandPromptStub = sinon.stub()
        provider = new AdditionalContextProvider(testFeatures.workspace)
        localProjectContextControllerInstanceStub = sinon.stub(LocalProjectContextController, 'getInstance').resolves({
            getContextCommandPrompt: getContextCommandPromptStub,
        } as unknown as LocalProjectContextController)
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('getAdditionalContext', () => {
        it('should return empty array when no additional context commands', async () => {
            const triggerContext = {
                workspaceFolder: null,
                context: [],
                workspaceRulesCount: 0,
            }

            fsExistsStub.resolves(false)
            getContextCommandPromptStub.resolves([])

            const result = await provider.getAdditionalContext(triggerContext)

            assert.deepStrictEqual(result, [])
        })

        it('should process workspace rules and context correctly', async () => {
            const mockWorkspaceFolder = {
                uri: URI.file('/workspace').toString(),
                name: 'test',
            }
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])
            const triggerContext = {
                workspaceFolder: mockWorkspaceFolder,
                context: [],
                workspaceRulesCount: 0,
            }

            fsExistsStub.resolves(true)
            fsReadDirStub.resolves([{ name: 'rule1.md', isFile: () => true }])

            getContextCommandPromptStub.resolves([
                {
                    name: 'Test Rule',
                    description: 'Test Description',
                    content: 'Test Content',
                    filePath: '/workspace/.amazonq/rules/rule1.md',
                    relativePath: '.amazonq/rules/rule1.md',
                    startLine: 1,
                    endLine: 10,
                },
            ])

            const result = await provider.getAdditionalContext(triggerContext)

            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].name, 'Test Rule')
            assert.strictEqual(result[0].type, 'rule')
        })
    })

    describe('getFileListFromContext', () => {
        it('should create correct file list for symbol entries', () => {
            const mockContext = [
                {
                    relativePath: 'test/path.ts',
                    name: 'symbol',
                    startLine: 1,
                    endLine: 10,
                    type: 'code',
                    description: 'test',
                    innerContext: 'test',
                    path: '1/test/path.ts',
                },
            ]

            const result = provider.getFileListFromContext(mockContext)
            const fileDetail = result.details ? result.details['test/path.ts'] : undefined
            const lineRange = fileDetail?.lineRanges ? fileDetail.lineRanges[0] : undefined

            assert.deepStrictEqual(result.filePaths, ['test/path.ts'])
            assert.deepStrictEqual(lineRange, {
                first: 1,
                second: 10,
            })
        })

        it('should handle non-symbol entries with -1 line ranges', () => {
            const mockContext = [
                {
                    relativePath: 'test/path.ts',
                    name: 'not-symbol',
                    startLine: 1,
                    endLine: 10,
                    type: 'file',
                    description: 'test',
                    innerContext: 'test',
                    path: '1/test/path.ts',
                },
            ]

            const result = provider.getFileListFromContext(mockContext)
            const fileDetail = result.details ? result.details['test/path.ts'] : undefined
            const lineRange = fileDetail?.lineRanges ? fileDetail.lineRanges[0] : undefined

            assert.deepStrictEqual(lineRange, {
                first: -1,
                second: -1,
            })
        })
    })

    describe('getContextType', () => {
        const mockPrompt: AdditionalContextPrompt = {
            filePath: path.join('/workspace', '.amazonq', 'rules', 'test.md'),
            relativePath: path.join('.amazonq', 'rules', 'test.md'),
            content: 'Sample content',
            name: 'Test Rule',
            description: 'Test Description',
            startLine: 1,
            endLine: 10,
        }
        it('should identify rule type for files in .amazonq/rules', () => {
            const result = provider.getContextType(mockPrompt)

            assert.strictEqual(result, 'rule')
        })

        it('should identify prompt type for files in user prompts directory', () => {
            const userPromptsDir = getUserPromptsDirectory()
            const mockPrompt = {
                filePath: path.join(userPromptsDir, 'test.md'),
                relativePath: 'test.md',
                content: 'Sample content',
                name: 'Test Prompt',
                description: 'Test Description',
                startLine: 1,
                endLine: 10,
            }

            const result = provider.getContextType(mockPrompt)

            assert.strictEqual(result, 'prompt')
        })

        it('should return file type for non-prompt files', () => {
            const mockPrompt = {
                filePath: 'test.ts',
                relativePath: 'test.ts',
                content: 'Sample content',
                name: 'Test File',
                description: 'Test Description',
                startLine: 1,
                endLine: 10,
            }

            const result = provider.getContextType(mockPrompt)

            assert.strictEqual(result, 'file')
        })
    })

    describe('collectWorkspaceRules', () => {
        it('should return empty array when no workspace folder', async () => {
            // Mock empty workspace folders
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns([])

            const result = await provider.collectWorkspaceRules()

            assert.deepStrictEqual(result, [])
        })

        it('should return rules files when they exist', async () => {
            // Mock workspace folders
            sinon.stub(workspaceUtils, 'getWorkspaceFolderPaths').returns(['/workspace'])

            fsExistsStub.resolves(true)
            fsReadDirStub.resolves([
                { name: 'rule1.md', isFile: () => true },
                { name: 'rule2.md', isFile: () => true },
            ])

            const result = await provider.collectWorkspaceRules()

            assert.deepStrictEqual(result, [
                {
                    workspaceFolder: '/workspace',
                    type: 'file',
                    relativePath: path.join('.amazonq', 'rules', 'rule1.md'),
                    id: '',
                },
                {
                    workspaceFolder: '/workspace',
                    type: 'file',
                    relativePath: path.join('.amazonq', 'rules', 'rule2.md'),
                    id: '',
                },
            ])
        })
    })
})
