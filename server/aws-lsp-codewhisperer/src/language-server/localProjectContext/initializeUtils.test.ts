import { expect } from 'chai'
import { getWorkspaceFolders } from './initializeUtils'
import { InitializeParams, WorkspaceFolder } from '@aws/language-server-runtimes/protocol'
import { URI } from 'vscode-uri'
import * as path from 'path'
import assert = require('assert')

describe('workspaceUtils', () => {
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
            const result = getWorkspaceFolders(params)

            assert.deepStrictEqual(result, workspaceFolders)
        })

        it('should create workspace folder from rootUri when workspaceFolders is not provided', () => {
            const params = createParams({ rootUri: sampleWorkspaceUri })
            const result = getWorkspaceFolders(params)

            assert.deepStrictEqual(result, [sampleWorkspaceFolder])
        })

        it('should create workspace folder from rootPath when neither workspaceFolders nor rootUri is provided', () => {
            const rootPath = '/path/to/folder'
            const params = createParams({ rootPath: rootPath })
            const result = getWorkspaceFolders(params)

            assert.deepStrictEqual(result, [sampleWorkspaceFolder])
        })

        it('should use "workspace" as folder name when URI basename is empty', () => {
            const rootUri = 'file:///'
            const params = createParams({ rootUri })
            const result = getWorkspaceFolders(params)

            assert.deepStrictEqual(result, [{ name: 'workspace', uri: rootUri }])
        })

        it('should handle Windows paths correctly', () => {
            const rootPath = 'C:\\Users\\test\\folder'
            const pathUri = URI.parse(rootPath).toString()
            const params = createParams({ rootPath })

            const result = getWorkspaceFolders(params)

            assert.deepStrictEqual(result, [{ name: sampleWorkspaceName, uri: pathUri }])
        })

        it('should handle rootUri with special characters', () => {
            const rootUri = 'file:///path/to/special%20project'
            const decodedPath = URI.parse(rootUri).path
            const folderName = path.basename(decodedPath)

            const params = createParams({ rootUri })
            const result = getWorkspaceFolders(params)

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
                    const result = getWorkspaceFolders(input as InitializeParams)
                    assert.equal(result.length, 0)
                })
            })
        })
    })
})
