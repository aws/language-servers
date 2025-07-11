/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable import/no-nodejs-modules */

import { CodeWhispererServiceToken } from '../../../../shared/codeWhispererService'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import {
    Q_CODE_REVIEW_TOOL_NAME,
    Q_CODE_REVIEW_TOOL_DESCRIPTION,
    FULL_REVIEW,
    CODE_DIFF_REVIEW,
} from './qCodeReviewConstants'
import { QCodeReviewUtils } from './qCodeReviewUtils'
import { Q_CODE_REVIEW_INPUT_SCHEMA, Z_Q_CODE_REVIEW_INPUT_SCHEMA, Q_FINDINGS_SCHEMA } from './qCodeReviewSchemas'
import { randomUUID } from 'crypto'
import * as crypto from 'crypto'
import * as path from 'path'
import * as JSZip from 'jszip'
import { existsSync, statSync } from 'fs'
import { CancellationToken } from '@aws/language-server-runtimes/server-interface'
import { InvokeOutput } from '../toolShared'

export class QCodeReview {
    private static readonly CUSTOMER_CODE_BASE_PATH = 'customerCodeBaseFolder'
    private static readonly CODE_ARTIFACT_PATH = 'code_artifact'
    private static readonly CUSTOMER_CODE_ZIP_NAME = 'customerCode.zip'
    private static readonly CODE_DIFF_PATH = 'code_artifact/codeDiff/customerCodeDiff.diff'
    private static readonly RULE_ARTIFACT_PATH = '.amazonq/rules'
    private static readonly MAX_POLLING_ATTEMPTS = 30
    private static readonly MID_POLLING_ATTEMPTS = 15
    private static readonly POLLING_INTERVAL_MS = 10000
    private static readonly UPLOAD_INTENT = 'AGENTIC_CODE_REVIEW'
    private static readonly SCAN_SCOPE = 'AGENTIC'
    private static readonly MAX_FINDINGS_COUNT = 50

    private static readonly ERROR_MESSAGES = {
        MISSING_CLIENT: 'CodeWhisperer client not available',
        MISSING_ARTIFACTS: `Missing fileLevelArtifacts and folderLevelArtifacts for ${Q_CODE_REVIEW_TOOL_NAME} tool. Ask user to provide a specific file / folder / workspace which has code that can be scanned.`,
        MISSING_FILES_TO_SCAN: `There are no valid files to scan. Ask user to provide a specific file / folder / workspace which has code that can be scanned.`,
        UPLOAD_FAILED: `Failed to upload artifact for code review in ${Q_CODE_REVIEW_TOOL_NAME} tool.`,
        ANALYSIS_FAILED: `Failed to start code analysis in ${Q_CODE_REVIEW_TOOL_NAME} tool.`,
        SCAN_FAILED: 'Code scan failed',
        TIMEOUT: (attempts: number) =>
            `Code scan timed out after ${attempts} attempts. Ask user to provide a smaller size of code to scan.`,
    }

    private readonly credentialsProvider: Features['credentialsProvider']
    private readonly logging: Features['logging']
    private readonly lsp: Features['lsp']
    private readonly telemetry: Features['telemetry']
    private readonly workspace: Features['workspace']
    private codeWhispererClient?: CodeWhispererServiceToken
    private cancellationToken?: CancellationToken
    private writableStream?: WritableStream

    constructor(
        features: Pick<Features, 'credentialsProvider' | 'logging' | 'lsp' | 'telemetry' | 'workspace'> &
            Partial<Features>
    ) {
        this.credentialsProvider = features.credentialsProvider
        this.logging = features.logging
        this.lsp = features.lsp
        this.telemetry = features.telemetry
        this.workspace = features.workspace
    }

    static readonly toolName = Q_CODE_REVIEW_TOOL_NAME

    static readonly toolDescription = Q_CODE_REVIEW_TOOL_DESCRIPTION

    static readonly inputSchema = Q_CODE_REVIEW_INPUT_SCHEMA

