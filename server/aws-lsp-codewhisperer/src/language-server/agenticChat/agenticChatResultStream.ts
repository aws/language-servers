import { ChatResult, FileDetails, ChatMessage } from '@aws/language-server-runtimes/protocol'

interface ResultStreamWriter {
    write(chunk: ChatResult): Promise<void>
    close(): Promise<void>
}

/**
 * This class wraps around lsp.sendProgress to provide a more helpful interface for streaming a ChatResult to the client.
 * ChatResults are grouped into blocks that can be written directly, or streamed in.
 * In the final message, blocks are seperated by resultDelimiter defined below.
 */

interface FileDetailsWithPath extends FileDetails {
    relativeFilePath: string
}
export class AgenticChatResultStream {
    static readonly resultDelimiter = '\n\n'
    #state = {
        chatResultBlocks: [] as ChatMessage[],
        isLocked: false,
        contextFileList: {} as Record<string, FileDetailsWithPath[]>,
    }
    readonly #sendProgress: (newChatResult: ChatResult | string) => Promise<void>

    constructor(sendProgress: (newChatResult: ChatResult | string) => Promise<void>) {
        this.#sendProgress = sendProgress
    }

    getResult(): ChatResult {
        return this.#joinResults(this.#state.chatResultBlocks)
    }

    getContextFileList(toolUseId: string): FileDetailsWithPath[] {
        return this.#state.contextFileList[toolUseId] ?? []
    }

    addContextFileList(toolUseId: string, fileDetails: FileDetailsWithPath) {
        if (!this.#state.contextFileList[toolUseId]) {
            this.#state.contextFileList[toolUseId] = []
        }
        this.#state.contextFileList[toolUseId].push(fileDetails)
    }

    #joinResults(chatResults: ChatMessage[]): ChatResult {
        const tools: Record<string, boolean> = {}
        let firstResponseMessageId: string | undefined

        for (const result of chatResults) {
            if (result.type === 'tool') {
                tools[result.messageId || ''] = true
            } else if (tools[result.messageId || '']) {
                firstResponseMessageId = result.messageId
                break
            }
        }

        const result: ChatResult = {
            body: '', // TODO: somehow doesn't stream unless there is content in the primary result message
            additionalMessages: [],
            messageId: firstResponseMessageId,
        }

        return chatResults.reduce<ChatResult>((acc, c) => {
            if (c.messageId && c.messageId !== firstResponseMessageId) {
                if (acc.additionalMessages!.some(am => am.messageId === c.messageId)) {
                    return {
                        ...acc,
                        additionalMessages: acc.additionalMessages!.map(am => ({
                            ...am,
                            body:
                                am.messageId === c.messageId
                                    ? am.body + AgenticChatResultStream.resultDelimiter + c.body
                                    : am.body,
                            ...((c.contextList || acc.contextList) && {
                                contextList: {
                                    filePaths: [
                                        ...(acc.contextList?.filePaths ?? []),
                                        ...(c.contextList?.filePaths ?? []),
                                    ],
                                    rootFolderTitle: c.contextList?.rootFolderTitle
                                        ? c.contextList.rootFolderTitle
                                        : (acc.contextList?.rootFolderTitle ?? ''),
                                },
                            }),
                        })),
                    }
                } else {
                    return {
                        ...acc,
                        additionalMessages: [...acc.additionalMessages!, c],
                    }
                }
            } else {
                return {
                    ...acc,
                    body: c.body + AgenticChatResultStream.resultDelimiter + acc.body,
                }
            }
        }, result)
    }

    async writeResultBlock(result: ChatMessage) {
        this.#state.chatResultBlocks.push(result)
        await this.#sendProgress(this.getResult())
    }

    getResultStreamWriter(): ResultStreamWriter {
        // Note: if write calls are not awaited, stream can be out-of-order.
        if (this.#state.isLocked) {
            throw new Error('AgenticChatResultStream: already locked')
        }
        this.#state.isLocked = true
        let lastResult: ChatResult | undefined

        return {
            write: async (intermediateChatResult: ChatResult) => {
                const combinedResult = this.#joinResults([...this.#state.chatResultBlocks, intermediateChatResult])
                lastResult = intermediateChatResult
                return await this.#sendProgress(combinedResult)
            },
            close: async () => {
                if (lastResult) {
                    this.#state.chatResultBlocks.push(lastResult)
                }
                this.#state.isLocked = false
            },
        }
    }
}
