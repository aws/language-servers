import { ChatResult, FileDetails, ChatMessage } from '@aws/language-server-runtimes/protocol'
import { randomUUID } from 'crypto'

export interface ResultStreamWriter {
    /**
     * Writes a result block to the chat result stream.
     *
     * This method sends a partial result to the client during a streaming response.
     * It handles various types of content including assistant responses, loading indicators,
     * and context lists that should be displayed to the user.
     *
     * @param result - The result block to write to the stream
     * @param final - Optional flag indicating if this is the final write in the stream
     *
     * @returns A Promise that resolves when the write operation is complete
     *
     * @throws Will throw an error if the stream has been closed or if writing fails
     *
     * @example
     * // Write a regular text response
     * await streamWriter.write({ body: 'Hello, how can I help?', type: 'answer-stream' });
     *
     * // Write a loading indicator for a tool use operation
     * // Note: This will be treated as a separate block and not joined with other results
     * await streamWriter.write({ body: '', type: 'answer-stream', messageId: `loading-${toolUseId}` });
     *
     * // Write context files information
     * await streamWriter.write({ body: '', contextList: files });
     */

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

type OperationType = 'read' | 'write' | 'listDir'

export const progressPrefix = 'progress_'

interface FileOperation {
    type: OperationType
    filePaths: FileDetailsWithPath[]
}
export class AgenticChatResultStream {
    static readonly resultDelimiter = '\n\n'
    #state = {
        chatResultBlocks: [] as ChatMessage[],
        isLocked: false,
        uuid: randomUUID(),
        messageId: undefined as string | undefined,
        messageIdToUpdateForTool: new Map<OperationType, string>(),
        messageOperations: new Map<string, FileOperation>(),
    }
    readonly #sendProgress: (newChatResult: ChatResult | string) => Promise<void>

    constructor(sendProgress: (newChatResult: ChatResult | string) => Promise<void>) {
        this.#sendProgress = sendProgress
    }

    getResult(only?: string): ChatResult {
        return this.#joinResults(this.#state.chatResultBlocks, only)
    }

    setMessageIdToUpdateForTool(toolName: string, messageId: string) {
        this.#state.messageIdToUpdateForTool.set(toolName as OperationType, messageId)
    }

    getMessageIdToUpdateForTool(toolName: string): string | undefined {
        return this.#state.messageIdToUpdateForTool.get(toolName as OperationType)
    }

    /**
     * Adds a file operation for a specific message
     * @param messageId The ID of the message
     * @param type The type of operation ('fsRead' or 'listDirectory' or 'fsWrite')
     * @param filePaths Array of FileDetailsWithPath involved in the operation
     */
    addMessageOperation(messageId: string, type: string, filePaths: FileDetailsWithPath[]) {
        this.#state.messageOperations.set(messageId, { type: type as OperationType, filePaths })
    }

    /**
     * Gets the file operation details for a specific message
     * @param messageId The ID of the message
     * @returns The file operation details or undefined if not found
     */
    getMessageOperation(messageId: string): FileOperation | undefined {
        return this.#state.messageOperations.get(messageId)
    }

    #joinResults(chatResults: ChatMessage[], only?: string): ChatResult {
        const result: ChatResult = {
            body: '',
            additionalMessages: [],
            messageId: this.#state.messageId || this.#state.uuid,
        }

