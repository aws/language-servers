/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { QCodeReviewUtils } from './qCodeReviewUtils'
import { SKIP_DIRECTORIES, EXTENSION_TO_LANGUAGE } from './qCodeReviewConstants'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as https from 'https'
import JSZip = require('jszip')
import * as childProcess from 'child_process'
import * as sinon from 'sinon'
import { assert } from 'sinon'
import { expect } from 'chai'
import { CancellationError } from '@aws/lsp-core'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { QCodeReviewMetric } from './qCodeReviewTypes'

describe('QCodeReviewUtils', () => {
    // Sinon sandbox for managing stubs
    let sandbox: sinon.SinonSandbox

    // Mock logging object
    const mockLogging = {
        log: sinon.stub(),
        info: sinon.stub(),
        warn: sinon.stub(),
        error: sinon.stub(),
        debug: sinon.stub(),
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        // Reset stubs
        mockLogging.info.reset()
        mockLogging.warn.reset()
        mockLogging.error.reset()
        mockLogging.debug.reset()
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe('shouldSkipFile', () => {
        it('should skip files with no extension', () => {
            expect(QCodeReviewUtils.shouldSkipFile('file')).to.be.true
        })

        it('should skip files with empty extension', () => {
            expect(QCodeReviewUtils.shouldSkipFile('file.')).to.be.true
        })

        it('should not skip files with supported extensions', () => {
            expect(QCodeReviewUtils.shouldSkipFile('file.js')).to.be.false
            expect(QCodeReviewUtils.shouldSkipFile('file.py')).to.be.false
            expect(QCodeReviewUtils.shouldSkipFile('file.ts')).to.be.false
        })

        it('should skip files with unsupported extensions', () => {
            expect(QCodeReviewUtils.shouldSkipFile('file.xyz')).to.be.true
        })

        it('should handle uppercase extensions', () => {
            expect(QCodeReviewUtils.shouldSkipFile('file.JS')).to.be.false
            expect(QCodeReviewUtils.shouldSkipFile('file.PY')).to.be.false
        })
    })

    describe('shouldSkipDirectory', () => {
        it('should skip directories in the skip list', () => {
            SKIP_DIRECTORIES.forEach(dir => {
                expect(QCodeReviewUtils.shouldSkipDirectory(dir)).to.be.true
            })
        })

        it('should not skip directories not in the skip list', () => {
            expect(QCodeReviewUtils.shouldSkipDirectory('src')).to.be.false
            expect(QCodeReviewUtils.shouldSkipDirectory('app')).to.be.false
        })
    })

    describe('getFolderPath', () => {
        beforeEach(() => {
            // Stub path.extname and path.dirname
            sandbox.stub(path, 'extname').callsFake((p: string) => {
                const lastDotIndex = p.lastIndexOf('.')
                return lastDotIndex !== -1 ? p.substring(lastDotIndex) : ''
            })

            sandbox.stub(path, 'dirname').callsFake((p: string) => {
                const lastSlashIndex = p.lastIndexOf('/')
                return lastSlashIndex !== -1 ? p.substring(0, lastSlashIndex) : p
            })
        })

        it('should return directory path for file paths', () => {
            expect(QCodeReviewUtils.getFolderPath('/path/to/file.js')).to.equal('/path/to')
        })

        it('should return the same path for directory paths', () => {
            expect(QCodeReviewUtils.getFolderPath('/path/to/dir')).to.equal('/path/to/dir')
        })

        it('should handle paths with trailing slashes', () => {
            expect(QCodeReviewUtils.getFolderPath('/path/to/dir/')).to.equal('/path/to/dir')
        })
    })

    describe('logZipSummary', () => {
        it('should log zip summary information', () => {
            const mockZip = {
                files: {
                    'file1.js': { dir: false },
                    'file2.ts': { dir: false },
                    'dir1/': { dir: true },
                    'dir2/': { dir: true },
                    'dir1/file3.py': { dir: false },
                },
            } as unknown as JSZip

            QCodeReviewUtils.logZipSummary(mockZip, mockLogging)

            sinon.assert.calledWith(mockLogging.info, 'Zip summary: 3 files, 2 folders')
            sinon.assert.calledWith(
                mockLogging.info,
                sinon.match(str => str.includes('Zip structure:'))
            )
        })

        it('should handle errors gracefully', () => {
            const mockZip = {} as unknown as JSZip

            QCodeReviewUtils.logZipSummary(mockZip, mockLogging)

            sinon.assert.calledWith(
                mockLogging.warn,
                sinon.match(str => str.includes('Failed to generate zip summary'))
            )
        })
    })

    describe('generateClientToken', () => {
        it('should generate a unique token', () => {
            const token1 = QCodeReviewUtils.generateClientToken()
            const token2 = QCodeReviewUtils.generateClientToken()

            expect(token1).to.match(/^code-scan-\d+-[a-z0-9]+$/)
            expect(token2).to.match(/^code-scan-\d+-[a-z0-9]+$/)
            expect(token1).to.not.equal(token2)
        })
    })

    describe('executeGitCommand', () => {
        it('should execute git command and return output on success', async () => {
            const execStub = sandbox.stub(childProcess, 'exec').callsFake((cmd, callback: any) => {
                callback(null, 'command output', '')
                return {} as childProcess.ChildProcess
            })

            const result = await QCodeReviewUtils.executeGitCommand('git status', 'status', mockLogging)
            expect(result).to.equal('command output')
            sinon.assert.calledWith(execStub, 'git status', sinon.match.func)
        })

        it('should handle errors and return empty string', async () => {
            sandbox.stub(childProcess, 'exec').callsFake((cmd, callback: any) => {
                callback(new Error('git error'), '', 'error output')
                return {} as childProcess.ChildProcess
            })

            const result = await QCodeReviewUtils.executeGitCommand('git status', 'status', mockLogging)
            expect(result).to.equal('')
            sinon.assert.calledWith(
                mockLogging.warn,
                sinon.match(str => str.includes('Git diff failed for status'))
            )
        })
    })

    describe('getGitDiff', () => {
        let getFolderPathStub: sinon.SinonStub
        let executeGitCommandStub: sinon.SinonStub

        beforeEach(() => {
            // Stub getFolderPath and executeGitCommand
            getFolderPathStub = sandbox.stub(QCodeReviewUtils, 'getFolderPath').returns('/mock/path')
            executeGitCommandStub = sandbox.stub(QCodeReviewUtils, 'executeGitCommand')
            executeGitCommandStub.callsFake(async cmd => {
                if (cmd.includes('--staged')) {
                    return 'staged diff'
                }
                return 'unstaged diff'
            })
        })

        it('should get combined git diff for a path', async () => {
            const result = await QCodeReviewUtils.getGitDiff('/mock/path/file.js', mockLogging)
            expect(result).to.equal('unstaged diff\n\nstaged diff')
            sinon.assert.calledTwice(executeGitCommandStub)
        })

        it('should return null if no diff is found', async () => {
            executeGitCommandStub.resolves('')
            const result = await QCodeReviewUtils.getGitDiff('/mock/path/file.js', mockLogging)
            expect(result).to.be.null
        })

        it('should handle errors', async () => {
            executeGitCommandStub.rejects(new Error('git error'))
            const result = await QCodeReviewUtils.getGitDiff('/mock/path/file.js', mockLogging)
            expect(result).to.be.null
            sinon.assert.calledWith(
                mockLogging.error,
                sinon.match(str => str.includes('Error getting git diff'))
            )
        })
    })

    describe('logZipStructure', () => {
        it('should log zip file structure', () => {
            const mockZip = {
                files: {
                    'file1.js': { dir: false },
                    'dir1/': { dir: true },
                    'dir1/file2.ts': { dir: false },
                },
            } as unknown as JSZip

            QCodeReviewUtils.logZipStructure(mockZip, 'test-zip', mockLogging)

            sinon.assert.calledWith(mockLogging.info, 'test-zip zip structure:')
            sinon.assert.calledWith(mockLogging.info, '  file1.js')
            sinon.assert.calledWith(mockLogging.info, '  dir1/file2.ts')
        })
    })

    describe('countZipFiles', () => {
        it('should count files in zip correctly', () => {
            const mockZip = {
                files: {
                    'file1.js': { dir: false },
                    'dir1/': { dir: true },
                    'dir1/file2.ts': { dir: false },
                    'dir2/': { dir: true },
                    'dir2/file3.py': { dir: false },
                },
            } as unknown as JSZip

            const count = QCodeReviewUtils.countZipFiles(mockZip)
            expect(count).to.equal(3)
        })

        it('should return 0 for empty zip', () => {
            const mockZip = { files: {} } as unknown as JSZip
            const count = QCodeReviewUtils.countZipFiles(mockZip)
            expect(count).to.equal(0)
        })
    })

    describe('generateZipBuffer', () => {
        it('should call generateAsync with correct options', async () => {
            const generateAsyncStub = sandbox.stub().resolves(Buffer.from('zip-data'))
            const mockZip = {
                generateAsync: generateAsyncStub,
            } as unknown as JSZip

            await QCodeReviewUtils.generateZipBuffer(mockZip)

            sinon.assert.calledWith(generateAsyncStub, {
                type: 'nodebuffer',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 },
            })
        })
    })

    describe('saveZipToDownloads', () => {
        let homedirStub: sinon.SinonStub
        let pathJoinStub: sinon.SinonStub
        let toISOStringStub: sinon.SinonStub
        let writeFileSyncStub: sinon.SinonStub

        beforeEach(() => {
            homedirStub = sandbox.stub(os, 'homedir').returns('/home/user')
            pathJoinStub = sandbox.stub(path, 'join').callsFake((...args) => args.join('/'))
            toISOStringStub = sandbox.stub(Date.prototype, 'toISOString').returns('2023-01-01T12:00:00.000Z')
            writeFileSyncStub = sandbox.stub(fs, 'writeFileSync')
        })

        it('should save zip buffer to downloads folder', () => {
            const mockBuffer = Buffer.from('zip-data')

            QCodeReviewUtils.saveZipToDownloads(mockBuffer, mockLogging)

            sinon.assert.calledWith(
                writeFileSyncStub,
                '/home/user/Downloads/codeArtifact-2023-01-01T12-00-00-000Z.zip',
                mockBuffer
            )
            sinon.assert.calledWith(
                mockLogging.info,
                sinon.match(str => str.includes('Saved code artifact zip to:'))
            )
        })

        it('should handle errors', () => {
            writeFileSyncStub.throws(new Error('write error'))

            const mockBuffer = Buffer.from('zip-data')
            QCodeReviewUtils.saveZipToDownloads(mockBuffer, mockLogging)

            sinon.assert.calledWith(
                mockLogging.error,
                sinon.match(str => str.includes('Failed to save zip file'))
            )
        })
    })

    describe('processArtifactWithDiff', () => {
        let getGitDiffStub: sinon.SinonStub

        beforeEach(() => {
            getGitDiffStub = sandbox.stub(QCodeReviewUtils, 'getGitDiff').resolves('mock diff')
        })

        it('should return empty string if not a code diff scan', async () => {
            const result = await QCodeReviewUtils.processArtifactWithDiff({ path: '/path/file.js' }, false, mockLogging)
            expect(result).to.equal('')
            sinon.assert.notCalled(getGitDiffStub)
        })

        it('should return diff with newline if code diff scan', async () => {
            const result = await QCodeReviewUtils.processArtifactWithDiff({ path: '/path/file.js' }, true, mockLogging)
            expect(result).to.equal('mock diff\n')
            sinon.assert.calledWith(getGitDiffStub, '/path/file.js', mockLogging)
        })

        it('should handle null diff result', async () => {
            getGitDiffStub.resolves(null)
            const result = await QCodeReviewUtils.processArtifactWithDiff({ path: '/path/file.js' }, true, mockLogging)
            expect(result).to.equal('')
        })

        it('should handle errors', async () => {
            getGitDiffStub.rejects(new Error('diff error'))
            const result = await QCodeReviewUtils.processArtifactWithDiff({ path: '/path/file.js' }, true, mockLogging)
            expect(result).to.equal('')
            sinon.assert.calledWith(
                mockLogging.warn,
                sinon.match(str => str.includes('Failed to get git diff'))
            )
        })
    })

    describe('withErrorHandling', () => {
        it('should return operation result on success', async () => {
            const operation = sandbox.stub().resolves('success')

            const result = await QCodeReviewUtils.withErrorHandling(
                operation,
                'Error message',
                mockLogging,
                '/path/file.js'
            )

            expect(result).to.equal('success')
            sinon.assert.calledOnce(operation)
        })

        it('should handle errors and log them', async () => {
            const error = new Error('operation failed')
            const operation = sandbox.stub().rejects(error)

            try {
                await QCodeReviewUtils.withErrorHandling(operation, 'Error message', mockLogging, '/path/file.js')
                // Should not reach here
                expect.fail('Expected error was not thrown')
            } catch (e: any) {
                // The error message is formatted with the error message prefix
                expect(e.message).to.include('operation failed')
                sinon.assert.calledWith(
                    mockLogging.error,
                    sinon.match(str => str.includes('Error message'))
                )
            }
        })

        it('should handle errors without path', async () => {
            const error = new Error('operation failed')
            const operation = sandbox.stub().rejects(error)

            try {
                await QCodeReviewUtils.withErrorHandling(operation, 'Error message', mockLogging)
                expect.fail('Expected error was not thrown')
            } catch (e: any) {
                expect(e.message).to.include('operation failed')
                sinon.assert.calledWith(
                    mockLogging.error,
                    sinon.match(str => !str.includes('/path/file.js'))
                )
            }
        })
    })

    describe('isAgenticReviewEnabled', () => {
        it('should return true when qCodeReviewInChat is enabled', () => {
            const params = {
                initializationOptions: {
                    aws: {
                        awsClientCapabilities: {
                            q: {
                                qCodeReviewInChat: true,
                            },
                        },
                    },
                },
            }

            expect(QCodeReviewUtils.isAgenticReviewEnabled(params as any)).to.be.true
        })

        it('should return false when qCodeReviewInChat is disabled', () => {
            const params = {
                initializationOptions: {
                    aws: {
                        awsClientCapabilities: {
                            q: {
                                qCodeReviewInChat: false,
                            },
                        },
                    },
                },
            }

            expect(QCodeReviewUtils.isAgenticReviewEnabled(params as any)).to.be.false
        })

        it('should return false when q capabilities are undefined', () => {
            const params = {
                initializationOptions: {
                    aws: {
                        awsClientCapabilities: {},
                    },
                },
            }

            expect(QCodeReviewUtils.isAgenticReviewEnabled(params as any)).to.be.false
        })

        it('should return false when params are undefined', () => {
            expect(QCodeReviewUtils.isAgenticReviewEnabled(undefined)).to.be.false
        })
    })

    describe('convertToUnixPath', () => {
        let normalizeStub: sinon.SinonStub

        beforeEach(() => {
            // We need to directly test the implementation without relying on path.normalize
            normalizeStub = sandbox.stub(path, 'normalize')
        })

        it('should convert Windows path to Unix format', () => {
            // Setup the stub to return a Windows-style normalized path
            normalizeStub.returns('C:\\Users\\test\\file.js')

            const result = QCodeReviewUtils.convertToUnixPath('C:\\Users\\test\\file.js')

            // Verify the regex replacements work correctly
            expect(result).to.match(/^\/Users\/test\/file\.js$/)
        })

        it('should handle paths without drive letter', () => {
            normalizeStub.returns('Users\\test\\file.js')

            const result = QCodeReviewUtils.convertToUnixPath('Users\\test\\file.js')

            // Verify backslashes are converted to forward slashes
            expect(result).to.match(/^Users\/test\/file\.js$/)
        })

        it('should not modify Unix paths', () => {
            normalizeStub.returns('/Users/test/file.js')

            const result = QCodeReviewUtils.convertToUnixPath('/Users/test/file.js')

            // Unix paths should remain unchanged
            expect(result).to.equal('/Users/test/file.js')
        })
    })

    describe('createErrorOutput', () => {
        it('should create standardized error output object', () => {
            const errorObj = { message: 'Test error' }
            const result = QCodeReviewUtils.createErrorOutput(errorObj)

            expect(result).to.deep.equal({
                output: {
                    kind: 'json',
                    content: errorObj,
                    success: false,
                },
            })
        })
    })

    describe('uploadFileToPresignedUrl', () => {
        let httpsRequestStub: sinon.SinonStub
        let requestOnStub: sinon.SinonStub
        let requestWriteStub: sinon.SinonStub
        let requestEndStub: sinon.SinonStub
        let responseOnStub: sinon.SinonStub

        beforeEach(() => {
            requestOnStub = sandbox.stub()
            requestWriteStub = sandbox.stub()
            requestEndStub = sandbox.stub()
            responseOnStub = sandbox.stub()

            const mockRequest = {
                on: requestOnStub,
                write: requestWriteStub,
                end: requestEndStub,
            }

            const mockResponse = {
                statusCode: 200,
                on: responseOnStub,
            }

            httpsRequestStub = sandbox.stub(https, 'request').returns(mockRequest as any)

            // Setup response.on('data') and response.on('end')
            responseOnStub.withArgs('data').callsFake((event, callback) => {
                if (event === 'data') callback('response chunk')
            })

            responseOnStub.withArgs('end').callsFake((event, callback) => {
                if (event === 'end') callback()
            })

            // Setup the request callback to be called with the mock response
            httpsRequestStub.callsFake((options, callback) => {
                callback(mockResponse)
                return mockRequest as any
            })
        })

        it('should upload file to presigned URL successfully', async () => {
            const uploadUrl = 'https://example.com/upload'
            const fileContent = Buffer.from('test content')
            const requestHeaders = { 'Content-Type': 'application/octet-stream' }

            await QCodeReviewUtils.uploadFileToPresignedUrl(uploadUrl, fileContent, requestHeaders, mockLogging)

            sinon.assert.calledOnce(httpsRequestStub)
            sinon.assert.calledWith(requestWriteStub, fileContent)
            sinon.assert.calledOnce(requestEndStub)
            sinon.assert.calledWith(mockLogging.info, sinon.match('File upload completed successfully'))
        })

        it('should handle upload failure with non-200 status code', async () => {
            const uploadUrl = 'https://example.com/upload'
            const fileContent = Buffer.from('test content')
            const requestHeaders = { 'Content-Type': 'application/octet-stream' }

            // Override the response status code
            httpsRequestStub.callsFake((options, callback) => {
                callback({ statusCode: 403, on: responseOnStub })
                return { on: requestOnStub, write: requestWriteStub, end: requestEndStub } as any
            })

            try {
                await QCodeReviewUtils.uploadFileToPresignedUrl(uploadUrl, fileContent, requestHeaders, mockLogging)
                expect.fail('Expected error was not thrown')
            } catch (e: any) {
                expect(e.message).to.include('Upload failed with status code: 403')
            }
        })

        it('should handle network errors during upload', async () => {
            const uploadUrl = 'https://example.com/upload'
            const fileContent = Buffer.from('test content')
            const requestHeaders = { 'Content-Type': 'application/octet-stream' }

            // Create a request object that will emit an error
            const mockRequest = {
                on: sandbox.stub(),
                write: sandbox.stub(),
                end: sandbox.stub(),
            }

            // Make the request emit an error when 'error' event is registered
            mockRequest.on.withArgs('error').callsFake((event, callback) => {
                // Immediately call the callback with an error
                setTimeout(() => callback(new Error('Network error')), 0)
                return mockRequest
            })

            // Make https.request return our mock request
            httpsRequestStub.returns(mockRequest as any)

            try {
                await QCodeReviewUtils.uploadFileToPresignedUrl(uploadUrl, fileContent, requestHeaders, mockLogging)
                expect.fail('Expected error was not thrown')
            } catch (e: any) {
                expect(e.message).to.equal('Network error')
                sinon.assert.calledWith(mockLogging.error, sinon.match('Error uploading file:'))
            }
        })
    })

    describe('checkCancellation', () => {
        it('should not throw when cancellation is not requested', () => {
            const cancellationToken = { isCancellationRequested: false }

            expect(() => {
                QCodeReviewUtils.checkCancellation(cancellationToken as any, mockLogging)
            }).to.not.throw()
        })

        it('should throw CancellationError when cancellation is requested', () => {
            const cancellationToken = { isCancellationRequested: true }

            try {
                QCodeReviewUtils.checkCancellation(cancellationToken as any, mockLogging)
                expect.fail('Expected error was not thrown')
            } catch (e: any) {
                expect(e).to.be.instanceOf(CancellationError)
                sinon.assert.calledWith(mockLogging.info, 'Command execution cancelled')
            }
        })

        it('should use custom message when provided', () => {
            const cancellationToken = { isCancellationRequested: true }
            const customMessage = 'Custom cancellation message'

            try {
                QCodeReviewUtils.checkCancellation(cancellationToken as any, mockLogging, customMessage)
                expect.fail('Expected error was not thrown')
            } catch (e: any) {
                expect(e).to.be.instanceOf(CancellationError)
                sinon.assert.calledWith(mockLogging.info, customMessage)
            }
        })

        it('should not throw when cancellation token is undefined', () => {
            expect(() => {
                QCodeReviewUtils.checkCancellation(undefined, mockLogging)
            }).to.not.throw()
        })
    })

    describe('emitMetric', () => {
        let mockTelemetry: Features['telemetry']

        beforeEach(() => {
            mockTelemetry = {
                emitMetric: sinon.stub(),
            } as unknown as Features['telemetry']
        })

        it('should emit a success metric with all parameters', () => {
            const metric = {
                type: 'CodeScanSuccess',
                result: 'Succeeded',
            } as QCodeReviewMetric

            const metricData = { jobId: '123', scanType: 'full' }
            const credentialStartUrl = 'https://example.com'

            QCodeReviewUtils.emitMetric(metric, metricData, mockLogging, mockTelemetry, credentialStartUrl)

            sinon.assert.calledWith(mockTelemetry.emitMetric as sinon.SinonStub, {
                name: 'amazonq_qCodeReviewTool',
                data: {
                    credentialStartUrl: 'https://example.com',
                    jobId: '123',
                    scanType: 'full',
                    type: 'CodeScanSuccess',
                    result: 'Succeeded',
                },
            })

            sinon.assert.calledWith(mockLogging.info, sinon.match(/Emitting telemetry metric: amazonq_qCodeReviewTool/))
        })

        it('should emit a failure metric with required reason', () => {
            const metric = {
                type: 'CodeScanFailed',
                result: 'Failed',
                reason: 'Required failure reason',
            } as QCodeReviewMetric

            const metricData = { jobId: '456' }

            QCodeReviewUtils.emitMetric(metric, metricData, mockLogging, mockTelemetry)

            sinon.assert.calledWith(mockTelemetry.emitMetric as sinon.SinonStub, {
                name: 'amazonq_qCodeReviewTool',
                data: {
                    jobId: '456',
                    type: 'CodeScanFailed',
                    result: 'Failed',
                    reason: 'Required failure reason',
                },
            })
        })

        it('should handle empty metricData object', () => {
            const metric = {
                type: 'MissingFileOrFolder',
                result: 'Failed',
                reason: 'File not found',
            } as QCodeReviewMetric

            QCodeReviewUtils.emitMetric(metric, {}, mockLogging, mockTelemetry)

            sinon.assert.calledWith(mockTelemetry.emitMetric as sinon.SinonStub, {
                name: 'amazonq_qCodeReviewTool',
                data: {
                    type: 'MissingFileOrFolder',
                    result: 'Failed',
                    reason: 'File not found',
                },
            })
        })
    })
})
