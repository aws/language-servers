/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod'
import { FINDING_SEVERITY, PROGRAMMING_LANGUAGES_CAPS } from './qCodeReviewConstants'

/**
 * Input schema for QCodeReview tool - used to send input schema info to model
 */
export const INPUT_SCHEMA = {
    type: <const>'object',
    description: 'Contains either file level or folder level artifacts to perform code review',
    properties: {
        isCodeDiffScan: {
            type: <const>'boolean',
            description:
                "When a user asks for a code review, determine if they're specifically requesting a review of uncommitted changes " +
                'in their code. Look for phrases which are similar in meaning to: "review my uncommitted changes" or "code review for my pending changes" or ' +
                '"review the changes I haven\'t committed yet" or "look at my git diff" or "review my staged/unstaged changes" or ' +
                '"scan/review the new changes" or "scan/review changed lines of code". ' +
                'If you detect such a request, respond with "true" else "false".',
        },
        fileLevelArtifacts: {
            type: <const>'array',
            description:
                'Array of file paths that will be reviewed and their respective programming language (e.g. [{"path": "path/to/file.py", "programmingLanguage": "PYTHON"}]).' +
                'So, if the customer asks for a code review of a single file, provide the file path and programming language in the array.' +
                'If the customer asks for a code review of multiple files, provide the file paths and programming languages in the array.' +
                'If the customer asks for a code review of a folder, do not provide any file paths or programming languages in this array. It should be provided in folderLevelArtifacts',
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
                        enum: PROGRAMMING_LANGUAGES_CAPS,
                    },
                },
                required: ['path', 'programmingLanguage'] as const,
            },
        },
        folderLevelArtifacts: {
            type: <const>'array',
            description:
                'Array of folder paths that will be reviewed (e.g. [{"path": "path/to/code/"}]).' +
                'So, if the customer asks for a code review of a single folder, provide the folder path in the array.' +
                'If the customer asks for a code review of multiple folders, provide the folder paths in the array.' +
                'If the customer asks for a code review of a file or multiple files, do not provide any folder paths in this array. It should be provided in fileLevelArtifacts.',
            items: {
                type: <const>'object',
                description:
                    'Array item containing folder path of code that will be scanned (e.g. {"path": "path/to/code/"})',
                properties: {
                    path: {
                        type: <const>'string',
                        description: 'The path of the folder that will be scanned',
                    },
                },
                required: ['path'] as const,
            },
        },
    },
    required: ['isCodeDiffScan'] as const,
}

/**
 * Zod schema for input validation during execution
 */
export const Z_INPUT_SCHEMA = z.object({
    isCodeDiffScan: z.boolean(),
    fileLevelArtifacts: z
        .array(
            z.object({
                path: z.string(),
                programmingLanguage: z.enum(PROGRAMMING_LANGUAGES_CAPS as [string, ...string[]]),
            })
        )
        .optional(),
    folderLevelArtifacts: z
        .array(
            z.object({
                path: z.string(),
            })
        )
        .optional(),
})

/**
 * Schema for a single finding
 */
export const Q_FINDING_SCHEMA = z.object({
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
    severity: z.enum(FINDING_SEVERITY as [string, ...string[]]),
    startLine: z.number(),
    title: z.string(),
})

/**
 * Schema for an array of findings
 */
export const Q_FINDINGS_SCHEMA = z.array(Q_FINDING_SCHEMA)
