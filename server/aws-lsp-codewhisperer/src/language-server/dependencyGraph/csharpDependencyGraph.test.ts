import { Logging } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import * as path from 'path'
import * as Sinon from 'sinon'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { CsharpDependencyGraph } from './csharpDependencyGraph'
import { toFile } from '../testUtils'
import { DependencyGraph } from './dependencyGraph'

describe('Test CsharpDependencyGraph', () => {
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
        // mock the filter files function in csharpDependencyGraph to return the string[] files that was passed into it
        // csharpDependencyGraph.filterFiles = Sinon.mock()
    })

    describe('Test getPayloadSizeLimitInBytes', () => {
        it('should return correct payload size', () => {
            const expectedPayloadSize = Math.pow(2, 20)
            assert.strictEqual(csharpDependencyGraph.getPayloadSizeLimitInBytes(), expectedPayloadSize)
        })
    })

    describe('Test getProjectName', () => {
        beforeEach(() => {
            mockedFs.isFile.reset()
            mockedFs.isFile.resolves(false)
        })
        it('should return current folder name for given file path outside workspace folder', async () => {
            mockedFs.isFile.resolves(true)
            assert.strictEqual(
                await csharpDependencyGraph.getProjectName(path.join(projectPathUri, 'sample.cs')),
                'sampleWs'
            )
        })
        it('should return correct project name for given forlder path within workspace folder', async () => {
            const expectedProjectName = 'sampleWs'
            mockedGetWorkspaceFolder.returns({ uri: projectPathUri, name: expectedProjectName })
            assert.strictEqual(
                await csharpDependencyGraph.getProjectName(path.join(projectPathUri, 'src')),
                expectedProjectName
            )
        })
    })

    describe('Test getProjectPath', () => {
        beforeEach(() => {
            mockedFs.isFile.reset()
            mockedFs.isFile.resolves(false)
        })
        it('should not find workspace folder path for given path', async () => {
            const fileFolderPath = path.resolve('\\workspace\\src')
            const fileUri = path.join(fileFolderPath, 'sample.cs')
            mockedFs.isFile.resolves(true)

            const response = await csharpDependencyGraph.getProjectPath(fileUri)
            assert.strictEqual(response, fileFolderPath)
        })
        it('should return project name for within project file', async () => {
            const expectedProjectName = 'sampleWs'

            mockedGetWorkspaceFolder.returns({ uri: projectPathUri, name: expectedProjectName })
            assert.strictEqual(
                await csharpDependencyGraph.getProjectPath(path.join(projectPathUri, 'src')),
                projectPathUri
            )
            mockedGetWorkspaceFolder.reset()
        })
    })

    describe('Test getReadableSizeLimit', () => {
        it('should return size 1 MB', () => {
            assert.strictEqual(csharpDependencyGraph.getReadableSizeLimit(), '1MB')
        })
    })

    describe('Test exceedsSizeLimit', () => {
        it('should not exceed size limit', () => {
            const size = 100
            const expectedResult = false
            assert.strictEqual(csharpDependencyGraph.exceedsSizeLimit(size), expectedResult)
        })
        it('should exceed size limit', () => {
            const size = Math.pow(2, 21)
            const expectedResult = true
            assert.strictEqual(csharpDependencyGraph.exceedsSizeLimit(size), expectedResult)
        })
    })

    describe('Test createNamespaceFilenameMapper', () => {
        beforeEach(() => {
            mockedFs.readdir.reset()
            mockedFs.readFile.reset()
            mockedFs.readdir.callsFake(async dirpath => {
                switch (dirpath) {
                    case projectPathUri:
                        return [
                            {
                                isFile: () => false,
                                isDirectory: () => true,
                                name: 'src',
                                path: projectPathUri,
                            },
                        ]
                    case path.join(projectPathUri, 'src'):
                        return [
                            {
                                isFile: () => true,
                                isDirectory: () => false,
                                name: 'sample.cs',
                                path: path.join(projectPathUri, 'src'),
                            },
                            {
                                isFile: () => true,
                                isDirectory: () => false,
                                name: 'model.cs',
                                path: path.join(projectPathUri, 'src'),
                            },
                        ]
                    default:
                        return []
                }
            })
        })

        it('should create the map with namespace to filepath mapping', async () => {
            mockedFs.readFile.callsFake(async filePath => {
                if (filePath === path.join(projectPathUri, 'src', 'sample.cs')) {
                    return `namespace Amazon.Cw.Utils.Sample {}`
                }
                if (filePath === path.join(projectPathUri, 'src', 'model.cs')) {
                    return `namespace Amazon.Cw.Model {}`
                }
            })
            await csharpDependencyGraph.createNamespaceFilenameMapper(projectPathUri)
            assert.deepStrictEqual(
                csharpDependencyGraph.namespaceToFilepathDirectory,
                new Map([
                    ['Amazon.Cw.Model', new Set([path.join(projectPathUri, 'src', 'model.cs')])],
                    ['Amazon.Cw.Utils.Sample', new Set([path.join(projectPathUri, 'src', 'sample.cs')])],
                ])
            )
        })
        it('should create empty map', async () => {
            csharpDependencyGraph.namespaceToFilepathDirectory = new Map<string, Set<string>>()
            mockedFs.readFile.callsFake(async filePath => {
                if (filePath === path.join(projectPathUri, 'src', 'sample.cs')) {
                    return `using static Amazon.Cw.Sample;`
                }
                if (filePath === path.join(projectPathUri, 'src', 'model.cs')) {
                    return ``
                }
            })
            // repeat the above line but add logic to let it be called at most 2 times

            await csharpDependencyGraph.createNamespaceFilenameMapper(projectPathUri)
            assert.deepStrictEqual(csharpDependencyGraph.namespaceToFilepathDirectory, new Map([]))
        })
    })
    describe('Test searchDependency', () => {
        beforeEach(() => {
            mockedFs.getFileSize.reset()
            mockedFs.readFile.reset()

            csharpDependencyGraph.namespaceToFilepathDirectory = new Map([
                ['Amazon.Cw.Model', new Set([path.join(projectPathUri, 'src', 'model.cs')])],
                ['Amazon.Cw.Utils.Sample', new Set([path.join(projectPathUri, 'src', 'sample.cs')])],
                [
                    'Amazon.Cw.Props',
                    new Set([
                        path.join(projectPathUri, 'src', 'interface', 'model.cs'),
                        path.join(projectPathUri, 'src', 'interface', 'recommendations.cs'),
                    ]),
                ],
            ])
        })

        it('should return source file only for no dependencies', async () => {
            mockedFs.readFile.resolves(`var total = 5 + 4;`)
            mockedFs.getFileSize.resolves({ size: 1000 })
            const filePath = path.join(projectPathUri, 'main.cs')

            const pickedSourceFiles = await csharpDependencyGraph.searchDependency(filePath)
            assert.deepStrictEqual(pickedSourceFiles, new Set([filePath]))
        })

        it("should return source file with its dependecies' file path", async () => {
            mockedFs.getFileSize.atLeast(1).resolves({ size: 1000 })

            mockedFs.readFile.onFirstCall().resolves(
                `using Amazon.Cw.Props;
        var total = 5 + 4;`
            )
            const pickedSourceFiles = await csharpDependencyGraph.searchDependency(path.join(projectPathUri, 'main.cs'))
            assert.deepStrictEqual(
                pickedSourceFiles,
                new Set([
                    path.join(projectPathUri, 'main.cs'),
                    path.join(projectPathUri, 'src', 'interface', 'recommendations.cs'),
                    path.join(projectPathUri, 'src', 'interface', 'model.cs'),
                ])
            )
        })

        it("should return source file with its dependecies' until it reaches to payload size limit", async () => {
            mockedFs.getFileSize.onFirstCall().resolves({ size: Math.pow(2, 19) })
            mockedFs.getFileSize.onSecondCall().resolves({ size: Math.pow(2, 19) })

            mockedFs.readFile.onFirstCall().resolves(
                `using Amazon.Cw.Props;
        var total = 5 + 4;`
            )
            const pickedSourceFiles = await csharpDependencyGraph.searchDependency(path.join(projectPathUri, 'main.cs'))
            assert.deepStrictEqual(
                pickedSourceFiles,
                new Set([
                    path.join(projectPathUri, 'main.cs'),
                    path.join(projectPathUri, 'src', 'interface', 'model.cs'),
                ])
            )
        })
    })

    describe('Test traverseDir', () => {
        beforeEach(() => {
            mockedFs.getFileSize.reset()
            mockedFs.readFile.reset()
            mockedFs.readdir.reset()
            csharpDependencyGraph.namespaceToFilepathDirectory = new Map([
                ['Amazon.Cw.Model', new Set([path.join(projectPathUri, 'src', 'model.cs')])],
                ['Amazon.Cw.Utils.Sample', new Set([path.join(projectPathUri, 'src', 'sample.cs')])],
                [
                    'Amazon.Cw.Props',
                    new Set([
                        path.join(projectPathUri, 'src', 'interface', 'scan.cs'),
                        path.join(projectPathUri, 'src', 'interface', 'recommendations.cs'),
                    ]),
                ],
            ])
            mockedFs.readdir.callsFake(async dirpath => {
                switch (dirpath) {
                    case projectPathUri:
                        return [
                            {
                                isFile: () => false,
                                isDirectory: () => true,
                                name: 'src',
                                path: projectPathUri,
                            },
                        ]
                    case path.join(projectPathUri, 'src'):
                        return [
                            {
                                isFile: () => true,
                                isDirectory: () => false,
                                name: 'sample.cs',
                                path: path.join(projectPathUri, 'src'),
                            },
                            {
                                isFile: () => true,
                                isDirectory: () => false,
                                name: 'model.cs',
                                path: path.join(projectPathUri, 'src'),
                            },
                            {
                                isFile: () => false,
                                isDirectory: () => true,
                                name: 'props',
                                path: path.join(projectPathUri, 'src'),
                            },
                        ]
                    case path.join(projectPathUri, 'src', 'props'):
                        return [
                            {
                                isFile: () => true,
                                isDirectory: () => false,
                                name: 'scan.cs',
                                path: path.join(projectPathUri, 'src', 'props'),
                            },
                            {
                                isFile: () => true,
                                isDirectory: () => false,
                                name: 'recommendation.cs',
                                path: path.join(projectPathUri, 'src', 'props'),
                            },
                        ]
                    default:
                        return []
                }
            })
        })
        it('should return without traversing due to payload size limit reached', async () => {
            mockedFs.getFileSize.resolves({ size: Math.pow(2, 20) })
            await csharpDependencyGraph.searchDependency(path.join(projectPathUri, 'main.cs'))
            await csharpDependencyGraph.traverseDir(projectPathUri)
            assert.strictEqual(mockedFs.readFile.calledWith(projectPathUri), false)
        })
        it('should traverse through files until it reaches payload size limit', async () => {
            mockedFs.getFileSize.atLeast(1).resolves({ size: Math.pow(2, 19) })
            await csharpDependencyGraph.traverseDir(projectPathUri)
            assert.strictEqual(csharpDependencyGraph.isProjectTruncated, true)
        })
        it('should traverse through all files', async () => {
            mockedFs.getFileSize.atLeast(1).resolves({ size: Math.pow(2, 10) })
            await csharpDependencyGraph.traverseDir(projectPathUri)
            assert.strictEqual(csharpDependencyGraph.isProjectTruncated, false)
        })
    })
    describe('Test getDependencies', () => {
        beforeEach(() => {
            csharpDependencyGraph.namespaceToFilepathDirectory = new Map([
                ['Amazon.Cw.Model', new Set([path.join(projectPathUri, 'src', 'model.cs')])],
                ['Amazon.Cw.Utils.Sample', new Set([path.join(projectPathUri, 'src', 'sample.cs')])],
                [
                    'Amazon.Cw.Props',
                    new Set([
                        path.join(projectPathUri, 'src', 'interface', 'scan.cs'),
                        path.join(projectPathUri, 'src', 'interface', 'recommendations.cs'),
                    ]),
                ],
            ])
        })
        it('should return file paths for given imports', () => {
            const expectedResponse = new Set([
                path.join(projectPathUri, 'src', 'model.cs'),
                path.join(projectPathUri, 'src', 'sample.cs'),
            ])
            assert.deepStrictEqual(
                csharpDependencyGraph.getDependencies(['Amazon.Cw.Utils.Sample', 'Amazon.Cw.Model']),
                expectedResponse
            )
        })
        it('should return empty list', () => {
            assert.deepStrictEqual(csharpDependencyGraph.getDependencies(['Amazon.Cw']), new Set())
        })
    })
    describe('Test readImports', () => {
        it('should return list of imports ', () => {
            const content = `
global using static Amazon.Cw.Utils;
using Amazon.Cw.Model;
using Proto = Amazon.Cw.Prototypes;
namespace Amazon.Toolkit.Demo {
  class Main {
    pulbic print() {

    }
  }
}
        `
            const response = csharpDependencyGraph.readImports(content)
            const expectedImports = ['Amazon.Cw.Utils', 'Amazon.Cw.Model', 'Amazon.Cw.Prototypes']
            assert.deepStrictEqual(response, expectedImports)
        })
        it('should return empty list', () => {
            const content = `
namespace Amazon.Toolkit.Demo {
  class Main {
    pulbic print() {
    }
  }
}
        `
            const response = csharpDependencyGraph.readImports(content)
            assert.deepStrictEqual(response, [])
        })
    })

    describe('Test generateTruncation', () => {
        before(() => {
            Sinon.stub(Date, 'now').returns(111111111)
            // csharpDependencyGraph.filterFiles() = Sinon.mock().returns()
        })
        it('should call zip dir', async () => {
            const zipSize = Math.pow(2, 19)
            const zipFileBuffer = 'dummy-zip-data'
            mockedFs.getFileSize.atLeast(1).resolves({ size: zipSize })
            csharpDependencyGraph.createZip = Sinon.stub().returns({
                zipFileBuffer,
                zipFileSize: zipSize,
            })
            const expectedResult = {
                rootDir: path.join(tempDirPath, 'codewhisperer_scan_111111111'),
                zipFileBuffer,
                scannedFiles: new Set([path.join(projectPathUri, 'main.cs')]),
                srcPayloadSizeInBytes: zipSize,
                zipFileSizeInBytes: zipSize,
                buildPayloadSizeInBytes: 0,
                lines: 0,
            }

            console.log('about to generate .....  wooo ... ')
            const trucation = await csharpDependencyGraph.generateTruncation(path.join(projectPathUri, 'main.cs'))

            assert.deepStrictEqual(trucation, expectedResult)
        })
    })

    // describe('Test gitIgnore', () => {
    //     it('should return all files in the workspace not excluded by gitignore', async function () {
    //         // these variables are a manual selection of settings for the test in order to test the collectFiles function
    //         // const fileAmount = 3
    //         // const fileNamePrefix = 'file'
    //         const fileContent = 'test content'

    //         // const workspaceFolder = await createTestWorkspace(fileAmount, { fileNamePrefix, fileContent })

    //         const writeFile = (pathParts: string[], fileContent: string) => {
    //             return toFile(fileContent, tempDirPath, ...pathParts)
    //         }

    //         // Sinon.stub(vscode.workspace, 'workspaceFolders').value([workspaceFolder])

    //         const gitignoreContent = `file2
    //             # different formats of prefixes
    //             /build
    //             node_modules

    //             #some comment

    //             range_file[0-5]
    //             `
    //         // await writeFile(['.gitignore'], gitignoreContent)

    //         // await writeFile(['build', `ignored1`], fileContent)
    //         // await writeFile(['build', `ignored2`], fileContent)

    //         // await writeFile(['node_modules', `ignored1`], fileContent)
    //         // await writeFile(['node_modules', `ignored2`], fileContent)

    //         // await writeFile([`range_file0`], fileContent)
    //         // await writeFile([`range_file9`], fileContent)

    //         // const gitignore2 = 'folder1\n'
    //         // await writeFile(['src', '.gitignore'], gitignore2)
    //         // await writeFile(['src', 'folder2', 'a.js'], fileContent)

    //         // const gitignore3 = `negate_test*
    //         //     !negate_test[0-5]`
    //         // await writeFile(['src', 'folder3', '.gitignore'], gitignore3)
    //         // await writeFile(['src', 'folder3', 'negate_test1'], fileContent)
    //         // await writeFile(['src', 'folder3', 'negate_test6'], fileContent)

    //         const allFiles = await csharpDependencyGraph.getFiles(tempDirPath)

    //         console.log('all files: ', allFiles)

    //         // const files = await csharpDependencyGraph.filterOutGitIgnoredFiles(tempDirPath, allFiles)

    //         // console.log('filtered files: ', files)

    //         // const result = (await collectFiles([workspaceFolder.uri.fsPath], [workspaceFolder], true))
    //         //     // for some reason, uri created inline differ in subfields, so skipping them from assertion
    //         //     .map(({ fileUri, zipFilePath, ...r }) => ({ ...r }))

    //         // result.sort((l, r) => l.relativeFilePath.localeCompare(r.relativeFilePath))

    //         // non-posix filePath check here is important.
    //         // assert.deepStrictEqual(
    //         //     [
    //         //         {
    //         //             workspaceFolder,
    //         //             relativeFilePath: '.gitignore',
    //         //             fileContent: gitignoreContent,
    //         //         },
    //         //         {
    //         //             workspaceFolder,
    //         //             relativeFilePath: 'file1',
    //         //             fileContent: 'test content',
    //         //         },
    //         //         {
    //         //             workspaceFolder,
    //         //             relativeFilePath: 'file3',
    //         //             fileContent: 'test content',
    //         //         },
    //         //         {
    //         //             workspaceFolder,
    //         //             relativeFilePath: 'range_file9',
    //         //             fileContent: 'test content',
    //         //         },
    //         //         // {
    //         //         //     workspaceFolder,
    //         //         //     relativeFilePath: path.join('src', '.gitignore'),
    //         //         //     fileContent: gitignore2,
    //         //         // },
    //         //         {
    //         //             workspaceFolder,
    //         //             relativeFilePath: path.join('src', 'folder2', 'a.js'),
    //         //             fileContent: fileContent,
    //         //         },
    //         //         // {
    //         //         //     workspaceFolder,
    //         //         //     relativeFilePath: path.join('src', 'folder3', '.gitignore'),
    //         //         //     fileContent: gitignore3,
    //         //         // },
    //         //         {
    //         //             workspaceFolder,
    //         //             relativeFilePath: path.join('src', 'folder3', 'negate_test1'),
    //         //             fileContent: fileContent,
    //         //         },
    //         //     ] satisfies typeof result,
    //         //     result
    //         // )
    //     })
    // })
})
