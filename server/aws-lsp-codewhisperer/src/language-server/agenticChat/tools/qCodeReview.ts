/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable import/no-nodejs-modules */

import { CodeWhispererServiceToken } from '../../../shared/codeWhispererService'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { PROGRAMMING_LANGUAGES_LOWERCASE, TOOL_NAME, TOOL_DESCRIPTION } from './qCodeReviewConstants'
import { QCodeReviewUtils } from './qCodeReviewUtils'
import { INPUT_SCHEMA, Z_INPUT_SCHEMA, Q_FINDINGS_SCHEMA } from './qCodeReviewSchemas'
import { randomUUID } from 'crypto'
import * as crypto from 'crypto'
import * as path from 'path'
import * as https from 'https'
import * as JSZip from 'jszip'

export class QCodeReview {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']

    private static readonly CUSTOMER_CODE_BASE_PATH = 'customerCodeBaseFolder'
    private static readonly CODE_ARTIFACT_PATH = 'code_artifact'
    private static readonly CUSTOMER_CODE_ZIP_NAME = 'customerCode.zip'
    private static readonly CODE_DIFF_PATH = 'code_artifact/codeDiff/customerCodeDiff.diff'
    private static readonly ZIP_COMPRESSION_OPTIONS = {
        type: 'nodebuffer' as const,
        compression: 'DEFLATE' as const,
        compressionOptions: { level: 9 },
    }

    constructor(features: Pick<Features, 'workspace' | 'logging' | 'lsp'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
        this.lsp = features.lsp
    }

    static readonly toolName = TOOL_NAME

    static readonly toolDescription = TOOL_DESCRIPTION

    static readonly inputSchema = INPUT_SCHEMA

