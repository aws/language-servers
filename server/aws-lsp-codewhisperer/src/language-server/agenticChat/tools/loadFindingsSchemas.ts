/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { FINDING_SEVERITY } from './loadFindingsConstants'
import { z } from 'zod'

/**
 * Input schema for QCodeReview tool - used to send input schema info to model
 */
export const INPUT_SCHEMA = {
    type: <const>'object',
    description:
        'Contains optional information on the severity or file of the code issues which should be accessed.' +
        'Never display the direct output of this tool be output in the chat. ' +
        'Instead, the agent should use the result to answer whatever question the user has asked.',
    properties: {
        severityList: {
            type: <const>'array',
            description:
                'A list of severities for the code issues which should be loaded into the context. If none are provided, then this list should be empty.',
            items: {
                type: <const>'string',
                description: 'The severity of a code issue',
                enum: FINDING_SEVERITY,
            },
        },
        fileList: {
            type: <const>'array',
            description:
                'A list of files which should have their code issues loaded into the context. If none are provided, then this list should be empty.',
            items: {
                type: <const>'string',
                description: 'The file name',
            },
        },
    },
    required: ['severityList', 'fileList'] as const,
}

/**
 * Zod schema for input validation during execution
 */
export const Z_INPUT_SCHEMA = z.object({
    severityList: z.array(z.enum(FINDING_SEVERITY as [string, ...string[]])),
    fileList: z.array(z.string()),
    // findingsPath is provided by the agent controller, not from Maestro service, so it doesn't need to be included in the INPUT_SCHEMA
    findingsPath: z.string(),
})
