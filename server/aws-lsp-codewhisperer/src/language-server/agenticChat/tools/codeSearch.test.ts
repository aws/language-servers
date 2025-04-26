import * as assert from 'assert'
import { CodeSearch, CodeSearchOutput } from './codeSearch'
import { testFolder } from '@aws/lsp-core'
import * as path from 'path'
import * as fs from 'fs/promises'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'
import { Chunk } from 'local-indexing'
import { stub, restore, SinonStub } from 'sinon'

describe('CodeSearch Tool', () => {
    let tempFolder: testFolder.TestFolder
    let testFeatures: TestFeatures
    let mockLocalProjectContextController: Partial<LocalProjectContextController>
    let getInstanceStub: SinonStub

    before(async () => {
        testFeatures = new TestFeatures()
        testFeatures.workspace.fs.exists = path =>
            fs.access(path).then(
                () => true,
                () => false
            )
        tempFolder = await testFolder.TestFolder.create()

        mockLocalProjectContextController = {
            isEnabled: true,
            queryVectorIndex: stub().resolves([]),
        }

        // Stub the getInstance method
        getInstanceStub = stub(LocalProjectContextController, 'getInstance').resolves(
            mockLocalProjectContextController as LocalProjectContextController
        )
    })

    after(async () => {
        await tempFolder.delete()
        restore() // Restore all stubbed methods
    })

    it('invalidates empty query', async () => {
        const codeSearch = new CodeSearch(testFeatures)
        await assert.rejects(
            codeSearch.validate({ query: '' }),
            /Code search query cannot be empty/i,
            'Expected an error about empty query'
        )
    })

    it('returns empty results when no matches found', async () => {
        const codeSearch = new CodeSearch(testFeatures)
        const result = await codeSearch.invoke({ query: 'nonexistent code' })

        assert.strictEqual(result.output.kind, 'text')
        assert.strictEqual(result.output.content, 'No code matches found for code search.')
    })

    it('returns formatted results when matches found', async () => {
        // Create mock chunks that would be returned from vector search
        const mockChunks: Chunk[] = [
            {
                content: 'function testFunction() { return true; }',
                filePath: path.join(tempFolder.path, 'test.js'),
                relativePath: 'test.js',
                startLine: 1,
                endLine: 3,
                programmingLanguage: 'javascript',
                id: '',
                index: 0,
                vec: [],
            },
        ]

        // Configure the mock to return our test chunks
        ;(mockLocalProjectContextController.queryVectorIndex as SinonStub).resolves(mockChunks)

        const codeSearch = new CodeSearch(testFeatures)
        const result = await codeSearch.invoke({ query: 'testFunction' })

        assert.strictEqual(result.output.kind, 'json')
        const content = result.output.content as CodeSearchOutput[]
        assert.strictEqual(Array.isArray(content), true)
        assert.strictEqual(content.length, 1)
        assert.strictEqual(content[0].text, 'function testFunction() { return true; }')
        assert.strictEqual(content[0].relativeFilePath, 'test.js')
        assert.strictEqual(content[0].startLine, 1)
        assert.strictEqual(content[0].endLine, 3)
        assert.strictEqual(content[0].programmingLanguage?.languageName, 'javascript')
    })

    it('handles chunks without programming language', async () => {
        // Create mock chunks without programming language
        const mockChunks: Chunk[] = [
            {
                content: 'Some plain text content',
                filePath: path.join(tempFolder.path, 'readme.txt'),
                relativePath: 'readme.txt',
                startLine: 1,
                endLine: 1,
                id: '',
                index: 0,
                vec: [],
            },
        ]

        // Configure the mock to return our test chunks
        ;(mockLocalProjectContextController.queryVectorIndex as SinonStub).resolves(mockChunks)

        const codeSearch = new CodeSearch(testFeatures)
        const result = await codeSearch.invoke({ query: 'plain text' })

        assert.strictEqual(result.output.kind, 'json')
        const content = result.output.content as CodeSearchOutput[]
        assert.strictEqual(content.length, 1)
        assert.strictEqual(content[0].text, 'Some plain text content')
        assert.strictEqual(content[0].relativeFilePath, 'readme.txt')
        assert.strictEqual(content[0].programmingLanguage, undefined)
    })

    it('uses default workspace folder when path not provided', async () => {
        const codeSearch = new CodeSearch(testFeatures)
        await codeSearch.invoke({ query: 'test query' })

        // Verify that queryVectorIndex was called
        assert.strictEqual((mockLocalProjectContextController.queryVectorIndex as SinonStub).called, true)
    })

    it('handles errors from LocalProjectContextController', async () => {
        // Configure the mock to throw an error
        ;(mockLocalProjectContextController.queryVectorIndex as SinonStub).rejects(new Error('Test error'))

        const codeSearch = new CodeSearch(testFeatures)
        await assert.rejects(
            codeSearch.invoke({ query: 'error test' }),
            /Failed to perform code search/,
            'Expected an error when vector search fails'
        )
    })

    it('provides correct queue description', async () => {
        const codeSearch = new CodeSearch(testFeatures)

        // Create a mock WritableStream
        let capturedDescription = ''
        const mockWriter = {
            write: async (content: string) => {
                capturedDescription = content
                return Promise.resolve()
            },
            close: async () => Promise.resolve(),
            releaseLock: () => {},
        }
        const mockStream = {
            getWriter: () => mockWriter,
        } as unknown as WritableStream

        await codeSearch.queueDescription({ query: 'test query' }, mockStream, true)
        assert.strictEqual(capturedDescription, 'Performing code search for "test query" in ')
    })

    it('returns correct tool specification', () => {
        const codeSearch = new CodeSearch(testFeatures)
        const spec = codeSearch.getSpec()

        assert.strictEqual(spec.name, 'codeSearch')
        assert.ok(spec.description.includes('Find snippets of code'))
        assert.deepStrictEqual(spec.inputSchema.required, ['query'])
    })
})
