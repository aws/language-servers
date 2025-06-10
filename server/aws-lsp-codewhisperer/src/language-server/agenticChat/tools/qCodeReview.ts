/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { CodeWhispererServiceToken } from '../../../shared/codeWhispererService'
import { Features } from '@aws/language-server-runtimes/server-interface/server'
import {
    EXTENSION_TO_LANGUAGE,
    PROGRAMMING_LANGUAGES_LOWERCASE,
    TOOL_NAME,
    TOOL_DESCRIPTION,
} from './qCodeReviewConstants'
import { QCodeReviewUtils } from './qCodeReviewUtils'
import { INPUT_SCHEMA, Z_INPUT_SCHEMA, Q_FINDINGS_SCHEMA } from './qCodeReviewSchemas'

export class QCodeReview {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']

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
            const scanName = 'q-agentic-code-review-' + Date.now().toString()
            this.logging.info(`Creating code scan with name: ${scanName}`)

            // Determine upload intent based on input, setting 'FULL_PROJECT_SECURITY_SCAN' by default
            const uploadIntent = 'FULL_PROJECT_SECURITY_SCAN'

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

            // Determine scan scope based on input, setting it always to Project for now
            const scanScope = 'PROJECT'

            const createResponse = await codeWhispererClient.startCodeAnalysis({
                artifacts: artifactMap,
                programmingLanguage: { languageName: programmingLanguage },
                clientToken: QCodeReviewUtils.generateClientToken(),
                codeScanName: scanName,
                scope: scanScope,
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
     * Determine the primary programming language from folder content
     * @param folderPath Path to the folder to analyze
     * @returns The determined programming language or null if can't be determined
     */
    private async determineLanguageFromFolderContent(folderPath: string): Promise<string | null> {
        if (!folderPath) {
            return null
        }

        try {
            // eslint-disable-next-line import/no-nodejs-modules
            const path = require('path')
            const fs = this.workspace.fs

            // Get all files in the directory (non-recursive)
            const items = await fs.readdir(folderPath)

            // Count file extensions to determine the most common language
            const extensionCounts: Record<string, number> = {}

            for (const item of items) {
                // Only process files, not directories
                if (item.isFile()) {
                    const fileName = item.name || item.toString()
                    const ext = path.extname(fileName).toLowerCase()
                    if (ext) {
                        extensionCounts[ext] = (extensionCounts[ext] || 0) + 1
                    }
                }
            }

            // Find the most common extension
            let mostCommonExt = ''
            let highestCount = 0

            for (const [ext, count] of Object.entries(extensionCounts)) {
                if (count > highestCount && EXTENSION_TO_LANGUAGE[ext]) {
                    highestCount = count
                    mostCommonExt = ext
                }
            }

            if (mostCommonExt && EXTENSION_TO_LANGUAGE[mostCommonExt]) {
                return EXTENSION_TO_LANGUAGE[mostCommonExt]
            }

            // If no language could be determined, default to JavaScript as a fallback
            return 'javascript'
        } catch (error) {
            this.logging.error(`Error determining language from folder: ${error}`)
            return null
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
        const JSZip = require('jszip')
        // eslint-disable-next-line import/no-nodejs-modules
        const crypto = require('crypto')
        // eslint-disable-next-line import/no-nodejs-modules
        const path = require('path')
        // eslint-disable-next-line import/no-nodejs-modules
        const { execFile } = require('child_process')
        const fs = this.workspace.fs

        try {
            this.logging.info(
                `Preparing ${fileArtifacts.length} files and ${folderArtifacts.length} folders for upload`
            )

            const codeArtifactZip = new JSZip()
            const customerCodeZip = new JSZip()

            let codeDiff = ''
            const customerCodeBasePath = 'customerCodeBaseFolder'

            // Add individual files to the zip archive
            for (const artifact of fileArtifacts) {
                const filePath = artifact.path
                this.logging.info(`Adding file to zip: ${filePath}`)

                try {
                    // Read file content using workspace fs API
                    const fileContent = await fs.readFile(filePath)

                    // Add file to zip with relative path to maintain directory structure
                    // Use the basename to avoid absolute paths in the zip
                    const fileName = path.basename(filePath)
                    customerCodeZip.file(`${customerCodeBasePath}/${fileName}`, fileContent)

                    // Get git diff of this filePath and append it to codeDiff
                    if (isCodeDiffScan) {
                        try {
                            const diff = await this.getGitDiff(filePath)
                            if (diff) {
                                codeDiff += `\n${diff}\n`
                            }
                        } catch (diffError) {
                            this.logging.warn(`Failed to get git diff for ${filePath}: ${diffError}`)
                        }
                    }
                } catch (error) {
                    this.logging.error(`Failed to read file ${filePath}: ${error}`)
                    throw new Error(`Failed to read file ${filePath}: ${error}`)
                }
            }

            // Add folders (recursively) to the zip archive
            for (const folderArtifact of folderArtifacts) {
                const folderPath = folderArtifact.path
                this.logging.info(`Adding folder to zip: ${folderPath}`)

                try {
                    await this.addFolderToZip(customerCodeZip, folderPath, customerCodeBasePath)

                    // Get git diff of this folderPath and append it to codeDiff
                    if (isCodeDiffScan) {
                        try {
                            const diff = await this.getGitDiff(folderPath)
                            if (diff) {
                                codeDiff += `\n${diff}\n`
                            }
                        } catch (diffError) {
                            this.logging.warn(`Failed to get git diff for ${folderPath}: ${diffError}`)
                        }
                    }
                } catch (error) {
                    this.logging.error(`Failed to add folder ${folderPath}: ${error}`)
                    throw new Error(`Failed to add folder ${folderPath}: ${error}`)
                }
            }

            // Generate customer code zip buffer
            const customerCodeBuffer = await customerCodeZip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }, // Maximum compression
            })

            // Add customer code zip to the main artifact zip
            codeArtifactZip.file('code_artifact/customerCode.zip', customerCodeBuffer)

            // Add code diff file if we have any diffs
            if (isCodeDiffScan && !!codeDiff && codeDiff.trim() !== '') {
                this.logging.info(`Adding code diff to zip: ${codeDiff}`)
                codeArtifactZip.file('code_artifact/codeDiff/customerCodeDiff.diff', codeDiff)
            }

            // Generate the final code artifact zip
            const zipBuffer = await codeArtifactZip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }, // Maximum compression
            })

            // Calculate MD5 hash of the zip buffer
            const md5Hash = crypto.createHash('md5').update(zipBuffer).digest('hex')

            this.logging.info(`Created zip archive, size: ${zipBuffer.length} bytes, MD5: ${md5Hash}`)

            return {
                zipBuffer,
                md5Hash,
            }
        } catch (error) {
            this.logging.error(`Error preparing files for upload: ${error}`)
            throw error
        }
    }

    /**
     * Get git diff for a file or folder
     * @param artifactPath Path to the file or folder
     * @returns Git diff output as string or null if not in a git repository
     */
    private async getGitDiff(artifactPath: string): Promise<string | null> {
        // eslint-disable-next-line import/no-nodejs-modules
        const { exec } = require('child_process')
        // eslint-disable-next-line import/no-nodejs-modules
        const path = require('path')

        this.logging.info(`Get git diff for path - ${artifactPath}`)

        const directoryPath = QCodeReviewUtils.getFolderPath(artifactPath)

        const gitDiffCommandUnstaged = `cd ${directoryPath} && git diff ${artifactPath}`
        const gitDiffCommandStaged = `cd ${directoryPath} && git diff --staged ${artifactPath}`

        this.logging.info(`Running git commands - ${gitDiffCommandUnstaged} and ${gitDiffCommandStaged}`)

        try {
            // Get unstaged changes
            const unstagedDiff = await new Promise<string>((resolve, reject) => {
                exec(gitDiffCommandUnstaged, (error: any, stdout: string, stderr: string) => {
                    if (error) {
                        this.logging.warn(`Git diff failed for unstaged: ${stderr || error.message}`)
                        resolve('') // Resolve with empty string on error
                    } else {
                        resolve(stdout.trim())
                    }
                })
            })

            // Get staged changes
            const stagedDiff = await new Promise<string>((resolve, reject) => {
                exec(gitDiffCommandStaged, (error: any, stdout: string, stderr: string) => {
                    if (error) {
                        this.logging.warn(`Git diff failed for staged: ${stderr || error.message}`)
                        resolve('') // Resolve with empty string on error
                    } else {
                        resolve(stdout.trim())
                    }
                })
            })

            // Combine the diffs
            const combinedDiff = [unstagedDiff, stagedDiff].filter(Boolean).join('\n\n')
            return combinedDiff || null
        } catch (error) {
            this.logging.error(`Error getting git diff: ${error}`)
            return null
        }
    }

    /**
     * Recursively add a folder and its contents to a zip archive
     * @param zip JSZip instance to add files to
     * @param folderPath Path to the folder to add
     * @param zipPath Relative path within the zip archive
     */
    private async addFolderToZip(zip: any, folderPath: string, zipPath: string): Promise<void> {
        // eslint-disable-next-line import/no-nodejs-modules
        const path = require('path')
        const fs = this.workspace.fs

        try {
            const entries = await fs.readdir(folderPath)

            for (const entry of entries) {
                const name = entry.name
                const fullPath = path.join(folderPath, name)
                const zipEntryPath = zipPath ? path.join(zipPath, name) : name

                if (entry.isFile()) {
                    // File
                    // Skip hidden files and common non-code files
                    if (name.startsWith('.') || QCodeReviewUtils.shouldSkipFile(name)) {
                        continue
                    }

                    const content = await fs.readFile(fullPath)
                    zip.file(zipEntryPath, content)
                } else if (entry.isDirectory()) {
                    // Directory
                    // Skip common directories to exclude
                    if (QCodeReviewUtils.shouldSkipDirectory(name)) {
                        continue
                    }

                    // Recursively add subdirectory
                    await this.addFolderToZip(zip, fullPath, zipEntryPath)
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
        // eslint-disable-next-line import/no-nodejs-modules
        const https = require('https')
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
