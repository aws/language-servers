/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { SKIP_FILE_EXTENSIONS, SKIP_DIRECTORIES } from './qCodeReviewConstants'
import JSZip = require('jszip')

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
}
