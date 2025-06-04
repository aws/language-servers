/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod'
import { CodeWhispererServiceToken } from '../../../shared/codeWhispererService'
import { Features } from '@aws/language-server-runtimes/server-interface/server'

export class QCodeReview {
    private readonly logging: Features['logging']
    private readonly workspace: Features['workspace']
    private readonly lsp: Features['lsp']

    constructor(features: Pick<Features, 'workspace' | 'logging' | 'lsp'> & Partial<Features>) {
        this.logging = features.logging
        this.workspace = features.workspace
        this.lsp = features.lsp
    }

    static readonly toolName = 'qCodeReview'

    static readonly toolDescription = [
        'A tool for scanning code for security vulnerabilities and code quality issues',
        '',
        'Amazon Q Review provides comprehensive code analysis with:',
        '- Static Application Security Testing (SAST): Identifies vulnerabilities in source code without execution',
        '- Secrets Detection: Finds hardcoded credentials, API keys, tokens, and other sensitive information',
        '- Infrastructure as Code (IaC) Analysis: Detects security issues in infrastructure definitions',
        '- Software Composition Analysis (SCA): Identifies vulnerabilities in dependencies and third-party components',
        '',
        'Key capabilities include detection of:',
        '- Security vulnerabilities: Injection flaws, XSS, CSRF, insecure authentication, data exposure risks',
        '- Code quality issues: Bugs, anti-patterns, and maintainability concerns',
        '- Best practice violations: Deviations from coding standards and recommended practices',
        '- Resource leaks: Potential memory leaks and unclosed resources',
        '- Input validation problems: Missing or improper validation of user inputs',
        '',
        'Findings include:',
        '- Issue severity classification (Critical, High, Medium, Low)',
        '- Specific code locations where issues were found',
        '- References to relevant security standards and best practices',
        '',
        'Supported programming languages:',
        '- Python, JavaScript/TypeScript, Java, C#, PHP, Ruby, Go, Rust, C/C++',
        '- Shell scripts, SQL, Kotlin, Scala, Swift',
    ].join('\n')

    private static readonly programmingLanguageInCaps = [
        'PYTHON',
        'JAVASCRIPT',
        'TYPESCRIPT',
        'JAVA',
        'CSHARP',
        'PHP',
        'RUBY',
        'GO',
        'RUST',
        'CPP',
        'C',
        'SHELL',
        'SQL',
        'KOTLIN',
        'SCALA',
        'SWIFT',
    ]

    private static readonly programmingLanguageInLowerCase = [
        'python',
        'javascript',
        'typescript',
        'java',
        'csharp',
        'php',
        'ruby',
        'go',
        'rust',
        'cpp',
        'c',
        'shell',
        'sql',
        'kotlin',
        'scala',
        'swift',
    ]

    private static readonly findingSeverity = ['Info', 'Low', 'Medium', 'High', 'Critical']

    static readonly inputSchema = {
        type: <const>'object',
        properties: {
            artifacts: {
                type: <const>'array',
                description:
                    'Array of items containing artifact paths and their programming language (e.g. [{"path": "path/to/file.py", "programmingLanguage": "PYTHON"}])',
                items: {
                    type: <const>'object',
                    description:
                        'Array item containing artifact path and the programming language (e.g. {"path": "path/to/file.py", "programmingLanguage": "PYTHON"})',
                    properties: {
                        path: {
                            type: <const>'string',
                            description: 'The path of the file that will be scanned',
                        },
                        programmingLanguage: {
                            type: <const>'string',
                            description: 'The type of programming language of the file based on file extension',
                            enum: QCodeReview.programmingLanguageInCaps,
                        },
                    },
                    required: ['path', 'programmingLanguage'] as const,
                },
            },
            programmingLanguage: {
                type: <const>'string',
                description:
                    'Primary programming language for the scan (lowercase). If not provided, will be determined from artifacts.',
                enum: QCodeReview.programmingLanguageInLowerCase,
            },
        },
        required: ['artifacts'] as const,
    }

    static readonly zInputSchema = z.object({
        artifacts: z.array(
            z.object({
                path: z.string(),
                programmingLanguage: z.enum(QCodeReview.programmingLanguageInCaps as [string, ...string[]]),
            })
        ),
        programmingLanguage: z.enum(QCodeReview.programmingLanguageInLowerCase as [string, ...string[]]).optional(),
    })

