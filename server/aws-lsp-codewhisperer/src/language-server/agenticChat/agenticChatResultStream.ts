import { ChatResult, FileDetails } from '@aws/language-server-runtimes/protocol'

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
        chatResultBlocks: [] as ChatResult[],
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

    #joinResults(chatResults: ChatResult[]): ChatResult {
        // TODO: if we add ui elements to ChatResult in the response, we need to be more aware of how we combine them.

        // TODO: the combining of contextList is temporary just so we can see them
        // they should be different messages once we support multiple messages
        return chatResults.reduceRight((acc, c) => ({
            ...acc,
            body: c.body + AgenticChatResultStream.resultDelimiter + acc.body,
            ...((c.contextList || acc.contextList) && {
                contextList: {
                    filePaths: [...(acc.contextList?.filePaths ?? []), ...(c.contextList?.filePaths ?? [])],
                    rootFolderTitle: c.contextList?.rootFolderTitle
                        ? c.contextList.rootFolderTitle
                        : (acc.contextList?.rootFolderTitle ?? ''),
                },
            }),
            buttons: [...(acc.buttons ?? []), ...(c.buttons ?? [])],
        }))
    }

    async writeResultBlock(result: ChatResult) {
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