    public async execute(input: any, context: any) {
        try {
            this.logging.info(`Executing ${TOOL_NAME}: ${JSON.stringify(input)}`)

            // Step 0: Validate input
            // Get the CodeWhisperer client from the context
            const codeWhispererClient = context.codeWhispererClient as CodeWhispererServiceToken
            if (!codeWhispererClient) {
                throw new Error('CodeWhisperer client not available')
            }

            // Parse and validate input using zod schema for file/folder level
            const validatedInput = Z_INPUT_SCHEMA.parse(input)

            // Prepare artifacts for processing
            const fileArtifacts = validatedInput.fileLevelArtifacts || []
            const folderArtifacts = validatedInput.folderLevelArtifacts || []
            const isCodeDiffScan = validatedInput.isCodeDiffScan || false

            if (fileArtifacts.length === 0 && folderArtifacts.length === 0) {
                throw new Error('No files or folders provided for code review')
            }

            // Determine programming language from file artifacts if available
            const programmingLanguage =
                fileArtifacts.length > 0 ? this.determineProgrammingLanguageFromFileArtifacts(fileArtifacts) : 'java'

            if (!programmingLanguage) {
                throw new Error('Programming language could not be determined')
            }

            // Step 1: Prepare the files for upload - create zip and calculate MD5
            const { zipBuffer, md5Hash } = await this.prepareFilesAndFoldersForUpload(
                fileArtifacts,
                folderArtifacts,
                isCodeDiffScan
            )

            // Step 2: Get a pre-signed URL for uploading the code
            const scanName = 'Standard-' + randomUUID()
            this.logging.info(`Agentic scan name: ${scanName}`)

            // Determine upload intent based on input
            const uploadIntent = 'AGENTIC_CODE_REVIEW'

            const uploadUrlResponse = await codeWhispererClient.createUploadUrl({
                contentLength: zipBuffer.length,
                contentMd5: md5Hash,
                uploadIntent: uploadIntent,
                uploadContext: {
                    codeAnalysisUploadContext: {
                        codeScanName: scanName,
                    },
                },
            })

            if (!uploadUrlResponse.uploadUrl || !uploadUrlResponse.uploadId) {
                throw new Error('Failed to get upload URL')
            } else {
                this.logging.info(`Upload Url - ${uploadUrlResponse.uploadUrl}`)
            }

            // Step 3: Upload the file to the pre-signed URL
            await this.uploadFileToPresignedUrl(
                uploadUrlResponse.uploadUrl,
                zipBuffer,
                uploadUrlResponse.requestHeaders || {}
            )

            // Step 4: Create the code scan with the upload ID
            // The artifact map should be a mapping of artifact type to upload ID
            const artifactMap = {
                SourceCode: uploadUrlResponse.uploadId,
            }

            // Determine scan scope based on input
            const scanScope = 'AGENTIC'

            const createResponse = await codeWhispererClient.startCodeAnalysis({
                artifacts: artifactMap,
                programmingLanguage: { languageName: programmingLanguage },
                clientToken: QCodeReviewUtils.generateClientToken(),
                codeScanName: scanName,
                scope: scanScope,
                codeDiffMetadata: isCodeDiffScan ? { codeDiffPath: '/code_artifact/codeDiff/' } : undefined,
            })

            const jobId = createResponse.jobId
            if (!jobId) {
                throw new Error('Failed to create code scan: No job ID returned')
            }

            this.logging.info(`Code scan created with job ID: ${jobId}`)

            // Step 5: Poll for the code scan status until it completes or fails
            let status = createResponse.status
            while (status === 'Pending') {
                this.logging.info(`Code scan status: ${status}, waiting...`)

                // Wait before checking again
                await new Promise(resolve => setTimeout(resolve, 5000))

                // Check the status
                const statusResponse = await codeWhispererClient.getCodeAnalysis({ jobId })
                status = statusResponse.status

                if (statusResponse.errorMessage) {
                    return {
                        jobId,
                        status,
                        errorMessage: statusResponse.errorMessage,
                    }
                }
            }

            this.logging.info(`Code scan completed with status: ${status}`)

            // Step 6: If the scan completed successfully, get the findings
            if (status === 'Completed') {
                const findingsResponse = await codeWhispererClient.listCodeAnalysisFindings({
                    jobId,
                    codeAnalysisFindingsSchema: 'codeanalysis/findings/1.0',
                })

                let validatedFindings: any[] = []
                if (findingsResponse.codeAnalysisFindings) {
                    validatedFindings = Q_FINDINGS_SCHEMA.parse(JSON.parse(findingsResponse.codeAnalysisFindings))
                }

                this.logging.info(`Parsed findings: ${JSON.stringify(validatedFindings)}`)

                return {
                    jobId,
                    status,
                    result: {
                        message: 'Q Code review tool completed successfully with attached findings.',
                        findings: JSON.stringify(validatedFindings),
                    },
                }
            }

            // If the scan failed or had another status
            return {
                jobId,
                status,
                errorMessage: status === 'Failed' ? 'Code scan failed' : `Unexpected status: ${status}`,
            }
        } catch (error) {
            this.logging.error(`Error in ${TOOL_NAME} - ${error}`)
            throw error
        }
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
     * @param isCodeDiffScan Did customer request for a scan of only code diff
     * @returns An object containing the zip file buffer and its MD5 hash
     */
    private async prepareFilesAndFoldersForUpload(
        fileArtifacts: Array<{ path: string; programmingLanguage: string }>,
        folderArtifacts: Array<{ path: string }>,
        isCodeDiffScan: boolean
    ): Promise<{ zipBuffer: Buffer; md5Hash: string }> {
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
                isCodeDiffScan
            )

            // Generate customer code zip buffer
            const customerCodeBuffer = await QCodeReviewUtils.generateZipBuffer(customerCodeZip)
            QCodeReviewUtils.logZipStructure(customerCodeZip, 'Customer code', this.logging)

            // Add customer code zip to the main artifact zip
            codeArtifactZip.file(
                `${QCodeReview.CODE_ARTIFACT_PATH}/${QCodeReview.CUSTOMER_CODE_ZIP_NAME}`,
                customerCodeBuffer
            )

            // Add code diff file if we have any diffs
            if (isCodeDiffScan && codeDiff.trim()) {
                this.logging.info(`Adding code diff to zip: ${codeDiff}`)
                codeArtifactZip.file(QCodeReview.CODE_DIFF_PATH, codeDiff)
            }

            // Generate the final code artifact zip
            const zipBuffer = await QCodeReviewUtils.generateZipBuffer(codeArtifactZip)
            QCodeReviewUtils.logZipStructure(codeArtifactZip, 'Code artifact', this.logging)

            // Calculate MD5 hash of the zip buffer
            const md5Hash = crypto.createHash('md5').update(zipBuffer).digest('hex')

            this.logging.info(`Created zip archive, size: ${zipBuffer.length} bytes, MD5: ${md5Hash}`)

            QCodeReviewUtils.saveZipToDownloads(zipBuffer, this.logging)

            return { zipBuffer, md5Hash }
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
}
