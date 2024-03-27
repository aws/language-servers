import { Logging, Workspace } from '@aws/language-server-runtimes/server-interface'
import * as assert from 'assert'
import { HttpResponse } from 'aws-sdk'
import got from 'got'
import * as Sinon from 'sinon'
import { StubbedInstance, default as simon, stubInterface } from 'ts-sinon'
import { StartCodeAnalysisRequest } from '../../client/token/codewhispererbearertokenclient'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { SecurityScanHandler } from './securityScanHandler'
import { RawCodeScanIssue } from './types'

const mockCodeScanFindings = JSON.stringify([
    {
        filePath: 'app.py',
        startLine: 1,
        endLine: 1,
        title: 'title',
        description: {
            text: 'text',
            markdown: 'markdown',
        },
        detectorId: 'detectorId',
        detectorName: 'detectorName',
        findingId: 'findingId',
        relatedVulnerabilities: [],
        severity: 'High',
        remediation: {
            recommendation: {
                text: 'text',
                url: 'url',
            },
            suggestedFixes: [],
        },
    } satisfies RawCodeScanIssue,
])

const mocked$Response = {
    $response: {
        hasNextPage: simon.mock(),
        nextPage: simon.mock(),
        data: undefined,
        error: undefined,
        requestId: '',
        redirectCount: 0,
        retryCount: 0,
        httpResponse: new HttpResponse(),
    },
}

describe('securityScanHandler', () => {
    let client: StubbedInstance<CodeWhispererServiceToken>
    let workspace: StubbedInstance<Workspace>
    let securityScanhandler: SecurityScanHandler
    const mockedLogging = stubInterface<Logging>()
    beforeEach(async () => {
        // Set up the server with a mock service
        client = stubInterface<CodeWhispererServiceToken>()
        workspace = stubInterface<Workspace>()
        securityScanhandler = new SecurityScanHandler(client, workspace, mockedLogging)
    })

    describe('Test createCodeResourcePresignedUrlHandler', () => {
        let putStub: Sinon.SinonStub
        beforeEach(async () => {
            // mock default return value for createUploadUrl
            client.createUploadUrl.resolves({
                uploadId: 'dummy-upload-id',
                uploadUrl: 'dummy-upload-url',
                kmsKeyArn: 'ResourceArn',
                ...mocked$Response,
            })
            putStub = Sinon.stub(got, 'put').resolves({ statusCode: 'Success' })
        })

        it('returns correct source code', async () => {
            const expectedSourceCode = 'dummy-upload-id'
            const res = await securityScanhandler.createCodeResourcePresignedUrlHandler(Buffer.from('dummy-data'))
            simon.assert.callCount(putStub, 1)
            assert.equal(res.SourceCode, expectedSourceCode)
        })
    })
    describe('Test createScanJob', () => {
        beforeEach(async () => {
            // mock default return value for createCodeScan
            client.startCodeAnalysis.returns(
                Promise.resolve({
                    jobId: 'dummy-job-id',
                    status: 'Pending',
                    ...mocked$Response,
                })
            )
        })

        it('should create code scan', async () => {
            const artifactMap = { SourceCode: 'dummy-upload-id' }
            const requestParams: StartCodeAnalysisRequest = {
                artifacts: { SourceCode: 'dummy-upload-id' },
                programmingLanguage: { languageName: 'csharp' },
            }
            const res = await securityScanhandler.createScanJob(artifactMap, 'csharp')
            simon.assert.calledOnceWithExactly(client.startCodeAnalysis, requestParams)
            assert.equal(res.jobId, 'dummy-job-id')
            assert.equal(res.status, 'Pending')
        })
    })

    describe('Test pollScanJobStatus', () => {
        beforeEach(async () => {
            // mock default return value for getCodeAnalysis
            client.getCodeAnalysis.resolves({
                status: 'Pending',
                ...mocked$Response,
            })
        })

        it('should change job status from pending to completed', async () => {
            client.getCodeAnalysis.onCall(0).resolves({
                status: 'Pending',
                ...mocked$Response,
            })
            client.getCodeAnalysis.onCall(1).resolves({
                status: 'Completed',
                ...mocked$Response,
            })
            const dummyJobId = 'dummy-job-id'
            const requestParams = { jobId: dummyJobId }
            const res = await securityScanhandler.pollScanJobStatus(dummyJobId)
            simon.assert.calledWith(client.getCodeAnalysis, requestParams)
            simon.assert.calledTwice(client.getCodeAnalysis)
            assert.equal(res, 'Completed')
        })

        it('should change job status from pending to failed', async () => {
            client.getCodeAnalysis.onCall(0).resolves({
                status: 'Pending',
                ...mocked$Response,
            })
            client.getCodeAnalysis.onCall(1).resolves({
                status: 'Failed',
                ...mocked$Response,
            })
            const dummyJobId = 'dummy-job-id'
            const requestParams = { jobId: dummyJobId }
            const res = await securityScanhandler.pollScanJobStatus(dummyJobId)
            simon.assert.calledWith(client.getCodeAnalysis, requestParams)
            simon.assert.calledTwice(client.getCodeAnalysis)
            assert.equal(res, 'Failed')
        })
    })

    describe('Test listScanResults', () => {
        beforeEach(() => {
            // mock default return value for listCodeAnalysisFindings
            client.listCodeAnalysisFindings.resolves({
                codeAnalysisFindings: mockCodeScanFindings,
                ...mocked$Response,
            })
            workspace.fs.exists = simon.stub().resolves(true)
        })

        it('should return appropriate issues', async () => {
            const dummyJobId = 'dummy-job-id'
            const codeAnalysisFindingsSchema = 'codeanalysis/findings/1.0'
            const dummyProjectPath = 'C:\\workspace\\workspaceFolder\\python3.7-plain-sam-app\\hello_world'
            const requestParams = { jobId: dummyJobId, codeAnalysisFindingsSchema }

            const aggregatedCodeScanIssueList = await securityScanhandler.listScanResults(dummyJobId, dummyProjectPath)
            simon.assert.calledWith(client.listCodeAnalysisFindings, requestParams)
            assert.equal(aggregatedCodeScanIssueList.length, 1)
            assert.equal(aggregatedCodeScanIssueList[0].issues.length, 1)
        })
        it('should return zero issues', async () => {
            client.listCodeAnalysisFindings.resolves({
                codeAnalysisFindings: '[]',
                ...mocked$Response,
            })
            const dummyJobId = 'dummy-job-id'
            const codeAnalysisFindingsSchema = 'codeanalysis/findings/1.0'
            const dummyProjectPath = 'C:\\workspace\\workspaceFolder\\python3.7-plain-sam-app\\hello_world'
            const requestParams = { jobId: dummyJobId, codeAnalysisFindingsSchema }

            const aggregatedCodeScanIssueList = await securityScanhandler.listScanResults(dummyJobId, dummyProjectPath)
            simon.assert.calledWith(client.listCodeAnalysisFindings, requestParams)
            assert.equal(aggregatedCodeScanIssueList.length, 0)
        })
    })
})
