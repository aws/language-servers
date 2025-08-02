/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod'
import { FINDING_SEVERITY } from './codeReviewConstants'

/**
 * Input schema for CodeReview tool
 */
export const DISPLAY_FINDINGS_INPUT_SCHEMA = {
    type: <const>'object',
    description: [
        'There is only one input to the DisplayFindings tool: the findings.',
        'Please format all of the findings which are meant to be displayed using this schema.',
    ].join('\n'),
    properties: {
        findings: {
            type: <const>'array',
            description: [
                'Array of the code issues, bugs, security risks, and code quality violations which were found by the agent and need to be sent to the Code Issues Panel',
            ].join('\n'),
            items: {
                type: <const>'object',
                description: 'Array item containing all of the findings which will be sent to the Code Issues Panel',
                properties: {
                    filePath: {
                        type: <const>'string',
                        description: 'The absolute path of the file which has the finding',
                    },
                    startLine: {
                        type: <const>'string',
                        description: 'The line number of the first line of the finding',
                    },
                    endLine: {
                        type: <const>'string',
                        description: 'The line number of the last line of the finding.',
                    },
                    title: {
                        type: <const>'string',
                        description: 'A short title to represent the finding',
                    },
                    language: {
                        type: <const>'string',
                        description: 'The programming language of the file which holds the finding',
                    },
                    description: {
                        type: <const>'string',
                        description: 'A more thorough description of the finding',
                    },
                    severity: {
                        type: <const>'string',
                        description: 'The severity of the finding',
                        enum: FINDING_SEVERITY,
                    },
                    suggestedFixes: {
                        type: <const>'array',
                        description:
                            'An array of possible fixes. Do not generate fixes just to populate this, only include them if they are provided.',
                        items: {
                            type: <const>'string',
                            description: 'The absolute path of the file which has the finding',
                        },
                    },
                },
                required: ['filePath', 'startLine', 'endLine', 'title', 'severity', 'description', 'language'] as const,
            },
        },
    },
    required: ['findings'] as const,
}

/**
 * Schema for a single finding
 */
export const Z_DISPLAY_FINDING_SCHEMA = z.object({
    description: z.string(),
    endLine: z.string(),
    filePath: z.string(),
    language: z.string(),
    severity: z.enum(FINDING_SEVERITY as [string, ...string[]]),
    startLine: z.string(),
    suggestedFixes: z.array(z.string().optional()).optional(),
    title: z.string(),
})

/**
 * Schema for an array of findings
 */
export const Z_DISPLAY_FINDINGS_SCHEMA = z.array(Z_DISPLAY_FINDING_SCHEMA)

export const Z_DISPLAY_FINDINGS_INPUT_SCHEMA = z.object({
    findings: Z_DISPLAY_FINDINGS_SCHEMA,
})
