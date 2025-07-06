/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable import/no-nodejs-modules */

import { CodeWhispererServiceToken } from '../../../../shared/codeWhispererService'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import {
    PROGRAMMING_LANGUAGES_LOWERCASE,
    Q_CODE_REVIEW_TOOL_NAME,
    Q_CODE_REVIEW_TOOL_DESCRIPTION,
    FULL_REVIEW,
    PARTIAL_REVIEW,
} from './qCodeReviewConstants'
import { QCodeReviewUtils } from './qCodeReviewUtils'
import { Q_CODE_REVIEW_INPUT_SCHEMA, Z_Q_CODE_REVIEW_INPUT_SCHEMA, Q_FINDINGS_SCHEMA } from './qCodeReviewSchemas'
import { randomUUID } from 'crypto'
import * as crypto from 'crypto'
import * as path from 'path'
import * as https from 'https'
import * as JSZip from 'jszip'
import { existsSync, statSync } from 'fs'
import { CancellationToken } from '@aws/language-server-runtimes/server-interface'
import { InvokeOutput } from '../toolShared'
import { CancellationError } from '@aws/lsp-core'

export class QCodeReview {
    private static readonly CUSTOMER_CODE_BASE_PATH = 'customerCodeBaseFolder'
    private static readonly CODE_ARTIFACT_PATH = 'code_artifact'
    private static readonly CUSTOMER_CODE_ZIP_NAME = 'customerCode.zip'
    private static readonly CODE_DIFF_PATH = 'code_artifact/codeDiff/customerCodeDiff.diff'
    private static readonly RULE_ARTIFACT_PATH = '.amazonq/rules'
    private static readonly MAX_POLLING_ATTEMPTS = 30
    private static readonly POLLING_INTERVAL_MS = 10000
    private static readonly UPLOAD_INTENT = 'AGENTIC_CODE_REVIEW'
    private static readonly SCAN_SCOPE = 'AGENTIC'

    private static readonly ERROR_MESSAGES = {
        MISSING_CLIENT: 'CodeWhisperer client not available',
        MISSING_ARTIFACTS: `Missing fileLevelArtifacts and folderLevelArtifacts for ${Q_CODE_REVIEW_TOOL_NAME} tool. Need more information from user.`,
        UPLOAD_FAILED: `Failed to upload artifact for code review in ${Q_CODE_REVIEW_TOOL_NAME} tool.`,
        ANALYSIS_FAILED: `Failed to start code analysis in ${Q_CODE_REVIEW_TOOL_NAME} tool.`,
        SCAN_FAILED: 'Code scan failed',
        TIMEOUT: (attempts: number) => `Code scan timed out after ${attempts} attempts`,
    }

    private readonly chat: Features['chat']
    private readonly credentialsProvider: Features['credentialsProvider']
    private readonly logging: Features['logging']
    private readonly lsp: Features['lsp']
    private readonly notification: Features['notification']
    private readonly telemetry: Features['telemetry']
    private readonly workspace: Features['workspace']
    private codeWhispererClient?: CodeWhispererServiceToken
    private cancellationToken?: CancellationToken
    private writableStream?: WritableStream

    constructor(
        features: Pick<
            Features,
            'chat' | 'credentialsProvider' | 'logging' | 'lsp' | 'notification' | 'telemetry' | 'workspace'
        > &
            Partial<Features>
    ) {
        this.chat = features.chat
        this.credentialsProvider = features.credentialsProvider
        this.logging = features.logging
        this.lsp = features.lsp
        this.notification = features.notification
        this.telemetry = features.telemetry
        this.workspace = features.workspace
    }

    static readonly toolName = Q_CODE_REVIEW_TOOL_NAME

    static readonly toolDescription = Q_CODE_REVIEW_TOOL_DESCRIPTION

    static readonly inputSchema = Q_CODE_REVIEW_INPUT_SCHEMA

    private checkCancellation(message: string = 'Command execution cancelled'): void {
        if (this.cancellationToken?.isCancellationRequested) {
            this.logging.info(message)
            throw new CancellationError('user')
        }
    }

