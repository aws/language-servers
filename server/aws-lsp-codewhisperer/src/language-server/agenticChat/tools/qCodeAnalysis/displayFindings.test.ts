/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { DisplayFindings } from './displayFindings'
import { DISPLAY_FINDINGS_TOOL_NAME } from './displayFindingsConstants'
import * as sinon from 'sinon'
import * as path from 'path'
import { expect } from 'chai'
import { CancellationError } from '@aws/lsp-core'

describe('DisplayFindings', () => {
    let sandbox: sinon.SinonSandbox
    let displayFindings: DisplayFindings
    let mockFeatures: any
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

        mockFeatures = {
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

        displayFindings = new DisplayFindings(mockFeatures)
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe('static properties', () => {
        it('should have correct tool name', () => {
            expect(DisplayFindings.toolName).to.equal(DISPLAY_FINDINGS_TOOL_NAME)
        })

        it('should have tool description', () => {
            expect(DisplayFindings.toolDescription).to.be.a('string')
        })

        it('should have input schema', () => {
            expect(DisplayFindings.inputSchema).to.be.an('object')
        })
    })

    describe('execute', () => {
        let context: any
        let validInput: any

        beforeEach(() => {
            context = {
                cancellationToken: mockCancellationToken,
                writableStream: mockWritableStream,
            }

            validInput = {
                findings: [
                    {
                        filePath: '/test/file.js',
                        startLine: '10',
                        endLine: '15',
                        title: 'Test Issue',
                        description: 'Test description',
                        severity: 'High',
                        language: 'javascript',
                        suggestedFixes: ['Fix suggestion'],
                    },
                ],
            }
        })

        it('should execute successfully with valid input', async () => {
            const result = await displayFindings.execute(validInput, context)

            expect(result.output.success).to.be.true
            expect(result.output.kind).to.equal('json')
            expect(result.output.content).to.be.an('array')
            expect(result.output.content).to.have.length(1)
            expect((result.output.content as any)[0].filePath).to.equal(path.normalize('/test/file.js'))
            expect((result.output.content as any)[0].issues).to.have.length(1)
        })

        it('should handle multiple findings for same file', async () => {
            const inputWithMultipleFindings = {
                findings: [
                    {
                        filePath: '/test/file.js',
                        startLine: '10',
                        endLine: '15',
                        title: 'Issue 1',
                        description: 'Description 1',
                        severity: 'High',
                        language: 'javascript',
                    },
                    {
                        filePath: '/test/file.js',
                        startLine: '20',
                        endLine: '25',
                        title: 'Issue 2',
                        description: 'Description 2',
                        severity: 'Medium',
                        language: 'javascript',
                    },
                ],
            }

            const result = await displayFindings.execute(inputWithMultipleFindings, context)

            expect(result.output.success).to.be.true
            expect(result.output.content).to.have.length(1)
            expect((result.output.content as any)[0].issues).to.have.length(2)
        })

        it('should handle findings for different files', async () => {
            const inputWithDifferentFiles = {
                findings: [
                    {
                        filePath: '/test/file1.js',
                        startLine: '10',
                        endLine: '15',
                        title: 'Issue 1',
                        description: 'Description 1',
                        severity: 'High',
                        language: 'javascript',
                    },
                    {
                        filePath: '/test/file2.py',
                        startLine: '5',
                        endLine: '10',
                        title: 'Issue 2',
                        description: 'Description 2',
                        severity: 'Low',
                        language: 'python',
                    },
                ],
            }

            const result = await displayFindings.execute(inputWithDifferentFiles, context)

            expect(result.output.success).to.be.true
            expect(result.output.content).to.have.length(2)
            expect((result.output.content as any)[0].issues).to.have.length(1)
            expect((result.output.content as any)[1].issues).to.have.length(1)
        })

        it('should handle empty findings array', async () => {
            const emptyInput = { findings: [] }

            const result = await displayFindings.execute(emptyInput, context)

            expect(result.output.success).to.be.true
            expect(result.output.content).to.be.an('array')
            expect(result.output.content).to.have.length(0)
        })

        it('should handle invalid input schema', async () => {
            const invalidInput = {
                findings: [
                    {
                        filePath: '/test/file.js',
                        // Missing required fields
                    },
                ],
            }

            const result = await displayFindings.execute(invalidInput, context)

            expect(result.output.success).to.be.false
            expect((result.output.content as any).errorMessage).to.be.a('string')
        })

        it('should handle cancellation', async () => {
            mockCancellationToken.isCancellationRequested = true

            try {
                await displayFindings.execute(validInput, context)
                expect.fail('Expected cancellation error')
            } catch (error) {
                expect(error).to.be.instanceOf(CancellationError)
            }
        })

        it('should handle unexpected errors gracefully', async () => {
            // Make validateInputAndSetup throw an error
            sandbox.stub(displayFindings as any, 'validateInputAndSetup').rejects(new Error('Unexpected error'))

            const result = await displayFindings.execute(validInput, context)

            expect(result.output.success).to.be.false
            expect((result.output.content as any).errorMessage).to.equal('Unexpected error')
        })
    })

    describe('validateInputAndSetup', () => {
        it('should validate and setup correctly', async () => {
            const input = {
                findings: [
                    {
                        filePath: '/test/file.js',
                        startLine: '10',
                        endLine: '15',
                        title: 'Test Issue',
                        description: 'Test description',
                        severity: 'High',
                        language: 'javascript',
                    },
                ],
            }

            const context = {
                cancellationToken: mockCancellationToken,
                writableStream: mockWritableStream,
            }

            const result = await (displayFindings as any).validateInputAndSetup(input, context)

            expect(result).to.be.an('array')
            expect(result).to.have.length(1)
            expect(result[0].filePath).to.equal('/test/file.js')
        })
    })

    describe('mapToCodeReviewFinding', () => {
        it('should map DisplayFinding to CodeReviewFinding correctly', () => {
            const displayFinding = {
                filePath: '/test/file.js',
                startLine: '10',
                endLine: '15',
                title: 'Test Issue',
                description: 'Test description',
                severity: 'High',
                language: 'javascript',
                suggestedFixes: ['Fix suggestion'],
                comment: 'Test comment',
            }

            const result = (displayFindings as any).mapToCodeReviewFinding(displayFinding)

            expect(result.filePath).to.equal('/test/file.js')
            expect(result.startLine).to.equal(10)
            expect(result.endLine).to.equal(15)
            expect(result.title).to.equal('Test Issue')
            expect(result.comment).to.equal('Test description')
            expect(result.severity).to.equal('High')
            expect(result.language).to.equal('javascript')
            expect(result.suggestedFixes).to.deep.equal(['Fix suggestion'])
            expect(result.detectorName).to.equal('DisplayFindings')
            expect(result.autoDetected).to.be.false
        })

        it('should handle missing suggestedFixes', () => {
            const displayFinding = {
                filePath: '/test/file.js',
                startLine: '10',
                endLine: '15',
                title: 'Test Issue',
                description: 'Test description',
                severity: 'High',
                language: 'javascript',
                comment: 'Test comment',
            }

            const result = (displayFindings as any).mapToCodeReviewFinding(displayFinding)

            expect(result.suggestedFixes).to.deep.equal([])
        })
    })

    describe('aggregateFindingsByFile', () => {
        it('should aggregate findings by file path', () => {
            const findings = [
                {
                    filePath: '/test/file.js',
                    startLine: 10,
                    endLine: 15,
                    title: 'Issue 1',
                    comment: 'Description 1',
                    description: { text: 'Description 1', markdown: 'Description 1' },
                    severity: 'High',
                    language: 'javascript',
                    detectorName: 'DisplayFindings',
                    detectorId: '',
                    findingId: '',
                    relatedVulnerabilities: [],
                    recommendation: { text: '' },
                    suggestedFixes: [],
                    scanJobId: '',
                    autoDetected: false,
                    findingContext: undefined,
                },
                {
                    filePath: '/test/file.js',
                    startLine: 20,
                    endLine: 25,
                    title: 'Issue 2',
                    comment: 'Description 2',
                    description: { text: 'Description 2', markdown: 'Description 2' },
                    severity: 'Medium',
                    language: 'javascript',
                    detectorName: 'DisplayFindings',
                    detectorId: '',
                    findingId: '',
                    relatedVulnerabilities: [],
                    recommendation: { text: '' },
                    suggestedFixes: [],
                    scanJobId: '',
                    autoDetected: false,
                    findingContext: undefined,
                },
            ]

            const result = (displayFindings as any).aggregateFindingsByFile(findings)

            expect(result).to.have.length(1)
            expect(result[0].filePath).to.equal(path.normalize('/test/file.js'))
            expect(result[0].issues).to.have.length(2)
        })

        it('should handle findings from different files', () => {
            const findings = [
                {
                    filePath: '/test/file1.js',
                    startLine: 10,
                    endLine: 15,
                    title: 'Issue 1',
                    comment: 'Description 1',
                    description: { text: 'Description 1', markdown: 'Description 1' },
                    severity: 'High',
                    language: 'javascript',
                    detectorName: 'DisplayFindings',
                    detectorId: '',
                    findingId: '',
                    relatedVulnerabilities: [],
                    recommendation: { text: '' },
                    suggestedFixes: [],
                    scanJobId: '',
                    autoDetected: false,
                    findingContext: undefined,
                },
                {
                    filePath: '/test/file2.py',
                    startLine: 5,
                    endLine: 10,
                    title: 'Issue 2',
                    comment: 'Description 2',
                    description: { text: 'Description 2', markdown: 'Description 2' },
                    severity: 'Low',
                    language: 'python',
                    detectorName: 'DisplayFindings',
                    detectorId: '',
                    findingId: '',
                    relatedVulnerabilities: [],
                    recommendation: { text: '' },
                    suggestedFixes: [],
                    scanJobId: '',
                    autoDetected: false,
                    findingContext: undefined,
                },
            ]

            const result = (displayFindings as any).aggregateFindingsByFile(findings)

            expect(result).to.have.length(2)
            expect(result[0].issues).to.have.length(1)
            expect(result[1].issues).to.have.length(1)
        })
    })

    describe('checkCancellation', () => {
        it('should not throw when cancellation is not requested', () => {
            mockCancellationToken.isCancellationRequested = false
            ;(displayFindings as any).cancellationToken = mockCancellationToken

            expect(() => {
                ;(displayFindings as any).checkCancellation()
            }).to.not.throw()
        })

        it('should throw CancellationError when cancellation is requested', () => {
            mockCancellationToken.isCancellationRequested = true
            ;(displayFindings as any).cancellationToken = mockCancellationToken

            expect(() => {
                ;(displayFindings as any).checkCancellation()
            }).to.throw(CancellationError)
        })
    })
})