    static readonly qFindingSchema = z.object({
        description: z.object({
            markdown: z.string(),
            text: z.string(),
        }),
        endLine: z.number(),
        filePath: z.string(),
        findingId: z.string(),
        relatedVulnerabilities: z.array(z.string().optional()),
        remediation: z.object({
            recommendation: z.object({
                text: z.string(),
                url: z.string().optional(),
            }),
        }),
        severity: z.enum(QCodeReview.findingSeverity as [string, ...string[]]),
        startLine: z.number(),
        title: z.string(),
    })
    static readonly qFindingsSchema = z.array(QCodeReview.qFindingSchema)

    public static getCodeReviewFindingSummary(findingsJsonString: string): string {
        // Step 1: Convert findingsJsonString to zFindingSchema
        try {
            const findings = JSON.parse(findingsJsonString)
            const validatedFindings = QCodeReview.qFindingsSchema.parse(findings)

            // Step 2: Map findings into severity and count of each severity
            const severityCounts: Record<string, number> = {
                Critical: 0,
                High: 0,
                Medium: 0,
                Low: 0,
                Info: 0,
            }

            // Count findings by severity
            validatedFindings.forEach(finding => {
                if (severityCounts.hasOwnProperty(finding.severity)) {
                    severityCounts[finding.severity]++
                }
            })

            // Step 3: Return summary string
            const totalFindings = validatedFindings.length

            let summary = `## Q Code Review \n`

            if (totalFindings > 0) {
                summary += `Based on my analysis, I've identified ${totalFindings} issue${totalFindings !== 1 ? 's' : ''} in the code that need to be addressed. Here is a summary of them -\n`
                // Add counts for each severity level (only include non-zero counts)
                // Iterate in reverse order to show most severe findings first
                for (const severity of [...QCodeReview.findingSeverity].reverse()) {
                    if (severityCounts[severity] > 0) {
                        summary += `- ${severity}: ${severityCounts[severity]}\n`
                    }
                }
                summary += `\nHere is a detailed list -\n`
                validatedFindings.forEach(finding => {
                    summary += `- **${finding.title}**\n`
                    summary += `  - Severity: **${finding.severity}**\n`
                    summary += `  - Location: ${finding.filePath} (lines ${finding.startLine}-${finding.endLine})\n`
                    summary += `  - Description: ${finding.description.markdown}\n`
                    if (finding.relatedVulnerabilities.length > 0) {
                        summary += `  - Related Vulnerabilities: **${finding.relatedVulnerabilities.join(', ')}**\n`
                    }
                    if (finding.remediation.recommendation.text) {
                        summary += `  - Recommendation: *${finding.remediation.recommendation.text}*\n`
                    }
                    if (finding.remediation.recommendation.url) {
                        summary += `  - Reference: [${finding.remediation.recommendation.url}](${finding.remediation.recommendation.url})\n`
                    }
                    summary += `\n`
                })
            } else {
                summary += 'No issues were found in the code review.'
            }

            return summary.trim()
        } catch (error) {
            console.error('Error parsing findings JSON:', error)
            return 'Failed to parse code review findings.'
        }
    }

