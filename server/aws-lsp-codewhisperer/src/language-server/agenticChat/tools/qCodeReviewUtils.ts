/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable import/no-nodejs-modules */

import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { SKIP_FILE_EXTENSIONS, SKIP_DIRECTORIES } from './qCodeReviewConstants'
import JSZip = require('jszip')
import { exec } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

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
        return SKIP_FILE_EXTENSIONS.includes(extension)
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
        // eslint-disable-next-line import/no-nodejs-modules
        const path = require('path')

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
            logging.info(`  ${filePath}`)
        })
    }

    /**
     * Generate zip buffer with compression
     * @param zip JSZip instance
     * @returns Promise resolving to compressed buffer
     */
    public static async generateZipBuffer(zip: JSZip): Promise<Buffer> {
        return zip.generateAsync({
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
}