    public async execute(input: any, context: any): Promise<InvokeOutput> {
        let writer: WritableStreamDefaultWriter<any> | undefined

        try {
            this.logging.info(`Executing ${Q_CODE_REVIEW_TOOL_NAME}: ${JSON.stringify(input)}`)

            const setup = await this.validateInputAndSetup(input, context)
            if ('errorMessage' in setup) {
                return this.createErrorOutput(setup)
            }
            this.checkCancellation()

            writer = this.writableStream?.getWriter()
            await writer?.write('Initiating code review...')

            const uploadResult = await this.prepareAndUploadArtifacts(setup)
            if ('errorMessage' in uploadResult) {
                return this.createErrorOutput(uploadResult)
            }
            this.checkCancellation()

            const analysisResult = await this.startCodeAnalysis(setup, uploadResult)
            if ('errorMessage' in analysisResult) {
                return this.createErrorOutput(analysisResult)
            }
            this.checkCancellation()

            await writer?.write('Reviewing your code...')

            const completionResult = await this.pollForCompletion(
                analysisResult.jobId,
                setup.scanName,
                setup.artifactType
            )
            if ('errorMessage' in completionResult) {
                return this.createErrorOutput(completionResult)
            }

            this.checkCancellation()

            const results = await this.processResults(
                completionResult,
                { ...setup, isCodeDiffPresent: analysisResult.isCodeDiffPresent },
                analysisResult.jobId
            )

            return {
                output: {
                    kind: 'json',
                    content: results,
                    success: true,
                },
            }
        } catch (error) {
            return {
                output: {
                    kind: 'json',
                    content: this.handleFailure(error, input),
                    success: false,
                },
            }
        } finally {
            await writer?.close()
            writer?.releaseLock()
        }
    }

    private createErrorOutput(errorObj: any): InvokeOutput {
        return {
            output: {
                kind: 'json',
                content: errorObj,
                success: false,
            },
        }
    }

    private async validateInputAndSetup(input: any, context: any) {
        this.cancellationToken = context.cancellationToken as CancellationToken

        this.writableStream = context.writableStream as WritableStream

        this.codeWhispererClient = context.codeWhispererClient as CodeWhispererServiceToken
        if (!this.codeWhispererClient) {
            throw new Error(QCodeReview.ERROR_MESSAGES.MISSING_CLIENT)
        }

        // parse input
        const validatedInput = Z_Q_CODE_REVIEW_INPUT_SCHEMA.parse(input)
        const fileArtifacts = validatedInput.fileLevelArtifacts || []
        const folderArtifacts = validatedInput.folderLevelArtifacts || []
        const ruleArtifacts = validatedInput.ruleArtifacts || []

        if (fileArtifacts.length === 0 && folderArtifacts.length === 0) {
            this.emitMetric('MissingFilesOrFolders', {})
            return { errorMessage: QCodeReview.ERROR_MESSAGES.MISSING_ARTIFACTS }
        }

        const isFullReviewRequest = validatedInput.scopeOfReview?.toUpperCase() === FULL_REVIEW
        const artifactType = fileArtifacts.length > 0 ? 'FILE' : 'FOLDER'
        const programmingLanguage =
            fileArtifacts.length > 0 ? this.determineProgrammingLanguageFromFileArtifacts(fileArtifacts) : 'java'
        const scanName = 'Standard-' + randomUUID()

        this.logging.info(`Agentic scan name: ${scanName}`)

        return {
            fileArtifacts,
            folderArtifacts,
            isFullReviewRequest,
            artifactType,
            programmingLanguage,
            scanName,
            ruleArtifacts,
        }
    }

