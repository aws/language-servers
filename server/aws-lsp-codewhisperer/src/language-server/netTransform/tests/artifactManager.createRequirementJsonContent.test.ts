import { expect } from 'chai'
import { Workspace, Logging } from '@aws/language-server-runtimes/server-interface'
import { StartTransformRequest, RequirementJson } from '../models'
import { ArtifactManager } from '../artifactManager'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { EXAMPLE_REQUEST } from './mockData'
import sinon = require('sinon')
import * as fs from 'fs'
import * as path from 'path'

describe('ArtifactManager - createRequirementJsonContent', () => {
    let workspace: StubbedInstance<Workspace>
    let artifactManager: ArtifactManager
    let mockedLogging: StubbedInstance<Logging>
    let baseRequest: StartTransformRequest
    let fsStubs: { [key: string]: sinon.SinonStub }

    const setupRequest = (overrides: Partial<StartTransformRequest> = {}): StartTransformRequest => ({
        ...EXAMPLE_REQUEST,
        SolutionRootPath: path.join('C:', 'solution'),
        SolutionFilePath: path.join('C:', 'solution', 'test.sln'),
        SelectedProjectPath: path.join('C:', 'solution', 'project.csproj'),
        TransformNetStandardProjects: true,
        ProjectMetadata: [
            {
                Name: 'TestProject',
                ProjectPath: path.join('C:', 'solution', 'project.csproj'),
                ProjectTargetFramework: 'net48',
                ProjectLanguage: 'C#',
                ProjectType: 'Console',
                SourceCodeFilePaths: [path.join('C:', 'solution', 'file1.cs'), path.join('C:', 'solution', 'file2.vb')],
                ExternalReferences: [
                    {
                        ProjectPath: path.join('C:', 'solution', 'project.csproj'),
                        RelativePath: path.join('lib', 'assembly1.dll'),
                        AssemblyFullPath: path.join('C:', 'solution', 'lib', 'assembly1.dll'),
                        IncludedInArtifact: true,
                    },
                ],
            },
        ],
        PackageReferences: [
            {
                Id: 'TestPackage',
                Versions: ['1.0.0'],
                IsPrivatePackage: false,
                NetCompatiblePackageFilePath: path.join('C:', 'packages', 'test.nupkg'),
            },
        ],
        ...overrides,
    })

    const mockFileSystem = () => {
        fsStubs = {
            existsSync: sinon.stub(fs, 'existsSync').returns(true),
            mkdirSync: sinon.stub(fs, 'mkdirSync'),
            copyFile: sinon.stub(fs, 'copyFile').callsArg(2),
            createReadStream: sinon.stub(fs, 'createReadStream').returns({
                [Symbol.asyncIterator]: async function* () {
                    yield Buffer.from('test content')
                },
            } as any),
        }
    }

    beforeEach(() => {
        workspace = stubInterface<Workspace>()
        mockedLogging = stubInterface<Logging>()
        artifactManager = new ArtifactManager(workspace, mockedLogging, 'test-workspace', 'test-solution')
        baseRequest = setupRequest()
        mockFileSystem()
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('Basic functionality', () => {
        it('should generate requirement json with correct structure', async () => {
            const result = await artifactManager.createRequirementJsonContent(baseRequest)

            expect(result).to.have.property('EntryPath')
            expect(result).to.have.property('SolutionPath')
            expect(result).to.have.property('Projects')
            expect(result).to.have.property('TransformNetStandardProjects', true)
            expect(result).to.have.property('Packages')
            expect(result.Projects).to.have.length(1)
        })

        it('should process source code files correctly', async () => {
            const result = await artifactManager.createRequirementJsonContent(baseRequest)

            expect(result.Projects[0].codeFiles).to.have.length(2)
            expect(result.Projects[0].codeFiles[0]).to.have.property('contentMd5Hash')
            expect(result.Projects[0].codeFiles[0]).to.have.property('relativePath')
        })

        it('should process project metadata correctly', async () => {
            const result = await artifactManager.createRequirementJsonContent(baseRequest)
            const project = result.Projects[0]

            expect(project).to.have.property('projectFilePath')
            expect(project).to.have.property('projectTarget', 'net48')
            expect(project).to.have.property('codeFiles')
            expect(project).to.have.property('references')
        })
    })

    describe('Filtering functionality', () => {
        it('should filter source code files with filtered extensions', async () => {
            const request = setupRequest({
                ProjectMetadata: [
                    {
                        ...baseRequest.ProjectMetadata[0],
                        SourceCodeFilePaths: [
                            path.join('C:', 'solution', 'file1.cs'),
                            path.join('C:', 'solution', 'file2.suo'), // Should be filtered
                            path.join('C:', 'solution', 'file3.pdb'), // Should be filtered
                            path.join('C:', 'solution', 'file4.vb'),
                        ],
                        ExternalReferences: [],
                    },
                ],
            })

            const result = await artifactManager.createRequirementJsonContent(request)

            // Should only include .cs and .vb files, not .suo or .pdb
            expect(result.Projects[0].codeFiles).to.have.length(2)
        })

        it('should filter external references with filtered extensions', async () => {
            const request = setupRequest({
                ProjectMetadata: [
                    {
                        ...baseRequest.ProjectMetadata[0],
                        SourceCodeFilePaths: [path.join('C:', 'solution', 'file1.cs')],
                        ExternalReferences: [
                            {
                                ProjectPath: path.join('C:', 'solution', 'project.csproj'),
                                RelativePath: path.join('lib', 'assembly1.dll'),
                                AssemblyFullPath: path.join('C:', 'solution', 'lib', 'assembly1.dll'),
                                IncludedInArtifact: true,
                            },
                            {
                                ProjectPath: path.join('C:', 'solution', 'project.csproj'),
                                RelativePath: path.join('lib', 'debug.pdb'),
                                AssemblyFullPath: path.join('C:', 'solution', 'lib', 'debug.pdb'), // Should be filtered
                                IncludedInArtifact: true,
                            },
                        ],
                    },
                ],
            })

            const result = await artifactManager.createRequirementJsonContent(request)

            // Should only include .dll reference, not .pdb
            expect(result.Projects[0].references).to.have.length(1)
        })

        it('should filter package references with filtered extensions', async () => {
            const request = setupRequest({
                PackageReferences: [
                    {
                        Id: 'ValidPackage',
                        Versions: ['1.0.0'],
                        IsPrivatePackage: false,
                        NetCompatiblePackageFilePath: path.join('C:', 'packages', 'valid.nupkg'),
                    },
                    {
                        Id: 'FilteredPackage',
                        Versions: ['1.0.0'],
                        IsPrivatePackage: false,
                        NetCompatiblePackageFilePath: path.join('C:', 'packages', 'filtered.pdb'), // Should be filtered
                    },
                ],
            })

            const result = await artifactManager.createRequirementJsonContent(request)

            // Should only include valid package, not filtered one
            expect((result as any).Packages).to.have.length(1)
        })
    })

    describe('Error handling', () => {
        it('should handle file processing errors gracefully', async () => {
            fsStubs.copyFile.callsArgWith(2, new Error('Copy failed'))
            fsStubs.createReadStream.throws(new Error('Read failed'))

            const result = await artifactManager.createRequirementJsonContent(baseRequest)

            expect(result).to.have.property('Projects')
            expect(result.Projects[0].codeFiles).to.have.length(0)
        })

        it('should handle reference processing errors gracefully', async () => {
            fsStubs.copyFile.callsArgWith(2, new Error('Reference copy failed'))

            const result = await artifactManager.createRequirementJsonContent(baseRequest)

            // Reference is still added even if copy fails, but error is logged
            expect(result.Projects[0].references).to.have.length(1)
            expect(mockedLogging.log.called).to.be.true
        })
    })

    describe('Package processing', () => {
        it('should handle null PackageReferences', async () => {
            const request = setupRequest({ PackageReferences: undefined })

            const result = await artifactManager.createRequirementJsonContent(request)
            expect((result as any).Packages).to.have.length(0)
        })

        it('should skip packages without NetCompatiblePackageFilePath', async () => {
            const request = setupRequest({
                PackageReferences: [
                    {
                        Id: 'EmptyPathPackage',
                        Versions: ['1.0.0'],
                        IsPrivatePackage: false,
                        NetCompatiblePackageFilePath: undefined,
                    },
                    {
                        Id: 'ValidPackage',
                        Versions: ['1.0.0'],
                        IsPrivatePackage: false,
                        NetCompatiblePackageFilePath: path.join('C:', 'packages', 'valid.nupkg'),
                    },
                ],
            })

            const result = await artifactManager.createRequirementJsonContent(request)
            expect((result as any).Packages).to.have.length(1)
        })
    })

    describe('Optional properties', () => {
        it('should include EnableRazorViewTransform when defined', async () => {
            const request = setupRequest({ EnableRazorViewTransform: true })

            const result = await artifactManager.createRequirementJsonContent(request)
            expect(result).to.have.property('EnableRazorViewTransform', true)
        })

        it('should include EnableWebFormsTransform when defined', async () => {
            const request = setupRequest({ EnableWebFormsTransform: false })

            const result = await artifactManager.createRequirementJsonContent(request)
            expect(result).to.have.property('EnableWebFormsTransform', false)
        })

        it('should exclude optional properties when undefined', async () => {
            const request = setupRequest({
                EnableRazorViewTransform: undefined,
                EnableWebFormsTransform: undefined,
            })

            const result = await artifactManager.createRequirementJsonContent(request)
            expect(result).to.not.have.property('EnableRazorViewTransform')
            expect(result).to.not.have.property('EnableWebFormsTransform')
        })
    })

    describe('Edge cases', () => {
        it('should handle empty project metadata', async () => {
            const request = setupRequest({ ProjectMetadata: [] })

            const result = await artifactManager.createRequirementJsonContent(request)
            expect(result.Projects).to.have.length(0)
        })

        it('should handle empty source code file paths', async () => {
            const request = setupRequest({
                ProjectMetadata: [
                    {
                        ...baseRequest.ProjectMetadata[0],
                        SourceCodeFilePaths: [],
                        ExternalReferences: [],
                    },
                ],
            })

            const result = await artifactManager.createRequirementJsonContent(request)
            expect(result.Projects[0].codeFiles).to.have.length(0)
            expect(result.Projects[0].references).to.have.length(0)
        })

        it('should filter out empty file paths', async () => {
            const request = setupRequest({
                ProjectMetadata: [
                    {
                        ...baseRequest.ProjectMetadata[0],
                        SourceCodeFilePaths: [
                            path.join('C:', 'solution', 'file1.cs'),
                            '', // Empty path should be filtered
                            null as any, // Null path should be filtered
                            path.join('C:', 'solution', 'file2.vb'),
                        ],
                    },
                ],
            })

            const result = await artifactManager.createRequirementJsonContent(request)
            expect(result.Projects[0].codeFiles).to.have.length(2)
        })
    })

    describe('Multiple projects', () => {
        it('should process multiple projects correctly', async () => {
            const request = setupRequest({
                ProjectMetadata: [
                    baseRequest.ProjectMetadata[0],
                    {
                        Name: 'SecondProject',
                        ProjectPath: path.join('C:', 'solution', 'project2.csproj'),
                        ProjectTargetFramework: 'net6.0',
                        ProjectLanguage: 'C#',
                        ProjectType: 'Library',
                        SourceCodeFilePaths: [path.join('C:', 'solution', 'file3.cs')],
                        ExternalReferences: [],
                    },
                ],
            })

            const result = await artifactManager.createRequirementJsonContent(request)

            expect(result.Projects).to.have.length(2)
            expect(result.Projects[0].projectTarget).to.equal('net48')
            expect(result.Projects[1].projectTarget).to.equal('net6.0')
            expect(result.Projects[0].codeFiles).to.have.length(2)
            expect(result.Projects[1].codeFiles).to.have.length(1)
        })
    })
})
