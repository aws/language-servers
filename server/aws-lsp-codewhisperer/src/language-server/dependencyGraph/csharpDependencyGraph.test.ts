import * as assert from 'assert'
import * as path from 'path'
import * as Sinon from 'sinon'
import { CsharpDependencyGraph } from './csharpDependencyGraph'

describe('test CsharpDependencyGraph', () => {
    let csharpDependencyGraph: CsharpDependencyGraph
    const mockedGetWorkspaceFolder = Sinon.mock()
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
    before(() => {
        csharpDependencyGraph = new CsharpDependencyGraph(mockedWorkspace)
    })
    beforeEach(() => {
        mockedGetWorkspaceFolder.reset()
        mockedGetWorkspaceFolder.returns(undefined)

        csharpDependencyGraph = new CsharpDependencyGraph(mockedWorkspace)
    })

    describe('Test getPayloadSizeLimitInBytes', () => {
        it('should return correct payload size', () => {
            const expectedPayloadSize = Math.pow(2, 20)
            assert.equal(csharpDependencyGraph.getPayloadSizeLimitInBytes(), expectedPayloadSize)
        })
    })

    describe('Test getProjectName', () => {
        beforeEach(() => {
            mockedFs.isFile.reset()
            mockedFs.isFile.returns(false)
        })
        it('should return current folder name for given file path outside workspace folder', () => {
            mockedFs.isFile.returns(true)
            assert.equal(csharpDependencyGraph.getProjectName(path.join(projectPathUri, 'sample.cs')), 'sampleWs')
        })
        it('should return correct project name for given forlder path within workspace folder', () => {
            const expectedProjectName = 'sampleWs'
            mockedGetWorkspaceFolder.returns({ uri: projectPathUri, name: expectedProjectName })
            assert.equal(csharpDependencyGraph.getProjectName(path.join(projectPathUri, 'src')), expectedProjectName)
        })
    })

    describe('Test getProjectPath', () => {
        beforeEach(() => {
            mockedFs.isFile.reset()
            mockedFs.isFile.returns(false)
        })
        it('should not find workspace folder path for given path', () => {
            const fileFolderPath = path.resolve('\\workspace\\src')
            const fileUri = path.join(fileFolderPath, 'sample.cs')
            mockedFs.isFile.returns(true)

            const response = csharpDependencyGraph.getProjectPath(fileUri)
            assert.equal(response, fileFolderPath)
        })
        it('should return project name for within project file', () => {
            const expectedProjectName = 'sampleWs'

            mockedGetWorkspaceFolder.returns({ uri: projectPathUri, name: expectedProjectName })
            assert.equal(csharpDependencyGraph.getProjectPath(path.join(projectPathUri, 'src')), projectPathUri)
            mockedGetWorkspaceFolder.reset()
        })
    })

    describe('Test getReadableSizeLimit', () => {
        it('should return size 1 MB', () => {
            assert.equal(csharpDependencyGraph.getReadableSizeLimit(), '1MB')
        })
    })

    describe('Test exceedsSizeLimit', () => {
        it('should not exceed size limit', () => {
            const size = 100
            const expectedResult = false
            assert.equal(csharpDependencyGraph.exceedsSizeLimit(size), expectedResult)
        })
        it('should exceed size limit', () => {
            const size = Math.pow(2, 21)
            const expectedResult = true
            assert.equal(csharpDependencyGraph.exceedsSizeLimit(size), expectedResult)
        })
    })

    describe('Test createNamespaceFilenameMapper', () => {
        beforeEach(() => {
            mockedFs.readdir.reset()
            mockedFs.readFile.reset()
            mockedFs.readdir.resolves([
                {
                    isFile: () => false,
                    isDirectory: () => true,
                    name: 'src',
                    path: projectPathUri,
                },
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
            ])
        })

        it('should create the map with namespace to filepath mapping', async () => {
            csharpDependencyGraph.namespaceToFilepathDirectory = new Map<string, Set<string>>()
            mockedFs.readFile.callsFake(async filePath => {
                if (filePath === path.join(projectPathUri, 'src', 'sample.cs')) {
                    return `namespace Amazon.Cw.Utils.Sample {}`
                }
                if (filePath === path.join(projectPathUri, 'src', 'model.cs')) {
                    return `namespace Amazon.Cw.Model {}`
                }
            })
            await csharpDependencyGraph.createNamespaceFilenameMapper(projectPathUri)
            assert.deepEqual(
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
            await csharpDependencyGraph.createNamespaceFilenameMapper(projectPathUri)
            assert.deepEqual(csharpDependencyGraph.namespaceToFilepathDirectory, new Map([]))
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
            assert.deepEqual(pickedSourceFiles, new Set([filePath]))
        })

        it("should return source file with its dependecies' file path", async () => {
            mockedFs.getFileSize.atLeast(1).resolves({ size: 1000 })

            mockedFs.readFile.onFirstCall().resolves(
                `using Amazon.Cw.Props;
        var total = 5 + 4;`
            )
            const pickedSourceFiles = await csharpDependencyGraph.searchDependency(path.join(projectPathUri, 'main.cs'))
            assert.deepEqual(
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
            assert.deepEqual(
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
            mockedFs.readdir.resolves([
                {
                    isFile: () => false,
                    isDirectory: () => true,
                    name: 'src',
                    path: projectPathUri,
                },
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
            ])
        })
        it('should return without traversing due to payload size limit reached', async () => {
            mockedFs.getFileSize.resolves({ size: Math.pow(2, 20) })
            await csharpDependencyGraph.searchDependency(path.join(projectPathUri, 'main.cs'))
            await csharpDependencyGraph.traverseDir(projectPathUri)
            assert.equal(mockedFs.readFile.calledWith(projectPathUri), false)
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
            assert.deepEqual(
                csharpDependencyGraph.getDependencies(['Amazon.Cw.Utils.Sample', 'Amazon.Cw.Model']),
                expectedResponse
            )
        })
        it('should return empty list', () => {
            assert.deepEqual(csharpDependencyGraph.getDependencies(['Amazon.Cw']), new Set())
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
            assert.deepEqual(response, expectedImports)
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
            assert.deepEqual(response, [])
        })
    })
    describe('Test generateTruncation', () => {
        before(() => {
            Sinon.stub(Date, 'now').returns(111111111)
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
                srcPayloadSizeInBytes: 0,
                zipFileSizeInBytes: zipSize,
                buildPayloadSizeInBytes: 0,
                lines: 0,
            }

            const trucation = await csharpDependencyGraph.generateTruncation(path.join(projectPathUri, 'main.cs'))

            assert.deepEqual(trucation, expectedResult)
        })
    })
})