    private async prepareAndUploadArtifacts(setup: any) {
        const { zipBuffer, md5Hash, isCodeDiffPresent } = await this.prepareFilesAndFoldersForUpload(
            setup.fileArtifacts,
            setup.folderArtifacts,
            setup.ruleArtifacts,
            setup.isFullReviewRequest
        )

        const uploadUrlResponse = await this.codeWhispererClient!.createUploadUrl({
            contentLength: zipBuffer.length,
            contentMd5: md5Hash,
            uploadIntent: QCodeReview.UPLOAD_INTENT,
            uploadContext: {
                codeAnalysisUploadContext: {
                    codeScanName: setup.scanName,
                },
            },
        })

        if (!uploadUrlResponse.uploadUrl || !uploadUrlResponse.uploadId) {
            this.emitMetric('createUploadUrlFailed', {
                codeScanName: setup.scanName,
                contentLength: zipBuffer.length,
                uploadIntent: QCodeReview.UPLOAD_INTENT,
                response: uploadUrlResponse,
            })
            return { errorMessage: QCodeReview.ERROR_MESSAGES.UPLOAD_FAILED }
        }

        this.logging.info(`Upload Url - ${uploadUrlResponse.uploadUrl}`)

        await this.uploadFileToPresignedUrl(
            uploadUrlResponse.uploadUrl,
            zipBuffer,
            uploadUrlResponse.requestHeaders || {}
        )

        this.emitMetric('uploadArtifactSuccess', {
            codeScanName: setup.scanName,
            codeArtifactId: uploadUrlResponse.uploadId,
            artifactSize: zipBuffer.length,
            artifactType: setup.artifactType,
        })
        return { uploadId: uploadUrlResponse.uploadId, isCodeDiffPresent }
    }

    private async startCodeAnalysis(setup: any, uploadResult: any) {
        const createResponse = await this.codeWhispererClient!.startCodeAnalysis({
            artifacts: { SourceCode: uploadResult.uploadId },
            programmingLanguage: { languageName: setup.programmingLanguage },
            clientToken: QCodeReviewUtils.generateClientToken(),
            codeScanName: setup.scanName,
            scope: QCodeReview.SCAN_SCOPE,
            codeDiffMetadata: uploadResult.isCodeDiffPresent ? { codeDiffPath: '/code_artifact/codeDiff/' } : undefined,
        })

        if (!createResponse.jobId) {
            this.emitMetric('startCodeAnalysisFailed', {
                artifacts: { SourceCode: uploadResult.uploadId },
                programmingLanguage: { languageName: setup.programmingLanguage },
                codeScanName: setup.scanName,
                scope: QCodeReview.SCAN_SCOPE,
                artifactType: setup.artifactType,
                response: createResponse,
            })
            return { errorMessage: QCodeReview.ERROR_MESSAGES.ANALYSIS_FAILED }
        }

        this.logging.info(`Code scan created with job ID: ${createResponse.jobId}`)
        return {
            jobId: createResponse.jobId,
            status: createResponse.status,
            isCodeDiffPresent: uploadResult.isCodeDiffPresent,
        }
    }

    private async pollForCompletion(jobId: string, scanName: string, artifactType: string) {
        let status = 'Pending'
        let attemptCount = 0

        while (status === 'Pending' && attemptCount < QCodeReview.MAX_POLLING_ATTEMPTS) {
            this.logging.info(`Code scan status: ${status}, waiting...`)
            await new Promise(resolve => setTimeout(resolve, QCodeReview.POLLING_INTERVAL_MS))

            const statusResponse = await this.getCodeAnalysisStatus(jobId)
            status = statusResponse.status
            attemptCount++

            if (statusResponse.errorMessage) {
                this.emitMetric('codeAnalysisFailed', {
                    codeScanName: scanName,
                    codeReviewId: jobId,
                    status,
                    artifactType,
                    message: statusResponse.errorMessage,
                })
                return {
                    codeReviewId: jobId,
                    status,
                    errorMessage: statusResponse.errorMessage,
                }
            }

            this.checkCancellation('Command execution cancelled while waiting for scan to complete')
        }

        if (status === 'Pending') {
            this.emitMetric('codeAnalysisTimeout', {
                codeScanName: scanName,
                codeReviewId: jobId,
                status: 'Timeout',
                maxAttempts: QCodeReview.MAX_POLLING_ATTEMPTS,
            })
            return {
                codeReviewId: jobId,
                status: 'Timeout',
                errorMessage: QCodeReview.ERROR_MESSAGES.TIMEOUT(QCodeReview.MAX_POLLING_ATTEMPTS),
            }
        }

        this.logging.info(`Code scan completed with status: ${status}`)
        return { status, jobId }
    }

