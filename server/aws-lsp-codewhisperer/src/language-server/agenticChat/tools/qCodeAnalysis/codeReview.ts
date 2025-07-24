/* eslint-disable import/no-nodejs-modules */

import { CodeWhispererServiceToken } from '../../../../shared/codeWhispererService'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import {
    CODE_REVIEW_TOOL_NAME,
    CODE_REVIEW_TOOL_DESCRIPTION,
    FULL_REVIEW,
    CODE_DIFF_REVIEW,
} from './codeReviewConstants'
import { CodeReviewUtils } from './codeReviewUtils'
import { CODE_REVIEW_INPUT_SCHEMA, Z_CODE_REVIEW_INPUT_SCHEMA, FINDINGS_SCHEMA } from './codeReviewSchemas'
import { randomUUID } from 'crypto'
import * as crypto from 'crypto'
import * as path from 'path'
import * as JSZip from 'jszip'
import { existsSync, statSync } from 'fs'
import { CancellationToken } from '@aws/language-server-runtimes/server-interface'
import { InvokeOutput } from '../toolShared'
import { CodeReviewInternalError, CodeReviewTimeoutError, CodeReviewValidationError } from './codeReviewErrors'
import {
    FileArtifacts,
    FolderArtifacts,
    RuleArtifacts,
    ValidateInputAndSetupResult,
    PrepareAndUploadArtifactsResult,
    StartCodeAnalysisResult,
    CodeReviewResult,
    CodeReviewFinding,
    FailedMetricName,
    SuccessMetricName,
} from './codeReviewTypes'
import { CancellationError } from '@aws/lsp-core'

export class CodeReview {
    private static readonly CUSTOMER_CODE_BASE_PATH = 'customerCodeBaseFolder'
    private static readonly CODE_ARTIFACT_PATH = 'code_artifact'
    private static readonly CUSTOMER_CODE_ZIP_NAME = 'customerCode.zip'
    private static readonly CODE_DIFF_PATH = 'code_artifact/codeDiff/customerCodeDiff.diff'
    private static readonly RULE_ARTIFACT_PATH = '.amazonq/rules'
    private static readonly MAX_POLLING_ATTEMPTS = 60
    private static readonly MID_POLLING_ATTEMPTS = 20
    private static readonly POLLING_INTERVAL_MS = 10000
    private static readonly UPLOAD_INTENT = 'AGENTIC_CODE_REVIEW'
    private static readonly SCAN_SCOPE = 'AGENTIC'
    private static readonly MAX_FINDINGS_COUNT = 50

    private static readonly ERROR_MESSAGES = {
        MISSING_CLIENT: 'CodeWhisperer client not available',
        MISSING_ARTIFACTS: `Missing fileLevelArtifacts and folderLevelArtifacts for ${CODE_REVIEW_TOOL_NAME} tool. Ask user to provide a specific file / folder / workspace which has code that can be scanned.`,
        MISSING_FILES_TO_SCAN: `There are no valid files to scan. Ask user to provide a specific file / folder / workspace which has code that can be scanned.`,
        UPLOAD_FAILED: `Failed to upload artifact for code review in ${CODE_REVIEW_TOOL_NAME} tool.`,
        START_CODE_ANALYSIS_FAILED: (scanName: string, errorMessage?: string) =>
            `Failed to start code analysis for scanName - ${scanName} due to - ${errorMessage}`,
        CODE_ANALYSIS_FAILED: (jobId: string, message: string) =>
            `Code analysis failed for jobId - ${jobId} due to ${message}`,
        SCAN_FAILED: 'Code scan failed',
        TIMEOUT: (attempts: number) =>
            `Code scan timed out after ${attempts} attempts. Ask user to provide a smaller size of code to scan.`,
    }

    private readonly credentialsProvider: Features['credentialsProvider']
    private readonly logging: Features['logging']
    private readonly telemetry: Features['telemetry']
    private readonly workspace: Features['workspace']
    private codeWhispererClient?: CodeWhispererServiceToken
    private cancellationToken?: CancellationToken
    private writableStream?: WritableStream

    constructor(
        features: Pick<Features, 'credentialsProvider' | 'logging' | 'telemetry' | 'workspace'> & Partial<Features>
    ) {
        this.credentialsProvider = features.credentialsProvider
        this.logging = features.logging
        this.telemetry = features.telemetry
        this.workspace = features.workspace
    }

