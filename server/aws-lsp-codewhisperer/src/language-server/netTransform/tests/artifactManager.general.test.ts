import { expect } from 'chai'
import { Workspace, Logging } from '@aws/language-server-runtimes/server-interface'
import { StartTransformRequest } from '../models'
import { ArtifactManager } from '../artifactManager'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { EXAMPLE_REQUEST } from './mockData'
import sinon = require('sinon')
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('ArtifactManager - Complete Coverage', () => {
    let workspace: StubbedInstance<Workspace>
    let artifactManager: ArtifactManager
    let mockedLogging: StubbedInstance<Logging>
    let baseRequest: StartTransformRequest
    let tempDir: string

    const createTestRequest = (overrides: Partial<StartTransformRequest> = {}): StartTransformRequest => ({
        ...EXAMPLE_REQUEST,
        SolutionRootPath: path.join(tempDir, 'solution'),
        SolutionFilePath: path.join(tempDir, 'solution', 'test.sln'),
        SolutionConfigPaths: [path.join(tempDir, 'config.xml')],
        DatabaseSettings: { Tools: [{ Name: 'Test', Properties: {} }] },
        DmsArn: 'arn:aws:dms:region:account:task/test',
        ...overrides,
    })

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-test-'))
        workspace = stubInterface<Workspace>()
        workspace.fs = {
            exists: sinon.stub().resolves(true),
            rm: sinon.stub().resolves(),
        } as any
        mockedLogging = stubInterface<Logging>()
        artifactManager = new ArtifactManager(workspace, mockedLogging, tempDir, path.join(tempDir, 'solution'))
        baseRequest = createTestRequest()
    })

    afterEach(() => {
        sinon.restore()
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
        }
    })

    describe('createTransformationPreferencesContent', () => {
        it('should create valid transformation preferences with database settings', async () => {
            const result = await artifactManager.createTransformationPreferencesContent(baseRequest)

            expect(result).to.have.property('Transformations')
            expect(result).to.have.property('Metadata')
            expect(result.Transformations.DatabaseModernization).to.exist
            expect(result.Transformations.DatabaseModernization?.Enabled).to.be.true
            expect(result.Transformations.DatabaseModernization?.DatabaseSettings).to.deep.equal(
                baseRequest.DatabaseSettings
            )
            expect(result.Transformations.DatabaseModernization?.DmsArn).to.equal(baseRequest.DmsArn)
            expect(result.Metadata.GeneratedAt).to.be.a('string')
        })

        it('should handle DmsArn only scenario', async () => {
            const request = createTestRequest({
                DatabaseSettings: undefined,
                DmsArn: 'arn:aws:dms:test',
            })

            const result = await artifactManager.createTransformationPreferencesContent(request)

            expect(result.Transformations.DatabaseModernization?.DmsArn).to.equal('arn:aws:dms:test')
            expect(result.Transformations.DatabaseModernization?.DatabaseSettings?.Tools).to.have.length(1)
            expect(result.Transformations.DatabaseModernization?.DatabaseSettings?.Tools?.[0].Name).to.equal('DMS')
        })

        it('should handle no database configuration', async () => {
            const request = createTestRequest({
                DatabaseSettings: undefined,
                DmsArn: undefined,
            })

            const result = await artifactManager.createTransformationPreferencesContent(request)
            expect(result.Transformations.DatabaseModernization).to.be.undefined
        })
    })

    describe('removeDir method', () => {
        it('should call workspace.fs.rm when directory exists', async () => {
            await artifactManager.removeDir('test-dir')

            expect((workspace.fs.exists as sinon.SinonStub).calledWith('test-dir')).to.be.true
            expect((workspace.fs.rm as sinon.SinonStub).calledWith('test-dir')).to.be.true
        })

        it('should not call rm when directory does not exist', async () => {
            workspace.fs.exists = sinon.stub().resolves(false)

            await artifactManager.removeDir('test-dir')
            expect((workspace.fs.rm as sinon.SinonStub).called).to.be.false
        })
    })

    describe('cleanup method', () => {
        it('should handle cleanup gracefully when files exist', () => {
            // Create test files
            const artifactFolder = path.join(tempDir, 'artifact')
            const zipFile = path.join(tempDir, 'artifact.zip')
            fs.mkdirSync(artifactFolder, { recursive: true })
            fs.writeFileSync(zipFile, 'test')

            expect(() => artifactManager.cleanup()).to.not.throw()
            expect(fs.existsSync(artifactFolder)).to.be.false
            expect(fs.existsSync(zipFile)).to.be.false
        })

        it('should handle cleanup errors gracefully', () => {
            // Test with non-existent directory
            expect(() => artifactManager.cleanup()).to.not.throw()
        })
    })

    describe('file writing methods', () => {
        it('should write requirement json with correct content', async () => {
            const testDir = path.join(tempDir, 'test-dir')
            fs.mkdirSync(testDir, { recursive: true })
            const testContent = '{"test": "content"}'

            await artifactManager.writeRequirementJsonAsync(testDir, testContent)

            const filePath = path.join(testDir, 'requirement.json')
            expect(fs.existsSync(filePath)).to.be.true
            expect(fs.readFileSync(filePath, 'utf8')).to.equal(testContent)
        })

        it('should write transformation preferences with correct content', async () => {
            const testDir = path.join(tempDir, 'test-dir')
            fs.mkdirSync(testDir, { recursive: true })
            const testContent = '{"preferences": "data"}'

            await artifactManager.writeTransformationPreferencesAsync(testDir, testContent)

            const filePath = path.join(testDir, 'transformation-preferences.json')
            expect(fs.existsSync(filePath)).to.be.true
            expect(fs.readFileSync(filePath, 'utf8')).to.equal(testContent)
        })
    })

    describe('path helper methods', () => {
        it('should normalize source file paths correctly', () => {
            const solutionRoot = path.join('C:', 'solution')
            const filePath = path.join('C:', 'solution', 'src', 'file.cs')

            const result = artifactManager.normalizeSourceFileRelativePath(solutionRoot, filePath)
            expect(result).to.include('sourceCode')
            expect(result).to.include('src')
            expect(result).to.include('file.cs')
        })

        it('should normalize reference file paths correctly', () => {
            const relativePath = path.join('lib', 'test.dll')

            const result = artifactManager.normalizeReferenceFileRelativePath(relativePath, true)
            expect(result).to.include('references')
            expect(result).to.include('lib')
            expect(result).to.include('test.dll')
        })

        it('should normalize package file paths correctly', () => {
            const packagePath = path.join('C:', 'packages', 'test.nupkg')

            const result = artifactManager.normalizePackageFileRelativePath(packagePath)
            expect(result).to.include('packages')
            expect(result).to.include('test.nupkg')
        })
    })

    describe('getSha256Async static method', () => {
        it('should calculate SHA256 hash for existing file', async () => {
            const testFile = path.join(tempDir, 'test.txt')
            const testContent = 'test content for hashing'
            fs.writeFileSync(testFile, testContent)

            const result = await ArtifactManager.getSha256Async(testFile)

            expect(result).to.be.a('string')
            expect(result).to.have.length.greaterThan(0)
            // Verify it's a valid base64 string
            expect(() => Buffer.from(result, 'base64')).to.not.throw()
        })
    })

    describe('zipArtifact method', () => {
        it('should return empty string when artifact folder does not exist', async () => {
            const result = await artifactManager.zipArtifact()
            expect(result).to.equal('')
        })

        it('should create zip path when artifact folder exists', async () => {
            const artifactFolder = path.join(tempDir, 'artifact')
            fs.mkdirSync(artifactFolder, { recursive: true })
            fs.writeFileSync(path.join(artifactFolder, 'test.txt'), 'test')

            // Mock zipDirectory to avoid actual zip creation
            sinon.stub(artifactManager, 'zipDirectory').resolves()

            const result = await artifactManager.zipArtifact()
            expect(result).to.include('artifact.zip')
            expect(path.isAbsolute(result)).to.be.true
        })
    })

    describe('copySolutionConfigFiles', () => {
        it('should process config files when present', async () => {
            const copyStub = sinon.stub(artifactManager, 'copySourceFile').resolves()
            const request = createTestRequest({
                SolutionConfigPaths: ['config1.xml', 'config2.json'],
            })

            await artifactManager.copySolutionConfigFiles(request)

            expect(copyStub.callCount).to.equal(2)
            expect(copyStub.firstCall.args[1]).to.equal('config1.xml')
            expect(copyStub.secondCall.args[1]).to.equal('config2.json')
        })

        it('should handle empty config paths array', async () => {
            const copyStub = sinon.stub(artifactManager, 'copySourceFile').resolves()
            const request = createTestRequest({ SolutionConfigPaths: [] })

            await artifactManager.copySolutionConfigFiles(request)
            expect(copyStub.called).to.be.false
        })
    })

    describe('removeDuplicateNugetPackagesFolder', () => {
        it('should remove packages folder when it exists', async () => {
            const packagesFolder = path.join(tempDir, 'artifact', 'sourceCode', 'packages')
            fs.mkdirSync(packagesFolder, { recursive: true })
            fs.writeFileSync(path.join(packagesFolder, 'test.nupkg'), 'test')

            await artifactManager.removeDuplicateNugetPackagesFolder(baseRequest)
            expect(fs.existsSync(packagesFolder)).to.be.false
        })

        it('should handle non-existent packages folder gracefully', async () => {
            await artifactManager.removeDuplicateNugetPackagesFolder(baseRequest)
            // Should not throw
        })
    })

    describe('shouldFilterFile', () => {
        it('should filter filetypes', async () => {
            expect(artifactManager.shouldFilterFile('test.cs')).to.be.false
            expect(artifactManager.shouldFilterFile('test.jfm.cs')).to.be.false
            expect(artifactManager.shouldFilterFile('test.jfm')).to.be.true
        })

        it('should filter directories', async () => {
            const unfilteredString = path.join('test', 'solution', 'test.cs')
            const filteredString = path.join('test', 'artifactworkspace', 'test.cs')
            const filteredStringWithCasing = path.join('test', 'ArtifactWorkspace', 'test.cs')
            const hardCodeFilterString = '\\test\\.GIT\\test.cs'

            expect(artifactManager.shouldFilterFile(unfilteredString)).to.be.false
            expect(artifactManager.shouldFilterFile(filteredString)).to.be.true
            expect(artifactManager.shouldFilterFile(filteredStringWithCasing)).to.be.true
            expect(artifactManager.shouldFilterFile(hardCodeFilterString)).to.be.true
        })
    })
})
