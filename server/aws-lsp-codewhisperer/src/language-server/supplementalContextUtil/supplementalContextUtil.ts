/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/9d8ddbd85f4533e539a58e76f7c46883d8e50a79/packages/core/src/codewhisperer/util/supplementalContext/supplementalContextUtil.ts

import { fetchSupplementalContextForTest } from './utgUtils'
import { fetchSupplementalContextForSrc } from './crossFileContextUtil'
import { isTestFile } from './codeParsingUtil'
import * as vscode from 'vscode'
import { CodeWhispererSupplementalContext } from '../models/model'
import {
    CancellationToken,
    Logging,
    Position,
    TextDocument,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'

export class CancellationError extends Error {}

export async function fetchSupplementalContext(
    editor: vscode.TextEditor,
    document: TextDocument,
    position: Position,
    workspace: Workspace,
    logging: Logging,
    cancellationToken: CancellationToken
): Promise<CodeWhispererSupplementalContext | undefined> {
    const timesBeforeFetching = performance.now()

    const isUtg = await isTestFile(document.uri, {
        languageId: document.languageId,
        fileContent: document.getText(),
    })

    let supplementalContextPromise: Promise<
        Pick<CodeWhispererSupplementalContext, 'supplementalContextItems' | 'strategy'> | undefined
    >

    if (isUtg) {
        supplementalContextPromise = fetchSupplementalContextForTest(
            editor,
            document,
            workspace,
            logging,
            cancellationToken
        )
    } else {
        supplementalContextPromise = fetchSupplementalContextForSrc(document, position, workspace, cancellationToken)
    }

    return supplementalContextPromise
        .then(value => {
            if (value) {
                return {
                    isUtg: isUtg,
                    isProcessTimeout: false,
                    supplementalContextItems: value.supplementalContextItems,
                    contentsLength: value.supplementalContextItems.reduce((acc, curr) => acc + curr.content.length, 0),
                    latency: performance.now() - timesBeforeFetching,
                    strategy: value.strategy,
                }
            } else {
                return undefined
            }
        })
        .catch(err => {
            // PORT_TODO: lift this error handling to codeWhispererServer caller
            if (err instanceof CancellationError) {
                return {
                    isUtg: isUtg,
                    isProcessTimeout: true,
                    supplementalContextItems: [],
                    contentsLength: 0,
                    latency: performance.now() - timesBeforeFetching,
                    strategy: 'Empty',
                }
            } else {
                // getLogger().error(
                //     `Fail to fetch supplemental context for target file ${document.uri}: ${err}`
                // )
                return undefined
            }
        })
}
