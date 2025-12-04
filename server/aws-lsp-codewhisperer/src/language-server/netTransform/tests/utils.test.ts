import { expect } from 'chai'
import { Utils } from '../utils'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'
import got from 'got'
import AdmZip = require('adm-zip')
import sinon = require('sinon')
import { Readable } from 'stream'

describe('Utils', () => {
    let tempDir: string
    let testFile: string

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'utils-test-'))
        testFile = path.join(tempDir, 'test.txt')
        fs.writeFileSync(testFile, 'test content')
    })

    afterEach(() => {
        sinon.restore()
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
        }
    })

    describe('getSha256Async', () => {
        it('should calculate SHA256 hash of file contents', async () => {
            const result = await Utils.getSha256Async(testFile)

            expect(result).to.be.a('string')
            expect(result).to.have.length.greaterThan(0)
            // Verify it's a valid base64 string
            expect(() => Buffer.from(result, 'base64')).to.not.throw()
        })

        it('should return consistent hash for same content', async () => {
            const result1 = await Utils.getSha256Async(testFile)
            const result2 = await Utils.getSha256Async(testFile)

            expect(result1).to.equal(result2)
        })

        it('should handle empty file', async () => {
            const emptyFile = path.join(tempDir, 'empty.txt')
            fs.writeFileSync(emptyFile, '')

            const result = await Utils.getSha256Async(emptyFile)
            expect(result).to.be.a('string')
        })
    })

    describe('getWorkspacePath', () => {
        it('should create workspace path with UUID', () => {
            const solutionRoot = tempDir
            const result = Utils.getWorkspacePath(solutionRoot)

            expect(result).to.include(solutionRoot)
            expect(result).to.include('artifactWorkspace')
            expect(fs.existsSync(result)).to.be.true
        })

        it('should create different paths on multiple calls', () => {
            const solutionRoot = tempDir
            const result1 = Utils.getWorkspacePath(solutionRoot)
            const result2 = Utils.getWorkspacePath(solutionRoot)

            expect(result1).to.not.equal(result2)
        })

        it('should create directory if it does not exist', () => {
            const solutionRoot = path.join(tempDir, 'new-solution')
            const result = Utils.getWorkspacePath(solutionRoot)

            expect(fs.existsSync(result)).to.be.true
        })
    })

    describe('sleep', () => {
        it('should sleep for specified duration', async () => {
            const start = Date.now()
            await Utils.sleep(50)
            const elapsed = Date.now() - start

            expect(elapsed).to.be.at.least(45) // Allow some tolerance
        })

        it('should handle zero duration', async () => {
            const start = Date.now()
            await Utils.sleep(0)
            const elapsed = Date.now() - start

            expect(elapsed).to.be.at.least(0)
        })

        it('should handle negative duration as zero', async () => {
            const start = Date.now()
            await Utils.sleep(-100)
            const elapsed = Date.now() - start

            expect(elapsed).to.be.at.least(0)
        })

        it('should handle undefined duration', async () => {
            const start = Date.now()
            await Utils.sleep()
            const elapsed = Date.now() - start

            expect(elapsed).to.be.at.least(0)
        })
    })

    describe('uploadArtifact', () => {
        it('should upload artifact successfully', async () => {
            const putStub = sinon.stub(got, 'put').resolves({ statusCode: 200 })
            const createReadStreamStub = sinon.stub(fs, 'createReadStream').returns(new Readable() as fs.ReadStream)

            const result = await Utils.uploadArtifact('http://test-url', testFile, {
                'Content-Type': 'application/zip',
            })

            expect(result).to.be.true
            expect(putStub.calledOnce).to.be.true
            expect(createReadStreamStub.calledOnce).to.be.true
        })

        it('should handle array headers', async () => {
            const putStub = sinon.stub(got, 'put').resolves({ statusCode: 200 })
            const createReadStreamStub = sinon.stub(fs, 'createReadStream').returns(new Readable() as fs.ReadStream)

            const result = await Utils.uploadArtifact('http://test-url', testFile, {
                'Content-Type': ['application/zip'],
            })

            expect(result).to.be.true
        })

        it('should return false on non-200 status', async () => {
            const putStub = sinon.stub(got, 'put').resolves({ statusCode: 400 })
            const createReadStreamStub = sinon.stub(fs, 'createReadStream').returns(new Readable() as fs.ReadStream)

            const result = await Utils.uploadArtifact('http://test-url', testFile)

            expect(result).to.be.false
        })

        it('should return false on error', async () => {
            const putStub = sinon.stub(got, 'put').rejects(new Error('Network error'))
            const createReadStreamStub = sinon.stub(fs, 'createReadStream').returns(new Readable() as fs.ReadStream)

            const result = await Utils.uploadArtifact('http://test-url', testFile)

            expect(result).to.be.false
        })

        it('should upload without headers', async () => {
            const putStub = sinon.stub(got, 'put').resolves({ statusCode: 200 })
            const createReadStreamStub = sinon.stub(fs, 'createReadStream').returns(new Readable() as fs.ReadStream)

            const result = await Utils.uploadArtifact('http://test-url', testFile)

            expect(result).to.be.true
        })
    })

    describe('saveWorklogsToJson', () => {
        it('should create new worklog file', async () => {
            const jobId = 'test-job-id'
            const stepId = 'step1'
            const description = 'Test description'

            await Utils.saveWorklogsToJson(jobId, stepId, description, tempDir)

            const worklogPath = path.join(tempDir, 'artifactWorkspace', jobId, 'worklogs.json')
            expect(fs.existsSync(worklogPath)).to.be.true

            const content = JSON.parse(fs.readFileSync(worklogPath, 'utf8'))
            expect(content[stepId]).to.include(description)
        })

        it('should append to existing worklog file', async () => {
            const jobId = 'test-job-id'
            const stepId = 'step1'
            const description1 = 'First description'
            const description2 = 'Second description'

            await Utils.saveWorklogsToJson(jobId, stepId, description1, tempDir)
            await Utils.saveWorklogsToJson(jobId, stepId, description2, tempDir)

            const worklogPath = path.join(tempDir, 'artifactWorkspace', jobId, 'worklogs.json')
            const content = JSON.parse(fs.readFileSync(worklogPath, 'utf8'))

            expect(content[stepId]).to.include(description1)
            expect(content[stepId]).to.include(description2)
        })

        it('should handle null stepId', async () => {
            const jobId = 'test-job-id'
            const description = 'Test description'

            await Utils.saveWorklogsToJson(jobId, null, description, tempDir)

            const worklogPath = path.join(tempDir, 'artifactWorkspace', jobId, 'worklogs.json')
            const content = JSON.parse(fs.readFileSync(worklogPath, 'utf8'))

            expect(content['Progress']).to.include(description)
        })

        it('should not add duplicate descriptions', async () => {
            const jobId = 'test-job-id'
            const stepId = 'step1'
            const description = 'Test description'

            await Utils.saveWorklogsToJson(jobId, stepId, description, tempDir)
            await Utils.saveWorklogsToJson(jobId, stepId, description, tempDir)

            const worklogPath = path.join(tempDir, 'artifactWorkspace', jobId, 'worklogs.json')
            const content = JSON.parse(fs.readFileSync(worklogPath, 'utf8'))

            expect(content[stepId]).to.have.length(1)
        })
    })

    describe('downloadAndExtractArchive', () => {
        it('should download and extract archive', async () => {
            const mockZipBuffer = Buffer.from('mock zip content')
            const getStub = sinon.stub(got, 'get').resolves({ body: mockZipBuffer })
            const extractStub = sinon.stub(Utils, 'extractArchiveFromBuffer').resolves('/extracted/path')

            const result = await Utils.downloadAndExtractArchive(
                'http://test-url',
                { Authorization: 'Bearer token' },
                tempDir,
                'test.zip'
            )

            expect(result).to.equal('/extracted/path')
            expect(getStub.calledOnce).to.be.true
            expect(extractStub.calledOnce).to.be.true
        })

        it('should handle null headers', async () => {
            const mockZipBuffer = Buffer.from('mock zip content')
            const getStub = sinon.stub(got, 'get').resolves({ body: mockZipBuffer })
            const extractStub = sinon.stub(Utils, 'extractArchiveFromBuffer').resolves('/extracted/path')

            const result = await Utils.downloadAndExtractArchive('http://test-url', null, tempDir, 'test.zip')

            expect(result).to.equal('/extracted/path')
        })
    })

    describe('extractArchiveFromBuffer', () => {
        it('should extract archive from buffer', async () => {
            const extractStub = sinon.stub(Utils, 'extractAllEntriesTo').resolves()
            const directoryExistsStub = sinon.stub(Utils, 'directoryExists').resolves()
            const writeFileSyncStub = sinon.stub(fs, 'writeFileSync')

            // Create a real zip file buffer
            const zipPath = path.join(tempDir, 'test.zip')
            await Utils.zipFile(testFile, zipPath)
            const zipBuffer = fs.readFileSync(zipPath)

            const buffer = [zipBuffer]
            const result = await Utils.extractArchiveFromBuffer('test.zip', buffer, tempDir)

            expect(result).to.equal(tempDir)
            expect(directoryExistsStub.calledOnce).to.be.true
            expect(writeFileSyncStub.calledOnce).to.be.true
            expect(extractStub.calledOnce).to.be.true
        })
    })

    describe('directoryExists', () => {
        it('should not create directory if it exists', async () => {
            const accessStub = sinon.stub(fs.promises, 'access').resolves()
            const mkdirStub = sinon.stub(fs.promises, 'mkdir')

            await Utils.directoryExists(tempDir)

            expect(accessStub.calledOnce).to.be.true
            expect(mkdirStub.called).to.be.false
        })

        it('should create directory if it does not exist', async () => {
            const accessStub = sinon.stub(fs.promises, 'access').rejects(new Error('ENOENT'))
            const mkdirStub = sinon.stub(fs.promises, 'mkdir').resolves()

            await Utils.directoryExists('/non/existent/path')

            expect(accessStub.calledOnce).to.be.true
            expect(mkdirStub.calledOnce).to.be.true
        })
    })

    describe('extractAllEntriesTo', () => {
        it('should extract directory entries', async () => {
            const mkdirStub = sinon.stub(fs.promises, 'mkdir').resolves()
            const writeFileStub = sinon.stub(fs.promises, 'writeFile')

            const entries = [
                {
                    entryName: 'testdir/',
                    isDirectory: true,
                    getData: () => Buffer.from(''),
                },
            ]

            await Utils.extractAllEntriesTo(tempDir, entries as any)

            expect(mkdirStub.calledOnce).to.be.true
            expect(writeFileStub.called).to.be.false
        })

        it('should extract file entries', async () => {
            const mkdirStub = sinon.stub(fs.promises, 'mkdir').resolves()
            const writeFileStub = sinon.stub(fs.promises, 'writeFile').resolves()

            const entries = [
                {
                    entryName: 'test.txt',
                    isDirectory: false,
                    getData: () => Buffer.from('content'),
                },
            ]

            await Utils.extractAllEntriesTo(tempDir, entries as any)

            expect(mkdirStub.calledOnce).to.be.true
            expect(writeFileStub.calledOnce).to.be.true
        })

        it('should handle ENOENT error', async () => {
            const entries = [
                {
                    entryName: 'test.txt',
                    isDirectory: false,
                    getData: () => {
                        const error = new Error('ENOENT') as NodeJS.ErrnoException
                        error.code = 'ENOENT'
                        throw error
                    },
                },
            ]

            try {
                await Utils.extractAllEntriesTo(tempDir, entries as any)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect((error as Error).message).to.include('does not exist')
            }
        })

        it('should rethrow non-ENOENT errors', async () => {
            const entries = [
                {
                    entryName: 'test.txt',
                    isDirectory: false,
                    getData: () => {
                        throw new Error('Other error')
                    },
                },
            ]

            try {
                await Utils.extractAllEntriesTo(tempDir, entries as any)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect((error as Error).message).to.equal('Other error')
            }
        })
    })

    describe('zipFile', () => {
        it('should create zip file from source file', async () => {
            const outputZip = path.join(tempDir, 'output.zip')

            await Utils.zipFile(testFile, outputZip)

            expect(fs.existsSync(outputZip)).to.be.true
        })

        it('should handle archiver errors', async () => {
            const outputZip = path.join(tempDir, 'output.zip')
            const nonExistentFile = path.join(tempDir, 'nonexistent.txt')

            try {
                await Utils.zipFile(nonExistentFile, outputZip)
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).to.be.instanceOf(Error)
            }
        })
    })

    describe('getExpDelayForApiRetryMs', () => {
        it('should calculate exponential delay with jitter', () => {
            const delay0 = Utils.getExpDelayForApiRetryMs(0)
            const delay1 = Utils.getExpDelayForApiRetryMs(1)
            const delay2 = Utils.getExpDelayForApiRetryMs(2)

            expect(delay0).to.be.at.least(10)
            expect(delay0).to.be.at.most(30)
            expect(delay1).to.be.at.least(20)
            expect(delay1).to.be.at.most(40)
            expect(delay2).to.be.at.least(40)
            expect(delay2).to.be.at.most(60)
        })

        it('should include jitter in calculation', () => {
            const delays = Array.from({ length: 10 }, () => Utils.getExpDelayForApiRetryMs(1))
            const uniqueDelays = new Set(delays)

            // With jitter, we should get different values
            expect(uniqueDelays.size).to.be.greaterThan(1)
        })
    })
})