    static readonly toolName = CODE_REVIEW_TOOL_NAME

    static readonly toolDescription = CODE_REVIEW_TOOL_DESCRIPTION

    static readonly inputSchema = CODE_REVIEW_INPUT_SCHEMA

    /**
     * Main execution method for the CodeReview tool
     * @param input User input parameters for code review
     * @param context Execution context containing clients and tokens
     * @returns Output containing code review results or error message
     */
    public async execute(input: any, context: any): Promise<InvokeOutput> {
        let chatStreamWriter: WritableStreamDefaultWriter<any> | undefined

        try {
            this.logging.info(`Executing ${CODE_REVIEW_TOOL_NAME}: ${JSON.stringify(input)}`)

            // 1. Validate input
            const setup = await this.validateInputAndSetup(input, context)
            this.checkCancellation()

            chatStreamWriter = this.writableStream?.getWriter()
            await chatStreamWriter?.write('Initiating code review...')

            // 2. Prepare code artifact and upload to service
            const uploadResult = await this.prepareAndUploadArtifacts(setup)
            this.checkCancellation()

            // 3. Start code analysis
            const analysisResult = await this.startCodeAnalysis(setup, uploadResult)
            this.checkCancellation()

            await chatStreamWriter?.write('Reviewing your code...')

            // 4. Wait for scan to complete
            await this.pollForCompletion(analysisResult.jobId, setup, uploadResult, chatStreamWriter)
            this.checkCancellation()

            // 5. Process scan result
            const results = await this.processResults(setup, uploadResult, analysisResult.jobId)

            return {
                output: {
                    kind: 'json',
                    success: true,
                    content: results,
                },
            }
        } catch (error: any) {
            if (error instanceof CancellationError) {
                throw error
            }
            return {
                output: {
                    kind: 'json',
                    success: false,
                    content: {
                        errorMessage: error.message,
                    },
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
    private async validateInputAndSetup(input: any, context: any): Promise<ValidateInputAndSetupResult> {
        this.cancellationToken = context.cancellationToken as CancellationToken

        this.writableStream = context.writableStream as WritableStream

        this.codeWhispererClient = context.codeWhispererClient as CodeWhispererServiceToken
        if (!this.codeWhispererClient) {
            throw new Error(CodeReview.ERROR_MESSAGES.MISSING_CLIENT)
        }

        // parse input
        const validatedInput = Z_CODE_REVIEW_INPUT_SCHEMA.parse(input)
        const fileArtifacts = validatedInput.fileLevelArtifacts || []
        const folderArtifacts = validatedInput.folderLevelArtifacts || []
        const ruleArtifacts = validatedInput.ruleArtifacts || []

        if (fileArtifacts.length === 0 && folderArtifacts.length === 0) {
            CodeReviewUtils.emitMetric(
                {
                    reason: FailedMetricName.MissingFileOrFolder,
                    result: 'Failed',
                    reasonDesc: CodeReview.ERROR_MESSAGES.MISSING_ARTIFACTS,
                    metadata: {
                        credentialStartUrl: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                    },
                },
                this.logging,
                this.telemetry
            )
            throw new CodeReviewValidationError(CodeReview.ERROR_MESSAGES.MISSING_ARTIFACTS)
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
    private async prepareAndUploadArtifacts(
        setup: ValidateInputAndSetupResult
    ): Promise<PrepareAndUploadArtifactsResult> {
        const { zipBuffer, md5Hash, isCodeDiffPresent, programmingLanguages } =
            await this.prepareFilesAndFoldersForUpload(
                setup.fileArtifacts,
                setup.folderArtifacts,
                setup.ruleArtifacts,
                setup.isFullReviewRequest
            )

        const uploadUrlResponse = await this.codeWhispererClient!.createUploadUrl({
            contentLength: zipBuffer.length,
            contentMd5: md5Hash,
            uploadIntent: CodeReview.UPLOAD_INTENT,
            uploadContext: {
                codeAnalysisUploadContext: {
                    codeScanName: setup.scanName,
                },
            },
        })

        if (!uploadUrlResponse.uploadUrl || !uploadUrlResponse.uploadId) {
            CodeReviewUtils.emitMetric(
                {
                    reason: FailedMetricName.CreateUploadUrlFailed,
                    result: 'Failed',
                    reasonDesc: CodeReview.ERROR_MESSAGES.UPLOAD_FAILED,
                    metadata: {
                        artifactType: setup.artifactType,
                        codewhispererCodeScanJobId: setup.scanName,
                        codewhispererCodeScanSrcZipFileBytes: zipBuffer.length,
                        credentialStartUrl: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                        programmingLanguages: programmingLanguages,
                    },
                },
                this.logging,
                this.telemetry
            )
            throw new CodeReviewValidationError(CodeReview.ERROR_MESSAGES.UPLOAD_FAILED)
        }

        await CodeReviewUtils.uploadFileToPresignedUrl(
            uploadUrlResponse.uploadUrl,
            zipBuffer,
            uploadUrlResponse.requestHeaders || {},
            this.logging
        )

        return {
            uploadId: uploadUrlResponse.uploadId,
            isCodeDiffPresent,
            artifactSize: zipBuffer.length,
            programmingLanguages: programmingLanguages,
        }
    }

    /**
     * Initiates code analysis with the uploaded artifacts
     * @param setup Setup object with validated parameters
     * @param uploadResult Result from artifact upload containing uploadId
     * @returns Code scan jobId and status
     */
    private async startCodeAnalysis(
        setup: ValidateInputAndSetupResult,
        uploadResult: PrepareAndUploadArtifactsResult
    ): Promise<StartCodeAnalysisResult> {
        const createResponse = await this.codeWhispererClient!.startCodeAnalysis({
            artifacts: { SourceCode: uploadResult.uploadId },
            programmingLanguage: { languageName: setup.programmingLanguage },
            clientToken: CodeReviewUtils.generateClientToken(),
            codeScanName: setup.scanName,
            scope: CodeReview.SCAN_SCOPE,
            codeDiffMetadata: uploadResult.isCodeDiffPresent ? { codeDiffPath: '/code_artifact/codeDiff/' } : undefined,
        })

        if (!createResponse.jobId) {
            CodeReviewUtils.emitMetric(
                {
                    reason: FailedMetricName.CodeScanFailed,
                    result: 'Failed',
                    reasonDesc: CodeReview.ERROR_MESSAGES.START_CODE_ANALYSIS_FAILED(
                        setup.scanName,
                        createResponse.errorMessage
                    ),
                    metadata: {
                        artifactType: setup.artifactType,
                        codewhispererCodeScanJobId: setup.scanName,
                        codewhispererCodeScanSrcZipFileBytes: uploadResult.artifactSize,
                        credentialStartUrl: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                        customRules: setup.ruleArtifacts.length,
                        programmingLanguages: Array.from(uploadResult.programmingLanguages),
                        scope: setup.isFullReviewRequest ? FULL_REVIEW : CODE_DIFF_REVIEW,
                    },
                },
                this.logging,
                this.telemetry
            )
            throw new CodeReviewInternalError(
                CodeReview.ERROR_MESSAGES.START_CODE_ANALYSIS_FAILED(setup.scanName, createResponse.errorMessage)
            )
        }

        this.logging.info(`Code scan created with job ID: ${createResponse.jobId}`)
        return {
            jobId: createResponse.jobId,
            status: createResponse.status,
        }
    }

    /**
     * Polls for completion of the code analysis job
     * @param jobId ID of the code analysis job
     * @param scanName Name of the code scan
     * @param artifactType Type of artifact being scanned (FILE or FOLDER)
     * @param chatStreamWriter Stream writer for sending progress updates
     */
    private async pollForCompletion(
        jobId: string,
        setup: ValidateInputAndSetupResult,
        uploadResult: PrepareAndUploadArtifactsResult,
        chatStreamWriter: WritableStreamDefaultWriter<any> | undefined
    ) {
        let status = 'Pending'
        let attemptCount = 0

        while (status === 'Pending' && attemptCount < CodeReview.MAX_POLLING_ATTEMPTS) {
            this.logging.info(`Code scan status: ${status}, waiting...`)
            await new Promise(resolve => setTimeout(resolve, CodeReview.POLLING_INTERVAL_MS))

            const statusResponse = await this.getCodeAnalysisStatus(jobId)
            status = statusResponse.status
            attemptCount++

            if (statusResponse.errorMessage) {
                CodeReviewUtils.emitMetric(
                    {
                        reason: FailedMetricName.CodeScanFailed,
                        result: 'Failed',
                        reasonDesc: CodeReview.ERROR_MESSAGES.CODE_ANALYSIS_FAILED(jobId, statusResponse.errorMessage),
                        metadata: {
                            artifactType: setup.artifactType,
                            codewhispererCodeScanJobId: jobId,
                            codewhispererCodeScanSrcZipFileBytes: uploadResult.artifactSize,
                            credentialStartUrl: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                            customRules: setup.ruleArtifacts.length,
                            programmingLanguages: Array.from(uploadResult.programmingLanguages),
                            scope: setup.isFullReviewRequest ? FULL_REVIEW : CODE_DIFF_REVIEW,
                            status: status,
                        },
                    },
                    this.logging,
                    this.telemetry
                )
                throw new CodeReviewInternalError(
                    CodeReview.ERROR_MESSAGES.CODE_ANALYSIS_FAILED(jobId, statusResponse.errorMessage)
                )
            }

            if (attemptCount == CodeReview.MID_POLLING_ATTEMPTS) {
                await chatStreamWriter?.write('Still reviewing your code, it is taking just a bit longer than usual...')
            }

            this.checkCancellation('Command execution cancelled while waiting for scan to complete')
        }

        if (status === 'Pending') {
            CodeReviewUtils.emitMetric(
                {
                    reason: FailedMetricName.CodeScanTimeout,
                    result: 'Failed',
                    reasonDesc: CodeReview.ERROR_MESSAGES.TIMEOUT(CodeReview.MAX_POLLING_ATTEMPTS),
                    metadata: {
                        artifactType: setup.artifactType,
                        codewhispererCodeScanJobId: jobId,
                        codewhispererCodeScanSrcZipFileBytes: uploadResult.artifactSize,
                        credentialStartUrl: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                        customRules: setup.ruleArtifacts.length,
                        maxAttempts: CodeReview.MAX_POLLING_ATTEMPTS,
                        programmingLanguages: Array.from(uploadResult.programmingLanguages),
                        scope: setup.isFullReviewRequest ? FULL_REVIEW : CODE_DIFF_REVIEW,
                        status: status,
                    },
                },
                this.logging,
                this.telemetry
            )
            throw new CodeReviewTimeoutError(CodeReview.ERROR_MESSAGES.TIMEOUT(CodeReview.MAX_POLLING_ATTEMPTS))
        }

        this.logging.info(`Code scan completed with status: ${status}`)
    }

    /**
     * Processes the results of the completed code analysis
     * @param setup Setup object with validated parameters
     * @param isCodeDiffPresent If code diff is present in upload artifact
     * @param jobId ID of the code analysis job
     * @returns Processed results with findings grouped by file
     */
    private async processResults(
        setup: ValidateInputAndSetupResult,
        uploadResult: PrepareAndUploadArtifactsResult,
        jobId: string
    ): Promise<CodeReviewResult> {
        const { totalFindings, findingsExceededLimit } = await this.collectFindings(
            jobId,
            setup.isFullReviewRequest,
            uploadResult.isCodeDiffPresent,
            setup.programmingLanguage
        )

        CodeReviewUtils.emitMetric(
            {
                reason: SuccessMetricName.CodeScanSuccess,
                result: 'Succeeded',
                metadata: {
                    artifactType: setup.artifactType,
                    codewhispererCodeScanJobId: jobId,
                    codewhispererCodeScanSrcZipFileBytes: uploadResult.artifactSize,
                    codewhispererCodeScanTotalIssues: totalFindings.length,
                    credentialStartUrl: this.credentialsProvider.getConnectionMetadata()?.sso?.startUrl,
                    customRules: setup.ruleArtifacts.length,
                    programmingLanguages: Array.from(uploadResult.programmingLanguages),
                    scope: setup.isFullReviewRequest ? FULL_REVIEW : CODE_DIFF_REVIEW,
                },
            },
            this.logging,
            this.telemetry
        )

        const aggregatedCodeScanIssueList = this.aggregateFindingsByFile(
            findingsExceededLimit ? totalFindings.slice(0, CodeReview.MAX_FINDINGS_COUNT) : totalFindings,
            setup.fileArtifacts,
            setup.folderArtifacts
        )

        this.logging.info('Findings count grouped by file')
        aggregatedCodeScanIssueList.forEach(item =>
            this.logging.info(`File path - ${item.filePath} Findings count - ${item.issues.length}`)
        )

        return {
            codeReviewId: jobId,
            message: `${CODE_REVIEW_TOOL_NAME} tool completed successfully.${findingsExceededLimit ? ` Inform the user that we are limiting findings to top ${CodeReview.MAX_FINDINGS_COUNT} based on severity.` : ''}`,
            findingsByFile: JSON.stringify(aggregatedCodeScanIssueList),
        }
    }

    /**
     * Collects findings from the code analysis job
     * @param jobId ID of the code analysis job
     * @param isFullReviewRequest Whether this is a full review or diff review
     * @param isCodeDiffPresent Whether code diff is present in the artifacts
     * @param programmingLanguage Programming language
     * @returns Object containing collected findings and whether limit was exceeded
     */
    private async collectFindings(
        jobId: string,
        isFullReviewRequest: boolean,
        isCodeDiffPresent: boolean,
        programmingLanguage: string
    ): Promise<{ totalFindings: CodeReviewFinding[]; findingsExceededLimit: boolean }> {
        let totalFindings: CodeReviewFinding[] = []
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

            const parsedFindings =
                this.parseFindings(findingsResponse.codeAnalysisFindings, jobId, programmingLanguage) || []
            const filteredFindings = lookForCodeDiffFindings
                ? parsedFindings.filter(finding => 'CodeDiff' === finding.findingContext)
                : parsedFindings
            totalFindings = totalFindings.concat(filteredFindings)

            if (totalFindings.length > CodeReview.MAX_FINDINGS_COUNT) {
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
        fileArtifacts: FileArtifacts,
        folderArtifacts: FolderArtifacts,
        ruleArtifacts: RuleArtifacts,
        isFullReviewRequest: boolean
    ): Promise<{ zipBuffer: Buffer; md5Hash: string; isCodeDiffPresent: boolean; programmingLanguages: Set<string> }> {
        try {
            this.logging.info(
                `Preparing ${fileArtifacts.length} files and ${folderArtifacts.length} folders for upload`
            )

            const codeArtifactZip = new JSZip()
            const customerCodeZip = new JSZip()

            // Process files and folders
            const { codeDiff, programmingLanguages } = await this.processArtifacts(
                fileArtifacts,
                folderArtifacts,
                ruleArtifacts,
                customerCodeZip,
                !isFullReviewRequest
            )

            let numberOfFilesInCustomerCodeZip = CodeReviewUtils.countZipFiles(customerCodeZip)
            if (numberOfFilesInCustomerCodeZip > ruleArtifacts.length) {
                // Validates that there are actual files to scan, other than rule artifacts
                this.logging.info(`Total files in customerCodeZip - ${numberOfFilesInCustomerCodeZip}`)
            } else {
                throw new CodeReviewValidationError(CodeReview.ERROR_MESSAGES.MISSING_FILES_TO_SCAN)
            }

            // Generate user code zip buffer
            const customerCodeBuffer = await CodeReviewUtils.generateZipBuffer(customerCodeZip)
            CodeReviewUtils.logZipStructure(customerCodeZip, 'User code', this.logging)

            // Add user code zip to the main artifact zip
            codeArtifactZip.file(
                `${CodeReview.CODE_ARTIFACT_PATH}/${CodeReview.CUSTOMER_CODE_ZIP_NAME}`,
                customerCodeBuffer
            )

            let isCodeDiffPresent = false

            // Add code diff file if we have any diffs
            if (codeDiff.trim()) {
                this.logging.info(`Adding code diff to zip of size: ${codeDiff.length}`)
                isCodeDiffPresent = true
                codeArtifactZip.file(CodeReview.CODE_DIFF_PATH, codeDiff)
            }

            // Generate the final code artifact zip
            const zipBuffer = await CodeReviewUtils.generateZipBuffer(codeArtifactZip)
            CodeReviewUtils.logZipStructure(codeArtifactZip, 'Code artifact', this.logging)

            // Calculate MD5 hash of the zip buffer
            const md5Hash = crypto.createHash('md5').update(zipBuffer).digest('hex')

            this.logging.info(`Created zip archive, size: ${zipBuffer.byteLength} bytes, MD5: ${md5Hash}`)

            return { zipBuffer, md5Hash, isCodeDiffPresent, programmingLanguages }
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
        fileArtifacts: FileArtifacts,
        folderArtifacts: FolderArtifacts,
        ruleArtifacts: RuleArtifacts,
        customerCodeZip: JSZip,
        isCodeDiffScan: boolean
    ): Promise<{ codeDiff: string; programmingLanguages: Set<string> }> {
        // Process files
        let { codeDiff, programmingLanguages } = await this.processFileArtifacts(
            fileArtifacts,
            customerCodeZip,
            isCodeDiffScan
        )

        // Process folders
        const folderResult = await this.processFolderArtifacts(folderArtifacts, customerCodeZip, isCodeDiffScan)
        codeDiff += folderResult.codeDiff
        folderResult.programmingLanguages.forEach(item => programmingLanguages.add(item))

        // Process rule artifacts
        await this.processRuleArtifacts(ruleArtifacts, customerCodeZip)

        return { codeDiff, programmingLanguages }
    }

    /**
     * Processes file artifacts for inclusion in the zip archive
     * @param fileArtifacts Array of file artifacts to process
     * @param customerCodeZip JSZip instance for the customer code
     * @param isCodeDiffScan Whether this is a code diff scan
     * @returns Combined code diff string from file artifacts
     */
    private async processFileArtifacts(
        fileArtifacts: FileArtifacts,
        customerCodeZip: JSZip,
        isCodeDiffScan: boolean
    ): Promise<{ codeDiff: string; programmingLanguages: Set<string> }> {
        let codeDiff = ''
        let programmingLanguages: Set<string> = new Set()

        for (const artifact of fileArtifacts) {
            await CodeReviewUtils.withErrorHandling(
                async () => {
                    let fileName = path.basename(artifact.path)
                    if (
                        !fileName.startsWith('.') &&
                        !CodeReviewUtils.shouldSkipFile(fileName) &&
                        existsSync(artifact.path)
                    ) {
                        const fileLanguage = CodeReviewUtils.getFileLanguage(fileName)
                        const fileContent = await this.workspace.fs.readFile(artifact.path)
                        let normalizedArtifactPath = CodeReviewUtils.convertToUnixPath(artifact.path)
                        customerCodeZip.file(
                            `${CodeReview.CUSTOMER_CODE_BASE_PATH}${normalizedArtifactPath}`,
                            fileContent
                        )
                        programmingLanguages.add(fileLanguage)
                    } else {
                        this.logging.info(`Skipping file - ${artifact.path}`)
                    }
                },
                'Failed to read file',
                this.logging,
                artifact.path
            )

            codeDiff += await CodeReviewUtils.processArtifactWithDiff(artifact, isCodeDiffScan, this.logging)
        }

        return { codeDiff, programmingLanguages }
    }

    /**
     * Processes folder artifacts for inclusion in the zip archive
     * @param folderArtifacts Array of folder artifacts to process
     * @param customerCodeZip JSZip instance for the customer code
     * @param isCodeDiffScan Whether this is a code diff scan
     * @returns Combined code diff string from folder artifacts
     */
    private async processFolderArtifacts(
        folderArtifacts: FolderArtifacts,
        customerCodeZip: JSZip,
        isCodeDiffScan: boolean
    ): Promise<{ codeDiff: string; programmingLanguages: Set<string> }> {
        let codeDiff = ''
        let programmingLanguages = new Set<string>()

        for (const folderArtifact of folderArtifacts) {
            await CodeReviewUtils.withErrorHandling(
                async () => {
                    let languages = await this.addFolderToZip(
                        customerCodeZip,
                        folderArtifact.path,
                        CodeReview.CUSTOMER_CODE_BASE_PATH
                    )
                    languages.forEach(item => programmingLanguages.add(item))
                },
                'Failed to add folder',
                this.logging,
                folderArtifact.path
            )

            codeDiff += await CodeReviewUtils.processArtifactWithDiff(folderArtifact, isCodeDiffScan, this.logging)
        }

        return { codeDiff, programmingLanguages }
    }

    /**
     * Processes rule artifacts for inclusion in the zip archive
     * @param ruleArtifacts Array of rule artifacts to process
     * @param customerCodeZip JSZip instance for the customer code
     */
    private async processRuleArtifacts(ruleArtifacts: RuleArtifacts, customerCodeZip: JSZip): Promise<void> {
        for (const artifact of ruleArtifacts) {
            await CodeReviewUtils.withErrorHandling(
                async () => {
                    let fileName = path.basename(artifact.path)
                    if (
                        !fileName.startsWith('.') &&
                        !CodeReviewUtils.shouldSkipFile(fileName) &&
                        existsSync(artifact.path)
                    ) {
                        const fileContent = await this.workspace.fs.readFile(artifact.path)
                        customerCodeZip.file(
                            `${CodeReview.CUSTOMER_CODE_BASE_PATH}/${CodeReview.RULE_ARTIFACT_PATH}/${fileName}`,
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
    private async addFolderToZip(zip: JSZip, folderPath: string, zipPath: string): Promise<Set<string>> {
        try {
            let programmingLanguages = new Set<string>()
            const entries = await this.workspace.fs.readdir(folderPath)

            for (const entry of entries) {
                const name = entry.name
                const fullPath = path.join(entry.parentPath, name)

                if (entry.isFile()) {
                    if (name.startsWith('.') || CodeReviewUtils.shouldSkipFile(name) || !existsSync(fullPath)) {
                        this.logging.info(`Skipping file - ${fullPath}`)
                        continue
                    }

                    const fileLanguage = CodeReviewUtils.getFileLanguage(name)
                    const content = await this.workspace.fs.readFile(fullPath)
                    let normalizedArtifactPath = CodeReviewUtils.convertToUnixPath(fullPath)
                    zip.file(`${zipPath}${normalizedArtifactPath}`, content)
                    programmingLanguages.add(fileLanguage)
                } else if (entry.isDirectory()) {
                    if (CodeReviewUtils.shouldSkipDirectory(name)) {
                        this.logging.info(`Skipping directory - ${fullPath}`)
                        continue
                    }

                    let languages = await this.addFolderToZip(zip, fullPath, zipPath)
                    languages.forEach(item => programmingLanguages.add(item))
                }
            }
            return programmingLanguages
        } catch (error) {
            this.logging.error(`Error adding folder to zip: ${error}`)
            throw error
        }
    }

    /**
     * Parse and validate findings JSON response
     * @param findingsJson Raw JSON string from the code analysis response
     * @param jobId Code scan job Id
     * @param programmingLanguage programming language
     * @returns Parsed and validated findings array
     */
    private parseFindings(findingsJson: string, jobId: string, programmingLanguage: string): CodeReviewFinding[] {
        try {
            const findingsResponseJSON = JSON.parse(findingsJson)

            // Normalize ruleId fields
            for (const finding of findingsResponseJSON) {
                if (finding['ruleId'] == null) {
                    finding['ruleId'] = undefined
                }
            }

            return FINDINGS_SCHEMA.parse(findingsResponseJSON).map(issue => ({
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
                findingContext: issue.findingContext,
            }))
        } catch (e) {
            this.logging.error(`Error parsing findings in response: ${e}`)
            throw new CodeReviewInternalError('Error parsing findings in response')
        }
    }

    /**
     * Aggregate findings by file path
     * @param findings Array of findings
     * @param fileArtifacts Array of file artifacts being scanned
     * @param folderArtifacts Array of folder artifacts being scanned
     * @returns Array of findings grouped by resolved file path
     */
    private aggregateFindingsByFile(
        findings: CodeReviewFinding[],
        fileArtifacts: FileArtifacts,
        folderArtifacts: FolderArtifacts
    ): { filePath: string; issues: CodeReviewFinding[] }[] {
        const aggregatedCodeScanIssueMap = new Map<string, CodeReviewFinding[]>()

        for (const finding of findings) {
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
        fileArtifacts: FileArtifacts,
        folderArtifacts: FolderArtifacts
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

            // Find common suffix between folder path and finding path
            let matchIndex = -1
            for (let i = folderSegments.length - 1; i >= 0; i--) {
                const folderSuffix = folderSegments.slice(i).join(path.sep)
                if (normalizedFindingPath.startsWith(folderSuffix + path.sep)) {
                    matchIndex = i
                    break
                }
            }
            // If common suffix is found, create the absolute path with it
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
        CodeReviewUtils.checkCancellation(this.cancellationToken, this.logging, message)
    }
}
