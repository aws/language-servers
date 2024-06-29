import * as assert from 'assert'
import * as path from 'path'
import * as vscode from 'vscode'
import { GitIgnoreFilter } from '../dependencyGraph/gitIgnoreFilter'
import { createTestWorkspace, toFile } from '../testUtils'
import * as Sinon from 'sinon'
import { DependencyGraph } from './dependencyGraph'
import { CsharpDependencyGraph } from './csharpDependencyGraph'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { Logging } from '@aws/language-server-runtimes/server-interface'

describe('filterGitIgnore', () => {
    let csharpDependencyGraph: CsharpDependencyGraph
    const mockedGetWorkspaceFolder = Sinon.mock()
    let mockedLogging: StubbedInstance<Logging>
    const projectPathUri = path.resolve(path.join(__dirname, 'sampleWs'))

    const tempDirPath = path.resolve('\\Temp')
    const mockedFs = {
        copy: Sinon.mock(),
        exists: Sinon.mock(),
        getFileSize: Sinon.mock(),
        getTempDirPath: () => tempDirPath,
        readdir: Sinon.stub(),
        readFile: Sinon.stub(),
        isFile: Sinon.mock(),
        remove: Sinon.mock(),
    }
    const mockedWorkspace = {
        getTextDocument: Sinon.mock(),
        getWorkspaceFolder: mockedGetWorkspaceFolder,
        fs: mockedFs,
    }

    beforeEach(() => {
        mockedGetWorkspaceFolder.reset()
        mockedGetWorkspaceFolder.returns(undefined)
        mockedLogging = stubInterface<Logging>()
        csharpDependencyGraph = new CsharpDependencyGraph(mockedWorkspace, mockedLogging, projectPathUri)
    })

    it('returns all files in the workspace not excluded by gitignore', async function () {
        // these variables are a manual selection of settings for the test in order to test the collectFiles function
        const fileAmount = 3
        const fileNamePrefix = 'file'
        const fileContent = 'test content'

        const workspaceFolder = await createTestWorkspace(fileAmount, { fileNamePrefix, fileContent })

        const writeFile = (pathParts: string[], fileContent: string) => {
            return toFile(fileContent, workspaceFolder.uri.fsPath, ...pathParts)
        }

        Sinon.stub(vscode.workspace, 'workspaceFolders').value([workspaceFolder])

        const gitignoreContent = `file2
            # different formats of prefixes
            /build
            node_modules

            #some comment

            range_file[0-5]
            `
        await writeFile(['.gitignore'], gitignoreContent)

        await writeFile(['build', `ignored1`], fileContent)
        await writeFile(['build', `ignored2`], fileContent)

        await writeFile(['node_modules', `ignored1`], fileContent)
        await writeFile(['node_modules', `ignored2`], fileContent)

        await writeFile([`range_file0`], fileContent)
        await writeFile([`range_file9`], fileContent)

        // const gitignore2 = 'folder1\n'
        // await writeFile(['src', '.gitignore'], gitignore2)
        // await writeFile(['src', 'folder2', 'a.js'], fileContent)

        // const gitignore3 = `negate_test*
        //     !negate_test[0-5]`
        // await writeFile(['src', 'folder3', '.gitignore'], gitignore3)
        // await writeFile(['src', 'folder3', 'negate_test1'], fileContent)
        // await writeFile(['src', 'folder3', 'negate_test6'], fileContent)

        const allFiles = await csharpDependencyGraph.getFiles(workspaceFolder.uri.fsPath)

        console.log('all files: ', allFiles)

        const files = await csharpDependencyGraph.filterOutGitIgnoredFiles(workspaceFolder.uri.fsPath, allFiles)

        console.log('filtered files: ', files)

        // const result = (await collectFiles([workspaceFolder.uri.fsPath], [workspaceFolder], true))
        //     // for some reason, uri created inline differ in subfields, so skipping them from assertion
        //     .map(({ fileUri, zipFilePath, ...r }) => ({ ...r }))

        // result.sort((l, r) => l.relativeFilePath.localeCompare(r.relativeFilePath))

        // non-posix filePath check here is important.
        // assert.deepStrictEqual(
        //     [
        //         {
        //             workspaceFolder,
        //             relativeFilePath: '.gitignore',
        //             fileContent: gitignoreContent,
        //         },
        //         {
        //             workspaceFolder,
        //             relativeFilePath: 'file1',
        //             fileContent: 'test content',
        //         },
        //         {
        //             workspaceFolder,
        //             relativeFilePath: 'file3',
        //             fileContent: 'test content',
        //         },
        //         {
        //             workspaceFolder,
        //             relativeFilePath: 'range_file9',
        //             fileContent: 'test content',
        //         },
        //         // {
        //         //     workspaceFolder,
        //         //     relativeFilePath: path.join('src', '.gitignore'),
        //         //     fileContent: gitignore2,
        //         // },
        //         {
        //             workspaceFolder,
        //             relativeFilePath: path.join('src', 'folder2', 'a.js'),
        //             fileContent: fileContent,
        //         },
        //         // {
        //         //     workspaceFolder,
        //         //     relativeFilePath: path.join('src', 'folder3', '.gitignore'),
        //         //     fileContent: gitignore3,
        //         // },
        //         {
        //             workspaceFolder,
        //             relativeFilePath: path.join('src', 'folder3', 'negate_test1'),
        //             fileContent: fileContent,
        //         },
        //     ] satisfies typeof result,
        //     result
        // )
    })
})
