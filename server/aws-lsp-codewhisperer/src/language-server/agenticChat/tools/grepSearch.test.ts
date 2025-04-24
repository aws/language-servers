import { strict as assert } from 'assert'
import * as mockfs from 'mock-fs'
import * as sinon from 'sinon'
import { GrepSearch } from './grepSearch'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { URI } from 'vscode-uri'
import { InitializeParams } from '@aws/language-server-runtimes/protocol'
import * as path from 'path'
import * as childProcess from '@aws/lsp-core/out/util/processUtils'

describe('GrepSearch Tool', () => {
    let features: TestFeatures
    const workspaceFolder = '/workspace/folder'
    let mockChildProcess: sinon.SinonStub

    before(function () {
        features = new TestFeatures()
        features.lsp.getClientInitializeParams.returns({
            workspaceFolders: [{ uri: URI.file(workspaceFolder).toString(), name: 'test' }],
        } as InitializeParams)
    })

    beforeEach(() => {
        mockfs.restore()
        // Create a mock file system structure for testing
        mockfs({
            [workspaceFolder]: {
                'file1.txt': 'This is a test file with searchable content',
                'file2.js': 'function test() { return "searchable"; }',
                node_modules: {
                    'excluded.js': 'This should be excluded by default',
                },
                subfolder: {
                    'file3.ts': 'const searchable = "found in subfolder";',
                },
            },
        })

        // Mock the ChildProcess class
        mockChildProcess = sinon.stub(childProcess, 'ChildProcess')
        mockChildProcess.returns({
            run: sinon.stub().resolves({
                exitCode: 0,
                stdout: `${workspaceFolder}/file1.txt:1:This is a test file with searchable content
${workspaceFolder}/file2.js:1:function test() { return "searchable"; }
${workspaceFolder}/subfolder/file3.ts:1:const searchable = "found in subfolder";`,
            }),
        })
    })

    afterEach(() => {
        mockfs.restore()
        sinon.restore()
    })

    it('fails validation if the query is empty', async () => {
        const grepSearch = new GrepSearch(features)
        await assert.rejects(
            grepSearch.validate({ query: '   ' }),
            /Grep search query cannot be empty/i,
            'Expected an error for empty query'
        )
    })

    it('uses workspace folder as default path if none provided', async () => {
        const grepSearch = new GrepSearch(features)
        const result = await grepSearch.invoke({ query: 'searchable' })

        assert.strictEqual(result.output.kind, 'json')
        const content = result.output.content as any
        assert.ok('totalMatchCount' in content)
        assert.ok('fileMatches' in content)
        assert.equal(content.totalMatchCount, 3)
        assert.equal(content.fileMatches.length, 3)
    })

    it('processes ripgrep output correctly', async () => {
        // Set up specific mock output
        mockChildProcess.returns({
            run: sinon.stub().resolves({
                exitCode: 0,
                stdout: `${workspaceFolder}/file1.txt:1:match in line 1
${workspaceFolder}/file1.txt:3:match in line 3
${workspaceFolder}/file2.js:5:another match`,
            }),
        })

        const grepSearch = new GrepSearch(features)
        const result = await grepSearch.invoke({ query: 'match' })

        assert.strictEqual(result.output.kind, 'json')
        const content = result.output.content as any

        assert.equal(content.totalMatchCount, 3)
        assert.equal(content.fileMatches.length, 2)

        // Check file1.txt matches
        const file1Matches = content.fileMatches.find((f: any) => f.filePath === `${workspaceFolder}/file1.txt`)
        assert.ok(file1Matches)
        assert.equal(file1Matches.matchCount, 2)
        assert.equal(file1Matches.matches['1'], 'match in line 1')
        assert.equal(file1Matches.matches['3'], 'match in line 3')

        // Check file2.js matches
        const file2Matches = content.fileMatches.find((f: any) => f.filePath === `${workspaceFolder}/file2.js`)
        assert.ok(file2Matches)
        assert.equal(file2Matches.matchCount, 1)
        assert.equal(file2Matches.matches['5'], 'another match')
    })

    it('handles empty search results', async () => {
        mockChildProcess.returns({
            run: sinon.stub().resolves({
                exitCode: 1, // ripgrep returns 1 when no matches found
                stdout: '',
            }),
        })

        const grepSearch = new GrepSearch(features)
        const result = await grepSearch.invoke({ query: 'nonexistent' })

        assert.strictEqual(result.output.kind, 'json')
        const content = result.output.content as any

        assert.equal(content.totalMatchCount, 0)
        assert.equal(content.fileMatches.length, 0)
    })

    it('respects case sensitivity option', async () => {
        const grepSearch = new GrepSearch(features)
        await grepSearch.invoke({ query: 'test', caseSensitive: true })

        // Verify that -i flag is NOT included when caseSensitive is true
        const args = mockChildProcess.firstCall.args[1]
        assert.ok(!args.includes('-i'))
    })

    it('applies include patterns correctly', async () => {
        const grepSearch = new GrepSearch(features)
        await grepSearch.invoke({
            query: 'test',
            includePattern: '*.js,*.ts',
        })

        // Verify that the ChildProcess constructor was called
        assert.ok(mockChildProcess.called, 'ChildProcess constructor should be called')

        // Get all arguments passed to the constructor
        const allArgs = mockChildProcess.firstCall.args

        // The second argument should be the array of command line arguments
        const args = allArgs[2]

        // Check if --glob is included in the arguments
        assert.ok(Array.isArray(args), 'args should be an array')
        assert.ok(args.includes('--glob'), '--glob should be included in arguments')

        // Find all glob patterns
        const globIndices = []
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--glob') {
                globIndices.push(i)
            }
        }

        // Check if at least one of the glob patterns is for include (not starting with !)
        const hasIncludePattern = globIndices.some(
            i => i + 1 < args.length && (args[i + 1] === '*.js' || args[i + 1] === '*.ts')
        )

        assert.ok(hasIncludePattern, 'Should have include pattern for *.js or *.ts')
    })

    it('applies exclude patterns correctly', async () => {
        const grepSearch = new GrepSearch(features)
        await grepSearch.invoke({
            query: 'test',
            excludePattern: '*.min.js,*.d.ts',
        })

        // Verify that the ChildProcess constructor was called
        assert.ok(mockChildProcess.called, 'ChildProcess constructor should be called')

        // Get all arguments passed to the constructor
        const allArgs = mockChildProcess.firstCall.args

        // The second argument should be the array of command line arguments
        const args = allArgs[2]

        // Check if --glob is included in the arguments
        assert.ok(Array.isArray(args), 'args should be an array')
        assert.ok(args.includes('--glob'), '--glob should be included in arguments')

        // Find all glob patterns
        const globIndices = []
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--glob') {
                globIndices.push(i)
            }
        }

        // Check if at least one of the glob patterns is for exclude (not starting with !)
        const hasExcludePattern = globIndices.some(
            i => i + 1 < args.length && (args[i + 1] === '!*.min.js' || args[i + 1] === '!*.d.ts')
        )

        assert.ok(hasExcludePattern, 'Should have exclude pattern for *.js or *.ts')
    })
})
