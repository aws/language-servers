import { Features } from '../types'
import { ChatResult } from '@aws/language-server-runtimes/protocol'

interface ResultStreamWriter {
    write(chunk: ChatResult): Promise<void>
    close(): Promise<void>
}

/**
 * Abstraction for streaming intermediate ChatResults to the client.
 * Each result block is seperated by the resultDelimiter in a single message.
 * Result blocks can be written directly or streamed in.
 */
export class AgenticChatResultStream {
    static readonly resultDelimiter = '\n\n'
    #state = {
        chatResultBlocks: [] as ChatResult[],
        isLocked: false,
    }
    readonly #sendProgress: (newChatResult: ChatResult | string) => Promise<void>
    readonly #logging: Features['logging']

    constructor(logging: Features['logging'], sendProgress: (newChatResult: ChatResult | string) => Promise<void>) {
        this.#sendProgress = sendProgress
        this.#logging = logging
    }

    getResult(): ChatResult {
        return this.#joinResults(this.#state.chatResultBlocks)
    }

    #joinResults(chatResults: ChatResult[]): ChatResult {
        return chatResults.reduce((acc, c) => {
            return { ...acc, body: acc.body + AgenticChatResultStream.resultDelimiter + c.body }
        })
    }

    async writeResultBlock(result: ChatResult) {
        this.#state.chatResultBlocks.push(result)
        await this.#sendProgress(this.getResult())
    }
    // Note: if write calls are not awaited, stream can be out-of-order.
    getResultStreamWriter(): ResultStreamWriter {
        if (this.#state.isLocked) {
            throw new Error('Stream Writer is already locked')
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
