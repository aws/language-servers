import { expect } from 'chai'
import { StartTransformRequest, TransformProjectMetadata } from '../models'
import { isProject, isSolution } from '../validation'
import { supportedProjects, unsupportedViewComponents } from '../resources/SupportedProjects'
import mock = require('mock-fs')
import { Logging } from '@aws/language-server-runtimes/server-interface'
import { stubInterface } from 'ts-sinon'

const sampleStartTransformRequest: StartTransformRequest = {
    SolutionRootPath: '',
    SolutionFilePath: 'sample.sln',
    SelectedProjectPath: 'test.csproj',
    ProgramLanguage: '',
    TargetFramework: '',
    SolutionConfigPaths: [],
    ProjectMetadata: [],
    TransformNetStandardProjects: false,
    EnableRazorViewTransform: false,
    EnableWebFormsTransform: false,
    command: '',
    PackageReferences: [],
}
const mockedLogging = stubInterface<Logging>()

describe('Test validation functionality', () => {
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
})
