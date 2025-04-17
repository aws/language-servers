import { Features } from '../types'
import { ChatResult } from '@aws/language-server-runtimes/protocol'

interface ResultStreamWriter {
    write(chunk: ChatResult): Promise<void>
    close(): Promise<void>
}

/**
 * Abstraction for streaming intermediate ChatResults to the client.
 * Each result is seperated by the resultDeliter in a single message.
 */
export class AgenticChatResponse {
    static readonly resultDelimiter = '\n\n'
    #state = {
        chatResults: [] as ChatResult[],
        isLocked: false,
    }
    readonly #sendProgress: (newChatResult: ChatResult | string) => Promise<void>
    readonly #logging: Features['logging']

    constructor(logging: Features['logging'], sendProgress: (newChatResult: ChatResult | string) => Promise<void>) {
        this.#sendProgress = sendProgress
        this.#logging = logging
    }

    getCombinedResult(chatResult?: ChatResult): ChatResult {
        return { ...chatResult, body: this.#combineResults(this.#state.chatResults) }
    }

    #combineResults(chatResults: ChatResult[]): string {
        return chatResults.map(c => c.body).join(AgenticChatResponse.resultDelimiter)
    }

    async addResult(result: ChatResult) {
        this.#state.chatResults.push(result)
        await this.#sendProgress(this.getCombinedResult(result))
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
                const combinedResult = {
                    ...intermediateChatResult,
                    body: this.#combineResults([...this.#state.chatResults, intermediateChatResult]),
                }
                lastResult = intermediateChatResult
                return await this.#sendProgress(combinedResult)
            },
            close: async () => {
                if (lastResult) {
                    this.#state.chatResults.push(lastResult)
                }
                this.#state.isLocked = false
            },
        }
    }
}
