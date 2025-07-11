/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable import/no-nodejs-modules */

import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { SKIP_DIRECTORIES, EXTENSION_TO_LANGUAGE } from './qCodeReviewConstants'
import JSZip = require('jszip')
import { exec } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as https from 'https'
import { InitializeParams } from '@aws/language-server-runtimes/server-interface'
import { QClientCapabilities } from '../../../configuration/qConfigurationServer'
import { CancellationError } from '@aws/lsp-core'
import { InvokeOutput } from '../toolShared'
import { CancellationToken } from '@aws/language-server-runtimes/server-interface'

/**
 * Utility functions for QCodeReview
 */
export class QCodeReviewUtils {
    /**
     * Check if a file should be skipped during zip creation
     * @param fileName Name of the file to check
     * @returns True if the file should be skipped, false otherwise
     */
    public static shouldSkipFile(fileName: string): boolean {
        const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
        if (!extension || extension.trim() === '') {
            return true
        } else {
            return !EXTENSION_TO_LANGUAGE.hasOwnProperty(extension)
        }
    }

    /**
     * Check if a directory should be skipped during zip creation
     * @param dirName Name of the directory to check
     * @returns True if the directory should be skipped, false otherwise
     */
    public static shouldSkipDirectory(dirName: string): boolean {
        return SKIP_DIRECTORIES.includes(dirName)
    }

    /**
     * Get the folder path from a file or folder path
     * @param inputPath Path to a file or folder
     * @returns The folder path
     */
    public static getFolderPath(inputPath: string): string {
        // Remove trailing slash and get dirname
        const cleanPath = inputPath.replace(/\/$/, '')

        // If it's a file (has extension), get its directory
        // If it's a directory (no extension), return it as-is
        return path.extname(cleanPath) ? path.dirname(cleanPath) : cleanPath
    }

    /**
     * Log a summary of the zip archive contents
     * @param zip JSZip instance to analyze
     * @param logging Logging interface
     */
    public static logZipSummary(zip: JSZip, logging: Features['logging']): void {
        try {
            const files = Object.keys(zip.files)
            const fileCount = files.filter(f => !zip.files[f].dir).length
            const folderCount = files.filter(f => zip.files[f].dir).length

            logging.info(`Zip summary: ${fileCount} files, ${folderCount} folders`)

            // Log the top-level structure
            const topLevel = files
                .filter(path => !path.includes('/') || path.split('/').length === 2)
                .map(path => `  - ${path}${zip.files[path].dir ? '/' : ''}`)
                .join('\n')

            logging.info(`Zip structure:\n${topLevel}`)
        } catch (error) {
            logging.warn(`Failed to generate zip summary: ${error}`)
        }
    }