    private async processResults(completionResult: any, setup: any, jobId: string) {
        if (completionResult.status !== 'Completed') {
            return this.handleFailure(completionResult.status, null, setup.scanName, jobId)
        }

        const totalFindings = await this.collectFindings(jobId, setup.isFullReviewRequest, setup.isCodeDiffPresent)

        this.emitMetric('codeAnalysisSucces', {
            codeScanName: setup.scanName,
            codeReviewId: jobId,
            findingsCount: totalFindings.length,
        })

        const aggregatedCodeScanIssueList = await this.processFindings(
            totalFindings,
            jobId,
            setup.programmingLanguage,
            setup.fileArtifacts,
            setup.folderArtifacts
        )

        this.logging.info(`Parsed findings successfully.`)

        return {
            codeReviewId: jobId,
            status: completionResult.status,
            scopeOfReview: setup.isFullReviewRequest ? FULL_REVIEW : PARTIAL_REVIEW,
            result: {
                message: `${Q_CODE_REVIEW_TOOL_NAME} tool completed successfully. It performed a ${setup.isFullReviewRequest ? 'full' : 'partial'} review and has attached findings.`,
                findingsByFile: JSON.stringify(aggregatedCodeScanIssueList),
            },
        }
    }

    private async collectFindings(
        jobId: string,
        isFullReviewRequest: boolean,
        isCodeDiffPresent: boolean
    ): Promise<any[]> {
        let totalFindings: any[] = []
        let nextFindingToken = undefined

        this.logging.info(
            `Collect findings for jobId: ${jobId}, isFullReviewRequest: ${isFullReviewRequest}, isCodeDiffPresent: ${isCodeDiffPresent}`
        )

        do {
            this.logging.info(`Getting findings for job ID: ${jobId}, next token: ${nextFindingToken}`)
            const findingsResponse = await this.getCodeAnalysisFindings(jobId, nextFindingToken)
            nextFindingToken = findingsResponse.nextToken

            const parsedFindings = this.parseFindings(findingsResponse.codeAnalysisFindings) || []
            const filteredFindings =
                !isFullReviewRequest && isCodeDiffPresent
                    ? parsedFindings.filter(finding => finding?.findingContext === 'CodeDiff')
                    : parsedFindings
            totalFindings = totalFindings.concat(filteredFindings)
        } while (nextFindingToken)

        this.logging.info(`Total findings: ${totalFindings.length}`)
        return totalFindings
    }

    private handleFailure(error: any, input?: any, scanName?: string, jobId?: string) {
        const errorData: any = { error: JSON.stringify(error) }
        if (input) errorData.input = input
        if (scanName) errorData.codeScanName = scanName
        if (jobId) errorData.codeReviewId = jobId

        this.emitMetric('failed', {
            data: errorData,
        })

        this.logging.error(`Error in ${Q_CODE_REVIEW_TOOL_NAME} - ${JSON.stringify(error)}`)

        if (typeof error === 'string') {
            return {
                codeReviewId: jobId,
                status: error,
                errorMessage:
                    error === 'Failed' ? QCodeReview.ERROR_MESSAGES.SCAN_FAILED : `Unexpected status: ${error}`,
            }
        } else {
            return {
                codeReviewId: jobId,
                status: 'Failed',
                errorMessage: `${Q_CODE_REVIEW_TOOL_NAME} tool failed with error - ${JSON.stringify(error)}`,
            }
        }
    }

    private async getCodeAnalysisStatus(jobId: string) {
        return await this.codeWhispererClient!.getCodeAnalysis({ jobId })
    }

    private async getCodeAnalysisFindings(jobId: string, nextToken?: string) {
        return await this.codeWhispererClient!.listCodeAnalysisFindings({
            jobId,
            nextToken,
            codeAnalysisFindingsSchema: 'codeanalysis/findings/1.0',
        })
    }

