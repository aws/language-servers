/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod'
import { FINDING_SEVERITY, SCOPE_OF_CODE_REVIEW } from './qCodeReviewConstants'

/**
 * Input schema for QCodeReview tool
 */
export const Q_CODE_REVIEW_INPUT_SCHEMA = {
    type: <const>'object',
    description: [
        '**3 main fields in the tool:**',
        '- scopeOfReview: CRITICAL - Must be set to either FULL_REVIEW (analyze entire codebase) or CODE_DIFF_REVIEW (focus only on changes/modifications). This is a required field.',
        '- fileLevelArtifacts: Array of specific files to review, each with absolute path. Use this when reviewing individual files, not folders. Format: [{"path": "/absolute/path/to/file.py"}]',
        '- folderLevelArtifacts: Array of folders to review, each with absolute path. Use this when reviewing entire directories, not individual files. Format: [{"path": "/absolute/path/to/folder/"}]',
        "Note: Either fileLevelArtifacts OR folderLevelArtifacts should be provided based on what's being reviewed, but not both for the same items.",
    ].join('\n'),
    properties: {
        scopeOfReview: {
            type: <const>'string',
            description: [
                'CRITICAL: You must explicitly set the value of "scopeOfReview" based on user request analysis.',
                '',
                'Set "scopeOfReview" to CODE_DIFF_REVIEW when:',
                '- User explicitly asks to review only changes/modifications/diffs in their code',
                '- User mentions "review my changes", "look at what I modified", "check the uncommitted changes"',
                '- User refers to "review the diff", "analyze recent changes", "look at the new code"',
                '- User mentions "review what I added/updated", "check my latest commits", "review the modified lines"',
                '- User includes phrases like "new changes", "recent changes", or any combination of words indicating recency (new, latest, recent) with changes/modifications',
                '- User mentions specific files with terms like "review new changes in [file]" or "check changes in [file]"',
                '',
                'Set "scopeOfReview" to FULL_REVIEW for all other cases, including:',
                '- When user asks for a general code review without mentioning changes/diffs',
                '- When user asks to review specific files or folders without mentioning changes',
                '- When user asks for security analysis or best practices review of their code',
                '',
                'This is a required field. You must inform the user whether you are performing a full review or only reviewing changes.',
            ].join('\n'),
            enum: SCOPE_OF_CODE_REVIEW,
        },
        fileLevelArtifacts: {
            type: <const>'array',
            description: [
                'Array of abosolute file paths that will be reviewed (e.g. [{"path": "absolute/path/to/file.py"}]).',
                'So, if the user asks for a code review of a single file, provide the absolute file path in the array.',
                'If the user asks for a code review of multiple files, provide the absolute file paths in the array.',
                'If the user asks for a code review of a folder, do not provide any file paths or programming languages in this array. It should be provided in folderLevelArtifacts',
            ].join('\n'),
            items: {
                type: <const>'object',
                description:
                    'Array item containing absolute path of artifact (e.g. {"path": "absolute/path/to/file.py"})',
                properties: {
                    path: {
                        type: <const>'string',
                        description: 'The absolute path of the file that will be scanned',
                    },
                },
                required: ['path'] as const,
            },
        },
        folderLevelArtifacts: {
            type: <const>'array',
            description: [
                'Array of absolute folder paths that will be reviewed (e.g. [{"path": "path/to/code/"}]).',
                'So, if the user asks for a code review of a single folder, provide the absolute folder path in the array.',
                'If the user asks for a code review of multiple folders, provide multiple absolute folder paths in the array.',
                'If the user asks for a code review of a file or multiple files, do not provide any folder paths in this array. It should be provided in fileLevelArtifacts.',
            ].join('\n'),
            items: {
                type: <const>'object',
                description:
                    'Array item containing absolute folder path of code that will be scanned (e.g. {"path": "path/to/code/"})',
                properties: {
                    path: {
                        type: <const>'string',
                        description: 'The absolute path of the folder that will be scanned',
                    },
                },
                required: ['path'] as const,
            },
        },
    },
    required: ['scopeOfReview'] as const,
}

/**
 * Zod schema for input validation during execution of Q Code Review tool
 */
export const Z_Q_CODE_REVIEW_INPUT_SCHEMA = z.object({
    scopeOfReview: z.enum(SCOPE_OF_CODE_REVIEW as [string, ...string[]]),
    fileLevelArtifacts: z
        .array(
            z.object({
                path: z.string(),
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
    ruleArtifacts: z
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
            url: z.string().nullable().optional(),
        }),
    }),
    severity: z.enum(FINDING_SEVERITY as [string, ...string[]]),
    startLine: z.number(),
    title: z.string(),
    findingContext: z.string().nullable().optional(),
    detectorId: z.string().optional(),
    detectorName: z.string().optional(),
    ruleId: z.string().optional(),
    suggestedFixes: z.array(z.string().optional()).optional(),
})

/**
 * Schema for an array of findings
 */
export const Q_FINDINGS_SCHEMA = z.array(Q_FINDING_SCHEMA)
