// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/9d8ddbd85f4533e539a58e76f7c46883d8e50a79/packages/core/src/codewhisperer/util/supplementalContext/supplementalContextUtil.ts

import { fetchSupplementalContextForSrc } from './crossFileContextUtil'
import { isTestFile } from './codeParsingUtil'
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
    document: TextDocument,
    position: Position,
    workspace: Workspace,
    logging: Logging,
    cancellationToken: CancellationToken
): Promise<CodeWhispererSupplementalContext | undefined> {
    const timesBeforeFetching = performance.now()

    const isUtg = isTestFile(document.uri, {
        languageId: document.languageId,
        fileContent: document.getText(),
    })

    try {
        let supplementalContextValue:
            | Pick<CodeWhispererSupplementalContext, 'supplementalContextItems' | 'strategy'>
            | undefined

        if (isUtg) {
            return
        } else {
            supplementalContextValue = await fetchSupplementalContextForSrc(
                document,
                position,
                workspace,
                cancellationToken
            )
        }

        if (supplementalContextValue) {
            return {
                isUtg: isUtg,
                isProcessTimeout: false,
                supplementalContextItems: supplementalContextValue.supplementalContextItems,
                contentsLength: supplementalContextValue.supplementalContextItems.reduce(
                    (acc, curr) => acc + curr.content.length,
                    0
                ),
                latency: performance.now() - timesBeforeFetching,
                strategy: supplementalContextValue.strategy,
            }
        } else {
            return undefined
        }
    } catch (err) {
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
            logging.log(`Fail to fetch supplemental context for target file ${document.uri}: ${err}`)
            return undefined
        }
    }
}
