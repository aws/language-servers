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
        artifactManager = new ArtifactManager(workspace, mockedLogging, '', '')

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
            NetCompatibleAssemblyRelativePath: 'path/to/assembly.dll',
            NetCompatibleAssemblyPath: 'full/path/to/assembly.dll',
            NetCompatiblePackageVersion: '2.0.0',
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage]
        sampleExternalReference.RelativePath = 'some/path/test-package/more/path/assembly.dll'

        await artifactManager.processPrivatePackages(
            sampleStartTransformRequest,
            sampleExternalReference,
            sampleArtifactReference
        )

        expect(copyFileCalled).to.be.true
        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(true)
        expect(sampleArtifactReference.netCompatibleRelativePath).to.equal(
            path.join('references', 'thirdpartypackages', 'path/to/assembly.dll').toLowerCase()
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
            NetCompatibleAssemblyRelativePath: 'path/to/assembly.dll',
            NetCompatibleAssemblyPath: 'full/path/to/assembly.dll',
            NetCompatiblePackageVersion: '1.0.0',
            Versions: [],
        }

        sampleStartTransformRequest.PackageReferences = [nonPrivatePackage]
        sampleExternalReference.RelativePath = 'some/path/test-package/more/path/assembly.dll'

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

    it('should not process when assembly is not in reference path', async () => {
        let copyFileCalled = false
        artifactManager.copyFile = async (source: string, destination: string): Promise<void> => {
            copyFileCalled = true
            return Promise.resolve()
        }

        const privatePackage = {
            Id: 'test-package',
            IsPrivatePackage: true,
            NetCompatibleAssemblyRelativePath: 'path/to/testpackage.dll',
            NetCompatibleAssemblyPath: 'full/path/to/testpackage.dll',
            NetCompatiblePackageVersion: '1.0.0',
            Versions: [],
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage]
        sampleExternalReference.RelativePath = 'some/path/different-package/more/path/assembly.dll'

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

    it('should handle multiple packages with same substring', async () => {
        const privatePackage1: PackageReferenceMetadata = {
            Id: 'PNMAC.Core',
            Versions: ['2.27.0', '2.30.0'],
            IsPrivatePackage: true,
            NetCompatibleAssemblyRelativePath: 'PNMAC.Core/lib/net8.0/PNMAC.Core.dll',
            NetCompatibleAssemblyPath:
                'C:/Users/user/AppData/Local/Temp/AwsToolkit/Transforms/Packages/PNMAC.Core/lib/net8.0/PNMAC.Core.dll',
            NetCompatiblePackageVersion: '5.4.1',
        }

        const privatePackage2: PackageReferenceMetadata = {
            Id: 'PNMAC.Core.EntityService',
            Versions: ['2.2.0'],
            IsPrivatePackage: true,
            NetCompatibleAssemblyRelativePath: 'PNMAC.Core.EntityService/lib/net8.0/PNMAC.Core.EntityService.dll',
            NetCompatibleAssemblyPath:
                'C:/Users/user/AppData/Local/Temp/AwsToolkit/Transforms/Packages/PNMAC.Core.EntityService/lib/net8.0/PNMAC.Core.EntityService.dll',
            NetCompatiblePackageVersion: '4.1.0.4',
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage1, privatePackage2]
        sampleExternalReference.RelativePath =
            'references/packages/pnmac.core.entityservice.2.2.0/lib/pnmac.core.entityservice.dll'

        console.log('testing process private packages')
        await artifactManager.processPrivatePackages(
            sampleStartTransformRequest,
            sampleExternalReference,
            sampleArtifactReference
        )

        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(true)
        expect(sampleArtifactReference.packageId).to.equal('PNMAC.Core.EntityService')
        expect(sampleArtifactReference.netCompatibleVersion).to.equal('4.1.0.4')

        sampleExternalReference.RelativePath = 'references/packages/pnmac.core.2.30.0/lib/pnmac.core.dll'

        await artifactManager.processPrivatePackages(
            sampleStartTransformRequest,
            sampleExternalReference,
            sampleArtifactReference
        )

        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(true)
        expect(sampleArtifactReference.packageId).to.equal('PNMAC.Core')
        expect(sampleArtifactReference.netCompatibleVersion).to.equal('5.4.1')
    })
})
