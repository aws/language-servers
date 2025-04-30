import { expect } from 'chai'
import { getWorkspaceFolders } from './initializeUtils'
import { InitializeParams, WorkspaceFolder } from '@aws/language-server-runtimes/protocol'
import { URI } from 'vscode-uri'
import * as path from 'path'
import assert = require('assert')
import sinon = require('sinon')
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

describe('initializeUtils', () => {
    let logging: Features['logging']

    before(function () {
        logging = new TestFeatures().logging
    })

    describe('getWorkspaceFolders', () => {
        const sampleWorkspaceUri = 'file:///path/to/folder'
        const sampleWorkspaceName = 'folder'
        const sampleWorkspaceFolder: WorkspaceFolder = {
            name: sampleWorkspaceName,
            uri: sampleWorkspaceUri,
        }

        const createParams = (params: Partial<InitializeParams>) => params as InitializeParams

        it('should return workspaceFolders when provided', () => {
            const workspaceFolders: WorkspaceFolder[] = [
                sampleWorkspaceFolder,
                { name: 'folder2', uri: 'file:///path/to/folder2' },
            ]
            const params = createParams({ workspaceFolders })
            const result = getWorkspaceFolders(logging, params)

            assert.deepStrictEqual(result, workspaceFolders)
        })

        describe('should create workspace folder from rootUri when workspaceFolders is not provided', () => {
            const invalidWorkspaceFolderCases = [
                ['no workspaceFolder param', { rootUri: sampleWorkspaceUri }],
                ['empty workspaceFolder param params', { WorkspaceFolders: [], rootUri: sampleWorkspaceUri }],
            ] as const

            invalidWorkspaceFolderCases.forEach(([name, input]) => {
                it(`should return root uri for ${name}`, () => {
                    const params = createParams(input)
                    const result = getWorkspaceFolders(logging, params)
                    assert.deepStrictEqual(result, [sampleWorkspaceFolder])
                })
            })
            const params = createParams({ rootUri: sampleWorkspaceUri })
            const result = getWorkspaceFolders(logging, params)

            assert.deepStrictEqual(result, [sampleWorkspaceFolder])
        })

        it('should create workspace folder from rootPath when neither workspaceFolders nor rootUri is provided', () => {
            const rootPath = '/path/to/folder'
            const params = createParams({ rootPath: rootPath })
            const result = getWorkspaceFolders(logging, params)

            assert.deepStrictEqual(result, [sampleWorkspaceFolder])
        })

        it('should use "workspace" as folder name when URI basename is empty', () => {
            const rootUri = 'file:///'
            const params = createParams({ rootUri })
            const result = getWorkspaceFolders(logging, params)

            assert.deepStrictEqual(result, [{ name: 'workspace', uri: rootUri }])
        })

        it('should handle Windows paths correctly', () => {
            const rootPath = 'C:\\Users\\test\\folder'
            const pathUri = URI.parse(rootPath).toString()
            const params = createParams({ rootPath })

            const result = getWorkspaceFolders(logging, params)

            const expectedName = path.basename(URI.parse(pathUri).fsPath)
            assert.deepStrictEqual(result, [{ name: expectedName, uri: pathUri }])
        })

        it('should handle rootUri with special characters', () => {
            const rootUri = 'file:///path/to/special%20project'
            const decodedPath = URI.parse(rootUri).path
            const folderName = path.basename(decodedPath)

            const params = createParams({ rootUri })
            const result = getWorkspaceFolders(logging, params)

            assert.deepStrictEqual(result, [{ name: folderName, uri: rootUri }])
            assert.equal('special project', result[0].name)
        })

        describe('should return empty workspaceFolder array', () => {
            const emptyArrayCases = [
                ['no params', {}],
                ['undefined params', undefined as unknown as InitializeParams],
                ['null params', null as unknown as InitializeParams],
                ['empty workspaceFolders', { workspaceFolders: [] }],
            ] as const

            emptyArrayCases.forEach(([name, input]) => {
                it(`should return empty array for ${name}`, () => {
                    const result = getWorkspaceFolders(logging, input as InitializeParams)
                    assert.equal(result.length, 0)
                })
            })
        })

        it('should handle errors and return empty array', () => {
            const basenameStub = sinon.stub(path, 'basename').throws(new Error('Test error'))

            try {
                const badParams = createParams({ rootUri: sampleWorkspaceUri })
                const result = getWorkspaceFolders(logging, badParams)

                assert.deepStrictEqual(result, [])
            } finally {
                basenameStub.restore()
            }
        })
    })
})
