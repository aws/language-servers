/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { CodeReview } from './codeReview'
import { CodeReviewUtils } from './codeReviewUtils'
import { CODE_REVIEW_TOOL_NAME, FULL_REVIEW, CODE_DIFF_REVIEW } from './codeReviewConstants'
import * as sinon from 'sinon'
import * as path from 'path'
import { expect } from 'chai'
import { CancellationError } from '@aws/lsp-core'
import * as JSZip from 'jszip'

describe('CodeReview', () => {
    let sandbox: sinon.SinonSandbox
    let codeReview: CodeReview
    let mockFeatures: any
    let mockCodeWhispererClient: any
    let mockCancellationToken: any
    let mockWritableStream: any
    let mockWriter: any

    beforeEach(() => {
        sandbox = sinon.createSandbox()

        mockWriter = {
            write: sandbox.stub().resolves(),
            close: sandbox.stub().resolves(),
            releaseLock: sandbox.stub(),
        }

        mockWritableStream = {
            getWriter: sandbox.stub().returns(mockWriter),
        }

        mockCancellationToken = {
            isCancellationRequested: false,
        }

        mockCodeWhispererClient = {
            createUploadUrl: sandbox.stub(),
            startCodeAnalysis: sandbox.stub(),
            getCodeAnalysis: sandbox.stub(),
            listCodeAnalysisFindings: sandbox.stub(),
        }

        mockFeatures = {
            credentialsProvider: {
                getConnectionMetadata: sandbox.stub().returns({ sso: { startUrl: 'https://test.com' } }),
            },
            logging: {
                info: sandbox.stub(),
                warn: sandbox.stub(),
                error: sandbox.stub(),
                debug: sandbox.stub(),
            },
            telemetry: {
                emitMetric: sandbox.stub(),
            },
            workspace: {
                fs: {
                    readFile: sandbox.stub(),
                    readdir: sandbox.stub(),
                },
            },
        }

        codeReview = new CodeReview(mockFeatures)
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe('static properties', () => {
        it('should have correct tool name', () => {
            expect(CodeReview.toolName).to.equal(CODE_REVIEW_TOOL_NAME)
        })

        it('should have tool description', () => {
            expect(CodeReview.toolDescription).to.be.a('string')
        })

        it('should have input schema', () => {
            expect(CodeReview.inputSchema).to.be.an('object')
        })
    })

    describe('execute', () => {
        let context: any
        let validInput: any

        beforeEach(() => {
            context = {
                cancellationToken: mockCancellationToken,
                writableStream: mockWritableStream,
                codeWhispererClient: mockCodeWhispererClient,
            }

            validInput = {
                fileLevelArtifacts: [{ path: '/test/file.js', programmingLanguage: 'javascript' }],
                folderLevelArtifacts: [],
                ruleArtifacts: [],
                scopeOfReview: FULL_REVIEW,
            }
        })

        it('should execute successfully with valid input', async () => {
            // Setup mocks for successful execution
            mockCodeWhispererClient.createUploadUrl.resolves({
                uploadUrl: 'https://upload.com',
                uploadId: 'upload-123',
                requestHeaders: {},
            })

            mockCodeWhispererClient.startCodeAnalysis.resolves({
                jobId: 'job-123',
                status: 'Pending',
            })

            mockCodeWhispererClient.getCodeAnalysis.resolves({
                status: 'Completed',
            })

            mockCodeWhispererClient.listCodeAnalysisFindings.resolves({
                codeAnalysisFindings: '[]',
                nextToken: undefined,
            })

            sandbox.stub(CodeReviewUtils, 'uploadFileToPresignedUrl').resolves()
            sandbox.stub(codeReview as any, 'prepareFilesAndFoldersForUpload').resolves({
                zipBuffer: Buffer.from('test'),
                md5Hash: 'hash123',
                isCodeDiffPresent: false,
                programmingLanguages: new Set(['javascript']),
            })
            sandbox.stub(codeReview as any, 'parseFindings').returns([])

            const result = await codeReview.execute(validInput, context)

            expect(result.output.success).to.be.true
            expect(result.output.kind).to.equal('json')
        })

        it('should handle missing client error', async () => {
            context.codeWhispererClient = undefined

            try {
                await codeReview.execute(validInput, context)
                expect.fail('Expected exception to be thrown')
            } catch (error: any) {
                expect(error.message).to.equal('CodeWhisperer client not available')
            }
        })

        it('should handle missing artifacts error', async () => {
            const invalidInput = {
                fileLevelArtifacts: [],
                folderLevelArtifacts: [],
                ruleArtifacts: [],
                scopeOfReview: FULL_REVIEW,
            }

            try {
                await codeReview.execute(invalidInput, context)
                expect.fail('Expected exception to be thrown')
            } catch (error: any) {
                expect(error.message).to.include(
                    'Missing fileLevelArtifacts and folderLevelArtifacts for codeReview tool'
                )
            }
        })

        it('should handle upload failure', async () => {
            mockCodeWhispererClient.createUploadUrl.resolves({
                uploadUrl: undefined,
                uploadId: undefined,
            })

            sandbox.stub(codeReview as any, 'prepareFilesAndFoldersForUpload').resolves({
                zipBuffer: Buffer.from('test'),
                md5Hash: 'hash123',
                isCodeDiffPresent: false,
                programmingLanguages: new Set(['javascript']),
            })

            try {
                await codeReview.execute(validInput, context)
                expect.fail('Expected exception to be thrown')
            } catch (error: any) {
                expect(error.message).to.include('Failed to upload artifact')
            }
        })

        it('should handle analysis start failure', async () => {
            mockCodeWhispererClient.createUploadUrl.resolves({
                uploadUrl: 'https://upload.com',
                uploadId: 'upload-123',
                requestHeaders: {},
            })

            mockCodeWhispererClient.startCodeAnalysis.resolves({
                jobId: undefined,
            })

            sandbox.stub(CodeReviewUtils, 'uploadFileToPresignedUrl').resolves()
            sandbox.stub(codeReview as any, 'prepareFilesAndFoldersForUpload').resolves({
                zipBuffer: Buffer.from('test'),
                md5Hash: 'hash123',
                isCodeDiffPresent: false,
                programmingLanguages: new Set(['javascript']),
            })

            try {
                await codeReview.execute(validInput, context)
                expect.fail('Expected exception to be thrown')
            } catch (error: any) {
                expect(error.message).to.include('Failed to start code analysis')
            }
        })

        it('should handle scan timeout', async () => {
            mockCodeWhispererClient.createUploadUrl.resolves({
                uploadUrl: 'https://upload.com',
                uploadId: 'upload-123',
                requestHeaders: {},
            })

            mockCodeWhispererClient.startCodeAnalysis.resolves({
                jobId: 'job-123',
                status: 'Pending',
            })

            // Always return Pending status to simulate timeout
            mockCodeWhispererClient.getCodeAnalysis.resolves({
                status: 'Pending',
            })

            sandbox.stub(CodeReviewUtils, 'uploadFileToPresignedUrl').resolves()
            sandbox.stub(codeReview as any, 'prepareFilesAndFoldersForUpload').resolves({
                zipBuffer: Buffer.from('test'),
                md5Hash: 'hash123',
                isCodeDiffPresent: false,
                programmingLanguages: new Set(['javascript']),
            })

            // Stub setTimeout to avoid actual delays
            const setTimeoutStub = sandbox.stub(global, 'setTimeout')
            setTimeoutStub.callsFake((callback: Function) => {
                callback()
                return {} as any
            })

            try {
                await codeReview.execute(validInput, context)
                expect.fail('Expected exception to be thrown')
            } catch (error: any) {
                expect(error.message).to.include('Code review timed out')
            }
        })

        it('should handle cancellation', async () => {
            mockCancellationToken.isCancellationRequested = true

            try {
                await codeReview.execute(validInput, context)
                expect.fail('Expected cancellation error')
            } catch (error) {
                expect(error).to.be.instanceOf(CancellationError)
            }
        })
    })

    describe('validateInputAndSetup', () => {
        it('should validate and setup correctly for file artifacts', async () => {
            const input = {
                fileLevelArtifacts: [{ path: '/test/file.js' }],
                folderLevelArtifacts: [],
                ruleArtifacts: [],
                scopeOfReview: FULL_REVIEW,
            }

            const context = {
                cancellationToken: mockCancellationToken,
                writableStream: mockWritableStream,
                codeWhispererClient: mockCodeWhispererClient,
            }

            const result = await (codeReview as any).validateInputAndSetup(input, context)

            expect(result.fileArtifacts).to.have.length(1)
            expect(result.folderArtifacts).to.have.length(0)
            expect(result.isFullReviewRequest).to.be.true
            expect(result.artifactType).to.equal('FILE')
            expect(result.programmingLanguage).to.equal('java')
            expect(result.scanName).to.match(/^Standard-/)
        })

        it('should validate and setup correctly for folder artifacts', async () => {
            const input = {
                fileLevelArtifacts: [],
                folderLevelArtifacts: [{ path: '/test/folder' }],
                ruleArtifacts: [],
                scopeOfReview: CODE_DIFF_REVIEW,
            }

            const context = {
                cancellationToken: mockCancellationToken,
                writableStream: mockWritableStream,
                codeWhispererClient: mockCodeWhispererClient,
            }

            const result = await (codeReview as any).validateInputAndSetup(input, context)

            expect(result.fileArtifacts).to.have.length(0)
            expect(result.folderArtifacts).to.have.length(1)
            expect(result.isFullReviewRequest).to.be.false
            expect(result.artifactType).to.equal('FOLDER')
        })
    })

    describe('prepareFilesAndFoldersForUpload', () => {
        beforeEach(() => {
            mockFeatures.workspace.fs.readFile.resolves(Buffer.from('file content'))
            mockFeatures.workspace.fs.readdir.resolves([
                { name: 'file.js', parentPath: '/test', isFile: () => true, isDirectory: () => false },
            ])

            sandbox.stub(require('fs'), 'existsSync').returns(true)
            sandbox.stub(require('fs'), 'statSync').returns({ isFile: () => true })
        })

        it('should prepare files and folders for upload', async () => {
            const fileArtifacts = [{ path: '/test/file.js' }]
            const folderArtifacts = [{ path: '/test/folder' }]
            const ruleArtifacts: any[] = []

            const result = await (codeReview as any).prepareFilesAndFoldersForUpload(
                fileArtifacts,
                folderArtifacts,
                ruleArtifacts,
                false
            )

            expect(result.zipBuffer).to.be.instanceOf(Buffer)
            expect(result.md5Hash).to.be.a('string')
            expect(result.isCodeDiffPresent).to.be.a('boolean')
        })

        it('should handle code diff generation', async () => {
            const fileArtifacts = [{ path: '/test/file.js' }]
            const folderArtifacts: any[] = []
            const ruleArtifacts: any[] = []

            sandbox.stub(CodeReviewUtils, 'processArtifactWithDiff').resolves('diff content\n')

            const result = await (codeReview as any).prepareFilesAndFoldersForUpload(
                fileArtifacts,
                folderArtifacts,
                ruleArtifacts,
                true
            )

            expect(result.isCodeDiffPresent).to.be.true
        })

        it('should throw error when no valid files to scan', async () => {
            const fileArtifacts: any[] = []
            const folderArtifacts: any[] = []
            const ruleArtifacts = [{ path: '/test/rule.json' }]

            // Mock countZipFiles to return only rule artifacts count
            sandbox.stub(CodeReviewUtils, 'countZipFiles').returns(1)

            try {
                await (codeReview as any).prepareFilesAndFoldersForUpload(
                    fileArtifacts,
                    folderArtifacts,
                    ruleArtifacts,
                    false
                )
                expect.fail('Expected error was not thrown')
            } catch (error: any) {
                expect(error.message).to.include('There are no valid files to scan')
            }
        })
    })

    describe('collectFindings', () => {
        beforeEach(() => {
            // Set up the client in the instance
            ;(codeReview as any).codeWhispererClient = mockCodeWhispererClient
        })

        it('should collect findings for full review', async () => {
            const mockFindings = [
                { findingId: '1', severity: 'HIGH', findingContext: 'Full' },
                { findingId: '2', severity: 'MEDIUM', findingContext: 'Full' },
            ]

            mockCodeWhispererClient.listCodeAnalysisFindings.resolves({
                codeAnalysisFindings: JSON.stringify(mockFindings),
                nextToken: undefined,
            })

            sandbox.stub(codeReview as any, 'parseFindings').returns(mockFindings)

            const result = await (codeReview as any).collectFindings('job-123', true, false, 'javascript')

            expect(result.totalFindings).to.have.length(2)
            expect(result.findingsExceededLimit).to.be.false
        })

        it('should filter findings for code diff review', async () => {
            const mockFindings = [
                { findingId: '1', severity: 'HIGH', findingContext: 'CodeDiff' },
                { findingId: '2', severity: 'MEDIUM', findingContext: 'Full' },
            ]

            mockCodeWhispererClient.listCodeAnalysisFindings.resolves({
                codeAnalysisFindings: JSON.stringify(mockFindings),
                nextToken: undefined,
            })

            sandbox.stub(codeReview as any, 'parseFindings').returns(mockFindings)

            const result = await (codeReview as any).collectFindings('job-123', false, true, 'javascript')

            expect(result.totalFindings).to.have.length(1)
            expect(result.totalFindings[0].findingContext).to.equal('CodeDiff')
        })

        it('should handle pagination', async () => {
            const mockFindings1 = [{ findingId: '1', severity: 'HIGH' }]
            const mockFindings2 = [{ findingId: '2', severity: 'MEDIUM' }]

            mockCodeWhispererClient.listCodeAnalysisFindings
                .onFirstCall()
                .resolves({
                    codeAnalysisFindings: JSON.stringify(mockFindings1),
                    nextToken: 'token123',
                })
                .onSecondCall()
                .resolves({
                    codeAnalysisFindings: JSON.stringify(mockFindings2),
                    nextToken: undefined,
                })

            sandbox
                .stub(codeReview as any, 'parseFindings')
                .onFirstCall()
                .returns(mockFindings1)
                .onSecondCall()
                .returns(mockFindings2)

            const result = await (codeReview as any).collectFindings('job-123', true, false, 'javascript')

            expect(result.totalFindings).to.have.length(2)
            sinon.assert.calledTwice(mockCodeWhispererClient.listCodeAnalysisFindings)
        })
    })

    describe('aggregateFindingsByFile', () => {
        it('should aggregate findings by file path', () => {
            const mockFindings = [
                {
                    findingId: '1',
                    title: 'Test Issue',
                    description: { text: 'Test description', markdown: 'Test **description**' },
                    startLine: 10,
                    endLine: 15,
                    severity: 'HIGH',
                    filePath: '/test/file.js',
                    detectorId: 'detector1',
                    detectorName: 'Test Detector',
                    ruleId: 'rule1',
                    relatedVulnerabilities: [],
                    remediation: { recommendation: { text: 'Fix this', url: null } },
                    suggestedFixes: [],
                    comment: 'Test Issue: Test description',
                    recommendation: { text: 'Fix this', url: null },
                    scanJobId: 'job-123',
                    language: 'javascript',
                    autoDetected: false,
                    findingContext: 'Full',
                } as any,
            ]

            const fileArtifacts = [{ path: '/test/file.js' }]
            const folderArtifacts: any[] = []

            sandbox.stub(codeReview as any, 'resolveFilePath').returns('/test/file.js')

            const result = (codeReview as any).aggregateFindingsByFile(mockFindings, fileArtifacts, folderArtifacts)

            expect(result).to.have.length(1)
            expect(result[0].filePath).to.equal('/test/file.js')
            expect(result[0].issues).to.have.length(1)
        })
    })

    describe('resolveFilePath', () => {
        let existsSyncStub: sinon.SinonStub
        let statSyncStub: sinon.SinonStub

        beforeEach(() => {
            existsSyncStub = sandbox.stub(require('fs'), 'existsSync').returns(true)
            statSyncStub = sandbox.stub(require('fs'), 'statSync').returns({ isFile: () => true })
        })

        it('should resolve file path from file artifacts', () => {
            const filePath = path.resolve('/project/src/file.js')
            const fileArtifacts = [{ path: filePath }]
            const folderArtifacts: any[] = []

            const result = (codeReview as any).resolveFilePath('src/file.js', fileArtifacts, folderArtifacts)

            expect(result).to.equal(filePath)
        })

        it('should resolve file path from folder artifacts', () => {
            const fileArtifacts: any[] = []
            const folderArtifacts = [{ path: path.resolve('/project/src') }]

            const result = (codeReview as any).resolveFilePath('file.js', fileArtifacts, folderArtifacts)

            expect(result).to.equal(path.resolve('/project/src/file.js'))
        })

        it('should resolve file path with common suffix matching', () => {
            const fileArtifacts: any[] = []
            const folderArtifacts = [{ path: path.resolve('/project/src/main') }]

            existsSyncStub.returns(true)
            statSyncStub.returns({ isFile: () => true })

            const result = (codeReview as any).resolveFilePath('src/main/java/App.java', fileArtifacts, folderArtifacts)

            expect(result).to.equal(path.resolve('/project/src/main/java/App.java'))
        })

        it('should return null for unresolvable paths', () => {
            existsSyncStub.returns(false)

            const fileArtifacts: any[] = []
            const folderArtifacts: any[] = []

            const result = (codeReview as any).resolveFilePath('nonexistent.js', fileArtifacts, folderArtifacts)

            expect(result).to.be.null
        })
    })

    describe('checkCancellation', () => {
        it('should not throw when cancellation is not requested', () => {
            mockCancellationToken.isCancellationRequested = false

            expect(() => {
                ;(codeReview as any).checkCancellation()
            }).to.not.throw()
        })

        it('should throw CancellationError when cancellation is requested', () => {
            mockCancellationToken.isCancellationRequested = true

            // Set up the cancellation token in the instance
            ;(codeReview as any).cancellationToken = mockCancellationToken

            expect(() => {
                ;(codeReview as any).checkCancellation()
            }).to.throw(CancellationError)
        })
    })

    describe('error handling', () => {
        it('should handle unexpected errors gracefully', async () => {
            const context = {
                cancellationToken: mockCancellationToken,
                writableStream: mockWritableStream,
                codeWhispererClient: mockCodeWhispererClient,
            }

            const input = {
                fileLevelArtifacts: [{ path: '/test/file.js' }],
                folderLevelArtifacts: [],
                ruleArtifacts: [],
                scopeOfReview: FULL_REVIEW,
            }

            // Make prepareFilesAndFoldersForUpload throw an error
            sandbox.stub(codeReview as any, 'prepareFilesAndFoldersForUpload').rejects(new Error('Unexpected error'))

            try {
                await codeReview.execute(input, context)
                expect.fail('Expected exception to be thrown')
            } catch (error: any) {
                expect(error.message).to.equal('Unexpected error')
            }
        })
    })
})
