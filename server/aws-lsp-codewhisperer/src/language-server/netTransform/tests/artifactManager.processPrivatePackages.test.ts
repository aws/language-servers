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

        sampleArtifactReference = {
            includedInArtifact: true,
            relativePath: '',
            isThirdPartyPackage: false,
        }
    })

    it('should do nothing when PackageReferences is undefined', async () => {
        sampleStartTransformRequest.PackageReferences = undefined
        artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)
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
            NetCompatibleAssemblyRelativePath: 'path/to/test-package.dll',
            NetCompatibleAssemblyPath: 'full/path/to/test-package.dll',
            NetCompatiblePackageVersion: '2.0.0',
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage]
        sampleArtifactReference.relativePath = 'some/path/test-package/more/path/test-package.dll'

        await artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)

        expect(copyFileCalled).to.be.true
        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(true)
        expect(sampleArtifactReference.netCompatibleRelativePath).to.equal(
            path.join('references', 'thirdpartypackages', 'path/to/test-package.dll').toLowerCase()
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
            NetCompatibleAssemblyRelativePath: 'path/to/test-package.dll',
            NetCompatibleAssemblyPath: 'full/path/to/test-package.dll',
            NetCompatiblePackageVersion: '1.0.0',
            Versions: [],
        }

        sampleStartTransformRequest.PackageReferences = [nonPrivatePackage]
        sampleArtifactReference.relativePath = 'some/path/test-package/more/path/test-package.dll'

        artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)

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
            NetCompatibleAssemblyRelativePath: 'path/to/test-package.dll',
            NetCompatibleAssemblyPath: 'full/path/to/test-package.dll',
            NetCompatiblePackageVersion: '1.0.0',
            Versions: [],
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage]
        sampleArtifactReference.relativePath = 'some/path/different-package/more/path/test-package2.dll'

        artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)

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
        sampleArtifactReference.relativePath =
            'references/packages/pnmac.core.entityservice.2.2.0/lib/pnmac.core.entityservice.dll'

        await artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)

        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(true)
        expect(sampleArtifactReference.packageId).to.equal('PNMAC.Core.EntityService')
        expect(sampleArtifactReference.netCompatibleVersion).to.equal('4.1.0.4')

        sampleArtifactReference.relativePath = 'references/packages/pnmac.core.2.30.0/lib/pnmac.core.dll'

        await artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)

        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(true)
        expect(sampleArtifactReference.packageId).to.equal('PNMAC.Core')
        expect(sampleArtifactReference.netCompatibleVersion).to.equal('5.4.1')
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
        sampleArtifactReference.relativePath = 'some/path/test-package/more/test-package.dll'

        await artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)

        expect(copyFileCalled).to.be.false
        expect(sampleArtifactReference.isThirdPartyPackage).to.equal(true)
        expect(sampleArtifactReference.netCompatibleRelativePath).to.be.undefined
        expect(sampleArtifactReference.netCompatibleVersion).to.be.undefined
    })

    it('should copy source nupkg file and log full path when successful', async () => {
        let copyFileCalled = false
        let copiedSource = ''
        let copiedDestination = ''

        artifactManager.copyFile = async (source: string, destination: string): Promise<void> => {
            copyFileCalled = true
            copiedSource = source
            copiedDestination = destination
            return Promise.resolve()
        }

        artifactManager.normalizePackageFileRelativePath = (filePath: string) => {
            return 'normalized/path/package.nupkg'
        }

        const privatePackage: PackageReferenceMetadata = {
            Id: 'test-package',
            Versions: [],
            IsPrivatePackage: true,
            SourceNupkgFilePath: 'C:/full/path/to/my-package.nupkg',
            NetCompatiblePackageFilePath: 'C:/path/to/package.dll',
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage]

        await artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)

        expect(copyFileCalled).to.be.true
        expect(copiedSource).to.equal('C:/full/path/to/my-package.nupkg')
        expect(copiedDestination).to.equal('mock/workspace/path/normalized/path/package.nupkg')
        expect(mockedLogging.log.calledWith(simon.match('Successfully copy the private package file to artifacts'))).to
            .be.true
        expect(mockedLogging.log.calledWith(simon.match('C:/full/path/to/my-package.nupkg'))).to.be.true
    })

    it('should not copy source nupkg when package is not private', async () => {
        let copyFileCalled = false

        artifactManager.copyFile = async (source: string, destination: string): Promise<void> => {
            copyFileCalled = true
            return Promise.resolve()
        }

        const nonPrivatePackage: PackageReferenceMetadata = {
            Id: 'test-package',
            Versions: [],
            IsPrivatePackage: false,
            SourceNupkgFilePath: 'C:/path/to/package.nupkg',
            NetCompatiblePackageFilePath: 'C:/path/to/package.dll',
        }

        sampleStartTransformRequest.PackageReferences = [nonPrivatePackage]

        await artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)

        expect(copyFileCalled).to.be.false
    })

    it('should not copy source nupkg when SourceNupkgFilePath is undefined', async () => {
        let copyFileCalled = false

        artifactManager.copyFile = async (source: string, destination: string): Promise<void> => {
            copyFileCalled = true
            return Promise.resolve()
        }

        const privatePackage: PackageReferenceMetadata = {
            Id: 'test-package',
            Versions: [],
            IsPrivatePackage: true,
            SourceNupkgFilePath: undefined,
            NetCompatiblePackageFilePath: 'C:/path/to/package.dll',
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage]

        await artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)

        expect(copyFileCalled).to.be.false
    })

    it('should log full file path when copying source nupkg file fails', async () => {
        artifactManager.copyFile = async (source: string, destination: string): Promise<void> => {
            throw new Error('Copy failed')
        }

        artifactManager.normalizePackageFileRelativePath = (filePath: string) => {
            return 'normalized/path/package.nupkg'
        }

        const privatePackage: PackageReferenceMetadata = {
            Id: 'test-package',
            Versions: [],
            IsPrivatePackage: true,
            SourceNupkgFilePath: 'C:/full/path/to/my-package.nupkg',
            NetCompatiblePackageFilePath: 'C:/path/to/package.dll',
        }

        sampleStartTransformRequest.PackageReferences = [privatePackage]

        await artifactManager.processPrivatePackages(sampleStartTransformRequest, sampleArtifactReference)

        expect(mockedLogging.log.calledWith(simon.match('Failed to process private package file'))).to.be.true
        expect(mockedLogging.log.calledWith(simon.match('C:/full/path/to/my-package.nupkg'))).to.be.true
    })
})
