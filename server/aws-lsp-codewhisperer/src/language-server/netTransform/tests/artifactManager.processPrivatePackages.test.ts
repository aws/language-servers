import { expect } from 'chai'
import { Workspace, Logging } from '@aws/language-server-runtimes/server-interface'
import { StartTransformRequest, ExternalReference, References, PackageReferenceMetadata } from '../models'
import { ArtifactManager } from '../artifactManager'
import path = require('path')
import { StubbedInstance, default as simon, stubInterface } from 'ts-sinon'
import { EXAMPLE_REQUEST } from './mockData'

describe('ArtifactManager - processPrivatePackages', () => {
    let workspace: StubbedInstance<Workspace>
    let artifactManager: ArtifactManager
    let sampleStartTransformRequest: StartTransformRequest
    let sampleExternalReference: ExternalReference
    let sampleArtifactReference: References
    const mockedLogging = stubInterface<Logging>()

    beforeEach(() => {
        workspace = stubInterface<Workspace>()
        // Create new instance of ArtifactManager before each test
        artifactManager = new ArtifactManager(workspace, mockedLogging, '')

        // Mock internal methods that might be called
        artifactManager.copyFile = async (source: string, destination: string) => {
            // Mock implementation if needed
        }
        artifactManager.getWorkspaceReferencePathFromRelativePath = (relativePath: string) => {
            return path.join('mock/workspace/path', relativePath)
        }

        // Setup initial test data
        sampleStartTransformRequest = EXAMPLE_REQUEST

        sampleExternalReference = {
            ProjectPath: '',
            RelativePath: '',
            AssemblyFullPath: '',
            IncludedInArtifact: true,
        }
        sampleArtifactReference = {
            includedInArtifact: true,
            relativePath: '',
            isThirdPartyPackage: false,
        }
    })

    it('should do nothing when PackageReferences is undefined', async () => {
        sampleStartTransformRequest.PackageReferences = undefined
        artifactManager.processPrivatePackages(
            sampleStartTransformRequest,
            sampleExternalReference,
            sampleArtifactReference
        )
        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(false)
        expect(sampleArtifactReference.netCompatibleRelativePath).to.equal(undefined)
        expect(sampleArtifactReference.netCompatibleVersion).to.equal(undefined)
    })

    it('should process private package when all conditions are met', async () => {
        let copyFileCalled = false
        artifactManager.copyFile = async (source: string, destination: string): Promise<void> => {
            copyFileCalled = true
            return Promise.resolve()
        }

        const privatePackage: PackageReferenceMetadata = {
            Id: 'test-package',
            Versions: [],
            IsPrivatePackage: true,
            NetCompatibleAssemblyRelativePath: 'path/to/assembly',
            NetCompatibleAssemblyPath: 'full/path/to/assembly',
            NetCompatiblePackageVersion: '2.0.0',
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage]
        sampleExternalReference.RelativePath = 'some/path/test-package/more/path'

        await artifactManager.processPrivatePackages(
            sampleStartTransformRequest,
            sampleExternalReference,
            sampleArtifactReference
        )

        expect(copyFileCalled).to.be.true
        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(true)
        expect(sampleArtifactReference.netCompatibleRelativePath).to.equal(
            path.join('references', 'thirdpartypackages', 'path/to/assembly').toLowerCase()
        )
        expect(sampleArtifactReference.netCompatibleVersion).to.equal('2.0.0')
    })

    it('should not process when package is not private', async () => {
        let copyFileCalled = false
        artifactManager.copyFile = async (source: string, destination: string): Promise<void> => {
            copyFileCalled = true
            return Promise.resolve()
        }

        const nonPrivatePackage = {
            Id: 'test-package',
            IsPrivatePackage: false,
            NetCompatibleAssemblyRelativePath: 'path/to/assembly',
            NetCompatibleAssemblyPath: 'full/path/to/assembly',
            NetCompatiblePackageVersion: '1.0.0',
            Versions: [],
        }

        sampleStartTransformRequest.PackageReferences = [nonPrivatePackage]
        sampleExternalReference.RelativePath = 'some/path/test-package/more/path'

        artifactManager.processPrivatePackages(
            sampleStartTransformRequest,
            sampleExternalReference,
            sampleArtifactReference
        )

        expect(copyFileCalled).to.be.false
        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(false)
        expect(sampleArtifactReference.netCompatibleRelativePath).to.equal(undefined)
        expect(sampleArtifactReference.netCompatibleVersion).to.equal(undefined)
    })

    it('should not process when package ID is not in reference path', async () => {
        let copyFileCalled = false
        artifactManager.copyFile = async (source: string, destination: string): Promise<void> => {
            copyFileCalled = true
            return Promise.resolve()
        }

        const privatePackage = {
            Id: 'test-package',
            IsPrivatePackage: true,
            NetCompatibleAssemblyRelativePath: 'path/to/assembly',
            NetCompatibleAssemblyPath: 'full/path/to/assembly',
            NetCompatiblePackageVersion: '1.0.0',
            Versions: [],
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage]
        sampleExternalReference.RelativePath = 'some/path/different-package/more/path'

        artifactManager.processPrivatePackages(
            sampleStartTransformRequest,
            sampleExternalReference,
            sampleArtifactReference
        )

        expect(copyFileCalled).to.be.false
        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(false)
        expect(sampleArtifactReference.netCompatibleRelativePath).to.equal(undefined)
        expect(sampleArtifactReference.netCompatibleVersion).to.equal(undefined)
    })

    it('should mark as third party package but not copy when paths are null', async () => {
        let copyFileCalled = false
        artifactManager.copyFile = async (source: string, destination: string): Promise<void> => {
            copyFileCalled = true
            return Promise.resolve()
        }

        const privatePackage: PackageReferenceMetadata = {
            Id: 'test-package',
            Versions: [],
            IsPrivatePackage: true,
            NetCompatibleAssemblyRelativePath: undefined,
            NetCompatibleAssemblyPath: undefined,
            NetCompatiblePackageVersion: undefined,
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage]
        sampleExternalReference.RelativePath = 'some/path/test-package/more/path'

        await artifactManager.processPrivatePackages(
            sampleStartTransformRequest,
            sampleExternalReference,
            sampleArtifactReference
        )

        expect(copyFileCalled).to.be.false
        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(true)
        expect(sampleArtifactReference.netCompatibleRelativePath).to.be.undefined
        expect(sampleArtifactReference.netCompatibleVersion).to.be.undefined
    })
})