    public async execute(input: any, context: any) {
        try {
            this.logging.info(`Executing ${QCodeReview.toolName}: ${JSON.stringify(input)}`)
            // Step 0: Validate input
            // Get the CodeWhisperer client from the context
            const codeWhispererClient = context.codeWhispererClient as CodeWhispererServiceToken
            if (!codeWhispererClient) {
                throw new Error('CodeWhisperer client not available')
            }

            // Parse and validate input using zod schema
            const validatedInput = QCodeReview.zInputSchema.parse(input)

            // Extract programming language from input or determine from artifacts
            const programmingLanguage =
                validatedInput.programmingLanguage ||
                this.determineProgrammingLanguageFromArtifacts(validatedInput.artifacts)
            if (!programmingLanguage) {
                throw new Error('Programming language could not be determined')
            }

            // Step 1: Prepare the files for upload - create zip and calculate MD5
            const { zipBuffer, md5Hash } = await this.prepareFilesForUpload(input.artifacts)

            // Step 2: Get a pre-signed URL for uploading the code
            const scanName = 'q-agentic-code-review-' + Date.now().toString()
            this.logging.info(`Creating code scan with name: ${scanName}`)

            const uploadUrlResponse = await codeWhispererClient.createUploadUrl({
                contentLength: zipBuffer.length,
                contentMd5: md5Hash,
                uploadIntent: 'AUTOMATIC_FILE_SECURITY_SCAN',
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

            const createResponse = await codeWhispererClient.startCodeAnalysis({
                artifacts: artifactMap,
                programmingLanguage: { languageName: programmingLanguage },
                clientToken: this.generateClientToken(),
                codeScanName: scanName,
                scope: 'FILE',
            })

            const jobId = createResponse.jobId
            if (!jobId) {
                throw new Error('Failed to create code scan: No job ID returned')
            }

            this.logging.info(`Code scan created with job ID: ${jobId}`)

            // Poll for the code scan status until it completes or fails
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

            // If the scan completed successfully, get the findings
            if (status === 'Completed') {
                const findingsResponse = await codeWhispererClient.listCodeAnalysisFindings({
                    jobId,
                    codeAnalysisFindingsSchema: 'codeanalysis/findings/1.0',
                })

                let validatedFindings: any[] = []
                if (findingsResponse.codeAnalysisFindings) {
                    validatedFindings = QCodeReview.qFindingsSchema.parse(
                        JSON.parse(findingsResponse.codeAnalysisFindings)
                    )
                }

                this.logging.info(`Parsed findings: ${JSON.stringify(validatedFindings)}`)

                return {
                    jobId,
                    status,
                    result: {
                        message: 'Q Code review tool completed successfully with attached findings. ',
                        //+ 'These findings should be validated by runnning the Q Finding Critic tool.',
                        findings: JSON.stringify(validatedFindings),
                    },
                }
            }

            codeWhispererClient.completeRequest

            // If the scan failed or had another status
            return {
                jobId,
                status,
                errorMessage: status === 'Failed' ? 'Code scan failed' : `Unexpected status: ${status}`,
            }
        } catch (error) {
            this.logging.error(`Error in ${QCodeReview.toolName} - ${error}`)
            throw error
        }
    }

    private determineProgrammingLanguageFromArtifacts(
        artifacts: Array<{ path: string; programmingLanguage: string }>
    ): string | null {
        if (!artifacts || artifacts.length === 0) {
            return null
        }

        // Use the programming language of the first artifact as default
        const firstLanguage = artifacts[0].programmingLanguage.toLowerCase()
        if (QCodeReview.programmingLanguageInLowerCase.includes(firstLanguage)) {
            return firstLanguage
        } else {
            throw new Error(`Programming language : ${firstLanguage} is not supported for QCodeReview`)
        }
    }

    /**
     * Create a zip archive of the files to be scanned and calculate MD5 hash
     * @returns An object containing the zip file buffer and its MD5 hash
     */
    private async prepareFilesForUpload(
        artifacts: Array<{ path: string; programmingLanguage: string }>
    ): Promise<{ zipBuffer: Buffer; md5Hash: string }> {
        const JSZip = require('jszip')
        // eslint-disable-next-line import/no-nodejs-modules
        const crypto = require('crypto')
        const fs = this.workspace.fs
        // eslint-disable-next-line import/no-nodejs-modules
        const path = require('path')

        try {
            this.logging.info(`Preparing ${artifacts.length} files for upload`)
            const zip = new JSZip()

            // Add each file to the zip archive
            for (const artifact of artifacts) {
                const filePath = artifact.path
                this.logging.info(`Adding file to zip: ${filePath}`)

                try {
                    // Read file content using workspace fs API
                    const fileContent = await fs.readFile(filePath)

                    // Add file to zip with relative path to maintain directory structure
                    // Use the basename to avoid absolute paths in the zip
                    const fileName = path.basename(filePath)
                    zip.file(fileName, fileContent)
                } catch (error) {
                    this.logging.error(`Failed to read file ${filePath}: ${error}`)
                    throw new Error(`Failed to read file ${filePath}: ${error}`)
                }
            }

            // Generate zip file as buffer
            const zipBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }, // Maximum compression
            })

            // Calculate MD5 hash of the zip buffer
            const md5Hash = crypto.createHash('md5').update(zipBuffer).digest('hex')

            this.logging.info(
                `Created zip archive with ${artifacts.length} files, size: ${zipBuffer.length} bytes, MD5: ${md5Hash}`
            )

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
     * Upload file content to the pre-signed URL
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

    /**
     * Generate a unique client token for the request
     */
    private generateClientToken(): string {
        return `code-scan-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    }
}
