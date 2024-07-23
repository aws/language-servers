import * as fs from 'fs'
import { expect } from 'chai'
import { StartTransformRequest, TransformProjectMetadata } from '../models'
import {
    isProject,
    isSolution,
    validateProject,
    validateSolution,
    findFilesWithExtension,
    readFile,
    parseAndCheckUnsupportedComponents,
    checkForUnsupportedViews,
} from '../validation'
import { supportedProjects, unsupportedViewComponents } from '../resources/SupportedProjects'
import sinon = require('sinon')

const sampleStartTransformRequest: StartTransformRequest = {
    SolutionRootPath: '',
    SelectedProjectPath: 'test.csproj',
    ProgramLanguage: '',
    TargetFramework: '',
    SolutionConfigPaths: [],
    ProjectMetadata: [],
    command: '',
}

describe('Test validation functionality', () => {
    let readFileStub: sinon.SinonStub

    beforeEach(() => {
        readFileStub = sinon.stub(fs.promises, 'readFile')
    })

    afterEach(() => {
        readFileStub.restore()
    })

    it('should return true when selectedProjectPath is a valid csproj', () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        mockStartTransformationRequest.SelectedProjectPath = 'test.csproj'
        expect(isProject(mockStartTransformationRequest)).to.equal(true)
    })

    it('should return false when selectedProjectPath is not a valid csproj', () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        mockStartTransformationRequest.SelectedProjectPath = 'test.sln'
        expect(isProject(mockStartTransformationRequest)).to.equal(false)
    })

    it('should return true when selectedProjectPath is a valid sln', () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        mockStartTransformationRequest.SelectedProjectPath = 'test.sln'
        expect(isSolution(mockStartTransformationRequest)).to.equal(true)
    })

    it('should return false when selectedProjectPath is not a valid sln', () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        mockStartTransformationRequest.SelectedProjectPath = 'test.csproj'
        expect(isSolution(mockStartTransformationRequest)).to.equal(false)
    })

    it('should return true when project is a supported type', () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        const mockProjectMeta = {
            Name: '',
            ProjectTargetFramework: '',
            ProjectPath: 'test.csproj',
            SourceCodeFilePaths: [],
            ProjectLanguage: '',
            ProjectType: 'AspNetCoreMvc',
            ExternalReferences: [],
        }
        mockStartTransformationRequest.ProjectMetadata.push(mockProjectMeta)

        expect(validateProject(mockStartTransformationRequest)).to.equal(true)
    })

    it('should return false when project is not a supported type', () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        const mockProjectMeta = {
            Name: '',
            ProjectTargetFramework: '',
            ProjectPath: 'test.csproj',
            SourceCodeFilePaths: [],
            ProjectLanguage: '',
            ProjectType: 'not supported',
            ExternalReferences: [],
        }
        mockStartTransformationRequest.ProjectMetadata = []
        mockStartTransformationRequest.ProjectMetadata.push(mockProjectMeta)

        expect(validateProject(mockStartTransformationRequest)).to.equal(false)
    })

    it('should return false when there is no project path that is the same as the selected project path', () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        const mockProjectMeta = {
            Name: '',
            ProjectTargetFramework: '',
            ProjectPath: 'different.csproj',
            SourceCodeFilePaths: [],
            ProjectLanguage: '',
            ProjectType: 'AspNetCoreMvc',
            ExternalReferences: [],
        }
        mockStartTransformationRequest.ProjectMetadata = []
        mockStartTransformationRequest.ProjectMetadata.push(mockProjectMeta)

        expect(validateProject(mockStartTransformationRequest)).to.equal(false)
    })

    it('should return false when there is no project path that is the same as the selected project path', () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        const notSupportedProject = {
            Name: '',
            ProjectTargetFramework: '',
            ProjectPath: 'nonValid.csproj',
            SourceCodeFilePaths: [],
            ProjectLanguage: '',
            ProjectType: 'not support',
            ExternalReferences: [],
        }
        const supportedProject = {
            Name: '',
            ProjectTargetFramework: '',
            ProjectPath: 'valid.csproj',
            SourceCodeFilePaths: [],
            ProjectLanguage: '',
            ProjectType: 'AspNetCoreMvc',
            ExternalReferences: [],
        }

        mockStartTransformationRequest.ProjectMetadata = []
        mockStartTransformationRequest.ProjectMetadata.push(notSupportedProject)
        mockStartTransformationRequest.ProjectMetadata.push(supportedProject)

        const validSolution = validateSolution(mockStartTransformationRequest)

        expect(validSolution.length).to.equal(1)
        expect(validSolution[0]).to.equal('valid.csproj')
    })

    it('should return all cshtml files in source code file path when isProject is set to true', () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        const mockProjectMeta = {
            Name: '',
            ProjectTargetFramework: '',
            ProjectPath: 'test.csproj',
            SourceCodeFilePaths: ['test.cshtml'],
            ProjectLanguage: '',
            ProjectType: 'AspNetCoreMvc',
            ExternalReferences: [],
        }
        mockStartTransformationRequest.ProjectMetadata = []
        mockStartTransformationRequest.ProjectMetadata.push(mockProjectMeta)

        const cshtmlFiles = findFilesWithExtension(mockStartTransformationRequest, true, 'cshtml')

        expect(cshtmlFiles.length).to.equal(1)
        expect(cshtmlFiles[0]).to.equal('test.cshtml')
    })

    it('should return all cshtml files in source code file path when isProject is set to false', () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        const mockProjectMeta = {
            Name: '',
            ProjectTargetFramework: '',
            ProjectPath: 'test.csproj',
            SourceCodeFilePaths: ['nonProject.cshtml'],
            ProjectLanguage: '',
            ProjectType: 'AspNetCoreMvc',
            ExternalReferences: [],
        }
        mockStartTransformationRequest.ProjectMetadata = []
        mockStartTransformationRequest.ProjectMetadata.push(mockProjectMeta)

        const cshtmlFiles = findFilesWithExtension(mockStartTransformationRequest, false, 'cshtml')

        expect(cshtmlFiles.length).to.equal(1)
        expect(cshtmlFiles[0]).to.equal('nonProject.cshtml')
    })

    it('should return file content when readFile is called', async () => {
        const mockFilePath = 'test.txt'
        const expectedFileContents = 'Success'
        readFileStub.withArgs(mockFilePath, 'utf-8').resolves(expectedFileContents)

        const fileContents = await readFile(mockFilePath)
        expect(fileContents).to.equal(expectedFileContents)
    })

    it('should return empty string when there is an error calling readFile', async () => {
        const mockFilePath = 'test.txt'
        const error = new Error('File not found')
        const expectedFileContents = 'Success'
        readFileStub.withArgs(mockFilePath, 'utf-8').rejects(error)

        const result = await readFile(mockFilePath)
        expect(result).to.equal('')
    })

    it('should return false if html string does not contain unspported compoent when calling parseAndCheckUnsupportedComponents', () => {
        const mockHtmlString = '<html></html>'

        const containsUnsupportedComponents = parseAndCheckUnsupportedComponents(mockHtmlString)
        expect(containsUnsupportedComponents).to.equal(false)
    })

    it('should return true if html string contain unspported compoent when calling parseAndCheckUnsupportedComponents', () => {
        const mockHtmlString = '<html>@Scripts</html>'

        const containsUnsupportedComponents = parseAndCheckUnsupportedComponents(mockHtmlString)
        expect(containsUnsupportedComponents).to.equal(true)
    })

    it('should return false when callng checkForUnsupportedViews with no unsupported views ', async () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        const mockProjectMeta = {
            Name: '',
            ProjectTargetFramework: '',
            ProjectPath: 'test.csproj',
            SourceCodeFilePaths: ['test.cshtml'],
            ProjectLanguage: '',
            ProjectType: 'AspNetCoreMvc',
            ExternalReferences: [],
        }

        mockStartTransformationRequest.ProjectMetadata = []
        mockStartTransformationRequest.ProjectMetadata.push(mockProjectMeta)

        const mockFilePath = 'test.cshtml'
        const mockHtmlString = '<html></html>'
        readFileStub.withArgs(mockFilePath, 'utf-8').resolves(mockHtmlString)

        const containsUnsupportedComponents = await checkForUnsupportedViews(mockStartTransformationRequest, true)
        expect(containsUnsupportedComponents).to.equal(false)
    })

    it('should return true when callng checkForUnsupportedViews with unsupported views ', async () => {
        let mockStartTransformationRequest: StartTransformRequest = sampleStartTransformRequest
        const mockProjectMeta = {
            Name: '',
            ProjectTargetFramework: '',
            ProjectPath: 'test.csproj',
            SourceCodeFilePaths: ['test.cshtml'],
            ProjectLanguage: '',
            ProjectType: 'AspNetCoreMvc',
            ExternalReferences: [],
        }

        mockStartTransformationRequest.ProjectMetadata = []
        mockStartTransformationRequest.ProjectMetadata.push(mockProjectMeta)

        const mockFilePath = 'test.cshtml'
        const mockHtmlString = '<html>@Scripts</html>'
        readFileStub.withArgs(mockFilePath, 'utf-8').resolves(mockHtmlString)

        const containsUnsupportedComponents = await checkForUnsupportedViews(mockStartTransformationRequest, true)
        expect(containsUnsupportedComponents).to.equal(true)
    })
})
