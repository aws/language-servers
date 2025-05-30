// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/9d8ddbd85f4533e539a58e76f7c46883d8e50a79/packages/core/src/codewhisperer/util/supplementalContext/supplementalContextUtil.ts

import { fetchSupplementalContextForSrc } from './crossFileContextUtil'
import { CodeWhispererSupplementalContext } from '../models/model'
import {
    CancellationToken,
    Logging,
    Position,
    TextDocument,
    Workspace,
} from '@aws/language-server-runtimes/server-interface'
import { crossFileContextConfig, supplementalContextTimeoutInMs } from '../models/constants'
import * as os from 'os'
import { AmazonQBaseServiceManager } from '../amazonQServiceManager/BaseAmazonQServiceManager'
import { TestIntentDetector } from './unitTestIntentDetection'
import { FocalFileResolver } from './focalFileResolution'
import * as fs from 'fs'
import { waitUntil } from '@aws/lsp-core/out/util/timeoutUtils'

export class CancellationError extends Error {}

const unitTestIntentDetector = new TestIntentDetector()
const utgFocalFileResolver = new FocalFileResolver()

export async function fetchSupplementalContext(
    document: TextDocument,
    position: Position,
    workspace: Workspace,
    logging: Logging,
    cancellationToken: CancellationToken,
    amazonQServiceManager?: AmazonQBaseServiceManager
): Promise<CodeWhispererSupplementalContext | undefined> {
    const timesBeforeFetching = performance.now()

    const isUtg = unitTestIntentDetector.detectUnitTestIntent(document)

    try {
        let supplementalContextValue:
            | Pick<CodeWhispererSupplementalContext, 'supplementalContextItems' | 'strategy'>
            | undefined

        if (isUtg) {
            supplementalContextValue = await waitUntil(
                async function () {
                    const focalFile = await utgFocalFileResolver.inferFocalFile(document, workspace)
                    if (focalFile) {
                        const srcContent = fs.readFileSync(focalFile, 'utf-8')
                        return {
                            isUtg: true,
                            isProcessTimeout: false,
                            supplementalContextItems: [
                                {
                                    content: srcContent,
                                    filePath: focalFile,
                                },
                            ],
                            contentsLength: srcContent.length,
                            latency: performance.now() - timesBeforeFetching,
                            strategy: 'NEW_UTG',
                        }
                    }
                },
                {
                    timeout: supplementalContextTimeoutInMs,
                    interval: 5,
                    truthy: false,
                }
            )
        } else {
            supplementalContextValue = await fetchSupplementalContextForSrc(
                document,
                position,
                workspace,
                cancellationToken,
                amazonQServiceManager
            )
        }

        if (supplementalContextValue) {
            const resBeforeTruncation = {
                isUtg: isUtg,
                isProcessTimeout: false,
                supplementalContextItems: supplementalContextValue.supplementalContextItems.filter(
                    item => item.content.trim().length !== 0
                ),
                contentsLength: supplementalContextValue.supplementalContextItems.reduce(
                    (acc, curr) => acc + curr.content.length,
                    0
                ),
                latency: performance.now() - timesBeforeFetching,
                strategy: supplementalContextValue.strategy,
            }

            return truncateSupplementalContext(resBeforeTruncation)
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

/**
 * Requirement
 * - Maximum 5 supplemental context.
 * - Each chunk can't exceed 10240 characters
 * - Sum of all chunks can't exceed 20480 characters
 */
export function truncateSupplementalContext(
    context: CodeWhispererSupplementalContext
): CodeWhispererSupplementalContext {
    let c = context.supplementalContextItems.map(item => {
        if (item.content.length > crossFileContextConfig.maxLengthEachChunk) {
            return {
                ...item,
                content: truncateLineByLine(item.content, crossFileContextConfig.maxLengthEachChunk),
            }
        } else {
            return item
        }
    })

    if (c.length > crossFileContextConfig.maxContextCount) {
        c = c.slice(0, crossFileContextConfig.maxContextCount)
    }

    let curTotalLength = c.reduce((acc, cur) => {
        return acc + cur.content.length
    }, 0)
    while (curTotalLength >= 20480 && c.length - 1 >= 0) {
        const last = c[c.length - 1]
        c = c.slice(0, -1)
        curTotalLength -= last.content.length
    }

    return {
        ...context,
        supplementalContextItems: c,
        contentsLength: curTotalLength,
    }
}

export function truncateLineByLine(input: string, l: number): string {
    const maxLength = l > 0 ? l : -1 * l
    if (input.length === 0) {
        return ''
    }

    const shouldAddNewLineBack = input.endsWith(os.EOL)
    let lines = input.trim().split(os.EOL)
    let curLen = input.length
    while (curLen > maxLength && lines.length - 1 >= 0) {
        const last = lines[lines.length - 1]
        lines = lines.slice(0, -1)
        curLen -= last.length + 1
    }

    const r = lines.join(os.EOL)
    if (shouldAddNewLineBack) {
        return r + os.EOL
    } else {
        return r
    }
}
