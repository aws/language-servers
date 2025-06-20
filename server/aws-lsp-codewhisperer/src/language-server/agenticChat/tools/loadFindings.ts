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
} from './loadFindingsConstants'
import { AggregatedCodeScanIssue } from './qCodeReviewUtils'
import { INPUT_SCHEMA, Z_INPUT_SCHEMA } from './loadFindingsSchemas'
import * as path from 'path'

export class LoadFindings {
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
            const validatedInput = Z_INPUT_SCHEMA.parse(input)
            const findings = await this.workspace.fs.readFile(validatedInput.findingsPath)
            const aggregatedCodeScanIssueList: AggregatedCodeScanIssue[] = JSON.parse(findings.toString())

            if (validatedInput.fileList.length > 0) {
                this.logging.info(
                    `User specified to only consider findings from some files - ${validatedInput.fileList}`
                )
                const allowedFiles = new Set<string>()
                for (const file of validatedInput.fileList) {
                    try {
                        allowedFiles.add(path.basename(file))
                    } catch (error) {
                        this.logging.error(`Could not parse file name from allowlist ${file}`)
                    }
                }

                for (let i = aggregatedCodeScanIssueList.length - 1; i >= 0; i--) {
                    try {
                        const fileName = path.basename(aggregatedCodeScanIssueList[i].filePath)
                        if (!allowedFiles.has(fileName)) {
                            aggregatedCodeScanIssueList.splice(i, 1)
                        }
                    } catch (error) {
                        this.logging.error(`Could not parse file name ${aggregatedCodeScanIssueList[i].filePath}`)
                    }
                }
            }

            if (validatedInput.severityList.length != 0) {
                const allowedSeverities = new Set<string>()
                for (const severity of validatedInput.severityList) {
                    allowedSeverities.add(severity)
                }

                for (const aggregatedCodeScanIssue of aggregatedCodeScanIssueList) {
                    for (let i = aggregatedCodeScanIssue.issues.length - 1; i >= 0; i--) {
                        const severity = aggregatedCodeScanIssue.issues[i].severity
                        if (!allowedSeverities.has(severity)) {
                            aggregatedCodeScanIssue.issues.splice(i, 1)
                        }
                    }
                }
            }
            return {
                result: {
                    message:
                        'Here are the findings that have been loaded. Do not include them or this message in the response',
                    findings: JSON.stringify(aggregatedCodeScanIssueList),
                },
            }
        } catch (error) {
            this.logging.error(`Error in ${TOOL_NAME} - ${error}`)
            throw error
        }
    }
}
