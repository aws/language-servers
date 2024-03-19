import {
    Logging,
    Workspace,
    CancellationToken,
    CancellationTokenSource,
} from '@aws/language-server-runtimes/server-interface'
import got from 'got'
import { md5 } from 'js-md5'
import * as path from 'path'

import {
    ArtifactMap,
    CreateUploadUrlRequest,
    CreateUploadUrlResponse,
    GetCodeAnalysisRequest,
    ListCodeAnalysisFindingsRequest,
    StartCodeAnalysisRequest,
} from '../../client/token/codewhispererbearertokenclient'
import { CodeWhispererServiceToken } from '../codeWhispererService'
import { sleep } from '../dependencyGraph/commonUtil'
import { AggregatedCodeScanIssue, RawCodeScanIssue } from './types'

export class SecurityScanHandler {
    private client: CodeWhispererServiceToken
    private workspace: Workspace
    private logging: Logging
    public tokenSource: CancellationTokenSource

    constructor(client: CodeWhispererServiceToken, workspace: Workspace, logging: Logging) {
        this.client = client
        this.workspace = workspace
        this.logging = logging
        this.tokenSource = new CancellationTokenSource()
    }

    getMd5(content: Buffer) {
        return md5.base64(content)
    }

    throwIfCancelled(token: CancellationToken) {
        if (token.isCancellationRequested) {
            this.tokenSource.dispose()
            this.tokenSource = new CancellationTokenSource()
            throw new SecurityScanCancelledError('Security Scan has been cancelled')
        }
    }

    cancelSecurityScan() {
        this.tokenSource.cancel()
    }

    async createCodeResourcePresignedUrlHandler(zipContent: Buffer) {
        const request: CreateUploadUrlRequest = {
            contentMd5: this.getMd5(zipContent),
            artifactType: 'SourceCode',
        }
        try {
            this.logging.log('Prepare for uploading src context...')
            const response = await this.client.createUploadUrl(request)
            this.logging.log(`Request id: ${response.$response.requestId}`)
            this.logging.log(`Complete Getting presigned Url for uploading src context.`)
            this.logging.log(`Uploading src context...`)
            await this.uploadArtifactToS3(zipContent, response)
            this.logging.log(`Complete uploading src context.`)

            const artifactMap: ArtifactMap = {
                SourceCode: response.uploadId,
            }
            return artifactMap
        } catch (error) {
            this.logging.log(`Error creating upload artifacts url: ${error}`)
            throw error
        }
    }

    async uploadArtifactToS3(zipBuffer: Buffer, resp: CreateUploadUrlResponse) {
        const encryptionContext = `{"uploadId":"${resp.uploadId}"}`
        const md5Content = this.getMd5(zipBuffer)
        const headersObj =
            resp.kmsKeyArn !== '' || resp.kmsKeyArn !== undefined
                ? {
                      'Content-MD5': md5Content,
                      'x-amz-server-side-encryption': 'aws:kms',
                      'Content-Type': 'application/zip',
                      'x-amz-server-side-encryption-aws-kms-key-id': resp.kmsKeyArn,
                      'x-amz-server-side-encryption-context': Buffer.from(encryptionContext, 'utf8').toString('base64'),
                  }
                : {
                      'Content-MD5': md5Content,
                      'x-amz-server-side-encryption': 'aws:kms',
                      'Content-Type': 'application/zip',
                      'x-amz-server-side-encryption-context': Buffer.from(encryptionContext, 'utf8').toString('base64'),
                  }
        const response = await got.put(resp.uploadUrl, {
            body: zipBuffer,
            headers: headersObj,
        })
        this.logging.log(`StatusCode: ${response.statusCode}`)
    }