    private emitMetric(metricSuffix: string, metricData: any) {
        const metricName = `${Q_CODE_REVIEW_TOOL_NAME}_${metricSuffix}`
        const metricPayload = {
            name: metricName,
            data: {
                credentialStartUrl: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                ...metricData,
            },
        }
        this.logging.info(`Emitting telemetry metric: ${metricName} with data: ${JSON.stringify(metricPayload.data)}`)
        this.telemetry.emitMetric(metricPayload)
    }

    /**
     * Extracts the programming language from file artifacts
     * @param artifacts Array of file artifacts containing path and programming language
     * @returns The programming language in lowercase
     */
    private determineProgrammingLanguageFromFileArtifacts(
        artifacts: Array<{ path: string; programmingLanguage: string }>
    ): string {
        if (!artifacts || artifacts.length === 0) {
            throw new Error('Missing artifacts to get programming language')
        }

        // Use the programming language of the first artifact as default
        const firstLanguage = artifacts[0].programmingLanguage.toLowerCase()

        if (PROGRAMMING_LANGUAGES_LOWERCASE.includes(firstLanguage)) {
            return firstLanguage
        } else {
            throw new Error(`Programming language : ${firstLanguage} is not supported for QCodeReview`)
        }
    }

    /**
     * Create a zip archive of the files and folders to be scanned and calculate MD5 hash
     * @param fileArtifacts Array of file artifacts containing path and programming language
     * @param folderArtifacts Array of folder artifacts containing path
     * @param ruleArtifacts Array of file paths to customer selected rules
     * @param isFullReviewRequest If customer asked for Full review or Partial review
     * @returns An object containing the zip file buffer and its MD5 hash
     */
    private async prepareFilesAndFoldersForUpload(
        fileArtifacts: Array<{ path: string; programmingLanguage: string }>,
        folderArtifacts: Array<{ path: string }>,
        ruleArtifacts: string[],
        isFullReviewRequest: boolean
    ): Promise<{ zipBuffer: Buffer; md5Hash: string; isCodeDiffPresent: boolean }> {
        try {
            this.logging.info(
                `Preparing ${fileArtifacts.length} files and ${folderArtifacts.length} folders for upload`
            )

            const codeArtifactZip = new JSZip()
            const customerCodeZip = new JSZip()

            // Process files and folders
            const codeDiff = await this.processArtifacts(
                fileArtifacts,
                folderArtifacts,
                customerCodeZip,
                !isFullReviewRequest
            )

            // Generate customer code zip buffer
            const customerCodeBuffer = await QCodeReviewUtils.generateZipBuffer(customerCodeZip)
            QCodeReviewUtils.logZipStructure(customerCodeZip, 'Customer code', this.logging)

            // Add customer code zip to the main artifact zip
            codeArtifactZip.file(
                `${QCodeReview.CODE_ARTIFACT_PATH}/${QCodeReview.CUSTOMER_CODE_ZIP_NAME}`,
                customerCodeBuffer
            )

            let isCodeDiffPresent = false

            // Add code diff file if we have any diffs
            if (codeDiff.trim()) {
                this.logging.info(`Adding code diff to zip of size: ${codeDiff.length}`)
                isCodeDiffPresent = true
                codeArtifactZip.file(QCodeReview.CODE_DIFF_PATH, codeDiff)
            }

            for (const ruleArtifact of ruleArtifacts) {
                const ruleText = this.workspace.fs.readFileSync(ruleArtifact)
                codeArtifactZip.file(`${QCodeReview.RULE_ARTIFACT_PATH}/${path.basename(ruleArtifact)}`, ruleText)
            }

            // Generate the final code artifact zip
            const zipBuffer = await QCodeReviewUtils.generateZipBuffer(codeArtifactZip)
            QCodeReviewUtils.logZipStructure(codeArtifactZip, 'Code artifact', this.logging)

            // Calculate MD5 hash of the zip buffer
            const md5Hash = crypto.createHash('md5').update(zipBuffer).digest('hex')

            this.logging.info(`Created zip archive, size: ${zipBuffer.length} bytes, MD5: ${md5Hash}`)

            return { zipBuffer, md5Hash, isCodeDiffPresent }
        } catch (error) {
            this.logging.error(`Error preparing files for upload: ${error}`)
            throw error
        }
    }

