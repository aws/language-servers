import { ChatResult, FileDetails, ChatMessage } from '@aws/language-server-runtimes/protocol'
import { randomUUID } from 'crypto'

interface ResultStreamWriter {
    write(chunk: ChatResult, final?: boolean): Promise<void>
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
        uuid: randomUUID(),
        messageId: undefined as string | undefined,
    }
    readonly #sendProgress: (newChatResult: ChatResult | string) => Promise<void>

    constructor(sendProgress: (newChatResult: ChatResult | string) => Promise<void>) {
        this.#sendProgress = sendProgress
    }

    getResult(only?: string): ChatResult {
        return this.#joinResults(this.#state.chatResultBlocks, only)
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

    #joinResults(chatResults: ChatMessage[], only?: string): ChatResult {
        const result: ChatResult = {
            body: '',
            additionalMessages: [],
            messageId: this.#state.messageId || this.#state.uuid,
        }

        return chatResults
            .filter(cr => cr.messageId == this.#state.messageId || only === undefined || only === cr.messageId)
            .reduce<ChatResult>((acc, c) => {
                if (c.messageId === this.#state.messageId) {
                    return {
                        ...acc,
                        buttons: [...(acc.buttons ?? []), ...(c.buttons ?? [])],
                        body: acc.body + AgenticChatResultStream.resultDelimiter + c.body,
                    }
                } else if (acc.additionalMessages!.some(am => am.messageId === c.messageId)) {
                    return {
                        ...acc,
                        additionalMessages: acc.additionalMessages!.map(am => ({
                            ...am,
                            buttons:
                                am.messageId === c.messageId
                                    ? [...(am.buttons ?? []), ...(c.buttons ?? [])]
                                    : am.buttons,
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
                            header: c.header ? { ...c.header } : { ...am.header },
                        })),
                    }
                } else {
                    return {
                        ...acc,
                        additionalMessages: [...acc.additionalMessages!, c],
                    }
                }
            }, result)
    }

    /**
     * Add a block to the message block store and send it to the client.
     * @param result the blockId associated with the block such that it can be overwritten later
     * @returns
     */
    async writeResultBlock(result: ChatMessage): Promise<number> {
        this.#state.chatResultBlocks.push(result)
        await this.#sendProgress(this.getResult(result.messageId))
        return this.#state.chatResultBlocks.length - 1
    }

    /**
     * Overwrites a specific blockId and re-sends the resulting blocks to the client.
     * @param result
     * @param blockId
     */
    async overwriteResultBlock(result: ChatMessage, blockId: number) {
        this.#state.chatResultBlocks[blockId] = result
        await this.#sendProgress(this.getResult(result.messageId))
    }

    getResultStreamWriter(): ResultStreamWriter {
        // Note: if write calls are not awaited, stream can be out-of-order.
        if (this.#state.isLocked) {
            throw new Error('AgenticChatResultStream: already locked')
        }
        this.#state.isLocked = true
        let lastResult: ChatResult | undefined

        return {
            write: async (intermediateChatResult: ChatMessage) => {
                this.#state.messageId = intermediateChatResult.messageId
                const combinedResult = this.#joinResults(
                    [...this.#state.chatResultBlocks, intermediateChatResult],
                    intermediateChatResult.messageId
                )
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