    async createScanJob(artifactMap: ArtifactMap, languageName: string) {
        const req: StartCodeAnalysisRequest = {
            artifacts: artifactMap,
            programmingLanguage: {
                languageName,
            },
        }
        this.logging.log(`Creating scan job...`)
        try {
            const resp = await this.client.startCodeAnalysis(req)
            this.logging.log(`Request id: ${resp.$response.requestId}`)
            return resp
        } catch (error) {
            this.logging.log(`Error while creating scan job: ${error}`)
            throw error
        }
    }
    async pollScanJobStatus(jobId: string) {
        this.logging.log(`Polling scan job status...`)
        let status = 'Pending'
        let timer = 0
        const codeScanJobPollingIntervalSeconds = 1
        const codeScanJobTimeoutSeconds = 50
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const req: GetCodeAnalysisRequest = {
                jobId: jobId,
            }
            const resp = await this.client.getCodeAnalysis(req)
            this.logging.log(`Request id: ${resp.$response.requestId}`)

            if (resp.status !== 'Pending') {
                status = resp.status
                this.logging.log(`Scan job status: ${status}`)
                this.logging.log(`Complete Polling scan job status.`)
                break
            }
            await sleep(codeScanJobPollingIntervalSeconds * 1000)
            timer += codeScanJobPollingIntervalSeconds
            if (timer > codeScanJobTimeoutSeconds) {
                this.logging.log(`Scan job status: ${status}`)
                this.logging.log(`Scan job timeout.`)
                throw new Error('Scan job timeout.')
            }
        }
        return status
    }

    async listScanResults(jobId: string, projectPath: string) {
        const request: ListCodeAnalysisFindingsRequest = {
            jobId,
            codeAnalysisFindingsSchema: 'codeanalysis/findings/1.0',
        }
        const response = await this.client.listCodeAnalysisFindings(request)
        this.logging.log(`Request id: ${response.$response.requestId}`)

        const aggregatedCodeScanIssueList = await this.mapToAggregatedList(response.codeAnalysisFindings, projectPath)
        return aggregatedCodeScanIssueList
    }

    async mapToAggregatedList(json: string, projectPath: string) {
        const codeScanIssueMap: Map<string, RawCodeScanIssue[]> = new Map()
        const aggregatedCodeScanIssueList: AggregatedCodeScanIssue[] = []

        const codeScanIssues: RawCodeScanIssue[] = JSON.parse(json)

        codeScanIssues.forEach(issue => {
            if (codeScanIssueMap.has(issue.filePath)) {
                const list = codeScanIssueMap.get(issue.filePath)
                if (list === undefined) {
                    codeScanIssueMap.set(issue.filePath, [issue])
                } else {
                    list.push(issue)
                    codeScanIssueMap.set(issue.filePath, list)
                }
            } else {
                codeScanIssueMap.set(issue.filePath, [issue])
            }
        })

        for (const [relFilePath, issues] of codeScanIssueMap) {
            const filePath = path.join(projectPath, relFilePath)
            const fileExists = await this.workspace.fs.exists(filePath)
            if (fileExists) {
                const aggregatedCodeScanIssue = {
                    filePath: filePath,
                    issues: issues.map(issue => {
                        return {
                            startLine: issue.startLine - 1 >= 0 ? issue.startLine - 1 : 0,
                            endLine: issue.endLine,
                            comment: `${issue.title.trim()}: ${issue.description.text.trim()}`,
                            title: issue.title,
                            description: issue.description,
                            detectorId: issue.detectorId,
                            detectorName: issue.detectorName,
                            findingId: issue.findingId,
                            ruleId: issue.ruleId,
                            relatedVulnerabilities: issue.relatedVulnerabilities,
                            severity: issue.severity,
                            recommendation: issue.remediation.recommendation,
                            suggestedFixes: issue.remediation.suggestedFixes,
                        }
                    }),
                }
                aggregatedCodeScanIssueList.push(aggregatedCodeScanIssue)
            }
        }
        return aggregatedCodeScanIssueList
    }
}

export class SecurityScanCancelledError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'SecurityScanCancelledError'
    }
}