    /**
     * Main execution method for the QCodeReview tool
     * @param input User input parameters for code review
     * @param context Execution context containing clients and tokens
     * @returns Output containing code review results or error message
     */
    public async execute(input: any, context: any): Promise<InvokeOutput> {
        let chatStreamWriter: WritableStreamDefaultWriter<any> | undefined

        try {
            this.logging.info(`Executing ${Q_CODE_REVIEW_TOOL_NAME}: ${JSON.stringify(input)}`)

            // 1. Validate input
            const setup = await this.validateInputAndSetup(input, context)
            if ('errorMessage' in setup) {
                return QCodeReviewUtils.createErrorOutput(setup)
            }
            this.checkCancellation()

            chatStreamWriter = this.writableStream?.getWriter()
            await chatStreamWriter?.write('Initiating code review...')

            // 2. Prepare code artifact and upload to service
            const uploadResult = await this.prepareAndUploadArtifacts(setup)
            if ('errorMessage' in uploadResult) {
                return QCodeReviewUtils.createErrorOutput(uploadResult)
            }
            this.checkCancellation()

            // 3. Start code analysis
            const analysisResult = await this.startCodeAnalysis(setup, uploadResult)
            if ('errorMessage' in analysisResult) {
                return QCodeReviewUtils.createErrorOutput(analysisResult)
            }
            this.checkCancellation()

            await chatStreamWriter?.write('Reviewing your code...')

            // 4. Wait for scan to complete
            const completionResult = await this.pollForCompletion(
                analysisResult.jobId,
                setup.scanName,
                setup.artifactType,
                chatStreamWriter
            )
            if ('errorMessage' in completionResult) {
                return QCodeReviewUtils.createErrorOutput(completionResult)
            }

            this.checkCancellation()

            // 5. Process scan result
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
                    content: QCodeReviewUtils.handleFailure(
                        error,
                        this.logging,
                        this.telemetry,
                        Q_CODE_REVIEW_TOOL_NAME
                    ),
                    success: false,
                },
            }
        } finally {
            await chatStreamWriter?.close()
            chatStreamWriter?.releaseLock()
        }
    }

    /**
     * Validates user input and sets up the execution environment
     * @param input User input parameters for code review
     * @param context Execution context containing clients and tokens
     * @returns Setup object with validated parameters or error message
     */
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
            QCodeReviewUtils.emitMetric(
                'MissingFilesOrFolders',
                {},
                Q_CODE_REVIEW_TOOL_NAME,
                this.logging,
                this.telemetry,
                this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl
            )
            return { errorMessage: QCodeReview.ERROR_MESSAGES.MISSING_ARTIFACTS }
        }

        const isFullReviewRequest = validatedInput.scopeOfReview?.toUpperCase() === FULL_REVIEW
        const artifactType = fileArtifacts.length > 0 ? 'FILE' : 'FOLDER'
        // Setting java as default language
        // TODO: Remove requirement of programming language
        const programmingLanguage = 'java'
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

    /**
     * Prepares and uploads code artifacts for analysis
     * @param setup Setup object with validated parameters
     * @returns Upload result with uploadId or error message
     */
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
            QCodeReviewUtils.emitMetric(
                'createUploadUrlFailed',
                {
                    codeScanName: setup.scanName,
                    contentLength: zipBuffer.length,
                    uploadIntent: QCodeReview.UPLOAD_INTENT,
                    response: uploadUrlResponse,
                },
                Q_CODE_REVIEW_TOOL_NAME,
                this.logging,
                this.telemetry,
                this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl
            )
            return { errorMessage: QCodeReview.ERROR_MESSAGES.UPLOAD_FAILED }
        }

        await QCodeReviewUtils.uploadFileToPresignedUrl(
            uploadUrlResponse.uploadUrl,
            zipBuffer,
            uploadUrlResponse.requestHeaders || {},
            this.logging
        )

        QCodeReviewUtils.emitMetric(
            'uploadArtifactSuccess',
            {
                codeScanName: setup.scanName,
                codeArtifactId: uploadUrlResponse.uploadId,
                artifactSize: zipBuffer.length,
                artifactType: setup.artifactType,
            },
            Q_CODE_REVIEW_TOOL_NAME,
            this.logging,
            this.telemetry,
            this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl
        )
        return { uploadId: uploadUrlResponse.uploadId, isCodeDiffPresent }
    }

    /**
     * Initiates code analysis with the uploaded artifacts
     * @param setup Setup object with validated parameters
     * @param uploadResult Result from artifact upload containing uploadId
     * @returns Analysis result with jobId or error message
     */
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
            QCodeReviewUtils.emitMetric(
                'startCodeAnalysisFailed',
                {
                    artifacts: { SourceCode: uploadResult.uploadId },
                    programmingLanguage: { languageName: setup.programmingLanguage },
                    codeScanName: setup.scanName,
                    scope: QCodeReview.SCAN_SCOPE,
                    artifactType: setup.artifactType,
                    response: createResponse,
                },
                Q_CODE_REVIEW_TOOL_NAME,
                this.logging,
                this.telemetry,
                this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl
            )
            return { errorMessage: QCodeReview.ERROR_MESSAGES.ANALYSIS_FAILED }
        }

        this.logging.info(`Code scan created with job ID: ${createResponse.jobId}`)
        return {
            jobId: createResponse.jobId,
            status: createResponse.status,
            isCodeDiffPresent: uploadResult.isCodeDiffPresent,
        }
    }

    /**
     * Polls for completion of the code analysis job
     * @param jobId ID of the code analysis job
     * @param scanName Name of the code scan
     * @param artifactType Type of artifact being scanned (FILE or FOLDER)
     * @param chatStreamWriter Stream writer for sending progress updates
     * @returns Completion result with status or error message
     */
    private async pollForCompletion(
        jobId: string,
        scanName: string,
        artifactType: string,
        chatStreamWriter: WritableStreamDefaultWriter<any> | undefined
    ) {
        let status = 'Pending'
        let attemptCount = 0

        while (status === 'Pending' && attemptCount < QCodeReview.MAX_POLLING_ATTEMPTS) {
            this.logging.info(`Code scan status: ${status}, waiting...`)
            await new Promise(resolve => setTimeout(resolve, QCodeReview.POLLING_INTERVAL_MS))

            const statusResponse = await this.getCodeAnalysisStatus(jobId)
            status = statusResponse.status
            attemptCount++

            if (statusResponse.errorMessage) {
                QCodeReviewUtils.emitMetric(
                    'codeAnalysisFailed',
                    {
                        codeScanName: scanName,
                        codeReviewId: jobId,
                        status,
                        artifactType,
                        message: statusResponse.errorMessage,
                    },
                    Q_CODE_REVIEW_TOOL_NAME,
                    this.logging,
                    this.telemetry,
                    this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl
                )
                return {
                    codeReviewId: jobId,
                    status: status,
                    errorMessage: statusResponse.errorMessage,
                }
            }

            if (attemptCount == QCodeReview.MID_POLLING_ATTEMPTS) {
                await chatStreamWriter?.write('Still reviewing your code, it is taking just a bit longer than usual...')
            }

            this.checkCancellation('Command execution cancelled while waiting for scan to complete')
        }

        if (status === 'Pending') {
            QCodeReviewUtils.emitMetric(
                'codeAnalysisTimeout',
                {
                    codeScanName: scanName,
                    codeReviewId: jobId,
                    status: 'Timeout',
                    maxAttempts: QCodeReview.MAX_POLLING_ATTEMPTS,
                },
                Q_CODE_REVIEW_TOOL_NAME,
                this.logging,
                this.telemetry,
                this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl
            )
            return {
                codeReviewId: jobId,
                status: 'Timeout',
                errorMessage: QCodeReview.ERROR_MESSAGES.TIMEOUT(QCodeReview.MAX_POLLING_ATTEMPTS),
            }
        }

        this.logging.info(`Code scan completed with status: ${status}`)
        return { status, jobId }
    }

    /**
     * Processes the results of the completed code analysis
     * @param completionResult Result from the completion polling
     * @param setup Setup object with validated parameters
     * @param jobId ID of the code analysis job
     * @returns Processed results with findings grouped by file
     */
    private async processResults(completionResult: any, setup: any, jobId: string) {
        if (completionResult.status !== 'Completed') {
            return QCodeReviewUtils.handleFailure(
                new Error('Scan failed'),
                this.logging,
                this.telemetry,
                Q_CODE_REVIEW_TOOL_NAME,
                setup.scanName,
                jobId
            )
        }

        const { totalFindings, findingsExceededLimit } = await this.collectFindings(
            jobId,
            setup.isFullReviewRequest,
            setup.isCodeDiffPresent
        )
        let totalFindingsCount = totalFindings.length

        QCodeReviewUtils.emitMetric(
            'codeAnalysisSucces',
            {
                codeScanName: setup.scanName,
                codeReviewId: jobId,
                findingsCount: totalFindingsCount,
            },
            Q_CODE_REVIEW_TOOL_NAME,
            this.logging,
            this.telemetry,
            this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl
        )

        const aggregatedCodeScanIssueList = await this.processFindings(
            findingsExceededLimit ? totalFindings.slice(0, QCodeReview.MAX_FINDINGS_COUNT) : totalFindings,
            jobId,
            setup.programmingLanguage,
            setup.fileArtifacts,
            setup.folderArtifacts
        )

        this.logging.info('Findings count grouped by file')
        aggregatedCodeScanIssueList.forEach(item =>
            this.logging.info(`File path - ${item.filePath} Findings count - ${item.issues.length}`)
        )

        return {
            codeReviewId: jobId,
            status: completionResult.status,
            scopeOfReview: setup.isFullReviewRequest ? FULL_REVIEW : CODE_DIFF_REVIEW,
            result: {
                message: `${Q_CODE_REVIEW_TOOL_NAME} tool completed successfully.${findingsExceededLimit ? ` Inform the user that we are limiting findings to top ${QCodeReview.MAX_FINDINGS_COUNT} based on severity.` : ''}`,
                findingsByFile: JSON.stringify(aggregatedCodeScanIssueList),
            },
        }
    }

    /**
     * Collects findings from the code analysis job
     * @param jobId ID of the code analysis job
     * @param isFullReviewRequest Whether this is a full review or diff review
     * @param isCodeDiffPresent Whether code diff is present in the artifacts
     * @returns Object containing collected findings and whether limit was exceeded
     */
    private async collectFindings(
        jobId: string,
        isFullReviewRequest: boolean,
        isCodeDiffPresent: boolean
    ): Promise<{ totalFindings: any[]; findingsExceededLimit: boolean }> {
        let totalFindings: any[] = []
        let nextFindingToken = undefined
        let findingsExceededLimit = false
        const lookForCodeDiffFindings = !isFullReviewRequest && isCodeDiffPresent

        this.logging.info(
            `Collect findings for jobId: ${jobId}, isFullReviewRequest: ${isFullReviewRequest}, isCodeDiffPresent: ${isCodeDiffPresent}`
        )
        this.logging.info(`Look for code diff findings only - ${lookForCodeDiffFindings}`)

        do {
            this.logging.info(`GetFindings for job ID: ${jobId}`)
            const findingsResponse = await this.getCodeAnalysisFindings(jobId, nextFindingToken)
            nextFindingToken = findingsResponse.nextToken

            const parsedFindings = this.parseFindings(findingsResponse.codeAnalysisFindings) || []
            const filteredFindings = lookForCodeDiffFindings
                ? parsedFindings.filter(finding => finding?.findingContext === 'CodeDiff')
                : parsedFindings
            totalFindings = totalFindings.concat(filteredFindings)

            if (totalFindings.length > QCodeReview.MAX_FINDINGS_COUNT) {
                findingsExceededLimit = true
                break
            }
        } while (nextFindingToken)

        this.logging.info(`Total findings: ${totalFindings.length}`)
        return { totalFindings, findingsExceededLimit }
    }

    /**
     * Gets the current status of a code analysis job
     * @param jobId ID of the code analysis job
     * @returns Status response from the CodeWhisperer service
     */
    private async getCodeAnalysisStatus(jobId: string) {
        return await this.codeWhispererClient!.getCodeAnalysis({ jobId })
    }

    /**
     * Retrieves findings from a code analysis job
     * @param jobId ID of the code analysis job
     * @param nextToken Pagination token for retrieving next batch of findings
     * @returns Findings response from the CodeWhisperer service
     */
    private async getCodeAnalysisFindings(jobId: string, nextToken?: string) {
        return await this.codeWhispererClient!.listCodeAnalysisFindings({
            jobId,
            nextToken,
            codeAnalysisFindingsSchema: 'codeanalysis/findings/1.0',
        })
    }

    /**
     * Create a zip archive of the files and folders to be scanned and calculate MD5 hash
     * @param fileArtifacts Array of file artifacts containing path and programming language
     * @param folderArtifacts Array of folder artifacts containing path
     * @param ruleArtifacts Array of file paths to user selected rules
     * @param isFullReviewRequest If user asked for Full review or Partial review
     * @returns An object containing the zip file buffer and its MD5 hash
     */
    private async prepareFilesAndFoldersForUpload(
        fileArtifacts: Array<{ path: string; programmingLanguage: string }>,
        folderArtifacts: Array<{ path: string }>,
        ruleArtifacts: Array<{ path: string }>,
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
                ruleArtifacts,
                customerCodeZip,
                !isFullReviewRequest
            )

            let numberOfFilesInCustomerCodeZip = QCodeReviewUtils.countZipFiles(customerCodeZip)
            if (numberOfFilesInCustomerCodeZip > 0) {
                this.logging.info(`Total files in customerCodeZip - ${numberOfFilesInCustomerCodeZip}`)
            } else {
                throw new Error(QCodeReview.ERROR_MESSAGES.MISSING_FILES_TO_SCAN)
            }

            // Generate user code zip buffer
            const customerCodeBuffer = await QCodeReviewUtils.generateZipBuffer(customerCodeZip)
            QCodeReviewUtils.logZipStructure(customerCodeZip, 'User code', this.logging)

            // Add user code zip to the main artifact zip
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

            // Generate the final code artifact zip
            const zipBuffer = await QCodeReviewUtils.generateZipBuffer(codeArtifactZip)
            QCodeReviewUtils.logZipStructure(codeArtifactZip, 'Code artifact', this.logging)

            // Calculate MD5 hash of the zip buffer
            const md5Hash = crypto.createHash('md5').update(zipBuffer).digest('hex')

            this.logging.info(`Created zip archive, size: ${zipBuffer.byteLength} bytes, MD5: ${md5Hash}`)

            return { zipBuffer, md5Hash, isCodeDiffPresent }
        } catch (error) {
            this.logging.error(`Error preparing files for upload: ${error}`)
            throw error
        }
    }

    /**
     * Processes file, folder, and rule artifacts for inclusion in the zip archive
     * @param fileArtifacts Array of file artifacts to process
     * @param folderArtifacts Array of folder artifacts to process
     * @param ruleArtifacts Array of rule artifacts to process
     * @param customerCodeZip JSZip instance for the customer code
     * @param isCodeDiffScan Whether this is a code diff scan
     * @returns Combined code diff string from all artifacts
     */
    private async processArtifacts(
        fileArtifacts: Array<{ path: string; programmingLanguage: string }>,
        folderArtifacts: Array<{ path: string }>,
        ruleArtifacts: Array<{ path: string }>,
        customerCodeZip: JSZip,
        isCodeDiffScan: boolean
    ): Promise<string> {
        let codeDiff = ''

        // Process files
        codeDiff += await this.processFileArtifacts(fileArtifacts, customerCodeZip, isCodeDiffScan)

        // Process folders
        codeDiff += await this.processFolderArtifacts(folderArtifacts, customerCodeZip, isCodeDiffScan)

        // Process rule artifacts
        await this.processRuleArtifacts(ruleArtifacts, customerCodeZip)

        return codeDiff
    }

    /**
     * Processes file artifacts for inclusion in the zip archive
     * @param fileArtifacts Array of file artifacts to process
     * @param customerCodeZip JSZip instance for the customer code
     * @param isCodeDiffScan Whether this is a code diff scan
     * @returns Combined code diff string from file artifacts
     */
    private async processFileArtifacts(
        fileArtifacts: Array<{ path: string; programmingLanguage: string }>,
        customerCodeZip: JSZip,
        isCodeDiffScan: boolean
    ): Promise<string> {
        let codeDiff = ''

        for (const artifact of fileArtifacts) {
            await QCodeReviewUtils.withErrorHandling(
                async () => {
                    let fileName = path.basename(artifact.path)
                    if (
                        !fileName.startsWith('.') &&
                        !QCodeReviewUtils.shouldSkipFile(fileName) &&
                        existsSync(artifact.path)
                    ) {
                        const fileContent = await this.workspace.fs.readFile(artifact.path)
                        let normalizedArtifactPath = QCodeReviewUtils.convertToUnixPath(artifact.path)
                        customerCodeZip.file(
                            `${QCodeReview.CUSTOMER_CODE_BASE_PATH}${normalizedArtifactPath}`,
                            fileContent
                        )
                    } else {
                        this.logging.info(`Skipping file - ${artifact.path}`)
                    }
                },
                'Failed to read file',
                this.logging,
                artifact.path
            )

            codeDiff += await QCodeReviewUtils.processArtifactWithDiff(artifact, isCodeDiffScan, this.logging)
        }

        return codeDiff
    }

    /**
     * Processes folder artifacts for inclusion in the zip archive
     * @param folderArtifacts Array of folder artifacts to process
     * @param customerCodeZip JSZip instance for the customer code
     * @param isCodeDiffScan Whether this is a code diff scan
     * @returns Combined code diff string from folder artifacts
     */
    private async processFolderArtifacts(
        folderArtifacts: Array<{ path: string }>,
        customerCodeZip: JSZip,
        isCodeDiffScan: boolean
    ): Promise<string> {
        let codeDiff = ''

        for (const folderArtifact of folderArtifacts) {
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
     * Processes rule artifacts for inclusion in the zip archive
     * @param ruleArtifacts Array of rule artifacts to process
     * @param customerCodeZip JSZip instance for the customer code
     */
    private async processRuleArtifacts(ruleArtifacts: Array<{ path: string }>, customerCodeZip: JSZip): Promise<void> {
        for (const artifact of ruleArtifacts) {
            await QCodeReviewUtils.withErrorHandling(
                async () => {
                    let fileName = path.basename(artifact.path)
                    if (
                        !fileName.startsWith('.') &&
                        !QCodeReviewUtils.shouldSkipFile(fileName) &&
                        existsSync(artifact.path)
                    ) {
                        const fileContent = await this.workspace.fs.readFile(artifact.path)
                        customerCodeZip.file(
                            `${QCodeReview.CUSTOMER_CODE_BASE_PATH}/${QCodeReview.RULE_ARTIFACT_PATH}/${fileName}`,
                            fileContent
                        )
                    } else {
                        this.logging.info(`Skipping file - ${artifact.path}`)
                    }
                },
                'Failed to read file',
                this.logging,
                artifact.path
            )
        }
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
                    if (name.startsWith('.') || QCodeReviewUtils.shouldSkipFile(name) || !existsSync(fullPath)) {
                        this.logging.info(`Skipping file - ${fullPath}`)
                        continue
                    }

                    const content = await this.workspace.fs.readFile(fullPath)
                    let normalizedArtifactPath = QCodeReviewUtils.convertToUnixPath(fullPath)
                    zip.file(`${zipPath}${normalizedArtifactPath}`, content)
                } else if (entry.isDirectory()) {
                    if (QCodeReviewUtils.shouldSkipDirectory(name)) {
                        this.logging.info(`Skipping directory - ${fullPath}`)
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
        this.logging.info(`Processing ${findings.length} findings for jobId - ${jobId}`)
        const validatedFindings = this.convertToValidatedFindings(findings, jobId, programmingLanguage)
        this.logging.info(`Validated ${validatedFindings.length} findings for jobId - ${jobId}`)
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

    /**
     * Checks if the operation has been cancelled by the user
     * @param message Optional message to include in the cancellation error
     * @throws Error if the operation has been cancelled
     */
    private checkCancellation(message: string = 'Command execution cancelled'): void {
        QCodeReviewUtils.checkCancellation(this.cancellationToken, this.logging, message)
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
