import { ContextCommandsProvider } from './contextCommandsProvider'
import * as path from 'path'
import * as sinon from 'sinon'
import { URI } from 'vscode-uri'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as assert from 'assert'

describe('ContextCommandsProvider', () => {
    let provider: ContextCommandsProvider
    let testFeatures: TestFeatures
    let fsExistsStub: sinon.SinonStub
    let fsReadDirStub: sinon.SinonStub
    let fsWriteFileStub: sinon.SinonStub

    beforeEach(() => {
        testFeatures = new TestFeatures()
        fsExistsStub = sinon.stub()
        fsReadDirStub = sinon.stub()
        fsWriteFileStub = sinon.stub()

        testFeatures.workspace.fs.exists = fsExistsStub
        testFeatures.workspace.fs.readdir = fsReadDirStub
        testFeatures.workspace.fs.writeFile = fsWriteFileStub
        testFeatures.lsp.window.showDocument = sinon.stub()
        provider = new ContextCommandsProvider(testFeatures)
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('getUserPrompts', () => {
        it('should return empty commands list when directory does not exist', async () => {
            fsExistsStub.resolves(false)
            const result = await provider.getUserPromptsCommand()

            sinon.assert.match(result.commands.length, 1) // Only create prompt button
            sinon.assert.match(result.commands[0].command, 'Create a new prompt')
        })

        it('should return prompt commands when directory exists with files', async () => {
            fsExistsStub.resolves(true)
            fsReadDirStub.resolves([
                { name: 'test1.prompt.md', isFile: () => true },
                { name: 'test2.prompt.md', isFile: () => true },
            ])

            const result = await provider.getUserPromptsCommand()

            sinon.assert.match(result.commands.length, 3) // 2 files + create button
            sinon.assert.match(result.commands[0].command, 'test1.prompt.md')
            sinon.assert.match(result.commands[1].command, 'test2.prompt.md')
        })
    })

    describe('handleCreatePrompt', () => {
        it('should create prompt file with given name', async () => {
            const promptName = 'testPrompt'
            const expectedPath = path.join(provider.getUserPromptsDirectory(), 'testPrompt.prompt.md')

            await provider.handleCreatePrompt(promptName)

            sinon.assert.calledOnceWithExactly(fsWriteFileStub, expectedPath, '')
        })

        it('should create default prompt file when no name provided', async () => {
            const expectedPath = path.join(provider.getUserPromptsDirectory(), 'default.prompt.md')

            await provider.handleCreatePrompt('')

            sinon.assert.calledOnceWithExactly(fsWriteFileStub, expectedPath, '')
        })
    })

    describe('collectWorkspaceRules', () => {
        it('should return empty array when no workspace folder', async () => {
            const triggerContext = {
                relativeFilePath: 'test.ts',
                workspaceFolder: null,
            }

            const result = await provider.collectWorkspaceRules(triggerContext)

            assert.deepStrictEqual(result, [])
        })

        it('should return rules files when they exist', async () => {
            const mockWorkspaceFolder = {
                uri: URI.file('/workspace').toString(),
                name: 'test',
            }
            const triggerContext = {
                relativeFilePath: 'test.ts',
                workspaceFolder: mockWorkspaceFolder,
            }

            fsExistsStub.resolves(true)
            fsReadDirStub.resolves([
                { name: 'rule1.prompt.md', isFile: () => true },
                { name: 'rule2.prompt.md', isFile: () => true },
            ])

            const result = await provider.collectWorkspaceRules(triggerContext)

            assert.deepStrictEqual(result, [
                '/workspace/.amazonq/rules/rule1.prompt.md',
                '/workspace/.amazonq/rules/rule2.prompt.md',
            ])
        })
    })
})