        return chatResults
            .filter(cr => cr.messageId === this.#state.messageId || only === undefined || only === cr.messageId)
            .reduce<ChatResult>((acc, c) => {
                if (c.messageId === this.#state.messageId) {
                    return {
                        ...acc,
                        buttons: [...(acc.buttons ?? []), ...(c.buttons ?? [])],
                        body: acc.body + AgenticChatResultStream.resultDelimiter + c.body,
                        ...(c.contextList && { contextList: c.contextList }),
                        header: Object.prototype.hasOwnProperty.call(c, 'header') ? c.header : acc.header,
                        codeReference: [...(acc.codeReference ?? []), ...(c.codeReference ?? [])],
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
                            ...(am.messageId === c.messageId &&
                                (c.contextList || acc.contextList) && {
                                    contextList: {
                                        filePaths: [
                                            ...(acc.contextList?.filePaths ?? []),
                                            ...(c.contextList?.filePaths ?? []),
                                        ],
                                        rootFolderTitle: c.contextList?.rootFolderTitle
                                            ? c.contextList.rootFolderTitle
                                            : (acc.contextList?.rootFolderTitle ?? ''),
                                        details: {
                                            ...(acc.contextList?.details ?? {}),
                                            ...(c.contextList?.details ?? {}),
                                        },
                                    },
                                }),
                            ...(am.messageId === c.messageId &&
                                (c.fileList || acc.fileList) && {
                                    fileList: {
                                        filePaths: [
                                            ...(acc.fileList?.filePaths ?? []),
                                            ...(c.fileList?.filePaths ?? []),
                                        ],
                                        rootFolderTitle: c.fileList?.rootFolderTitle
                                            ? c.fileList.rootFolderTitle
                                            : (acc.fileList?.rootFolderTitle ?? ''),
                                        details: {
                                            ...(acc.fileList?.details ?? {}),
                                            ...(c.fileList?.details ?? {}),
                                        },
                                    },
                                }),
                            header: Object.prototype.hasOwnProperty.call(c, 'header') ? c.header : am.header,
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
        // TODO: We should use chat messageId as blockId instead of nummber for more predictable updates.
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

    /**
     * Removes a specific messageId and re-sends the result to the client.
     * @param messageId
     */
    async removeResultBlock(messageId: string) {
        this.#state.chatResultBlocks = this.#state.chatResultBlocks.filter(block => block.messageId !== messageId)
    }

    /**
     * Removes a specific messageId and renders the result on UI
     * @param messageId
     */
    async removeResultBlockAndUpdateUI(messageId: string) {
        if (this.hasMessage(messageId)) {
            const blockId = this.getMessageBlockId(messageId)
            if (blockId !== undefined) {
                await this.overwriteResultBlock({ body: '', messageId: messageId }, blockId)
            }
            await this.removeResultBlock(messageId)
        }
    }

    async updateOngoingProgressResult(errorMessage: string) {
        for (const block of this.#state.chatResultBlocks) {
            if (block.messageId?.startsWith(progressPrefix) && block.header?.status?.icon === 'progress') {
                await this.removeResultBlockAndUpdateUI(block.messageId)
                block.header.status = {
                    status: 'error',
                    icon: 'error',
                    text: errorMessage,
                }
                block.messageId = block.messageId.substring(progressPrefix.length)
                await this.writeResultBlock(block)
                break
            }
        }
    }

    hasMessage(messageId: string): boolean {
        return this.#state.chatResultBlocks.some(block => block.messageId === messageId)
    }

    getMessageBlockId(messageId: string): number | undefined {
        for (const [i, block] of this.#state.chatResultBlocks.entries()) {
            if (block.messageId === messageId) {
                return i
            }
        }
        return undefined
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
                const isLoading = intermediateChatResult.messageId?.startsWith('loading-')
                if (isLoading) {
                    return await this.#sendProgress(intermediateChatResult)
                }
                this.#state.messageId = intermediateChatResult.messageId
                const combinedResult = this.#joinResults(
                    [...this.#state.chatResultBlocks, intermediateChatResult],
                    intermediateChatResult.messageId
                )
                lastResult = intermediateChatResult
                return await this.#sendProgress(combinedResult)
            },
            close: async () => {
                if (!this.#state.isLocked) {
                    return
                }
                if (lastResult) {
                    this.#state.chatResultBlocks.push(lastResult)
                }
                this.#state.isLocked = false
            },
        }
    }
}