    /**
     * Generate a unique client token for the request
     * @returns A unique string token
     */
    public static generateClientToken(): string {
        return `code-scan-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    }

    /**
     * Execute git command and return output
     * @param command Git command to execute
     * @param type Type of command for logging
     * @param logging Logging interface
     * @returns Promise resolving to command output
     */
    public static async executeGitCommand(
        command: string,
        type: string,
        logging: Features['logging']
    ): Promise<string> {
        return new Promise<string>(resolve => {
            exec(command, (error: any, stdout: string, stderr: string) => {
                if (error) {
                    logging.warn(`Git diff failed for ${type}: ${stderr || error.message}`)
                    resolve('')
                } else {
                    resolve(stdout.trim())
                }
            })
        })
    }

    /**
     * Get git diff for a file or folder
     * @param artifactPath Path to the file or folder
     * @param logging Logging interface
     * @returns Git diff output as string or null if not in a git repository
     */
    public static async getGitDiff(artifactPath: string, logging: Features['logging']): Promise<string | null> {
        logging.info(`Get git diff for path - ${artifactPath}`)

        const directoryPath = QCodeReviewUtils.getFolderPath(artifactPath)
        const gitDiffCommandUnstaged = `cd ${directoryPath} && git diff ${artifactPath}`
        const gitDiffCommandStaged = `cd ${directoryPath} && git diff --staged ${artifactPath}`

        logging.info(`Running git commands - ${gitDiffCommandUnstaged} and ${gitDiffCommandStaged}`)

        try {
            const [unstagedDiff, stagedDiff] = await Promise.all([
                QCodeReviewUtils.executeGitCommand(gitDiffCommandUnstaged, 'unstaged', logging),
                QCodeReviewUtils.executeGitCommand(gitDiffCommandStaged, 'staged', logging),
            ])

            const combinedDiff = [unstagedDiff, stagedDiff].filter(Boolean).join('\n\n')
            return combinedDiff || null
        } catch (error) {
            logging.error(`Error getting git diff: ${error}`)
            return null
        }
    }

    /**
     * Log zip structure
     * @param zip JSZip instance
     * @param zipName Name of the zip for logging
     * @param logging Logging interface
     */
    public static logZipStructure(zip: JSZip, zipName: string, logging: Features['logging']): void {
        logging.info(`${zipName} zip structure:`)
        Object.keys(zip.files).forEach(filePath => {
            let item = zip.files[filePath]
            if (!item.dir) {
                logging.info(`  ${filePath}`)
            }
        })
    }

    /**
     * Count number of files in zip
     * @param zip JSZip instance
     * @returns number of files in zip
     */
    public static countZipFiles(zip: JSZip): number {
        let count = 0
        Object.keys(zip.files).forEach(filePath => {
            let item = zip.files[filePath]
            if (!item.dir) {
                count += 1
            }
        })
        return count
    }

    /**
     * Generate zip buffer with compression
     * @param zip JSZip instance
     * @returns Promise resolving to compressed buffer
     */
    public static async generateZipBuffer(zip: JSZip): Promise<Buffer> {
        return await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 },
        })
    }

    /**
     * Save zip buffer to Downloads folder
     * @param zipBuffer Buffer to save
     * @param logging Logging interface
     */
    public static saveZipToDownloads(zipBuffer: Buffer, logging: Features['logging']): void {
        try {
            const downloadsPath = path.join(os.homedir(), 'Downloads')
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const zipFilePath = path.join(downloadsPath, `codeArtifact-${timestamp}.zip`)

            fs.writeFileSync(zipFilePath, zipBuffer)
            logging.info(`Saved code artifact zip to: ${zipFilePath}`)
        } catch (saveError) {
            logging.error(`Failed to save zip file to Downloads folder: ${saveError}`)
        }
    }

    /**
     * Process artifact with git diff
     * @param artifact Artifact with path
     * @param isCodeDiffScan Whether to scan for code diff
     * @param logging Logging interface
     * @returns Promise resolving to diff string
     */
    public static async processArtifactWithDiff(
        artifact: { path: string },
        isCodeDiffScan: boolean,
        logging: Features['logging']
    ): Promise<string> {
        if (!isCodeDiffScan) return ''

        try {
            const diff = await QCodeReviewUtils.getGitDiff(artifact.path, logging)
            return diff ? `${diff}\n` : ''
        } catch (diffError) {
            logging.warn(`Failed to get git diff for ${artifact.path}: ${diffError}`)
            return ''
        }
    }

    /**
     * Error handling wrapper
     * @param operation Operation to execute
     * @param errorMessage Error message prefix
     * @param logging Logging interface
     * @param path Optional path for error context
     * @returns Promise resolving to operation result
     */
    public static async withErrorHandling<T>(
        operation: () => Promise<T>,
        errorMessage: string,
        logging: Features['logging'],
        path?: string
    ): Promise<T> {
        try {
            return await operation()
        } catch (error) {
            const fullMessage = path ? `${errorMessage} ${path}: ${error}` : `${errorMessage}: ${error}`
            logging.error(fullMessage)
            throw new Error(fullMessage)
        }
    }

    /**
     * Check if agentic review capability is enabled in client capabilities
     * @param params Initialize parameters from client
     * @returns True if agentic reviewer is enabled, false otherwise
     */
    public static isAgenticReviewEnabled(params: InitializeParams | undefined): boolean {
        const qCapabilities = params?.initializationOptions?.aws?.awsClientCapabilities?.q as
            | QClientCapabilities
            | undefined
        return qCapabilities?.agenticReviewer || false
    }

    /**
     * Converts a Windows absolute file path to Unix format and removes the drive letter
     * @param windowsPath The Windows path to convert
     * @returns The Unix formatted path without drive letter
     */
    public static convertToUnixPath(windowsPath: string): string {
        // Remove drive letter (e.g., C:/) if present
        // Normalize the path and convert backslashes to forward slashes
        return path
            .normalize(windowsPath)
            .replace(/^[a-zA-Z]:\/?/, '')
            .replace(/\\/g, '/')
    }

    /**
     * Create a standardized error output object
     * @param errorObj Error object or message
     * @returns Formatted InvokeOutput with error details
     */
    public static createErrorOutput(errorObj: any): InvokeOutput {
        return {
            output: {
                kind: 'json',
                content: errorObj,
                success: false,
            },
        }
    }

    /**
     * Upload file content to the pre-signed URL
     * @param uploadUrl Pre-signed URL for uploading the file
     * @param fileContent Buffer containing the file content
     * @param requestHeaders Additional headers for the request
     * @param logging Logging interface
     */
    public static uploadFileToPresignedUrl(
        uploadUrl: string,
        fileContent: Buffer,
        requestHeaders: Record<string, string>,
        logging: Features['logging']
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

            logging.info(`Uploading file to ${url.hostname}${url.pathname}`)

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
                    logging.info('File upload completed successfully')
                    resolve()
                })
            })

            req.on('error', (error: any) => {
                logging.error(`Error uploading file: ${error}`)
                reject(error)
            })

            req.write(fileContent)
            req.end()
        })
    }

    /**
     * Handle failure in a consistent way
     * @param error Error object
     * @param scanName Optional scan name for context
     * @param jobId Optional job ID for context
     * @param logging Logging interface
     * @param telemetry Telemetry interface
     * @param toolName Tool name for error messages
     * @returns Standardized error response
     */
    public static handleFailure(
        error: any,
        logging: Features['logging'],
        telemetry: Features['telemetry'],
        toolName: string,
        scanName?: string,
        jobId?: string
    ): any {
        // if error is of type CancellationError then throw
        if (error instanceof CancellationError) {
            throw error
        }

        const errorData: any = { errorMessage: error?.message }
        if (scanName) errorData.codeScanName = scanName
        if (jobId) errorData.codeReviewId = jobId

        QCodeReviewUtils.emitMetric('failed', { data: errorData }, toolName, logging, telemetry)

        logging.error(`Error in ${toolName} - ${error?.message}`)

        return {
            status: 'Failed',
            ...errorData,
        }
    }

    /**
     * Emit a telemetry metric with standard formatting
     * @param metricSuffix Suffix for the metric name
     * @param metricData Additional metric data
     * @param toolName Tool name for the metric prefix
     * @param logging Logging interface
     * @param telemetry Telemetry interface
     * @param credentialStartUrl Optional credential start URL
     */
    public static emitMetric(
        metricSuffix: string,
        metricData: any,
        toolName: string,
        logging: Features['logging'],
        telemetry: Features['telemetry'],
        credentialStartUrl?: string
    ): void {
        const metricName = `${toolName}_${metricSuffix}`
        const metricPayload = {
            name: metricName,
            data: {
                ...(credentialStartUrl ? { credentialStartUrl } : {}),
                ...metricData,
            },
        }
        logging.info(`Emitting telemetry metric: ${metricName} with data: ${JSON.stringify(metricPayload.data)}`)
        telemetry.emitMetric(metricPayload)
    }

    /**
     * Check if cancellation has been requested and throw if it has
     * @param cancellationToken Cancellation token to check
     * @param message Optional message for the error
     * @param logging Logging interface
     */
    public static checkCancellation(
        cancellationToken: CancellationToken | undefined,
        logging: Features['logging'],
        message: string = 'Command execution cancelled'
    ): void {
        if (cancellationToken?.isCancellationRequested) {
            logging.info(message)
            throw new CancellationError('user')
        }
    }
}