    private async processArtifacts(
        fileArtifacts: Array<{ path: string; programmingLanguage: string }>,
        folderArtifacts: Array<{ path: string }>,
        customerCodeZip: JSZip,
        isCodeDiffScan: boolean
    ): Promise<string> {
        let codeDiff = ''

        // Process files
        codeDiff += await this.processFileArtifacts(fileArtifacts, customerCodeZip, isCodeDiffScan)

        // Process folders
        codeDiff += await this.processFolderArtifacts(folderArtifacts, customerCodeZip, isCodeDiffScan)

        return codeDiff
    }

    private async processFileArtifacts(
        fileArtifacts: Array<{ path: string; programmingLanguage: string }>,
        customerCodeZip: JSZip,
        isCodeDiffScan: boolean
    ): Promise<string> {
        let codeDiff = ''

        for (const artifact of fileArtifacts) {
            this.logging.info(`Adding file to zip: ${artifact.path}`)

            await QCodeReviewUtils.withErrorHandling(
                async () => {
                    const fileContent = await this.workspace.fs.readFile(artifact.path)
                    customerCodeZip.file(`${QCodeReview.CUSTOMER_CODE_BASE_PATH}${artifact.path}`, fileContent)
                },
                'Failed to read file',
                this.logging,
                artifact.path
            )

            codeDiff += await QCodeReviewUtils.processArtifactWithDiff(artifact, isCodeDiffScan, this.logging)
        }

        return codeDiff
    }

    private async processFolderArtifacts(
        folderArtifacts: Array<{ path: string }>,
        customerCodeZip: JSZip,
        isCodeDiffScan: boolean
    ): Promise<string> {
        let codeDiff = ''

        for (const folderArtifact of folderArtifacts) {
            this.logging.info(`Adding folder to zip: ${folderArtifact.path}`)

            await QCodeReviewUtils.withErrorHandling(
                async () => {
                    await this.addFolderToZip(customerCodeZip, folderArtifact.path, QCodeReview.CUSTOMER_CODE_BASE_PATH)
                },
                'Failed to add folder',
                this.logging,
                folderArtifact.path
            )

            codeDiff += await QCodeReviewUtils.processArtifactWithDiff(folderArtifact, isCodeDiffScan, this.logging)
        }

        return codeDiff
    }

    /**
     * Recursively add a folder and its contents to a zip archive
     * @param zip JSZip instance to add files to
     * @param folderPath Path to the folder to add
     * @param zipPath Relative path within the zip archive
     */
    private async addFolderToZip(zip: JSZip, folderPath: string, zipPath: string): Promise<void> {
        try {
            const entries = await this.workspace.fs.readdir(folderPath)

            for (const entry of entries) {
                const name = entry.name
                const fullPath = path.join(entry.parentPath, name)

                if (entry.isFile()) {
                    if (name.startsWith('.') || QCodeReviewUtils.shouldSkipFile(name)) {
                        continue
                    }

                    const content = await this.workspace.fs.readFile(fullPath)
                    zip.file(`${zipPath}${fullPath}`, content)
                } else if (entry.isDirectory()) {
                    if (QCodeReviewUtils.shouldSkipDirectory(name)) {
                        continue
                    }

                    await this.addFolderToZip(zip, fullPath, zipPath)
                }
            }
        } catch (error) {
            this.logging.error(`Error adding folder to zip: ${error}`)
            throw error
        }
    }

    /**
     * Upload file content to the pre-signed URL
     * @param uploadUrl Pre-signed URL for uploading the file
     * @param fileContent Buffer containing the file content
     * @param requestHeaders Additional headers for the request
     */
    private async uploadFileToPresignedUrl(
        uploadUrl: string,
        fileContent: Buffer,
        requestHeaders: Record<string, string>
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = new URL(uploadUrl)

            const options = {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'PUT',
                headers: {
                    'Content-Length': fileContent.length,
                    ...requestHeaders,
                },
            }

            this.logging.info(`Uploading file to ${url.hostname}${url.pathname}`)

            const req = https.request(options, (res: any) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Upload failed with status code: ${res.statusCode}`))
                    return
                }
                let responseData = ''
                res.on('data', (chunk: string) => {
                    responseData += chunk
                })
                res.on('end', () => {
                    this.logging.info('File upload completed successfully')
                    resolve()
                })
            })

            req.on('error', (error: any) => {
                this.logging.error(`Error uploading file: ${error}`)
                reject(error)
            })

            req.write(fileContent)
            req.end()
        })
    }

    /**
     * Process findings from the code analysis response
     * @param findingsJson JSON string containing the findings data
     * @param jobId The scan job ID for tracking
     * @param programmingLanguage Programming language of the scanned code
     * @param fileArtifacts Array of file artifacts being scanned
     * @param folderArtifacts Array of folder artifacts being scanned
     * @returns Array of findings grouped by file path
     */
    private async processFindings(
        findings: any[],
        jobId: string,
        programmingLanguage: string,
        fileArtifacts: Array<{ path: string; programmingLanguage: string }>,
        folderArtifacts: Array<{ path: string }>
    ): Promise<{ filePath: string; issues: ValidatedFinding[] }[]> {
        const validatedFindings = this.convertToValidatedFindings(findings, jobId, programmingLanguage)
        return this.aggregateFindingsByFile(validatedFindings, fileArtifacts, folderArtifacts)
    }

    /**
     * Parse and validate findings JSON response
     * @param findingsJson Raw JSON string from the code analysis response
     * @returns Parsed and validated findings array
     */
    private parseFindings(findingsJson: string): any[] {
        let findingsResponseJSON: any
        try {
            findingsResponseJSON = JSON.parse(findingsJson)
        } catch (e) {
            this.logging.error(`Error parsing findings response: ${e}`)
            throw new Error('Error parsing findings response')
        }

        // Normalize ruleId fields
        for (const finding of findingsResponseJSON) {
            if (finding['ruleId'] == null) {
                finding['ruleId'] = undefined
            }
        }

        return Q_FINDINGS_SCHEMA.parse(findingsResponseJSON)
    }

    /**
     * Convert parsed findings to ValidatedFinding objects
     * @param parsedFindings Array of parsed findings from the schema validation
     * @param jobId The scan job ID for tracking
     * @param programmingLanguage Programming language of the scanned code
     * @returns Array of ValidatedFinding objects
     */
    private convertToValidatedFindings(
        parsedFindings: any[],
        jobId: string,
        programmingLanguage: string
    ): ValidatedFinding[] {
        return parsedFindings.map(issue => ({
            startLine: issue.startLine - 1 >= 0 ? issue.startLine - 1 : 0,
            endLine: issue.endLine,
            comment: `${issue.title.trim()}: ${issue.description.text.trim()}`,
            title: issue.title,
            description: issue.description,
            detectorId: issue.detectorId,
            detectorName: issue.detectorName,
            findingId: issue.findingId,
            ruleId: issue.ruleId != null ? issue.ruleId : undefined,
            relatedVulnerabilities: issue.relatedVulnerabilities,
            severity: issue.severity,
            recommendation: issue.remediation.recommendation,
            suggestedFixes: issue.suggestedFixes != undefined ? issue.suggestedFixes : [],
            scanJobId: jobId,
            language: programmingLanguage,
            autoDetected: false,
            filePath: issue.filePath,
        }))
    }

    /**
     * Aggregate findings by file path
     * @param validatedFindings Array of validated findings
     * @param fileArtifacts Array of file artifacts being scanned
     * @param folderArtifacts Array of folder artifacts being scanned
     * @returns Array of findings grouped by resolved file path
     */
    private aggregateFindingsByFile(
        validatedFindings: ValidatedFinding[],
        fileArtifacts: Array<{ path: string; programmingLanguage: string }>,
        folderArtifacts: Array<{ path: string }>
    ): { filePath: string; issues: ValidatedFinding[] }[] {
        const aggregatedCodeScanIssueMap = new Map<string, ValidatedFinding[]>()

        for (const finding of validatedFindings) {
            const resolvedPath = this.resolveFilePath(finding.filePath, fileArtifacts, folderArtifacts)
            if (resolvedPath) {
                if (aggregatedCodeScanIssueMap.has(resolvedPath)) {
                    aggregatedCodeScanIssueMap.get(resolvedPath)?.push(finding)
                } else {
                    aggregatedCodeScanIssueMap.set(resolvedPath, [finding])
                }
            } else {
                this.logging.warn(`Could not resolve finding file path: ${finding.filePath}`)
            }
        }

        return Array.from(aggregatedCodeScanIssueMap.entries()).map(([filePath, issues]) => ({
            filePath,
            issues,
        }))
    }

    /**
     * Resolve finding file path to actual file path
     * @param findingPath Relative file path from the finding
     * @param fileArtifacts Array of file artifacts being scanned
     * @param folderArtifacts Array of folder artifacts being scanned
     * @returns Resolved absolute file path or null if not found
     */
    private resolveFilePath(
        findingPath: string,
        fileArtifacts: Array<{ path: string; programmingLanguage: string }>,
        folderArtifacts: Array<{ path: string }>
    ): string | null {
        // 1. Check if finding path matches one of the file artifacts
        for (const fileArtifact of fileArtifacts) {
            const normalizedFilePath = path.normalize(fileArtifact.path)
            const normalizedFindingPath = path.normalize(findingPath)

            if (normalizedFilePath.endsWith(normalizedFindingPath)) {
                return normalizedFilePath
            }
        }

        // 2. Check if finding path falls under one of the folder artifacts
        for (const folderArtifact of folderArtifacts) {
            const normalizedFolderPath = path.normalize(folderArtifact.path)
            const normalizedFindingPath = path.normalize(findingPath)

            // 2.1. Check if finding path falls under one of the subdirectories in folder artifact path
            const folderSegments = normalizedFolderPath.split(path.sep)
            const findingSegments = normalizedFindingPath.split(path.sep)

            // Find common suffix between folder path and finding path
            let matchIndex = -1
            for (let i = folderSegments.length - 1; i >= 0; i--) {
                const folderSuffix = folderSegments.slice(i).join(path.sep)
                if (normalizedFindingPath.startsWith(folderSuffix + path.sep)) {
                    matchIndex = i
                    break
                }
            }

            if (matchIndex !== -1) {
                const remainingPath = normalizedFindingPath.substring(
                    folderSegments.slice(matchIndex).join(path.sep).length + 1
                )
                const absolutePath = path.join(normalizedFolderPath, remainingPath)
                if (existsSync(absolutePath) && statSync(absolutePath).isFile()) {
                    return absolutePath
                }
            }

            // 2.2. Check if folder path + finding path gives the absolute file path
            const filePath = path.join(folderArtifact.path, findingPath)
            if (existsSync(filePath) && statSync(filePath).isFile()) {
                return filePath
            }
        }

        // 3. Check if finding already has absolute file path
        const maybeAbsolutePath = path.normalize(findingPath)
        if (existsSync(maybeAbsolutePath) && statSync(maybeAbsolutePath).isFile()) {
            return maybeAbsolutePath
        }

        return null
    }
}

type ValidatedFinding = {
    filePath: string
    startLine: number
    endLine: number
    comment: string
    title: string
    description: { markdown: string; text: string }
    detectorId?: string
    detectorName?: string
    findingId: string
    ruleId?: string
    relatedVulnerabilities: (string | undefined)[]
    severity: string
    suggestedFixes?: (string | undefined)[]
    recommendation: { text: string; url?: string | null }
    scanJobId: string
    language: string
    autoDetected: false
}
